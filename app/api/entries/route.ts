// v19 - duplicate detection by receipt contents (total + retailer + date / receipt no.)
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

function makeSupabase(serviceKey: string) {
  return createClient(SUPABASE_URL, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
type Db = ReturnType<typeof makeSupabase>

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
  receipt_number: string
  barcode_found: boolean
}

interface PriorEntry {
  id: string | number
  ticket_number: string | null
  promotion_id: string | number | null
  promotion_name: string | null
  retailer: string | null
  receipt_number: string | null
  receipt_date: string | null
  ai_result: unknown
}

interface PromoRow {
  id: string | number
  promo_name: string | null
  product_keywords: unknown
}

interface BlockInfo {
  promoName: string
  brand: string
  ticket: string
}

const ENTRY_COLS = 'id, ticket_number, promotion_id, promotion_name, retailer, receipt_number, receipt_date, ai_result'

// ── helpers ──────────────────────────────────────────────────────────────────

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
  return typeof v === 'string' ? v.trim() : ''
}

// Accepts real arrays, JSON-array strings ('["Fanta"]') and comma strings ('Fanta, Fanta Orange')
function toStringArray(v: unknown): string[] {
  if (typeof v === 'string') {
    const s = v.trim()
    if (!s) return []
    if (s.startsWith('[')) {
      try { return toStringArray(JSON.parse(s)) } catch { /* fall through to comma split */ }
    }
    return s.split(',').map(x => x.trim()).filter(Boolean)
  }
  return Array.isArray(v)
    ? v.filter((x): x is string => typeof x === 'string' && x.trim() !== '').map(x => x.trim())
    : []
}

function normText(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

// Two reads of the same receipt may name the store slightly differently
function retailerSimilar(a: string | null, b: string | null): boolean {
  const na = normText(a || '')
  const nb = normText(b || '')
  if (!na || !nb || na === 'unknown' || nb === 'unknown') return true
  return na.slice(0, 5) === nb.slice(0, 5) || na.includes(nb) || nb.includes(na)
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

function pad(n: number): string {
  return n < 10 ? '0' + n : String(n)
}

function mkDate(y: number, m: number, d: number): string | null {
  if (!y || m < 1 || m > 12 || d < 1 || d > 31) return null
  return `${y}-${pad(m)}-${pad(d)}`
}

function fullYear(y: string): number {
  const n = parseInt(y, 10)
  return y.length <= 2 ? 2000 + n : n
}

// Returns every plausible YYYY-MM-DD reading of a date string (tolerates day/month swaps)
function dateKeys(raw: string): string[] {
  const s = (raw || '').trim().toLowerCase()
  if (!s) return []
  const out: (string | null)[] = []

  const iso = s.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/)
  const dmy = iso ? null : s.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/)
  const dMonY = iso || dmy ? null : s.match(/(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]{3})[a-z]*\.?,?\s+(\d{2,4})/)
  const monDY = iso || dmy || dMonY ? null : s.match(/([a-z]{3})[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{2,4})/)

  if (iso) {
    const y = +iso[1], a = +iso[2], b = +iso[3]
    out.push(mkDate(y, a, b), mkDate(y, b, a))
  } else if (dmy) {
    const y = fullYear(dmy[3]), a = +dmy[1], b = +dmy[2]
    out.push(mkDate(y, b, a), mkDate(y, a, b))
  } else if (dMonY) {
    const mi = MONTHS.indexOf(dMonY[2]) + 1
    if (mi) out.push(mkDate(fullYear(dMonY[3]), mi, +dMonY[1]))
  } else if (monDY) {
    const mi = MONTHS.indexOf(monDY[1]) + 1
    if (mi) out.push(mkDate(fullYear(monDY[3]), mi, +monDY[2]))
  }
  return Array.from(new Set(out.filter((x): x is string => !!x)))
}

type MatchKind = 'same' | 'possible' | 'different'

// Decide whether a prior entry (already known to have the same total) is the same physical receipt
function compareReceipt(current: AiResult, prior: PriorEntry): MatchKind {
  if (!retailerSimilar(prior.retailer, current.retailer)) return 'different'

  const priorAi = (prior.ai_result && typeof prior.ai_result === 'object' ? prior.ai_result : {}) as Record<string, unknown>
  const curNo = normText(current.receipt_number)
  const priorNo = normText(prior.receipt_number || toStr(priorAi.receipt_number))
  if (curNo && priorNo && curNo === priorNo) return 'same'
  const numbersDiffer = !!(curNo && priorNo)

  const curDates = dateKeys(current.date)
  const priorDates = dateKeys(prior.receipt_date || toStr(priorAi.date))
  if (curDates.length && priorDates.length) {
    if (!curDates.some(d => priorDates.includes(d))) return 'different'
    return numbersDiffer ? 'possible' : 'same'
  }
  return numbersDiffer ? 'different' : 'possible'
}

function fuzzyMatch(item: string, keyword: string): boolean {
  const itemLower = item.toLowerCase().replace(/[^a-z0-9\s]/g, '')
  const keyWords = keyword.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean).slice(0, 3)
  return keyWords.length > 0 && keyWords.every(w => itemLower.includes(w))
}

