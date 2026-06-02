import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = 'https://qnpjawyeekhkzvrorqyv.supabase.co'

export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get('email')
    const promotionId = req.nextUrl.searchParams.get('promotion_id')
    if (!email || !promotionId) return NextResponse.json({ error: 'Email and promotion_id required' }, { status: 400 })

    const { createClient } = await import('@supabase/supabase-js')
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) return NextResponse.json({ error: 'No service key' }, { status: 500 })
    const supabase = createClient(SUPABASE_URL, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Verify this promotion belongs to this email
    const { data: promo } = await supabase
      .from('promotion_submissions')
      .select('id, email')
      .eq('id', promotionId)
      .eq('email', email.toLowerCase().trim())
      .single()

    if (!promo) return NextResponse.json({ error: 'Promotion not found or access denied' }, { status: 403 })

    const { data: entries, error } = await supabase
      .from('customer_entries')
      .select('*')
      .eq('promotion_id', promotionId)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ entries: entries || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
