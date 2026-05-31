import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = 'https://qnpjawyeekhkzvrorqyv.supabase.co'

export async function POST(req: NextRequest) {
  try {
    const { base64, mediaType, fileName } = await req.json()
    if (!base64) return NextResponse.json({ error: 'No image data' }, { status: 400 })

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) return NextResponse.json({ error: 'No service key' }, { status: 500 })

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(SUPABASE_URL, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const ext = (mediaType || 'image/jpeg').includes('png') ? 'png' : 'jpg'
    const uniqueName = `logo-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`
    const buffer = Buffer.from(base64, 'base64')

    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(uniqueName, buffer, {
        contentType: mediaType || 'image/jpeg',
        upsert: false
      })

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

    const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(uniqueName)
    return NextResponse.json({ url: publicUrl })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
