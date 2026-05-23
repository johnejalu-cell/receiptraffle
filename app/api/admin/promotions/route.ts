import { NextResponse } from 'next/server'

const SUPABASE_URL = 'https://qnpjawyeekhkzvrorqyv.supabase.co'

export async function GET() {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) return NextResponse.json({ error: 'No service key' }, { status: 500 })

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(SUPABASE_URL, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const { data, error } = await supabase
      .from('promotion_submissions')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ promotions: data || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
