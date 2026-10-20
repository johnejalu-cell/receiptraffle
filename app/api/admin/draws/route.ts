import { NextRequest, NextResponse } from 'next/server'
import { HttpError, adminDb, checkAdmin, kampalaToday, loadWinners, pickWinners, winnerAction } from '../../promoter/_shared'

export const dynamic = 'force-dynamic'

const fail = (e: any) => NextResponse.json({ error: e?.message || 'Failed' }, { status: e instanceof HttpError ? e.status : 400 })

export async function GET(req: NextRequest) {
  try {
    checkAdmin(req)
    const supabase = adminDb()
    const winners = await loadWinners(supabase)
    const flags: Record<string, boolean | null> = {}
    try {
      const { data, error } = await supabase.from('promotion_submissions').select('id, promoter_draw_enabled')
      if (!error) (data || []).forEach((r: any) => { flags[r.id] = r.promoter_draw_enabled !== false })
    } catch { /* column not created yet */ }
    return NextResponse.json({ winners, flags })
  } catch (e) {
    return fail(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    checkAdmin(req)
    const b = await req.json()
    const supabase = adminDb()
    const promotionId = String(b.promotionId || '')
    if (!promotionId) throw new HttpError('Missing promotion')

    if (b.action === 'toggle_promoter') {
      const { error } = await supabase.from('promotion_submissions').update({ promoter_draw_enabled: !!b.enabled }).eq('id', promotionId)
      if (error) throw new HttpError('Run the SQL update first (' + error.message + ')')
      return NextResponse.json({ ok: true })
    }

    if (b.action === 'draw') {
      const isDaily = b.mode === 'daily'
      const today = kampalaToday()
      const day = isDaily ? (/^\d{4}-\d{2}-\d{2}$/.test(String(b.day || '')) ? String(b.day) : today) : null
      if (day && day > today) throw new HttpError('You cannot draw for a future day')
      const count = Math.max(1, Math.min(20, parseInt(b.count, 10) || 1))

      if (isDaily && !b.again) {
        const { data: existing } = await supabase.from('draw_winners').select('id').eq('promotion_id', promotionId).eq('draw_day', day).neq('winner_status', 'failed')
        if (existing && existing.length > 0) {
          return NextResponse.json({ error: 'A draw for ' + day + ' already exists. Confirm to draw additional winners.', code: 'EXISTS' }, { status: 409 })
        }
      }
      const r = await pickWinners(supabase, {
        promotionId, day, count: isDaily ? count : 1, drawType: isDaily ? 'daily' : 'single', drawnBy: 'admin',
        prizeLabel: b.prizeLabel ? String(b.prizeLabel).slice(0, 120) : null, onePerPhone: !!b.onePrizePerPhone,
      })
      return NextResponse.json({ success: true, day, drawn: r.winners.length, eligible: r.eligible, winners: r.winners })
    }

    const out = await winnerAction(supabase, promotionId, { id: b.id, action: b.action, note: b.note, onePrizePerPhone: !!b.onePrizePerPhone }, 'admin')
    return NextResponse.json(out)
  } catch (e) {
    return fail(e)
  }
}
