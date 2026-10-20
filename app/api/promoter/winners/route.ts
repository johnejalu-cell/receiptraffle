import { NextRequest, NextResponse } from 'next/server'
import { HttpError, NOT_ENABLED, adminDb, authPromoter, loadWinners, promoterDrawEnabled, winnerAction } from '../_shared'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const u = new URL(req.url)
    const supabase = adminDb()
    const promotionId = u.searchParams.get('promotionId') || ''
    const promo = await authPromoter(supabase, promotionId, u.searchParams.get('email') || '', u.searchParams.get('pin') || '')
    if (!promo) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    const winners = await loadWinners(supabase, promotionId)
    return NextResponse.json({ winners })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: e instanceof HttpError ? e.status : 400 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json()
    const supabase = adminDb()
    const promo = await authPromoter(supabase, b.promotionId, b.email, b.pin)
    if (!promo) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    if (!(await promoterDrawEnabled(supabase, b.promotionId))) return NextResponse.json({ error: NOT_ENABLED }, { status: 403 })
    const out = await winnerAction(supabase, b.promotionId, { id: b.id, action: b.action, note: b.note, onePrizePerPhone: !!b.onePrizePerPhone }, 'promoter')
    return NextResponse.json(out)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: e instanceof HttpError ? e.status : 400 })
  }
}
