import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const SUPABASE_URL = 'https://qnpjawyeekhkzvrorqyv.supabase.co'

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mediaType, minSpend, currency, promotionId, name, phone, email, productKeywords } = await req.json()

    if (!imageBase64 || !name || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const anthropicKey = process.env.ANTHROPIC_API_KEY

    const keywordsList = Array.isArray(productKeywords) && productKeywords.length > 0
      ? productKeywords.join('", "')
      : null

    const productInstruction = keywordsList
      ? `The promotion requires purchase of these specific products: "${keywordsList}".
Find these products as line items on the receipt and add up ONLY their amounts.
The total spend on these promoted products must be >= ${minSpend || 0} ${currency || 'UGX'}.
If you cannot find any of these products clearly on the receipt, set status to "manual_review".
If the products are present and the total meets the minimum, set status to "approved".`
      : `Check that the total receipt amount is >= ${minSpend || 0} ${currency || 'UGX'}.`

    let aiResult: any = {
      verification_status: 'manual_review',
      total_amount: 0,
      promoted_items_total: 0,
      promoted_items_found: [],
      confidence: 0,
      verification_reason: 'Could not read receipt — sent for manual review',
      retailer: 'Unknown',
      date: ''
    }

    if (anthropicKey) {
      try {
        const anthropic = new Anthropic({ apiKey: anthropicKey })
        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1500,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mediaType as any, data: imageBase64 }
              },
              {
                type: 'text',
                text: `You are a receipt verification system for a prize promotion. Analyse this receipt image.

${productInstruction}

Guidelines:
- If the receipt is clearly readable and meets the criteria, approve it
- Only send to manual_review if: image is genuinely unclear/blurry, OR promoted products are genuinely absent, OR amount genuinely falls short
- Do not be overly strict — if the products are visible on the receipt, approve
- A PDF or digital receipt is perfectly valid
- confidence should be 80+ for a clear digital/printed receipt

Respond ONLY with valid JSON, no markdown:
{
  "retailer": "store name",
  "date": "DD/MM/YYYY",
  "total_amount": full receipt total as number,
  "promoted_items_found": ["exact product names found"],
  "promoted_items_total": total of promoted items only as number,
  "currency": "${currency || 'UGX'}",
  "verification_status": "approved" or "manual_review",
  "verification_reason": "brief reason",
  "confidence": number 0-100
}`
              }
            ]
          }]
        })

        const raw = response.content
          .map((c: any) => c.text || '')
          .join('')
          .replace(/```json|```/g, '')
          .trim()

        const parsed = JSON.parse(raw)

        const amountToCheck = keywordsList
          ? (parsed.promoted_items_total || 0)
          : (parsed.total_amount || 0)

        // Approve if: AI says approved AND amount meets minimum AND confidence >= 55
        if (
          parsed.verification_status === 'approved' &&
          parsed.confidence >= 55 &&
          amountToCheck >= (minSpend || 0) &&
          amountToCheck > 0
        ) {
          aiResult = parsed
        } else {
          let reason = parsed.verification_reason || 'Sent for manual review'
          if (parsed.confidence < 55) {
            reason = `Low confidence (${parsed.confidence}%) — sent for manual review`
          } else if (keywordsList && (!parsed.promoted_items_found?.length || parsed.promoted_items_found.length === 0)) {
            reason = `Promoted products not clearly found on receipt`
          } else if (amountToCheck < (minSpend || 0)) {
            reason = keywordsList
              ? `Promoted items total (UGX ${amountToCheck.toLocaleString()}) below minimum of UGX ${parseInt(minSpend).toLocaleString()}`
              : `Receipt total below minimum spend`
          }
          aiResult = { ...parsed, verification_status: 'manual_review', verification_reason: reason }
        }
      } catch (aiError: any) {
        console.error('AI error:', aiError)
      }
    }

    const isApproved = aiResult.verification_status === 'approved'
    const ticket = 'RR-' + Math.random().toString(36).substring(2, 10).toUpperCase()

    // Save to Supabase
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(SUPABASE_URL, serviceKey!, {
        auth: { autoRefreshToken: false, persistSession: false }
      })
      await supabase.from('customer_entries').insert({
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
      })
    } catch (dbError) {
      console.error('DB error:', dbError)
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
