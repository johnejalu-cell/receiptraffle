import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = 'https://qnpjawyeekhkzvrorqyv.supabase.co'

export async function GET() {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) return NextResponse.json({ error: 'No service key' }, { status: 500 })

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(SUPABASE_URL, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

    const { data: draws, error } = await supabase
      .from('grand_draws')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // For each draw, get linked promotions
    const drawsWithPromos = await Promise.all((draws || []).map(async (draw: any) => {
      const { data: linked } = await supabase
        .from('promotion_submissions')
        .select('id, promo_name, company_name, emoji, color, status')
        .eq('grand_draw_id', draw.id)

      // Get total entries across all linked promotions
      const promoIds = (linked || []).map((p: any) => p.id)
      let totalEntries = 0
      if (promoIds.length > 0) {
        const { data: entries } = await supabase
          .from('customer_entries')
          .select('id')
          .in('promotion_id', promoIds)
          .eq('verification_status', 'approved')
        totalEntries = entries?.length || 0
      }

      return { ...draw, linked_promotions: linked || [], total_entries: totalEntries }
    }))

    return NextResponse.json({ draws: drawsWithPromos })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action } = body

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) return NextResponse.json({ error: 'No service key' }, { status: 500 })

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(SUPABASE_URL, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

    // Create a new grand draw
    if (action === 'create') {
      const { name, prize_description, prize_value_usd, draw_date } = body
      if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })

      const { data, error } = await supabase
        .from('grand_draws')
        .insert({ name, prize_description, prize_value_usd, draw_date, status: 'pending' })
        .select()
        .single()

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, draw: data })
    }

    // Link a promotion to a grand draw
    if (action === 'link') {
      const { grand_draw_id, promotion_id } = body
      if (!grand_draw_id || !promotion_id) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

      const { error } = await supabase
        .from('promotion_submissions')
        .update({ grand_draw_id })
        .eq('id', promotion_id)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    // Unlink a promotion from a grand draw
    if (action === 'unlink') {
      const { promotion_id } = body
      if (!promotion_id) return NextResponse.json({ error: 'Missing promotion_id' }, { status: 400 })

      const { error } = await supabase
        .from('promotion_submissions')
        .update({ grand_draw_id: null })
        .eq('id', promotion_id)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    // Update grand draw status
    if (action === 'update_status') {
      const { grand_draw_id, status } = body
      const { error } = await supabase
        .from('grand_draws')
        .update({ status })
        .eq('id', grand_draw_id)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    // Run the grand draw
    if (action === 'run_draw') {
      const { grand_draw_id } = body
      if (!grand_draw_id) return NextResponse.json({ error: 'Missing grand_draw_id' }, { status: 400 })

      // Get all linked promotions
      const { data: promos } = await supabase
        .from('promotion_submissions')
        .select('id')
        .eq('grand_draw_id', grand_draw_id)

      if (!promos || promos.length === 0)
        return NextResponse.json({ error: 'No promotions linked to this draw' }, { status: 400 })

      const promoIds = promos.map((p: any) => p.id)

      // Get all approved entries from linked promotions
      const { data: entries } = await supabase
        .from('customer_entries')
        .select('id, customer_name, customer_phone, customer_email, ticket_number, promotion_id')
        .in('promotion_id', promoIds)
        .eq('verification_status', 'approved')

      if (!entries || entries.length === 0)
        return NextResponse.json({ error: 'No approved entries found' }, { status: 400 })

      // Pick random winner
      const winner = entries[Math.floor(Math.random() * entries.length)]

      // Record in draw_results
      await supabase.from('draw_results').insert({
        promotion_id: grand_draw_id,
        winner_entry_id: winner.id,
        winner_name: winner.customer_name,
        winner_phone: winner.customer_phone,
        winner_email: winner.customer_email || null,
        winner_ticket: winner.ticket_number,
        drawn_at: new Date().toISOString(),
      })

      // Update draw status
      await supabase.from('grand_draws').update({ status: 'drawn' }).eq('id', grand_draw_id)

      return NextResponse.json({
        success: true,
        winner: {
          name: winner.customer_name,
          phone: winner.customer_phone,
          email: winner.customer_email,
          ticket: winner.ticket_number,
          promotion_id: winner.promotion_id,
        },
        total_entries: entries.length,
      })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
