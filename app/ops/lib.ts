import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

export function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase env vars missing')
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    // Next.js caches fetch() responses by default; force fresh data on every call
    global: {
      fetch: (input: any, init: any) => fetch(input, { ...(init || {}), cache: 'no-store' }),
    },
  })
}

export function opsAuthorized(req: NextRequest): boolean {
  const pw = process.env.OPS_PASSWORD
  return !!pw && req.headers.get('x-ops-key') === pw
}

export function senderName(): string {
  return process.env.OPS_SENDER_NAME || 'John'
}

export function today(): string {
  return new Date().toISOString().slice(0, 10)
}

// ---------- LinkedIn touches: plain templates, no AI needed ----------
const LINKEDIN_TEMPLATES: Record<string, string> = {
  CONNECT:
    "Hi [First Name], I follow how [Company] activates its brands in-store. I work with FMCG trade marketing teams on promo attribution and sell-out data. I'd value connecting.",
  M1:
    "Thanks for connecting, [First Name]. Quick question I've been asking trade marketing leads: when [Company] runs a consumer promo, how much of the purchase data actually comes back to you, versus staying with the retailer? Most teams tell me \"almost none.\" That's the gap we built Receiptraffle to close. No pitch here, I'm just curious how you handle it.",
  M2:
    "VOICE NOTE SCRIPT (30-40 seconds, record it yourself on LinkedIn):\n\"Hi [First Name], [Founder] here. I've been following [Company]'s in-store promotions. I'm curious whether you can see which stores actually drive the results. We let brands do that from a photo of a supermarket receipt, with no packaging changes. If that's relevant, I'll send a 3-minute walkthrough.\"",
  M3:
    "[First Name], a simple way to test this: our Starter campaign is $750 for a 4-week receipt promotion on one [Company] SKU, with a branded microsite, automated validation, and a live dashboard. If the data doesn't change how you plan trade spend, you've spent less than a single in-store activation day. Shall I send the brief form?",
}

export function fillLinkedIn(code: string, contact: any, account: any): string {
  const t = LINKEDIN_TEMPLATES[code] || ''
  return t
    .replace(/\[First Name\]/g, contact?.first_name || 'there')
    .replace(/\[Company\]/g, account?.name || 'your company')
    .replace(/\[Founder\]/g, senderName())
}

// ---------- Email touches: Claude personalizes from these briefs ----------
const EMAIL_GUIDES: Record<string, string> = {
  R1: `Goal: this goes to a GENERIC company inbox (info@ or similar), not a named person. Ask them to point you to the right person. Open with "Hello," (there is no name). Subject idea: "Who handles trade marketing at [Company]?".
Points: you are the founder of Receiptraffle, which helps FMCG brands run consumer promotions where shoppers photograph a supermarket receipt and the brand gets verified purchase data at store level. You are not selling anything in this email. Ask one thing only: who is the best person (name and email) for trade marketing, brand marketing or consumer promotions at [Company]. Say you would be grateful for a forward to them if that is easier. Maximum 70 words.`,
  R2: `Goal: a polite follow-up to a generic inbox, 5 days after the first routing email. Open with "Hello,". Subject: "Re: Who handles trade marketing at [Company]?".
Points: briefly remind them of the earlier note, repeat the single ask (the name or email of the person responsible for trade marketing, brand marketing or consumer promotions), and say a forward is welcome. Maximum 50 words.`,
  E1: `Goal: the data gap. Subject ideas: "[Company]'s sell-out data" or "Who owns your promo data?".
Points: when a brand funds a consumer promotion, the retailer usually captures the shopper data and the brand gets a sell-in report weeks later. Receiptraffle reverses that: shoppers photograph their supermarket receipt, the system verifies the purchase automatically, and they enter the promo or raffle. The brand gets (1) verified proof of purchase at store level, (2) an opt-in consumer database it owns, (3) live campaign performance in its own client portal. No packaging changes, no printed codes, no retailer integration. Close by asking if closing the consumer data gap is a priority this year.`,
  E2: `Goal: compare with on-pack / under-cap code promos. Subject ideas: "Under-cap codes vs. receipts" or "Re: [Company] promo mechanics".
Points: code-based promos have (1) long lead time because packaging changes need months of planning, (2) cost, because code printing adds cost to every unit including packs never redeemed, (3) fraud, because codes get harvested or shared while receipts tie each entry to a real purchase. Receipt validation can run on existing stock. Do NOT state how many days a launch takes. Offer to send a one-page cost comparison for their category.`,
  E3: `Goal: Apo proof point. Subject ideas: "How Apo ran a receipt promo at Carrefour" or "Apo's promo data".
Facts you may use: Apo scouring powder ran an 8-week receipt-based promotion at Carrefour in Uganda. 1,200 receipts were submitted. About 85% were verified instantly by the system; the remainder were checked by our team and every genuine entry was approved. Apo's team tracked entries live in their own portal, with no new packaging or codes. Campaigns start from $750. Offer a 3-minute walkthrough. Do not invent any other figures.`,
  E4: `Goal: pivot to a second decision-maker. Subject idea: "[First Name] and [Company]'s promo data".
Points: say you have also reached out to a colleague on the trade marketing side about how [Company] measures promo performance, and you are writing to this person because it usually sits across trade marketing and insights. One line on Receiptraffle: it turns shoppers' supermarket receipts into verified purchase data, making trade spend measurable at store level. Ask who the right person would be to evaluate this.`,
  E5: `Goal: breakup email. Subject idea: "Closing the loop".
Points: you have not heard back, so you will assume promo attribution is not a priority right now. If [Company] plans a promotion in the coming months and wants verified purchase data from it, they can reply "later" and you will reconnect next quarter. Keep it to 3 short sentences.`,
}

