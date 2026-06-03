import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = 'https://qnpjawyeekhkzvrorqyv.supabase.co'

export async function POST(req: NextRequest) {
  try {
    const { promotionId, email, pin } = await req.json()
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

    // Fetch entries
    const { data: entries, error: entriesError } = await supabase
      .from('customer_entries')
      .select('id, customer_name, customer_phone, customer_email, ticket_number, amount, currency, retailer, receipt_date, verification_status, ai_confidence, created_at')
      .eq('promotion_id', promotionId)
      .order('created_at', { ascending: false })

    if (entriesError) return NextResponse.json({ error: entriesError.message }, { status: 500 })

    return NextResponse.json({ entries: entries || [] })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
