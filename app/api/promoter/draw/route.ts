import { NextRequest, NextResponse } from 'next/server'
import { HttpError, NOT_ENABLED, adminDb, authPromoter, pickWinners, promoterDrawEnabled } from '../_shared'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { promotionId, email, pin } = await req.json()
    const supabase = adminDb()
    const promo = await authPromoter(supabase, promotionId, email, pin)
    if (!promo) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    if (!(await promoterDrawEnabled(supabase, promotionId))) return NextResponse.json({ error: NOT_ENABLED }, { status: 403 })

    const r = await pickWinners(supabase, { promotionId, day: null, count: 1, drawType: 'single', drawnBy: 'promoter' })
    const w = r.winners[0]
    return NextResponse.json({
      success: true,
      winner: { name: w.winner_name, phone: w.winner_phone, email: w.winner_email, ticket: w.winner_ticket },
      totalEntries: r.eligible,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Draw failed' }, { status: e instanceof HttpError ? e.status : 500 })
  }
}
