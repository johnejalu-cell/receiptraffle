import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// GET — fetch all active promotions
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

// POST — save a new promotion submission
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const supabase = getServiceClient()

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
        start_date: body.startDate,
        end_date: body.endDate,
        draw_date: body.drawDate,
        prizes: body.prizes,
        status: 'pending',
        ref: 'RRP-' + Math.random().toString(36).substring(2, 8).toUpperCase()
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ submission: data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
