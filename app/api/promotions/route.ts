import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET() {
  try {
    const supabase = getServiceClient()
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

    if (!body.companyName || !body.contactName || !body.email || !body.phone || !body.promoName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = getServiceClient()
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
        status: 'pending',
        ref: ref,
        emoji: '🎁',
        color: '#1D9E75',
        entries_count: 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ submission: data }, { status: 201 })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