// Parses "Subject: ...\nBody: ..." tolerantly (handles markdown bold, any casing, line breaks)
function parseDraft(raw: string): { subject: string; body: string } {
  const cleaned = raw
    .replace(/```[a-z]*\n?|```/gi, '')
    .replace(/\*\*/g, '')
    .replace(/^#+\s*/gm, '')
    .trim()
  const m = cleaned.match(/subject\s*:\s*(.+?)\s*\n+\s*(?:body\s*:\s*)?([\s\S]+)$/i)
  if (!m) {
    throw new Error('Could not read draft format. Model said: ' + cleaned.slice(0, 160))
  }
  const subject = m[1].trim()
  const body = m[2].trim()
  if (!subject || !body) throw new Error('Incomplete draft. Model said: ' + cleaned.slice(0, 160))
  return { subject, body }
}

export async function draftEmail(
  code: string,
  contact: any,
  account: any
): Promise<{ subject: string; body: string }> {
  const guide = EMAIL_GUIDES[code]
  if (!guide) throw new Error('No email guide for ' + code)

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  const name = senderName()

  const prompt = `You write short, plain emails for ${name}, founder of Receiptraffle (a receipt validation and promotion platform for FMCG brands in East Africa), to trade marketing and brand leaders.

RECIPIENT
First name: ${contact?.first_name || '(unknown, open with "Hello,")'}
Title: ${contact?.title || 'unknown'}
Company: ${account?.name || 'unknown'}
Country: ${account?.country || 'unknown'}
Category: ${account?.category || 'unknown'}

BRIEF FOR THIS EMAIL (${code})
${guide}

HARD RULES
- Never invent numbers, dates, customers or results. Only use facts in the brief.
- Never say "85% accuracy". Never claim fraud detection. Never mention other supermarkets as proven; the only proven chain is Carrefour. Never mention tax-authority receipt systems.
- Replace [Company] and [First Name] in the brief with the real values.
- Plain text, no markdown, no bullet symbols other than a dash, within the word limit in the brief (default under 130 words).
- Warm, direct, human. No hype words. One clear question or offer at the end.
- Sign off with just "${name}, Receiptraffle".
- Add this line after the sign-off: "If this isn't relevant, reply 'stop' and I won't email again."

Respond in EXACTLY this format and nothing else:
SUBJECT: <the subject on one line>
BODY:
<the email body, with normal line breaks>`

  const res = await client.messages.create({
    model: process.env.OPS_MODEL || 'claude-haiku-5-5',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  })

  if (res.stop_reason === 'max_tokens') {
    throw new Error('Draft was cut off by the length limit; tap draft again')
  }

  const raw = res.content.map((c: any) => (c.type === 'text' ? c.text : '')).join('')
  return parseDraft(raw)
}
