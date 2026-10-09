// v17 - per-brand receipt duplicate detection + build/runtime fixes
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://qnpjawyeekhkzvrorqyv.supabase.co'

const AI_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6'

type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'

interface AiResult {
  verification_status: 'approved' | 'manual_review'
  total_amount: number
  promoted_items_total: number
  promoted_items_found: string[]
  confidence: number
  verification_reason: string
  retailer: string
  currency: string
  date: string
  barcode_found: boolean
}

interface PriorEntry {
  id: string | number
  promotion_id: string | number | null
}

interface PriorPromo {
  id: string | number
  promo_name: string | null
  product_keywords: unknown
}

function normaliseMediaType(raw: string): ImageMediaType {
  if (raw === 'image/png') return 'image/png'
  if (raw === 'image/gif') return 'image/gif'
  if (raw === 'image/webp') return 'image/webp'
  return 'image/jpeg'
}

function toNumber(v: unknown): number {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0
  if (typeof v === 'string') {
    const n = parseFloat(v.replace(/[^0-9.\-]/g, ''))
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

function toStr(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

function toStringArray(v: unknown): string[] {
  return Array.isArray(v)
    ? v.filter((x): x is string => typeof x === 'string' && x.trim() !== '')
    : []
}

function fuzzyMatch(item: string, keyword: string): boolean {
  const itemLower = item.toLowerCase().replace(/[^a-z0-9\s]/g, '')
  const keyWords = keyword.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean).slice(0, 3)
  return keyWords.every(w => itemLower.includes(w))
}

// Check if two keyword sets overlap (share any keyword)
function keywordsOverlap(keywordsA: string[], keywordsB: string[]): boolean {
  if (!keywordsA.length || !keywordsB.length) return false
  return keywordsA.some(a => keywordsB.some(b => fuzzyMatch(a, b) || fuzzyMatch(b, a)))
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
    } = body ?? {}

    if (!name || !phone) return NextResponse.json({ error: 'Missing name or phone' }, { status: 400 })
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return NextResponse.json({ error: 'No image received' }, { status: 400 })
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const anthropicKey = process.env.ANTHROPIC_API_KEY

    // Never pretend an entry was saved if we cannot save it
    if (!serviceKey) {
      console.error('[entries] SUPABASE_SERVICE_ROLE_KEY is not set in this environment')
      return NextResponse.json(
        { error: 'Entries are temporarily unavailable. Please try again later.' },
        { status: 500 }
      )
    }

    const supabase = createClient(SUPABASE_URL, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const ticket = 'RR-' + Math.random().toString(36).substring(2, 10).toUpperCase()
    const isPdf = mediaType === 'application/pdf'
    const imageMediaType = normaliseMediaType(typeof mediaType === 'string' ? mediaType : '')
    const keywords = toStringArray(productKeywords)
    const barcodes = toStringArray(productBarcodes)
    const minSpendNum = toNumber(minSpend)
    const fallbackCurrency = typeof currency === 'string' && currency ? currency : 'USD'

    // Hash of the receipt file for duplicate detection
    const receiptHash = createHash('sha256').update(imageBase64).digest('hex')

    // ── DUPLICATE DETECTION ──────────────────────────────────────────────────
    const { data: priorEntriesData, error: priorError } = await supabase
      .from('customer_entries')
      .select('id, promotion_id')
      .eq('receipt_hash', receiptHash)
      .neq('verification_status', 'rejected')

    if (priorError) console.error('[entries] Duplicate lookup error:', priorError.message)

    const priorEntries = (priorEntriesData ?? []) as PriorEntry[]

    if (priorEntries.length > 0) {
      // 1. Same receipt, same promotion: always blocked
      if (promotionId && priorEntries.some(e => String(e.promotion_id) === String(promotionId))) {
        return NextResponse.json({
          error: 'duplicate_receipt',
          message: 'This receipt has already been used to enter this promotion. Each receipt can only be used once per brand.',
          promotionName: promotionName || null,
        }, { status: 409 })
      }

      // 2. Same receipt, different promotion with overlapping brand keywords: blocked
      if (keywords.length > 0) {
        const promoIds = Array.from(
          new Set(
            priorEntries
              .map(e => e.promotion_id)
              .filter((x): x is string | number => x !== null && x !== undefined && x !== '')
          )
        )

        if (promoIds.length > 0) {
          const { data: priorPromosData } = await supabase
            .from('promotion_submissions')
            .select('id, promo_name, product_keywords')
            .in('id', promoIds)

          for (const priorPromo of (priorPromosData ?? []) as PriorPromo[]) {
            const priorKeywords = toStringArray(priorPromo.product_keywords)
            if (keywordsOverlap(keywords, priorKeywords)) {
              return NextResponse.json({
                error: 'duplicate_receipt',
                message: `This receipt has already been used to enter a ${priorKeywords[0] || 'similar'} promotion (${priorPromo.promo_name || 'another promotion'}). Each receipt can only be used once per brand.`,
                promotionName: priorPromo.promo_name,
              }, { status: 409 })
            }
          }
        }
      }
    }
    // ── END DUPLICATE DETECTION ──────────────────────────────────────────────

    let aiResult: AiResult = {
      verification_status: 'manual_review',
      total_amount: 0,
      promoted_items_total: 0,
      promoted_items_found: [],
      confidence: 50,
      verification_reason: 'Sent for manual review',
      retailer: 'Unknown',
      currency: fallbackCurrency,
      date: '',
      barcode_found: false,
    }

    if (!anthropicKey) {
      console.warn('[entries] ANTHROPIC_API_KEY not set - skipping AI, entry goes to manual review')
    } else {
      try {
        const anthropic = new Anthropic({ apiKey: anthropicKey })
        const prompt = buildPrompt(keywords, barcodes, minSpendNum, fallbackCurrency)

        const fileBlock: Anthropic.ImageBlockParam | Anthropic.DocumentBlockParam = isPdf
          ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: imageBase64 } }
          : { type: 'image', source: { type: 'base64', media_type: imageMediaType, data: imageBase64 } }

        const response = await anthropic.messages.create({
          model: AI_MODEL,
          max_tokens: 800,
          messages: [{ role: 'user', content: [fileBlock, { type: 'text', text: prompt }] }],
        })

        const rawText = response.content
          .filter((c): c is Anthropic.TextBlock => c.type === 'text')
          .map(c => c.text)
          .join('')

        const firstBrace = rawText.indexOf('{')
        const lastBrace = rawText.lastIndexOf('}')
        if (firstBrace === -1 || lastBrace === -1) throw new Error('No JSON in AI response')

        const parsed = JSON.parse(rawText.substring(firstBrace, lastBrace + 1)) as Record<string, unknown>

        const foundItems = toStringArray(parsed.promoted_items_found)
        const parsedTotal = toNumber(parsed.total_amount)
        const parsedPromoTotal = toNumber(parsed.promoted_items_total)
        const confidence = toNumber(parsed.confidence)
        const parsedCurrency = toStr(parsed.currency) || fallbackCurrency

        let matchedItems: string[] = []
        if (keywords.length > 0 && foundItems.length > 0) {
          matchedItems = foundItems.filter(item => keywords.some(kw => fuzzyMatch(item, kw)))
          if (matchedItems.length === 0) matchedItems = foundItems
        }

        const amountToCheck = keywords.length > 0 ? parsedPromoTotal : parsedTotal
        const meetsMinimum = amountToCheck >= minSpendNum
        const hasItems = keywords.length === 0 || matchedItems.length > 0
        const isReadable = confidence >= 40

        const base: AiResult = {
          verification_status: 'manual_review',
          total_amount: parsedTotal,
          promoted_items_total: parsedPromoTotal,
          promoted_items_found: matchedItems,
          confidence,
          verification_reason: toStr(parsed.verification_reason) || 'Sent for manual review',
          retailer: toStr(parsed.retailer) || 'Unknown',
          currency: parsedCurrency,
          date: toStr(parsed.date),
          barcode_found: parsed.barcode_found === true,
        }

        if (meetsMinimum && hasItems && isReadable && parsed.verification_status === 'approved') {
          aiResult = { ...base, verification_status: 'approved' }
        } else {
          let reason = base.verification_reason
          if (!isReadable) reason = 'Receipt not clearly readable (confidence: ' + confidence + '%)'
          else if (!hasItems) reason = 'Brand/product "' + keywords.join(', ') + '" not found on receipt'
          else if (!meetsMinimum) reason = 'Amount ' + parsedCurrency + ' ' + amountToCheck.toLocaleString() + ' is below minimum ' + minSpendNum.toLocaleString()
          aiResult = { ...base, verification_reason: reason }
        }
      } catch (aiError: unknown) {
        console.error('[entries] AI error:', aiError instanceof Error ? aiError.message : String(aiError))
      }
    }

    const isApproved = aiResult.verification_status === 'approved'

    // Upload receipt file to Supabase Storage
    let receiptImagePath: string | null = null
    try {
      const fileBuffer = Buffer.from(imageBase64, 'base64')
      const ext = isPdf ? 'pdf'
        : imageMediaType === 'image/png' ? 'png'
        : imageMediaType === 'image/gif' ? 'gif'
        : imageMediaType === 'image/webp' ? 'webp'
        : 'jpg'
      const filePath = `receipts/${ticket}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(filePath, fileBuffer, { contentType: isPdf ? 'application/pdf' : imageMediaType, upsert: false })
      if (uploadError) console.error('[entries] Upload error:', uploadError.message)
      else receiptImagePath = filePath
    } catch (uploadErr: unknown) {
      console.error('[entries] Upload exception:', uploadErr instanceof Error ? uploadErr.message : String(uploadErr))
    }

    const { error: dbError } = await supabase.from('customer_entries').insert({
      promotion_id: promotionId || null,
      customer_name: name,
      customer_phone: phone,
      customer_email: email || null,
      ticket_number: ticket,
      amount: keywords.length > 0 ? aiResult.promoted_items_total : aiResult.total_amount,
      retailer: aiResult.retailer || 'Unknown',
      receipt_date: aiResult.date || null,
      currency: aiResult.currency || fallbackCurrency,
      verification_status: isApproved ? 'approved' : 'manual_review',
      ai_confidence: aiResult.confidence || 0,
      ai_result: aiResult,
      receipt_image_path: receiptImagePath,
      receipt_hash: receiptHash,
      promotion_name: promotionName || null,
      company_name: companyName || null,
    })

    if (dbError) {
      console.error('[entries] DB ERROR:', dbError.message)
      return NextResponse.json({ error: 'Failed to save entry: ' + dbError.message }, { status: 500 })
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
