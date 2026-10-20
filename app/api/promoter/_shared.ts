import { createClient } from '@supabase/supabase-js'
import { randomInt, timingSafeEqual } from 'crypto'
import type { NextRequest } from 'next/server'

const SUPABASE_URL = 'https://qnpjawyeekhkzvrorqyv.supabase.co'

export class HttpError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

export function adminDb() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new HttpError('Server error', 500)
  return createClient(SUPABASE_URL, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: (input: any, init: any) => fetch(input, { ...(init || {}), cache: 'no-store' }) },
  })
}

// Admin check for the new admin draw endpoints. The PIN lives in the ADMIN_PIN environment variable.
export function checkAdmin(req: NextRequest) {
  const expected = process.env.ADMIN_PIN
  if (!expected) throw new HttpError('ADMIN_PIN is not set in Vercel', 500)
  const a = Buffer.from(req.headers.get('x-admin-pin') || '')
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new HttpError('Unauthorised', 401)
}

export async function authPromoter(supabase: any, promotionId: string, email: string, pin: string) {
  if (!promotionId || !email || !pin) return null
  const { data } = await supabase
    .from('promotion_submissions')
    .select('id, promo_name')
    .eq('id', promotionId)
    .eq('email', String(email).trim().toLowerCase())
    .eq('promoter_pin', String(pin).trim())
    .single()
  return data || null
}

// True unless the admin has switched the promoter's draw buttons off.
// If the column does not exist yet (database not updated), draws stay allowed as before.
export async function promoterDrawEnabled(supabase: any, promotionId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.from('promotion_submissions').select('promoter_draw_enabled').eq('id', promotionId).maybeSingle()
    if (error || !data) return true
    return data.promoter_draw_enabled !== false
  } catch {
    return true
  }
}

export const NOT_ENABLED = 'Draws for this promotion are run by the administrator.'

export function kampalaToday(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Kampala' })
}

function dayWindow(day: string) {
  const start = new Date(`${day}T00:00:00+03:00`)
  return { start, end: new Date(start.getTime() + 24 * 3600 * 1000) }
}

const normPhone = (p: any) => String(p || '').replace(/\D/g, '').slice(-9)

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export type DrawOpts = {
  promotionId: string
  day?: string | null            // set for daily draws: only that Uganda day's entries are eligible
  count: number
  drawType: 'single' | 'daily'
  drawnBy: 'admin' | 'promoter'
  prizeLabel?: string | null
  onePerPhone?: boolean          // default false: the same phone may win again, like a normal promotion
  replacesId?: string | null
}

// An entry can only win once. Every winner is saved to draw_winners.
export async function pickWinners(supabase: any, o: DrawOpts) {
  let q = supabase
    .from('customer_entries')
    .select('id, customer_name, customer_phone, customer_email, ticket_number, retailer, amount, receipt_date')
    .eq('promotion_id', o.promotionId)
    .eq('verification_status', 'approved')
  if (o.day) {
    const { start, end } = dayWindow(o.day)
    q = q.gte('created_at', start.toISOString()).lt('created_at', end.toISOString())
  }
  const { data: entries, error } = await q
  if (error) throw new HttpError(error.message)

  const { data: past, error: pastErr } = await supabase
    .from('draw_winners')
    .select('entry_id, winner_phone, winner_status')
    .eq('promotion_id', o.promotionId)
  if (pastErr) throw new HttpError('Draw records are not set up yet. Run the SQL update first (' + pastErr.message + ')')
  const used = new Set((past || []).map((r: any) => String(r.entry_id)))
  const taken = new Set<string>(
    o.onePerPhone ? (past || []).filter((r: any) => r.winner_status !== 'failed').map((r: any) => normPhone(r.winner_phone)) : []
  )

  const eligible = (entries || []).filter((e: any) => !used.has(String(e.id)) && (!o.onePerPhone || !taken.has(normPhone(e.customer_phone))))
  if (eligible.length === 0) {
    throw new HttpError(o.day ? 'No eligible entries for ' + o.day + ' (none approved, or all have already won)' : 'No eligible entries (none approved, or all have already won)')
  }

  const picks: any[] = []
  const phones = new Set<string>()
  for (const e of shuffle<any>(eligible)) {
    const ph = normPhone(e.customer_phone)
    if (o.onePerPhone && phones.has(ph)) continue
    phones.add(ph)
    picks.push(e)
    if (picks.length >= o.count) break
  }

  const rows = picks.map((e: any) => ({
    promotion_id: o.promotionId,
    entry_id: String(e.id),
    draw_type: o.drawType,
    draw_day: o.day || null,
    winner_name: e.customer_name,
    winner_phone: e.customer_phone,
    winner_email: e.customer_email || null,
    winner_ticket: e.ticket_number,
    outlet_name: e.retailer || null,
    receipt_amount: e.amount ?? null,
    receipt_date: e.receipt_date ? String(e.receipt_date) : null,
    prize_label: o.prizeLabel || null,
    drawn_by: o.drawnBy,
    winner_status: 'pending',
    prize_status: 'pending',
    replaces_id: o.replacesId || null,
  }))
  const { data: inserted, error: insErr } = await supabase.from('draw_winners').insert(rows).select()
  if (insErr) throw new HttpError(insErr.message)
  return { winners: inserted || [], eligible: eligible.length }
}

export async function loadWinners(supabase: any, promotionId?: string) {
  let q = supabase.from('draw_winners').select('*').order('drawn_at', { ascending: false }).limit(1000)
  if (promotionId) q = q.eq('promotion_id', promotionId)
  const { data, error } = await q
  if (error) throw new HttpError(error.message)
  return data || []
}

// verify / fail (with automatic replacement for daily draws) / paid. Shared by the admin and the promoter.
export async function winnerAction(
  supabase: any,
  promotionId: string,
  b: { id: string; action: string; note?: string; onePrizePerPhone?: boolean },
  by: 'admin' | 'promoter'
) {
  const { data: row } = await supabase.from('draw_winners').select('*').eq('id', b.id).eq('promotion_id', promotionId).single()
  if (!row) throw new HttpError('Winner not found', 404)
  const note = b.note ? String(b.note).slice(0, 300) : null

  if (b.action === 'verify') {
    await supabase.from('draw_winners').update({ winner_status: 'verified', verified_at: new Date().toISOString(), verification_note: note }).eq('id', row.id)
    return { ok: true }
  }
  if (b.action === 'fail') {
    await supabase.from('draw_winners').update({ winner_status: 'failed', verified_at: new Date().toISOString(), verification_note: note }).eq('id', row.id)
    try {
      const r = await pickWinners(supabase, {
        promotionId,
        day: row.draw_day || null,
        count: 1,
        drawType: row.draw_type === 'daily' ? 'daily' : 'single',
        drawnBy: by,
        prizeLabel: row.prize_label,
        onePerPhone: !!b.onePrizePerPhone,
        replacesId: String(row.id),
      })
      return { ok: true, replacement: r.winners[0] || null }
    } catch (e: any) {
      return { ok: true, replacement: null, message: e?.message || 'No replacement available' }
    }
  }
  if (b.action === 'paid') {
    if (row.draw_type === 'daily' && row.winner_status !== 'verified') {
      throw new HttpError('Verify the winning bill with the establishment before marking the prize paid')
    }
    await supabase.from('draw_winners').update({ prize_status: 'paid', paid_at: new Date().toISOString(), payment_ref: note }).eq('id', row.id)
    return { ok: true }
  }
  throw new HttpError('Unknown action')
}