function keywordsOverlap(keywordsA: string[], keywordsB: string[]): boolean {
  if (!keywordsA.length || !keywordsB.length) return false
  return keywordsA.some(a => keywordsB.some(b => fuzzyMatch(a, b) || fuzzyMatch(b, a)))
}

// Of the given prior entries, find one that conflicts (same promotion, or overlapping brand keywords)
async function findBlockingEntry(
  supabase: Db,
  priorEntries: PriorEntry[],
  promotionId: unknown,
  keywords: string[]
): Promise<BlockInfo | null> {
  if (!priorEntries.length) return null

  if (promotionId) {
    const same = priorEntries.find(e => String(e.promotion_id) === String(promotionId))
    if (same) return { promoName: same.promotion_name || 'this promotion', brand: '', ticket: same.ticket_number || '' }
  }

  if (!keywords.length) return null

  const ids = Array.from(
    new Set(
      priorEntries
        .map(e => e.promotion_id)
        .filter((x): x is string | number => x !== null && x !== undefined && x !== '')
    )
  )
  if (!ids.length) return null

  const { data, error } = await supabase
    .from('promotion_submissions')
    .select('id, promo_name, product_keywords')
    .in('id', ids)
  if (error) console.error('[entries] Prior promo lookup error:', error.message)

  for (const p of (data ?? []) as unknown as PromoRow[]) {
    const priorKeywords = toStringArray(p.product_keywords)
    if (keywordsOverlap(keywords, priorKeywords)) {
      const entry = priorEntries.find(e => String(e.promotion_id) === String(p.id))
      return {
        promoName: p.promo_name || 'another promotion',
        brand: priorKeywords[0] || '',
        ticket: entry?.ticket_number || '',
      }
    }
  }
  return null
}

function duplicateResponse(block: BlockInfo) {
  const used = block.brand
    ? `This receipt has already been used to enter a ${block.brand} promotion (${block.promoName}).`
    : `This receipt has already been used to enter ${block.promoName}.`
  return NextResponse.json({
    error: 'duplicate_receipt',
    message: used + ' Each receipt can only be used once per brand.',
    promotionName: block.promoName,
  }, { status: 409 })
}

function buildPrompt(keywords: string[], barcodes: string[], minSpend: number, currency: string): string {
  const barcodeNote = barcodes.length > 0
    ? '\nBARCODE CHECK: Also look for these product barcodes on the receipt: ' + barcodes.join(', ')
    : ''

  const jsonShape = (itemsLine: string, itemsTotalLine: string, barcodeLine: string) =>
    'Reply with JSON only, no markdown:\n'
    + '{\n'
    + '  "retailer": "exact store name from receipt",\n'
    + '  "date": "purchase date in YYYY-MM-DD format, or empty string if not visible",\n'
    + '  "receipt_number": "receipt/invoice/transaction number if shown, else empty string",\n'
    + '  "total_amount": total of entire receipt as a plain number,\n'
    + '  "currency": "currency code from receipt",\n'
    + itemsLine
    + itemsTotalLine
    + barcodeLine
    + '  "confidence": number 0-100,\n'
    + '  "verification_status": "approved" or "manual_review",\n'
    + '  "verification_reason": "brief explanation"\n'
    + '}'

  if (keywords.length > 0) {
    const keywordList = keywords.join('", "')
    return 'You are verifying a receipt for a sales promotion. Examine this receipt carefully.\n\n'
      + 'TASK: Find items matching this brand/product: "' + keywordList + '"\n'
      + '- Use fuzzy matching: if the first few letters of the brand appear on the receipt, count it as a match\n'
      + '- Look for the brand name anywhere on the receipt as a store name, product name, or line item\n'
      + '- The brand name may be abbreviated or partially visible, be generous in matching\n'
      + '- Report the store/retailer name exactly as shown\n'
      + '- Report the purchase date in YYYY-MM-DD format\n'
      + '- Report the receipt/invoice/transaction number if one is printed\n'
      + '- Report the currency shown on the receipt (e.g. USD, GBP, EUR, UGX, KES, etc.)\n'
      + '- Add up the total spent on matching items only'
      + barcodeNote + '\n\n'
      + jsonShape(
        '  "promoted_items_found": ["item1", "item2"],\n',
        '  "promoted_items_total": total of matching items as a plain number,\n',
        '  "barcode_found": true or false,\n'
      )
  }

  return 'You are verifying a receipt for a sales promotion. Extract the following information.\n\n'
    + '- Report the store/retailer name exactly as shown\n'
    + '- Report the purchase date in YYYY-MM-DD format\n'
    + '- Report the receipt/invoice/transaction number if one is printed\n'
    + '- Report the currency shown on the receipt\n'
    + '- Report the total amount\n'
    + '- Minimum spend required: ' + minSpend + ' ' + currency
    + barcodeNote + '\n\n'
    + jsonShape(
      '  "promoted_items_found": [],\n',
      '  "promoted_items_total": 0,\n',
      '  "barcode_found": false,\n'
    )
}

