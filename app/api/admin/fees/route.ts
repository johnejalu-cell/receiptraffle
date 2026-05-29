import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = 'https://qnpjawyeekhkzvrorqyv.supabase.co'

export async function GET() {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) return NextResponse.json({ fee: null })

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(SUPABASE_URL, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'promotion_fee')
      .single()

    if (error || !data) return NextResponse.json({ fee: null })
    return NextResponse.json({ fee: data.value })
  } catch (error: any) {
    return NextResponse.json({ fee: null })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { amount, currency, description } = await req.json()
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) return NextResponse.json({ error: 'No service key' }, { status: 500 })

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(SUPABASE_URL, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const value = { amount, currency, description }

    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: 'promotion_fee', value }, { onConflict: 'key' })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, fee: value })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
