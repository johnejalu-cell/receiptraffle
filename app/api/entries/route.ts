import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mediaType, minSpend, currency, promotionId, name, phone, email } = await req.json()

    // Run AI verification
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
    let aiResult: any = null

    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType as any, data: imageBase64 } },
            { type: 'text', text: `Analyse this receipt. Respond ONLY with JSON: {"retailer":"...","date":"...","total_amount":number,"currency":"${currency || 'UGX'}","verification_status":"approved" or "manual_review","verification_reason":"...","confidence":number}. Approve if total >= ${minSpend || 0}.` }
          ]
        }]
      })
      const raw = response.content.map((c: any) => c.text || '').join('').replace(/```json|```/g, '').trim()
      aiResult = JSON.parse(raw)
    } catch {
      aiResult = { verification_status: 'manual_review', total_amount: 0, confidence: 0, verification_reason: 'Could not read receipt' }
    }

    const ticket = 'RR-' + Math.random().toString(36).substring(2, 10).toUpperCase()
    const isApproved = aiResult.verification_status === 'approved' && aiResult.total_amount >= (minSpend || 0)

    // Save entry to Supabase
    const supabase = getServiceClient()
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
