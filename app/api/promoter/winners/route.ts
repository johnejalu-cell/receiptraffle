import { NextRequest, NextResponse } from 'next/server'
import { adminDb, authPromoter, pickWinners } from '../_shared'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const u = new URL(req.url)
    const supabase = adminDb()
    const promotionId = u.searchParams.get('promotionId') || ''
    const promo = await authPromoter(supabase, promotionId, u.searchParams.get('email') || '', u.searchParams.get('pin') || '')
    if (!promo) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    const { data, error } = await supabase
      .from('draw_results')
      .select('*')
      .eq('promotion_id', promotionId)
      .not('draw_day', 'is', null)
      .order('drawn_at', { ascending: false })
      .limit(500)
    if (error) throw new Error(error.message)
    return NextResponse.json({ winners: data || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 400 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json()
    const supabase = adminDb()
    const promo = await authPromoter(supabase, b.promotionId, b.email, b.pin)
    if (!promo) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { data: row } = await supabase.from('draw_results').select('*').eq('id', b.id).eq('promotion_id', b.promotionId).single()
    if (!row) return NextResponse.json({ error: 'Winner not found' }, { status: 404 })
    const note = b.note ? String(b.note).slice(0, 300) : null

    if (b.action === 'verify') {
      await supabase.from('draw_results').update({ winner_status: 'verified', verified_at: new Date().toISOString(), verification_note: note }).eq('id', row.id)
      return NextResponse.json({ ok: true })
    }

    if (b.action === 'fail') {
      await supabase.from('draw_results').update({ winner_status: 'failed', verified_at: new Date().toISOString(), verification_note: note }).eq('id', row.id)
      try {
        const r = await pickWinners(supabase, b.promotionId, row.draw_day, 1, { replaces_id: String(row.id), prize_label: row.prize_label || null }, !!b.onePrizePerPhone)
        return NextResponse.json({ ok: true, replacement: r.winners[0] || null })
      } catch (e: any) {
        return NextResponse.json({ ok: true, replacement: null, message: e?.message || 'No replacement available' })
      }
    }

    if (b.action === 'paid') {
      if (row.winner_status !== 'verified') {
        return NextResponse.json({ error: 'Verify the winning bill with the establishment before marking the prize paid' }, { status: 400 })
      }
      await supabase.from('draw_results').update({ prize_status: 'paid', paid_at: new Date().toISOString(), payment_ref: note }).eq('id', row.id)
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 400 })
  }
}
