import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = 'https://qnpjawyeekhkzvrorqyv.supabase.co'

export async function GET() {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) return NextResponse.json({ error: 'No service key', promotions: [] })
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(SUPABASE_URL, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

    const { data, error } = await supabase
      .from('promotion_submissions')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message, promotions: [] })
    if (!data || data.length === 0) return NextResponse.json({ promotions: [] })

    const ids = data.map((p: any) => p.id)
    const { data: entryCounts } = await supabase
      .from('customer_entries')
      .select('promotion_id')
      .in('promotion_id', ids)
      .eq('verification_status', 'approved')

    const countMap: Record<string, number> = {}
    if (entryCounts) {
      entryCounts.forEach((e: any) => {
        countMap[e.promotion_id] = (countMap[e.promotion_id] || 0) + 1
      })
    }

    const promotions = data.map((p: any) => ({
      ...p,
      entries_count: countMap[p.id] || 0,
    }))

    return NextResponse.json({ promotions })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err), promotions: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) return NextResponse.json({ error: 'No service key' }, { status: 500 })

    const formData = await req.formData()

    // Read all fields safely as strings
    const companyName = formData.get('companyName') as string || ''
    const contactName = formData.get('contactName') as string || ''
    const email = formData.get('email') as string || ''
    const phone = formData.get('phone') as string || ''
    const promoName = formData.get('promoName') as string || ''
    const minSpend = parseFloat(formData.get('minSpend') as string || '0') || 0
    const currency = formData.get('currency') as string || 'UGX'
    const startDate = formData.get('startDate') as string || null
    const endDate = formData.get('endDate') as string || null
    const drawDate = formData.get('drawDate') as string || null
    const prizes = formData.get('prizes') as string || ''
    const productKeywords = formData.get('productKeywords') as string || ''
    const termsConditions = formData.get('termsConditions') as string || ''
    const promoterPin = formData.get('promoterPin') as string || ''
    const emoji = formData.get('emoji') as string || '🛍'
    const color = formData.get('color') as string || '#1D9E75'
    const logoFile = formData.get('logo') as File | null

    // Parse barcodes safely
    let productBarcodes: string[] = []
    try {
      const barcodesRaw = formData.get('productBarcodes') as string
      if (barcodesRaw) productBarcodes = JSON.parse(barcodesRaw)
    } catch { productBarcodes = [] }

    // Parse keywords into array
    const keywordsArray = productKeywords
      ? productKeywords.split(',').map((k: string) => k.trim()).filter(Boolean)
      : []

    // Generate ref
    const ref = 'PR-' + Math.random().toString(36).substring(2, 8).toUpperCase()

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(SUPABASE_URL, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

    // Upload logo if provided
    let logoUrl: string | null = null
    if (logoFile && logoFile.size > 0) {
      try {
        const logoBytes = await logoFile.arrayBuffer()
        const logoBuffer = Buffer.from(logoBytes)
        const logoExt = logoFile.name.split('.').pop() || 'jpg'
        const logoPath = `logos/${ref}.${logoExt}`
        const { error: uploadError } = await supabase.storage
          .from('logos')
          .upload(logoPath, logoBuffer, { contentType: logoFile.type, upsert: true })
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('logos').getPublicUrl(logoPath)
          logoUrl = urlData?.publicUrl || null
        }
      } catch { logoUrl = null }
    }

    const { error: insertError } = await supabase
      .from('promotion_submissions')
      .insert({
        promo_name: promoName,
        company_name: companyName,
        contact_name: contactName,
        email,
        phone,
        min_spend: minSpend,
        currency,
        start_date: startDate,
        end_date: endDate,
        draw_date: drawDate,
        prizes,
        product_keywords: keywordsArray,
        product_barcodes: productBarcodes,
        terms_conditions: termsConditions,
        promoter_pin: promoterPin,
        emoji,
        color,
        logo_url: logoUrl,
        ref,
        status: 'pending',
      })

    if (insertError) {
      console.error('[promotions] Insert error:', insertError.message)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, ref })
  } catch (err: unknown) {
    console.error('[promotions] Fatal error:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
