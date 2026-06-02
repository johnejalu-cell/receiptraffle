// v14 - clean rewrite with barcode support
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const SUPABASE_URL = 'https://qnpjawyeekhkzvrorqyv.supabase.co'

function normaliseMediaType(raw: string): 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' {
  if (raw === 'image/png') return 'image/png'
  if (raw === 'image/gif') return 'image/gif'
  if (raw === 'image/webp') return 'image/webp'
  return 'image/jpeg'
}

function fuzzyMatch(item: string, keyword: string): boolean {
  const itemLower = item.toLowerCase().replace(/[^a-z0-9\s]/g, '')
  const keyWords = keyword.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean).slice(0, 3)
  return keyWords.every(w => itemLower.includes(w))
}

function buildPrompt(keywords: string[], barcodes: string[], minSpend: number, currency: string): string {
  const barcodeNote = barcodes.length > 0
    ? '\nBARCODE CHECK: Also look for these product barcodes on the receipt: ' + barcodes.join(', ')
    : ''

  if (keywords.length > 0) {
    const keywordList = keywords.join('", "')
    return 'You are verifying a receipt for a sales promotion. Examine this receipt carefully.\n\n'
      + 'TASK: Find items matching this brand/product: "' + keywordList + '"\n'
      + '- Use fuzzy matching: if the first few letters of the brand appear on the receipt, count it as a match\n'
      + '- Look for the brand name anywhere on the receipt as a store name, product name, or line item\n'
      + '- The brand name may be abbreviated or partially visible, be generous in matching\n'
      + '- Report the store/retailer name exactly as shown\n'
      + '- Report the currency shown on the receipt (e.g. USD, GBP, EUR, UGX, KES, etc.)\n'
      + '- Add up the total spent on matching items only'
      + barcodeNote + '\n\n'
      + 'Reply with JSON only, no markdown:\n'
      + '{\n'
      + '  "retailer": "exact store name from receipt",\n'
      + '  "date": "date shown on receipt",\n'
      + '  "total_amount": total of entire receipt as a plain number,\n'
      + '  "currency": "currency code from receipt",\n'
      + '  "promoted_items_found": ["item1", "item2"],\n'
      + '  "promoted_items_total": total of matching items as a plain number,\n'
      + '  "barcode_found": true or false,\n'
      + '  "confidence": number 0-100,\n'
      + '  "verification_status": "approved" or "manual_review",\n'
      + '  "verification_reason": "brief explanation"\n'
      + '}'
  }

  return 'You are verifying a receipt for a sales promotion. Extract the following information.\n\n'
    + '- Report the store/retailer name exactly as shown\n'
    + '- Report the currency shown on the receipt\n'
    + '- Report the total amount\n'
    + '- Minimum spend required: ' + minSpend + ' ' + currency
    + barcodeNote + '\n\n'
    + 'Reply with JSON only, no markdown:\n'
    + '{\n'
    + '  "retailer": "exact store name from receipt",\n'
    + '  "date": "date shown on receipt",\n'
    + '  "total_amount": total as a plain number,\n'
    + '  "currency": "currency code from receipt",\n'
    + '  "promoted_items_found": [],\n'
    + '  "promoted_items_total": 0,\n'
    + '  "barcode_found": false,\n'
    + '  "confidence": number 0-100,\n'
    + '  "verification_status": "approved" or "manual_review",\n'
    + '  "verification_reason": "brief explanation"\n'
    + '}'
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      imageBase64,
      mediaType,
      minSpend,
      currency,
      promotionId,
      name,
      phone,
      email,
      productKeywords,
      productBarcodes,
      promotionName,
      companyName,
    } = body

    console.warn('[entries] Request received:', {
      hasImage: !!imageBase64,
      imageLength: imageBase64?.length || 0,
      mediaType, name, phone, promotionId, minSpend,
      keywords: productKeywords,
      barcodes: productBarcodes,
    })

    if (!name || !phone) return NextResponse.json({ error: 'Missing name or phone' }, { status: 400 })
    if (!imageBase64) return NextResponse.json({ error: 'No image received' }, { status: 400 })

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const anthropicKey = process.env.ANTHROPIC_API_KEY

    console.warn('[entries] Keys present:', { hasServiceKey: !!serviceKey, hasAnthropicKey: !!anthropicKey })

    const ticket = 'RR-' + Math.random().toString(36).substring(2, 10).toUpperCase()
    const safeMediaType = normaliseMediaType(mediaType || '')
    const keywords: string[] = Array.isArray(productKeywords) && productKeywords.length > 0 ? productKeywords : []
    const barcodes: string[] = Array.isArray(productBarcodes) && productBarcodes.length > 0 ? productBarcodes : []

    let aiResult: {
      verification_status: string
      total_amount: number
      promoted_items_total: number
      promoted_items_found: string[]
      confidence: number
      verification_reason: string
      retailer: string
      currency: string
      date: string
      barcode_found: boolean
    } = {
      verification_status: 'manual_review',
      total_amount: 0,
      promoted_items_total: 0,
      promoted_items_found: [],
      confidence: 50,
      verification_reason: 'Sent for manual review',
      retailer: 'Unknown',
      currency: currency || 'USD',
      date: '',
      barcode_found: false,
    }

    if (!anthropicKey) {
      console.warn('[entries] No Anthropic key - skipping AI')
    } else {
      try {
        console.warn('[entries] Calling Anthropic API...')
        const anthropic = new Anthropic({ apiKey: anthropicKey })
        const prompt = buildPrompt(keywords, barcodes, minSpend || 0, currency || 'USD')

        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 800,
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: safeMediaType, data: imageBase64 } },
              { type: 'text', text: prompt }
            ]
          }]
        })

        const rawText = response.content.map((c: { type: string; text?: string }) => c.type === 'text' ? (c.text || '') : '').join('')
        console.warn('[entries] AI raw response:', rawText.substring(0, 300))

        const firstBrace = rawText.indexOf('{')
        const lastBrace = rawText.lastIndexOf('}')
        if (firstBrace === -1 || lastBrace === -1) throw new Error('No JSON in AI response: ' + rawText.substring(0, 100))

        const parsed = JSON.parse(rawText.substring(firstBrace, lastBrace + 1))
        console.warn('[entries] AI parsed:', parsed)

        let matchedItems: string[] = []
        const matchedTotal = parsed.promoted_items_total || 0

        if (keywords.length > 0 && parsed.promoted_items_found?.length > 0) {
          matchedItems = parsed.promoted_items_found.filter((item: string) =>
            keywords.some(kw => fuzzyMatch(item, kw))
          )
          if (matchedItems.length === 0 && parsed.promoted_items_found.length > 0) {
            matchedItems = parsed.promoted_items_found
          }
        }

        const amountToCheck = keywords.length > 0 ? matchedTotal : (parsed.total_amount || 0)
        const meetsMinimum = amountToCheck >= (minSpend || 0)
        const hasItems = keywords.length === 0 || matchedItems.length > 0
        const isReadable = (parsed.confidence || 0) >= 40

        console.warn('[entries] Checks:', { amountToCheck, minSpend, meetsMinimum, hasItems, isReadable, status: parsed.verification_status })

        if (meetsMinimum && hasItems && isReadable && parsed.verification_status === 'approved') {
          aiResult = { ...parsed, promoted_items_found: matchedItems, verification_status: 'approved' }
        } else {
          let reason = parsed.verification_reason || 'Sent for manual review'
          if (!isReadable) reason = 'Receipt not clearly readable (confidence: ' + parsed.confidence + '%)'
          else if (!hasItems) reason = 'Brand/product "' + keywords.join(', ') + '" not found on receipt'
          else if (!meetsMinimum) reason = 'Amount ' + (parsed.currency || currency || 'USD') + ' ' + amountToCheck.toLocaleString() + ' is below minimum ' + (minSpend || 0).toLocaleString()
          aiResult = { ...parsed, promoted_items_found: matchedItems, verification_status: 'manual_review', verification_reason: reason }
        }
      } catch (aiError: unknown) {
        console.error('[entries] AI error:', aiError instanceof Error ? aiError.message : String(aiError))
      }
    }

    const isApproved = aiResult.verification_status === 'approved'

    if (serviceKey) {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(SUPABASE_URL, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
      const { error: dbError } = await supabase.from('customer_entries').insert({
        promotion_id: promotionId || null,
        customer_name: name,
        customer_phone: phone,
        customer_email: email || null,
        ticket_number: ticket,
        amount: keywords.length > 0 ? (aiResult.promoted_items_total || 0) : (aiResult.total_amount || 0),
        retailer: aiResult.retailer || 'Unknown',
        receipt_date: aiResult.date || null,
        currency: aiResult.currency || currency || 'USD',
        verification_status: isApproved ? 'approved' : 'manual_review',
        ai_confidence: aiResult.confidence || 0,
        ai_result: { ...aiResult, barcode_found: aiResult.barcode_found || false },
        receipt_image_path: null,
        promotion_name: promotionName || null,
        company_name: companyName || null,
      })
      if (dbError) {
        console.error('[entries] DB ERROR:', dbError.message)
        return NextResponse.json({ error: 'Failed to save entry: ' + dbError.message }, { status: 500 })
      }
      console.warn('[entries] Saved to DB. Ticket:', ticket)
    }

    return NextResponse.json({
      aiResult,
      verificationStatus: isApproved ? 'approved' : 'manual_review',
      ticketNumber: ticket,
    })

  } catch (error: unknown) {
    console.error('[entries] FATAL ERROR:', error instanceof Error ? error.message : String(error))
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
