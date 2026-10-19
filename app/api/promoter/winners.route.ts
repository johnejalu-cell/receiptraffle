import { NextRequest, NextResponse } from 'next/server'
import { adminDb, authPromoter, kampalaToday, pickWinners } from '../_shared'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const b = await req.json()
    const supabase = adminDb()
    const promo = await authPromoter(supabase, b.promotionId, b.email, b.pin)
    if (!promo) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const today = kampalaToday()
    const day = /^\d{4}-\d{2}-\d{2}$/.test(String(b.day || '')) ? String(b.day) : today
    if (day > today) return NextResponse.json({ error: 'You cannot draw for a future day' }, { status: 400 })
    const count = Math.max(1, Math.min(20, parseInt(b.count, 10) || 1))

    const { data: existing } = await supabase
      .from('draw_results')
      .select('id')
      .eq('promotion_id', b.promotionId)
      .eq('draw_day', day)
      .neq('winner_status', 'failed')
    if (existing && existing.length > 0 && !b.again) {
      return NextResponse.json({ error: 'A draw for ' + day + ' already exists. Confirm to draw additional winners.', code: 'EXISTS' }, { status: 409 })
    }

    const result = await pickWinners(supabase, b.promotionId, day, count, { prize_label: b.prizeLabel ? String(b.prizeLabel).slice(0, 120) : null }, !!b.onePrizePerPhone)
    return NextResponse.json({ success: true, day, drawn: result.winners.length, eligible: result.eligible, winners: result.winners })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Draw failed' }, { status: 400 })
  }
}
