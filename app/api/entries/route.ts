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
  const keyWords = keyword.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean)
  const checkWords = keyWords.slice(0, 3)
  return checkWords.every(w => itemLower.includes(w))
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { imageBase64, mediaType, minSpend, currency, promotionId, name, phone, email, productKeywords } = body

    const b64Length = imageBase64?.length || 0
    const estimatedKB = Math.round(b64Length * 0.75 / 1024)
    console.warn('[entries] Request received:', {
      hasImage: !!imageBase64,
      imageLength: b64Length,
      estimatedKB,
      mediaType,
      name,
      phone,
      promotionId,
      minSpend,
      keywords: productKeywords,
    })
    // Return image stats in response for debugging
    const debugInfo = { b64Length, estimatedKB, mediaType }

    if (!name || !phone) {
      return NextResponse.json({ error: 'Missing name or phone' }, { status: 400 })
    }

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image received' }, { status: 400 })
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const anthropicKey = process.env.ANTHROPIC_API_KEY

    console.warn('[entries] Keys present:', { hasServiceKey: !!serviceKey, hasAnthropicKey: !!anthropicKey })

    const ticket = 'RR-' + Math.random().toString(36).substring(2, 10).toUpperCase()
    const safeMediaType = normaliseMediaType(mediaType || '')
    const keywords: string[] = Array.isArray(productKeywords) && productKeywords.length > 0 ? productKeywords : []

    console.warn('[entries] Safe media type:', safeMediaType, '| Keywords:', keywords)

    let aiResult: any = {
      verification_status: 'manual_review',
      total_amount: 0,
      promoted_items_total: 0,
      promoted_items_found: [],
      confidence: 50,
      verification_reason: 'Sent for manual review',
      retailer: 'Unknown',
      currency: currency || 'USD',
      date: ''
    }

    if (!anthropicKey) {
      console.warn('[entries] No Anthropic key — skipping AI')
    } else {
      try {
        console.warn('[entries] Calling Anthropic API...')
        const anthropic = new Anthropic({ apiKey: anthropicKey })

        const keywordList = keywords.join('", "')
        const prompt = keywords.length > 0
          ? `You are verifying a receipt for a sales promotion. Examine this receipt carefully.

TASK: Find items matching this brand/product: "${keywordList}"
- Use fuzzy matching: if the first few letters of the brand appear on the receipt, count it as a match
- Look for the brand name anywhere on the receipt as a store name, product name, or line item
- The brand name may be abbreviated or partially visible, be generous in matching
- Report the store/retailer name exactly as shown
- Report the currency shown on the receipt (e.g. USD, GBP, EUR, UGX, KES, etc.)
- Add up the total spent on matching items only

Reply with JSON only, no markdown:
{
  "retailer": "exact store name from receipt",
  "date": "date shown on receipt",
  "total_amount": total of entire receipt as a plain number,
  "promoted_items_found": ["exact names of matching items found"],
  "promoted_items_total": total of matching items only as a plain number,
  "currency": "3-letter currency code detected from receipt",
  "verification_status": "approved or manual_review",
  "verification_reason": "one sentence explaining your decision",
  "confidence": plain number 0-100 indicating how clearly you can read the receipt
}

Set verification_status to "approved" if you found items matching the brand (even partially) AND their total >= ${minSpend || 0}.
Set to "manual_review" only if receipt is genuinely unreadable, brand is genuinely absent, or total clearly falls short.`

          : `You are verifying a receipt for a sales promotion. Examine this receipt carefully.

TASK: Read the total amount and store name.
- Report the store/retailer name exactly as shown
- Report the currency shown on the receipt (e.g. USD, GBP, EUR, UGX, KES, etc.)
- Report the total amount paid

Reply with JSON only, no markdown:
{
  "retailer": "exact store name from receipt",
  "date": "date shown on receipt",
  "total_amount": total amount as a plain number,
  "promoted_items_found": [],
  "promoted_items_total": 0,
  "currency": "3-letter currency code detected from receipt",
  "verification_status": "approved or manual_review",
  "verification_reason": "one sentence explaining your decision",
  "confidence": plain number 0-100 indicating how clearly you can read the receipt
}

Set verification_status to "approved" if total_amount >= ${minSpend || 0} and receipt is legible.
Set to "manual_review" only if receipt is genuinely unreadable or total clearly falls short.`

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

        const rawText = response.content.map((c: any) => c.text || '').join('')
        console.warn('[entries] AI raw response:', rawText.substring(0, 500))

        // Robust JSON extraction — find the first { and last } in the response
        const firstBrace = rawText.indexOf('{')
        const lastBrace = rawText.lastIndexOf('}')
        if (firstBrace === -1 || lastBrace === -1) {
          throw new Error('No JSON object found in AI response: ' + rawText.substring(0, 200))
        }
        const raw = rawText.substring(firstBrace, lastBrace + 1)
        const parsed = JSON.parse(raw)
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
          if (!isReadable) reason = `Receipt not clearly readable (confidence: ${parsed.confidence}%)`
          else if (!hasItems) reason = `Brand/product "${keywords.join(', ')}" not found on receipt`
          else if (!meetsMinimum) reason = `Amount ${parsed.currency || currency || 'USD'} ${amountToCheck.toLocaleString()} is below the minimum of ${minSpend || 0}`
          aiResult = { ...parsed, promoted_items_found: matchedItems, verification_status: 'manual_review', verification_reason: reason }
        }

      } catch (aiError: any) {
        console.error('[entries] AI ERROR:', aiError.message, aiError.stack)
        // Expose the real error so admin can see it
        const errMsg = aiError?.message || aiError?.toString() || 'Unknown error'
        aiResult.verification_reason = 'AI error: ' + errMsg
      }
    }

    console.warn('[entries] Final aiResult status:', aiResult.verification_status, '| confidence:', aiResult.confidence)

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
        amount: aiResult.promoted_items_total || aiResult.total_amount || 0,
        retailer: aiResult.retailer || 'Unknown',
        receipt_date: aiResult.date || null,
        currency: aiResult.currency || currency || 'USD',
        verification_status: isApproved ? 'approved' : 'manual_review',
        ai_confidence: aiResult.confidence || 0,
        ai_result: aiResult,
        receipt_image_path: null,
      })
      if (dbError) {
        console.error('[entries] DB ERROR:', dbError.message, dbError.details, dbError.hint)
        return NextResponse.json({ error: 'Failed to save entry: ' + dbError.message }, { status: 500 })
      }
      console.warn('[entries] Saved to DB successfully. Ticket:', ticket)
    } else {
      console.warn('[entries] No service key — entry not saved to DB')
    }

    return NextResponse.json({
      aiResult,
      verificationStatus: isApproved ? 'approved' : 'manual_review',
      ticketNumber: ticket,
      debug: debugInfo,
    })

  } catch (error: any) {
    console.error('[entries] FATAL ERROR:', error.message, error.stack)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
