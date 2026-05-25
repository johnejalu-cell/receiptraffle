import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = 'https://qnpjawyeekhkzvrorqyv.supabase.co'

export async function GET() {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) return NextResponse.json({ error: 'No service key', promotions: [] })
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(SUPABASE_URL, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
    const { data, error } = await supabase
      .from('promotion_submissions')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message, promotions: [] })
    return NextResponse.json({ promotions: data || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message, promotions: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) return NextResponse.json({ error: 'No service key' }, { status: 500 })
    if (!body.companyName || !body.contactName || !body.email || !body.phone || !body.promoName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(SUPABASE_URL, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
    const ref = 'RRP-' + Math.random().toString(36).substring(2, 8).toUpperCase()
    const { data, error } = await supabase
      .from('promotion_submissions')
      .insert({
        company_name: body.companyName,
        contact_name: body.contactName,
        email: body.email,
        phone: body.phone,
        promo_name: body.promoName,
        description: body.description || '',
        min_spend: parseInt(body.minSpend) || 0,
        currency: 'UGX',
        max_entries: parseInt(body.maxEntries) || 3,
        start_date: body.startDate || '',
        end_date: body.endDate || '',
        draw_date: body.drawDate || '',
        prizes: body.prizes || [],
        product_keywords: body.productKeywords || [],
        status: 'pending',
        ref,
        emoji: '🎁',
        color: '#1D9E75',
        entries_count: 0,
      })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message, code: error.code }, { status: 500 })
    return NextResponse.json({ submission: data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