// ── handler ──────────────────────────────────────────────────────────────────

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

    if (!serviceKey) {
      console.error('[entries] SUPABASE_SERVICE_ROLE_KEY is not set in this environment')
      return NextResponse.json({ error: 'Entries are temporarily unavailable. Please try again later.' }, { status: 500 })
    }

    const supabase = makeSupabase(serviceKey)

    const ticket = 'RR-' + Math.random().toString(36).substring(2, 10).toUpperCase()
    const isPdf = mediaType === 'application/pdf'
    const imageMediaType = normaliseMediaType(typeof mediaType === 'string' ? mediaType : '')
    const barcodes = toStringArray(productBarcodes)
    const minSpendNum = toNumber(minSpend)
    const fallbackCurrency = typeof currency === 'string' && currency ? currency : 'USD'

    // Use the promotion's keywords from the database (trusted), fall back to what the client sent
    let keywords = toStringArray(productKeywords)
    if (promotionId) {
      const { data: currentPromo, error: promoErr } = await supabase
        .from('promotion_submissions')
        .select('product_keywords')
        .eq('id', promotionId)
        .maybeSingle()
      if (promoErr) console.error('[entries] Current promo lookup error:', promoErr.message)
      const dbKeywords = toStringArray((currentPromo as unknown as { product_keywords?: unknown } | null)?.product_keywords)
      if (dbKeywords.length > 0) keywords = dbKeywords
    }

    const receiptHash = createHash('sha256').update(imageBase64).digest('hex')

    // ── CHECK 1: identical file (free, runs before AI) ───────────────────────
    const { data: hashMatches, error: hashErr } = await supabase
      .from('customer_entries')
      .select(ENTRY_COLS)
      .eq('receipt_hash', receiptHash)
      .neq('verification_status', 'rejected')
    if (hashErr) console.error('[entries] Hash lookup error:', hashErr.message)

    const hashBlock = await findBlockingEntry(supabase, (hashMatches ?? []) as unknown as PriorEntry[], promotionId, keywords)
    console.log('[entries] hash check', { matches: hashMatches?.length ?? 0, blocked: !!hashBlock })
    if (hashBlock) return duplicateResponse(hashBlock)

    // ── AI VERIFICATION ──────────────────────────────────────────────────────
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
      receipt_number: '',
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
          receipt_number: toStr(parsed.receipt_number),
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

    // ── CHECK 2: same receipt contents (catches re-photographed receipts) ────
    if (aiResult.total_amount > 0) {
      const { data: totalMatches, error: totalErr } = await supabase
        .from('customer_entries')
        .select(ENTRY_COLS)
        .eq('receipt_total', aiResult.total_amount)
        .neq('verification_status', 'rejected')
        .limit(500)
      if (totalErr) console.error('[entries] Content lookup error:', totalErr.message)

      const candidates = (totalMatches ?? []) as unknown as PriorEntry[]
      const sameReceipt = candidates.filter(e => compareReceipt(aiResult, e) === 'same')
      const possibleReceipt = candidates.filter(e => compareReceipt(aiResult, e) === 'possible')

      const contentBlock = await findBlockingEntry(supabase, sameReceipt, promotionId, keywords)
      console.log('[entries] content check', {
        total: aiResult.total_amount,
        retailer: aiResult.retailer,
        date: aiResult.date,
        receiptNo: aiResult.receipt_number,
        sameTotal: candidates.length,
        same: sameReceipt.length,
        possible: possibleReceipt.length,
        blocked: !!contentBlock,
      })
      if (contentBlock) return duplicateResponse(contentBlock)

      // Not certain (e.g. date unreadable) - accept the entry but flag it for a human
      const possibleBlock = await findBlockingEntry(supabase, possibleReceipt, promotionId, keywords)
      if (possibleBlock) {
        aiResult = {
          ...aiResult,
          verification_status: 'manual_review',
          verification_reason: 'Possible duplicate of ' + (possibleBlock.ticket || possibleBlock.promoName) + ' - please check',
        }
      }
    } else {
      console.log('[entries] content check skipped - total not readable')
    }

    const isApproved = aiResult.verification_status === 'approved'

    // ── STORE RECEIPT FILE ───────────────────────────────────────────────────
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

    // ── SAVE ENTRY ───────────────────────────────────────────────────────────
    const { error: dbError } = await supabase.from('customer_entries').insert({
      promotion_id: promotionId || null,
      customer_name: name,
      customer_phone: phone,
      customer_email: email || null,
      ticket_number: ticket,
      amount: keywords.length > 0 ? aiResult.promoted_items_total : aiResult.total_amount,
      retailer: aiResult.retailer || 'Unknown',
      receipt_date: dateKeys(aiResult.date)[0] || null,
      currency: aiResult.currency || fallbackCurrency,
      verification_status: isApproved ? 'approved' : 'manual_review',
      ai_confidence: aiResult.confidence || 0,
      ai_result: aiResult,
      receipt_image_path: receiptImagePath,
      receipt_hash: receiptHash,
      receipt_total: aiResult.total_amount > 0 ? aiResult.total_amount : null,
      receipt_number: aiResult.receipt_number || null,
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
