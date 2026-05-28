import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const SUPABASE_URL = 'https://qnpjawyeekhkzvrorqyv.supabase.co'

// Anthropic only accepts these image types
function normaliseMediaType(raw: string): 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' {
  if (raw === 'image/png') return 'image/png'
  if (raw === 'image/gif') return 'image/gif'
  if (raw === 'image/webp') return 'image/webp'
  return 'image/jpeg' // default — covers image/jpeg, image/heic, image/heif, and anything else
}

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mediaType, minSpend, currency, promotionId, name, phone, email, productKeywords } = await req.json()

    if (!imageBase64 || !name || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const anthropicKey = process.env.ANTHROPIC_API_KEY
    const ticket = 'RR-' + Math.random().toString(36).substring(2, 10).toUpperCase()
    const safeMediaType = normaliseMediaType(mediaType || '')

    // AI verification
    let aiResult: any = {
      verification_status: 'manual_review',
      total_amount: 0,
      promoted_items_total: 0,
      promoted_items_found: [],
      confidence: 50,
      verification_reason: 'Sent for manual review',
      retailer: 'Unknown',
      date: ''
    }

    if (anthropicKey) {
      try {
        const anthropic = new Anthropic({ apiKey: anthropicKey })

        const keywords = Array.isArray(productKeywords) && productKeywords.length > 0
          ? productKeywords
          : []

        const prompt = keywords.length > 0
          ? `Look at this receipt image. Find any items from this brand/product list: ${keywords.join(', ')}.

Add up the total cost of ONLY those matching items.

Reply with JSON only (no markdown, no explanation):
{
  "retailer": "store name",
  "date": "date on receipt",
  "total_amount": total of entire receipt as number,
  "promoted_items_found": ["item names found from the list"],
  "promoted_items_total": total cost of matching items only as number,
  "currency": "${currency || 'UGX'}",
  "verification_status": "approved or manual_review",
  "verification_reason": "what you found",
  "confidence": confidence as a plain number 0-100
}

Set verification_status to "approved" if you found matching items AND their total >= ${minSpend || 0}.
Set to "manual_review" if no matching items found or total is too low or receipt is unclear.`
          : `Look at this receipt image.

Reply with JSON only (no markdown, no explanation):
{
  "retailer": "store name",
  "date": "date on receipt",
  "total_amount": total amount as number,
  "promoted_items_found": [],
  "promoted_items_total": 0,
  "currency": "${currency || 'UGX'}",
  "verification_status": "approved or manual_review",
  "verification_reason": "brief reason",
  "confidence": confidence as a plain number 0-100
}

Set verification_status to "approved" if total_amount >= ${minSpend || 0} and receipt is legible.`

        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-5-20251001',
          max_tokens: 800,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: safeMediaType, data: imageBase64 }
              },
              { type: 'text', text: prompt }
            ]
          }]
        })

        const raw = response.content
          .map((c: any) => c.text || '')
          .join('')
          .replace(/```json|```/g, '')
          .trim()

        const parsed = JSON.parse(raw)

        const amountToCheck = keywords.length > 0
          ? (parsed.promoted_items_total || 0)
          : (parsed.total_amount || 0)

        const meetsMinimum = amountToCheck >= (minSpend || 0)
        const hasItems = keywords.length === 0 || (parsed.promoted_items_found?.length > 0)
        const isReadable = parsed.confidence >= 40

        if (meetsMinimum && hasItems && isReadable) {
          aiResult = { ...parsed, verification_status: 'approved' }
        } else {
          let reason = 'Sent for manual review'
          if (!isReadable) reason = `Receipt not clearly readable (confidence: ${parsed.confidence}%)`
          else if (!hasItems) reason = `Promoted products (${keywords.join(', ')}) not found on receipt`
          else if (!meetsMinimum) reason = `Amount UGX ${amountToCheck.toLocaleString()} is below minimum UGX ${parseInt(minSpend || '0').toLocaleString()}`
          aiResult = { ...parsed, verification_status: 'manual_review', verification_reason: reason }
        }

      } catch (aiError: any) {
        console.error('AI error:', aiError.message)
        aiResult.verification_reason = 'AI processing error — sent for manual review'
      }
    }

    const isApproved = aiResult.verification_status === 'approved'

    // Save entry to Supabase
    if (serviceKey) {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(SUPABASE_URL, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      })
      const { error: dbError } = await supabase.from('customer_entries').insert({
        promotion_id: promotionId || null,
        customer_name: name,
        customer_phone: phone,
        customer_email: email || null,
        ticket_number: ticket,
        amount: aiResult.promoted_items_total || aiResult.total_amount || 0,
        retailer: aiResult.retailer || 'Unknown',
        receipt_date: aiResult.date || null,
        currency: currency || 'UGX',
        verification_status: isApproved ? 'approved' : 'manual_review',
        ai_confidence: aiResult.confidence || 0,
        ai_result: aiResult,
        receipt_image_path: null,
      })
      if (dbError) {
        console.error('DB insert error:', dbError.message, dbError.details, dbError.hint)
        return NextResponse.json({ error: 'Failed to save entry: ' + dbError.message }, { status: 500 })
      }
    }

    return NextResponse.json({
      aiResult,
      verificationStatus: isApproved ? 'approved' : 'manual_review',
      ticketNumber: ticket,
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
