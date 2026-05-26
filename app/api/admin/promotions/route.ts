import { NextResponse } from 'next/server'

const SUPABASE_URL = 'https://qnpjawyeekhkzvrorqyv.supabase.co'

export async function GET() {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) return NextResponse.json({ error: 'No service key', promotions: [] })

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(SUPABASE_URL, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Return ALL promotions (active + pending) for admin view
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
