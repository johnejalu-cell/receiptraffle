import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = 'https://qnpjawyeekhkzvrorqyv.supabase.co'

export async function POST(req: NextRequest) {
  try {
    const { email, pin } = await req.json()
    if (!email || !pin) return NextResponse.json({ error: 'Email and PIN required' }, { status: 400 })

    const { createClient } = await import('@supabase/supabase-js')
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) return NextResponse.json({ error: 'No service key' }, { status: 500 })
    const supabase = createClient(SUPABASE_URL, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const { data, error } = await supabase
      .from('promotion_submissions')
      .select('id, email, contact_name, promoter_pin')
      .eq('email', email.toLowerCase().trim())
      .limit(1)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'No account found for this email address' }, { status: 404 })
    }

    if (!data.promoter_pin) {
      return NextResponse.json({ error: 'No PIN set for this account. Please contact support.' }, { status: 401 })
    }

    if (data.promoter_pin !== pin.trim()) {
      return NextResponse.json({ error: 'Incorrect PIN. Please try again.' }, { status: 401 })
    }

    return NextResponse.json({ success: true, name: data.contact_name })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
