import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = 'https://qnpjawyeekhkzvrorqyv.supabase.co'

export async function POST(req: NextRequest) {
  try {
    const { promotionId, email, pin, updates } = await req.json()
    if (!promotionId || !email || !pin) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) return NextResponse.json({ error: 'Server error' }, { status: 500 })

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(SUPABASE_URL, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

    // Verify promoter owns this promotion
    const { data: promo, error: promoError } = await supabase
      .from('promotion_submissions')
      .select('id')
      .eq('id', promotionId)
      .eq('email', email.trim().toLowerCase())
      .eq('promoter_pin', pin.trim())
      .single()

    if (promoError || !promo) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    // Only allow safe fields to be updated - never min_spend or currency
    const safeUpdates: Record<string, unknown> = {}
    if (updates.promo_name !== undefined) safeUpdates.promo_name = updates.promo_name
    if (updates.draw_date !== undefined) safeUpdates.draw_date = updates.draw_date
    if (updates.end_date !== undefined) safeUpdates.end_date = updates.end_date
    if (updates.prizes !== undefined) safeUpdates.prizes = updates.prizes
    if (updates.product_keywords !== undefined) safeUpdates.product_keywords = updates.product_keywords
    if (updates.product_barcodes !== undefined) safeUpdates.product_barcodes = updates.product_barcodes
    if (updates.terms_conditions !== undefined) safeUpdates.terms_conditions = updates.terms_conditions

    const { error: updateError } = await supabase
      .from('promotion_submissions')
      .update(safeUpdates)
      .eq('id', promotionId)

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
