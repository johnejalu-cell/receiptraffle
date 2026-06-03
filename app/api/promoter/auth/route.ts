import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = 'https://qnpjawyeekhkzvrorqyv.supabase.co'

export async function POST(req: NextRequest) {
  try {
    const { email, pin } = await req.json()
    if (!email || !pin) return NextResponse.json({ error: 'Email and PIN required' }, { status: 400 })

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) return NextResponse.json({ error: 'Server error' }, { status: 500 })

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(SUPABASE_URL, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

    const { data, error } = await supabase
      .from('promotion_submissions')
      .select('id, promo_name, company_name, status, draw_date, start_date, end_date, prizes, currency, min_spend, emoji, color, logo_url, ref')
      .eq('email', email.trim().toLowerCase())
      .eq('promoter_pin', pin.trim())

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data || data.length === 0) return NextResponse.json({ error: 'Invalid email or PIN' }, { status: 401 })

    return NextResponse.json({ success: true, promotions: data })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
