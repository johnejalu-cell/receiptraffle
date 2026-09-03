import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = 'https://qnpjawyeekhkzvrorqyv.supabase.co'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug')
    if (!slug) return NextResponse.json({ error: 'No slug provided' }, { status: 400 })

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) return NextResponse.json({ error: 'Server error' }, { status: 500 })

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(SUPABASE_URL, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

    const { data: promo, error } = await supabase
      .from('promotion_submissions')
      .select('*')
      .eq('slug', slug.toLowerCase().trim())
      .eq('status', 'active')
      .single()

    if (error || !promo) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Get entry count
    const { data: entryCounts } = await supabase
      .from('customer_entries')
      .select('id')
      .eq('promotion_id', promo.id)
      .eq('verification_status', 'approved')

    // Get grand draw name if linked
    let grandDrawName = null
    if (promo.grand_draw_id) {
      const { data: grandDraw } = await supabase
        .from('grand_draws')
        .select('name')
        .eq('id', promo.grand_draw_id)
        .single()
      if (grandDraw) grandDrawName = grandDraw.name
    }

    return NextResponse.json({
      promotion: {
        ...promo,
        entries_count: entryCounts?.length || 0,
        grand_draw_name: grandDrawName,
      }
    })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
