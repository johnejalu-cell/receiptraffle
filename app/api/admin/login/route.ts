import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const expected = process.env.ADMIN_PIN
  if (!expected) return NextResponse.json({ error: 'ADMIN_PIN is not set in Vercel' }, { status: 500 })
  const { pin } = await req.json().catch(() => ({ pin: '' }))
  const a = Buffer.from(String(pin || ''))
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return NextResponse.json({ error: 'Incorrect PIN' }, { status: 401 })
  return NextResponse.json({ ok: true })
}
