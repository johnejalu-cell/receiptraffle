import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = 'https://qnpjawyeekhkzvrorqyv.supabase.co'

const CONTENT_KEYS = [
  'home_headline', 'home_subheading', 'home_ai_badge',
  'home_business_title', 'home_business_subtitle',
  'biz_hero_title', 'biz_hero_subtitle',
  'biz_problem_title', 'biz_solution_title',
  'biz_pricing_title', 'biz_pricing_subtitle',
  'biz_pricing_amount', 'biz_pricing_note',
  'biz_cta_title', 'biz_cta_subtitle',
  'contact_email',
]

function parseValue(v: unknown): string {
  if (typeof v === 'string') {
    // Strip surrounding JSON quotes if present
    return v.replace(/^"|"$/g, '')
  }
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (v === null || v === undefined) return ''
  return JSON.stringify(v).replace(/^"|"$/g, '')
}

export async function GET() {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) return NextResponse.json({ error: 'No service key' }, { status: 500 })

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(SUPABASE_URL, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

    const { data, error } = await supabase
      .from('app_settings')
      .select('key, value')
      .in('key', CONTENT_KEYS)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const content: Record<string, string> = {}
    if (data) data.forEach((row: { key: string; value: unknown }) => {
      content[row.key] = parseValue(row.value)
    })

    return NextResponse.json({ content })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { updates } = await req.json()
    if (!updates || typeof updates !== 'object') return NextResponse.json({ error: 'Invalid updates' }, { status: 400 })

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) return NextResponse.json({ error: 'No service key' }, { status: 500 })

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(SUPABASE_URL, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

    const safeUpdates = Object.entries(updates)
      .filter(([key]) => CONTENT_KEYS.includes(key))
      .map(([key, value]) => ({ key, value: `"${String(value).replace(/"/g, '\\"')}"` }))

    for (const { key, value } of safeUpdates) {
      await supabase
        .from('app_settings')
        .upsert({ key, value }, { onConflict: 'key' })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
