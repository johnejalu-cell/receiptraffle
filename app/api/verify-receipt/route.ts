import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mediaType, minSpend, currency } = await req.json()
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
          { type: 'text', text: `Analyse this receipt. Respond ONLY with JSON: {"retailer":"...","date":"...","total_amount":number,"currency":"${currency || 'UGX'}","verification_status":"approved" or "manual_review","verification_reason":"...","confidence":number}. Approve if total >= ${minSpend || 0}.` }
        ]
      }]
    })
    const raw = response.content.map((c: any) => c.text || '').join('').replace(/```json|```/g, '').trim()
    return NextResponse.json(JSON.parse(raw))
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
