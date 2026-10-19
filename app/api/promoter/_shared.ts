import { createClient } from '@supabase/supabase-js'
import { randomInt } from 'crypto'

const SUPABASE_URL = 'https://qnpjawyeekhkzvrorqyv.supabase.co'

export function adminDb() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('Server error')
  return createClient(SUPABASE_URL, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: (input: any, init: any) => fetch(input, { ...(init || {}), cache: 'no-store' }) },
  })
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

export function kampalaToday(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Kampala' })
}

function dayWindow(day: string) {
  const start = new Date(`${day}T00:00:00+03:00`)
  const end = new Date(start.getTime() + 24 * 3600 * 1000)
  return { start, end }
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

// Draws winners from the approved entries submitted on one Uganda calendar day.
// An entry can win once. By default the same phone number may win more than once (as in a normal promotion);
// set onePerPhone to hold each phone number to one live prize.
export async function pickWinners(supabase: any, promotionId: string, day: string, count: number, extra: Record<string, any> = {}, onePerPhone = false) {
  const { start, end } = dayWindow(day)
  const { data: entries, error } = await supabase
    .from('customer_entries')
    .select('id, customer_name, customer_phone, customer_email, ticket_number, retailer, amount, receipt_date')
    .eq('promotion_id', promotionId)
    .eq('verification_status', 'approved')
    .gte('created_at', start.toISOString())
    .lt('created_at', end.toISOString())
  if (error) throw new Error(error.message)

  const { data: past } = await supabase
    .from('draw_results')
    .select('winner_entry_id, winner_phone, winner_status')
    .eq('promotion_id', promotionId)
  const usedEntries = new Set((past || []).map((r: any) => String(r.winner_entry_id)))
  const takenPhones = new Set(onePerPhone ? (past || []).filter((r: any) => r.winner_status !== 'failed').map((r: any) => normPhone(r.winner_phone)) : [])

  const eligible = (entries || []).filter((e: any) => !usedEntries.has(String(e.id)) && (!onePerPhone || !takenPhones.has(normPhone(e.customer_phone))))
  if (eligible.length === 0) throw new Error('No eligible entries for ' + day + ' (none approved, or all have already won)')

  const picks: any[] = []
  const phones = new Set<string>()
  for (const e of shuffle<any>(eligible)) {
    const ph = normPhone(e.customer_phone)
    if (onePerPhone && phones.has(ph)) continue
    phones.add(ph)
    picks.push(e)
    if (picks.length >= count) break
  }

  const rows = picks.map((e: any) => ({
    promotion_id: promotionId,
    winner_entry_id: e.id,
    winner_name: e.customer_name,
    winner_phone: e.customer_phone,
    winner_email: e.customer_email || null,
    winner_ticket: e.ticket_number,
    drawn_at: new Date().toISOString(),
    draw_day: day,
    outlet_name: e.retailer || null,
    receipt_amount: e.amount ?? null,
    receipt_date: e.receipt_date ? String(e.receipt_date) : null,
    winner_status: 'pending',
    prize_status: 'pending',
    ...extra,
  }))
  const { data: inserted, error: insErr } = await supabase.from('draw_results').insert(rows).select()
  if (insErr) throw new Error(insErr.message)
  return { winners: inserted || [], eligible: eligible.length }
}
