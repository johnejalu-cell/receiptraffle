import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = 'https://qnpjawyeekhkzvrorqyv.supabase.co'

export async function GET() {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) return NextResponse.json({ redirects: [] })
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(SUPABASE_URL, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
    const { data, error } = await supabase
      .from('promotion_redirects')
      .select('slug, promotion_id, created_at')
      .order('created_at', { ascending: false })
    if (error) return NextResponse.json({ redirects: [] })
    return NextResponse.json({ redirects: data || [] })
  } catch (e: any) {
    return NextResponse.json({ redirects: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { slug, promotion_id } = await req.json()
    if (!slug || !promotion_id) return NextResponse.json({ error: 'Missing slug or promotion_id' }, { status: 400 })

    // Sanitise slug — lowercase, alphanumeric and hyphens only
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '')
    if (!cleanSlug) return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) return NextResponse.json({ error: 'No service key' }, { status: 500 })
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(SUPABASE_URL, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
    const { data, error } = await supabase
      .from('promotion_redirects')
      .upsert({ slug: cleanSlug, promotion_id }, { onConflict: 'slug' })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, redirect: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { slug } = await req.json()
    if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 })
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) return NextResponse.json({ error: 'No service key' }, { status: 500 })
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(SUPABASE_URL, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
    const { error } = await supabase
      .from('promotion_redirects')
      .delete()
      .eq('slug', slug)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
