import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function generateTicketNumber(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = 'RR-'
  for (let i = 0; i < 8; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { imageBase64, mediaType, promotionId, customerName, customerPhone, fileExtension } = body

    if (!imageBase64 || !promotionId) {
      return NextResponse.json({ error: 'Missing imageBase64 or promotionId' }, { status: 400 })
    }

    const supabase = getServiceClient()

    const { data: promotion, error: promoError } = await supabase
      .from('promotions')
      .select('*')
      .eq('id', promotionId)
      .single()

    if (promoError || !promotion) {
      return NextResponse.json({ error: 'Promotion not found' }, { status: 404 })
    }

    const ext = fileExtension || 'jpg'
    const filePath = `receipts/${promotionId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const imageBuffer = Buffer.from(imageBase64, 'base64')

    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(filePath, imageBuffer, {
        contentType: mediaType || 'image/jpeg',
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
    }

    const prompt = `You are a receipt verification assistant for a prize promotion platform in Uganda.

Your job is to read this receipt image and extract key details.

IMPORTANT RULES:
- Be LENIENT and CHARITABLE in your assessment. Approve the receipt unless there is a clear, specific problem.
- A receipt does NOT need to be perfect to be approved. Partial visibility, minor blur, or handwritten elements are fine.
- If you can read the total amount and it meets or exceeds the minimum spend of UGX ${promotion.min_spend}, approve it.
- Only set "manual_review" if you genuinely cannot read the total amount at all, or the receipt is clearly fake/altered.
- Do NOT set manual_review just because the image quality is imperfect.

Respond ONLY with valid JSON — no markdown, no explanation — in exactly this format:
{
  "retailer": "store name or Unknown if unreadable",
  "date": "date from receipt or today's date if unreadable",
  "total_amount": number,
  "currency": "UGX",
  "line_items": ["item 1", "item 2"],
  "verification_status": "approved" or "manual_review",
  "verification_reason": "one sentence explanation",
  "confidence": number from 0 to 100
}

Minimum spend for this promotion: UGX ${promotion.min_spend}

Decision guide:
- total_amount >= ${promotion.min_spend} AND receipt looks real → "approved"
- total_amount < ${promotion.min_spend} → "manual_review" (reason: below minimum spend)
- Cannot read total amount at all → "manual_review" (reason: total amount unreadable)
- Receipt appears clearly fraudulent or digitally altered → "manual_review" (reason: suspected fraud)`

    let aiResult: any = null

    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: (mediaType || 'image/jpeg') as any,
                data: imageBase64,
              },
            },
            { type: 'text', text: prompt },
          ],
        }],
      })

      const raw = response.content
        .map((c: any) => (c.type === 'text' ? c.text : ''))
        .join('')
        .replace(/```json|```/g, '')
        .trim()

      aiResult = JSON.parse(raw)
    } catch (aiError) {
      console.error('AI verification error:', aiError)
      aiResult = {
        retailer: 'Unknown',
        date: new Date().toLocaleDateString('en-GB'),
        total_amount: 0,
        currency: 'UGX',
        line_items: [],
        verification_status: 'manual_review',
        verification_reason: 'AI could not process image — sent for manual review',
        confidence: 0,
      }
    }

    const meetsMinSpend = aiResult.total_amount >= promotion.min_spend
    let verificationStatus: string

    if (aiResult.verification_status === 'approved' && meetsMinSpend) {
      verificationStatus = 'approved'
    } else if (!meetsMinSpend && aiResult.total_amount > 0) {
      verificationStatus = 'manual_review'
    } else {
      verificationStatus = 'manual_review'
    }

    const ticketNumber = generateTicketNumber()

    const { data: entry, error: entryError } = await supabase
      .from('entries')
      .insert({
        promotion_id: promotionId,
        customer_name: customerName || 'Anonymous',
        customer_phone: customerPhone || '',
        ticket_number: ticketNumber,
        receipt_url: filePath,
        amount: aiResult.total_amount || 0,
        currency: 'UGX',
        verification_status: verificationStatus,
        ai_confidence: aiResult.confidence || 0,
        ai_result: aiResult,
      })
      .select()
      .single()

    if (entryError) {
      console.error('Entry insert error:', entryError)
      return NextResponse.json({ error: 'Failed to save entry: ' + entryError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      entry,
      aiResult,
      verificationStatus,
      ticketNumber,
      receiptUrl: filePath,
    })

  } catch (error: any) {
    console.error('verify-receipt error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
