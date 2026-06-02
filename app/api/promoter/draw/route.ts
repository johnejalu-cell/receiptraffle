import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = 'https://qnpjawyeekhkzvrorqyv.supabase.co'

export async function POST(req: NextRequest) {
  try {
    const { email, promotion_id } = await req.json()
    if (!email || !promotion_id) return NextResponse.json({ error: 'Email and promotion_id required' }, { status: 400 })

    const { createClient } = await import('@supabase/supabase-js')
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) return NextResponse.json({ error: 'No service key' }, { status: 500 })
    const supabase = createClient(SUPABASE_URL, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Verify ownership
    const { data: promo } = await supabase
      .from('promotion_submissions')
      .select('id, email, promo_name, prizes')
      .eq('id', promotion_id)
      .eq('email', email.toLowerCase().trim())
      .single()

    if (!promo) return NextResponse.json({ error: 'Promotion not found or access denied' }, { status: 403 })

    // Get approved entries only
    const { data: entries } = await supabase
      .from('customer_entries')
      .select('id, customer_name, customer_phone, ticket_number')
      .eq('promotion_id', promotion_id)
      .eq('verification_status', 'approved')

    if (!entries || entries.length === 0) {
      return NextResponse.json({ error: 'No approved entries to draw from' }, { status: 400 })
    }

    // Random draw
    const prizes = Array.isArray(promo.prizes) ? promo.prizes : [promo.prizes]
    const winners = []
    const pool = [...entries]

    for (let i = 0; i < Math.min(prizes.length, pool.length); i++) {
      const idx = Math.floor(Math.random() * pool.length)
      const winner = pool.splice(idx, 1)[0]
      winners.push({ ...winner, prize: prizes[i] })
    }

    // Save draw results
    const drawTime = new Date().toISOString()
    for (const winner of winners) {
      await supabase.from('draw_results').insert({
        promotion_id,
        entry_id: winner.id,
        winner_name: winner.customer_name,
        winner_phone: winner.customer_phone,
        winner_ticket: winner.ticket_number,
        prize: winner.prize,
        drawn_at: drawTime,
        drawn_by: 'promoter:' + email
      })
    }

    return NextResponse.json({ winners, total_entries: entries.length })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
