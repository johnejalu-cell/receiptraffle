import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const SUPABASE_URL = 'https://qnpjawyeekhkzvrorqyv.supabase.co'

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mediaType, minSpend, currency, promotionId, name, phone, email } = await req.json()

    if (!imageBase64 || !name || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const anthropicKey = process.env.ANTHROPIC_API_KEY

    if (!serviceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Run AI verification
    let aiResult: any = {
      verification_status: 'manual_review',
      total_amount: 0,
      confidence: 0,
      verification_reason: 'Could not read receipt',
      retailer: 'Unknown',
      date: ''
    }

    if (anthropicKey) {
      try {
        const anthropic = new Anthropic({ apiKey: anthropicKey })
        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mediaType as any, data: imageBase64 }
              },
              {
                type: 'text',
                text: `Analyse this receipt image. Respond ONLY with valid JSON, no markdown:
{"retailer":"store name","date":"DD/MM/YYYY","total_amount":number,"currency":"${currency || 'UGX'}","verification_status":"approved" or "manual_review","verification_reason":"brief reason","confidence":number 0-100}
Approve if total_amount >= ${minSpend || 0} and receipt looks genuine.`
              }
            ]
          }]
        })
        const raw = response.content.map((c: any) => c.text || '').join('').replace(/```json|```/g, '').trim()
        aiResult = JSON.parse(raw)
      } catch (aiError) {
        console.error('AI error:', aiError)
      }
    }

    const isApproved = aiResult.verification_status === 'approved' &&
                       aiResult.total_amount >= (minSpend || 0)
    const ticket = 'RR-' + Math.random().toString(36).substring(2, 10).toUpperCase()

    // Save to Supabase
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(SUPABASE_URL, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const { data: entry, error } = await supabase
      .from('customer_entries')
      .insert({
        promotion_id: promotionId || null,
        customer_name: name,
        customer_phone: phone,
        customer_email: email || null,
        ticket_number: ticket,
        amount: aiResult.total_amount || 0,
        retailer: aiResult.retailer || 'Unknown',
        receipt_date: aiResult.date || null,
        currency: currency || 'UGX',
        verification_status: isApproved ? 'approved' : 'manual_review',
        ai_confidence: aiResult.confidence || 0,
        ai_result: aiResult,
      })
      .select()
      .single()

    if (error) {
      console.error('Entry save error:', error)
      // Still return success to customer even if save fails
    }

    return NextResponse.json({
      aiResult,
      verificationStatus: isApproved ? 'approved' : 'manual_review',
      ticketNumber: ticket,
    })
  } catch (error: any) {
    console.error('Entries API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
