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
      .select('id, promo_name')
      .eq('id', promotionId)
      .eq('email', email.trim().toLowerCase())
      .eq('promoter_pin', pin.trim())
      .single()

    if (promoError || !promo) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    // Get all approved entries
    const { data: entries, error: entriesError } = await supabase
      .from('customer_entries')
      .select('id, customer_name, customer_phone, customer_email, ticket_number')
      .eq('promotion_id', promotionId)
      .eq('verification_status', 'approved')

    if (entriesError) return NextResponse.json({ error: entriesError.message }, { status: 500 })
    if (!entries || entries.length === 0) return NextResponse.json({ error: 'No approved entries to draw from' }, { status: 400 })

    // Pick a random winner
    const winner = entries[Math.floor(Math.random() * entries.length)]

    // Record the draw result
    await supabase.from('draw_results').insert({
      promotion_id: promotionId,
      winner_entry_id: winner.id,
      winner_name: winner.customer_name,
      winner_phone: winner.customer_phone,
      winner_email: winner.customer_email || null,
      winner_ticket: winner.ticket_number,
      drawn_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      winner: {
        name: winner.customer_name,
        phone: winner.customer_phone,
        email: winner.customer_email,
        ticket: winner.ticket_number,
      },
      totalEntries: entries.length,
    })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
