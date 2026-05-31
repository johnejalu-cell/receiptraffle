import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = 'https://qnpjawyeekhkzvrorqyv.supabase.co'

export async function GET() {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) return NextResponse.json({ error: 'No service key', promotions: [] })

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(SUPABASE_URL, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const { data, error } = await supabase
      .from('promotion_submissions')
      .select('*')
      .in('status', ['active', 'pending'])
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message, promotions: [] })
    return NextResponse.json({ promotions: data || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message, promotions: [] })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) return NextResponse.json({ error: 'No service key' }, { status: 500 })

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(SUPABASE_URL, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Fetch the promotion details before deleting
    const { data: promo } = await supabase
      .from('promotion_submissions')
      .select('promo_name, company_name')
      .eq('id', id)
      .single()

    // Stamp the promotion name and company onto all linked entries before unlinking
    if (promo) {
      await supabase
        .from('customer_entries')
        .update({
          promotion_name: promo.promo_name,
          company_name: promo.company_name,
          promotion_id: null
        })
        .eq('promotion_id', id)
    }

    // Now delete the promotion
    const { error } = await supabase
      .from('promotion_submissions')
      .delete()
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
