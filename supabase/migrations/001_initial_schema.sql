-- ============================================================
-- ReceiptRaffle — Full Supabase Schema
-- Paste this entire file into the Supabase SQL Editor and run.
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- 1. PROFILES (extends Supabase auth.users)
-- ============================================================
create table public.profiles (
  id           uuid references auth.users(id) on delete cascade primary key,
  email        text not null,
  full_name    text not null default '',
  role         text not null default 'customer' check (role in ('customer', 'promoter', 'admin')),
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'customer')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- 2. PROMOTERS
-- ============================================================
create table public.promoters (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references public.profiles(id) on delete cascade not null unique,
  company_name    text not null,
  contact_email   text not null,
  contact_phone   text,
  status          text not null default 'active' check (status in ('active', 'suspended')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- 3. PROMOTIONS
-- ============================================================
create table public.promotions (
  id                        uuid primary key default uuid_generate_v4(),
  promoter_id               uuid references public.promoters(id) on delete cascade not null,
  name                      text not null,
  brand                     text not null,
  description               text,
  min_spend                 numeric(12, 2) not null default 0,
  currency                  text not null default 'UGX',
  max_entries_per_customer  integer not null default 1,
  start_date                date not null,
  end_date                  date not null,
  draw_date                 date not null,
  prizes                    jsonb not null default '[]',  -- [{label: string, quantity: number}]
  status                    text not null default 'draft'
                              check (status in ('draft', 'active', 'ended', 'cancelled')),
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  constraint valid_dates check (end_date >= start_date),
  constraint valid_draw check (draw_date >= end_date)
);

create index idx_promotions_promoter on public.promotions(promoter_id);
create index idx_promotions_status on public.promotions(status);

-- ============================================================
-- 4. ENTRIES (receipt submissions)
-- ============================================================
create table public.entries (
  id                    uuid primary key default uuid_generate_v4(),
  promotion_id          uuid references public.promotions(id) on delete cascade not null,
  customer_id           uuid references public.profiles(id) on delete cascade not null,
  ticket_number         text not null unique,
  receipt_url           text not null,
  amount                numeric(12, 2) not null,
  currency              text not null default 'UGX',
  verification_status   text not null default 'pending'
                          check (verification_status in ('pending', 'approved', 'manual_review', 'rejected')),
  ai_confidence         integer,
  ai_result             jsonb,          -- full AI extraction result
  manual_review_notes   text,
  reviewed_by           uuid references public.profiles(id),
  reviewed_at           timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index idx_entries_promotion on public.entries(promotion_id);
create index idx_entries_customer on public.entries(customer_id);
create index idx_entries_status on public.entries(verification_status);
create index idx_entries_ticket on public.entries(ticket_number);

-- Enforce max entries per customer per promotion
create or replace function check_max_entries()
returns trigger language plpgsql as $$
declare
  max_allowed integer;
  current_count integer;
begin
  select max_entries_per_customer into max_allowed
  from public.promotions where id = new.promotion_id;

  select count(*) into current_count
  from public.entries
  where promotion_id = new.promotion_id
    and customer_id = new.customer_id
    and verification_status != 'rejected';

  if current_count >= max_allowed then
    raise exception 'Maximum entries (%) reached for this promotion', max_allowed;
  end if;
  return new;
end;
$$;

create trigger enforce_max_entries
  before insert on public.entries
  for each row execute procedure check_max_entries();

-- ============================================================
-- 5. DRAW RESULTS (audit log)
-- ============================================================
create table public.draw_results (
  id                      uuid primary key default uuid_generate_v4(),
  promotion_id            uuid references public.promotions(id) on delete cascade not null,
  entry_id                uuid references public.entries(id) not null,
  prize_label             text not null,
  draw_number             integer not null,
  drawn_by                uuid references public.profiles(id) not null,
  drawn_at                timestamptz not null default now(),
  audit_hash              text not null,
  total_eligible_entries  integer not null,
  unique (promotion_id, entry_id),     -- a customer can only win once per promotion
  unique (promotion_id, draw_number)   -- each draw number is unique per promotion
);

create index idx_draw_results_promotion on public.draw_results(promotion_id);

-- ============================================================
-- 6. FRAUD FLAGS
-- ============================================================
create table public.fraud_flags (
  id          uuid primary key default uuid_generate_v4(),
  entry_id    uuid references public.entries(id) on delete cascade not null,
  customer_id uuid references public.profiles(id) on delete cascade not null,
  score       integer not null check (score between 0 and 100),
  reasons     jsonb not null default '[]',   -- string[]
  status      text not null default 'open'
                check (status in ('open', 'resolved_banned', 'resolved_warned', 'resolved_cleared')),
  resolved_by uuid references public.profiles(id),
  resolved_at timestamptz,
  created_at  timestamptz not null default now()
);

create index idx_fraud_flags_status on public.fraud_flags(status);
create index idx_fraud_flags_customer on public.fraud_flags(customer_id);

-- ============================================================
-- 7. PAYMENTS
-- ============================================================
create table public.payments (
  id            uuid primary key default uuid_generate_v4(),
  promoter_id   uuid references public.promoters(id) on delete cascade not null,
  promotion_id  uuid references public.promotions(id) on delete cascade not null,
  amount        numeric(12, 2) not null,
  currency      text not null default 'UGX',
  status        text not null default 'pending'
                  check (status in ('pending', 'paid', 'failed')),
  provider      text,          -- e.g. 'flutterwave', 'pesapal'
  provider_ref  text,          -- payment gateway transaction ID
  paid_at       timestamptz,
  created_at    timestamptz not null default now()
);

create index idx_payments_promoter on public.payments(promoter_id);
create index idx_payments_status on public.payments(status);

-- ============================================================
-- 8. STORAGE BUCKETS
-- ============================================================
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict do nothing;

-- ============================================================
-- 9. ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles       enable row level security;
alter table public.promoters      enable row level security;
alter table public.promotions     enable row level security;
alter table public.entries        enable row level security;
alter table public.draw_results   enable row level security;
alter table public.fraud_flags    enable row level security;
alter table public.payments       enable row level security;

-- Helper: get current user's role
create or replace function public.get_user_role()
returns text language sql security definer as $$
  select role from public.profiles where id = auth.uid()
$$;

-- Helper: get current user's promoter id
create or replace function public.get_promoter_id()
returns uuid language sql security definer as $$
  select id from public.promoters where user_id = auth.uid()
$$;

-- PROFILES policies
create policy "Users can read own profile"
  on public.profiles for select using (id = auth.uid());
create policy "Users can update own profile"
  on public.profiles for update using (id = auth.uid());
create policy "Admins can read all profiles"
  on public.profiles for select using (get_user_role() = 'admin');

-- PROMOTERS policies
create policy "Promoters can read own record"
  on public.promoters for select using (user_id = auth.uid());
create policy "Promoters can update own record"
  on public.promoters for update using (user_id = auth.uid());
create policy "Users can create promoter record"
  on public.promoters for insert with check (user_id = auth.uid());
create policy "Admins can read all promoters"
  on public.promoters for select using (get_user_role() = 'admin');
create policy "Admins can update all promoters"
  on public.promoters for update using (get_user_role() = 'admin');

-- PROMOTIONS policies
create policy "Anyone can read active promotions"
  on public.promotions for select using (status = 'active');
create policy "Promoters can read own promotions"
  on public.promotions for select using (promoter_id = get_promoter_id());
create policy "Promoters can insert own promotions"
  on public.promotions for insert with check (promoter_id = get_promoter_id());
create policy "Promoters can update own promotions"
  on public.promotions for update using (promoter_id = get_promoter_id());
create policy "Admins can read all promotions"
  on public.promotions for select using (get_user_role() = 'admin');
create policy "Admins can update all promotions"
  on public.promotions for update using (get_user_role() = 'admin');

-- ENTRIES policies
create policy "Customers can read own entries"
  on public.entries for select using (customer_id = auth.uid());
create policy "Customers can insert own entries"
  on public.entries for insert with check (customer_id = auth.uid());
create policy "Promoters can read entries for own promotions"
  on public.entries for select using (
    promotion_id in (select id from public.promotions where promoter_id = get_promoter_id())
  );
create policy "Admins can read all entries"
  on public.entries for select using (get_user_role() = 'admin');
create policy "Admins can update all entries"
  on public.entries for update using (get_user_role() = 'admin');

-- DRAW RESULTS policies
create policy "Customers can read own draw results"
  on public.draw_results for select using (
    entry_id in (select id from public.entries where customer_id = auth.uid())
  );
create policy "Promoters can read draw results for own promotions"
  on public.draw_results for select using (
    promotion_id in (select id from public.promotions where promoter_id = get_promoter_id())
  );
create policy "Promoters can insert draw results for own promotions"
  on public.draw_results for insert with check (
    promotion_id in (select id from public.promotions where promoter_id = get_promoter_id())
  );
create policy "Admins can read all draw results"
  on public.draw_results for select using (get_user_role() = 'admin');

-- FRAUD FLAGS policies
create policy "Admins can do everything with fraud flags"
  on public.fraud_flags for all using (get_user_role() = 'admin');

-- PAYMENTS policies
create policy "Promoters can read own payments"
  on public.payments for select using (promoter_id = get_promoter_id());
create policy "Admins can read all payments"
  on public.payments for select using (get_user_role() = 'admin');

-- STORAGE policies
create policy "Authenticated users can upload receipts"
  on storage.objects for insert with check (
    bucket_id = 'receipts' and auth.role() = 'authenticated'
  );
create policy "Users can read own receipts"
  on storage.objects for select using (
    bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "Admins and promoters can read all receipts"
  on storage.objects for select using (
    bucket_id = 'receipts' and get_user_role() in ('admin', 'promoter')
  );

-- ============================================================
-- 10. UPDATED_AT TRIGGERS
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger set_profiles_updated_at   before update on public.profiles   for each row execute procedure set_updated_at();
create trigger set_promoters_updated_at  before update on public.promoters  for each row execute procedure set_updated_at();
create trigger set_promotions_updated_at before update on public.promotions for each row execute procedure set_updated_at();
create trigger set_entries_updated_at    before update on public.entries    for each row execute procedure set_updated_at();
