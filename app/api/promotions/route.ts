import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const { data, error } = await supabase
      .from('promotion_submissions')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json({ promotions: data || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ 
        error: 'Missing environment variables',
        debug: { hasUrl: !!supabaseUrl, hasKey: !!serviceKey }
      }, { status: 500 })
    }

    if (!body.companyName || !body.contactName || !body.email || !body.phone || !body.promoName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const ref = 'RRP-' + Math.random().toString(36).substring(2, 8).toUpperCase()

    const insertData = {
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
      status: 'pending',
      ref: ref,
      emoji: '🎁',
      color: '#1D9E75',
      entries_count: 0,
    }

    const { data, error } = await supabase
      .from('promotion_submissions')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ 
        error: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      }, { status: 500 })
    }

    return NextResponse.json({ submission: data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack?.split('\n')[0]
    }, { status: 500 })
  }
}
