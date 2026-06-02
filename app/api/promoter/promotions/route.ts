import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = 'https://qnpjawyeekhkzvrorqyv.supabase.co'

export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get('email')
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    const { createClient } = await import('@supabase/supabase-js')
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) return NextResponse.json({ error: 'No service key' }, { status: 500 })
    const supabase = createClient(SUPABASE_URL, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Get all promotions for this email
    const { data: promotions, error } = await supabase
      .from('promotion_submissions')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!promotions || promotions.length === 0) {
      return NextResponse.json({ promotions: [] })
    }

    // Get entry counts per promotion
    const ids = promotions.map((p: any) => p.id)
    const { data: entries } = await supabase
      .from('customer_entries')
      .select('promotion_id, verification_status')
      .in('promotion_id', ids)

    const countMap: Record<string, { total: number, approved: number, review: number }> = {}
    if (entries) {
      entries.forEach((e: any) => {
        if (!countMap[e.promotion_id]) countMap[e.promotion_id] = { total: 0, approved: 0, review: 0 }
        countMap[e.promotion_id].total++
        if (e.verification_status === 'approved') countMap[e.promotion_id].approved++
        if (e.verification_status === 'manual_review') countMap[e.promotion_id].review++
      })
    }

    const result = promotions.map((p: any) => ({
      ...p,
      counts: countMap[p.id] || { total: 0, approved: 0, review: 0 }
    }))

    return NextResponse.json({ promotions: result })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
