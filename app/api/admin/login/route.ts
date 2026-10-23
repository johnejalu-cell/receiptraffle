import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'

export const dynamic = 'force-dynamic'

const COOKIE = 'rr_admin'
const HOURS = 12

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({} as any))

  if (body.logout) {
    const res = NextResponse.json({ ok: true })
    res.cookies.set(COOKIE, '', { maxAge: 0, path: '/' })
    return res
  }

  const expected = process.env.ADMIN_PIN
  if (!expected) return NextResponse.json({ error: 'ADMIN_PIN is not set in Vercel' }, { status: 500 })

  const a = Buffer.from(String(body.pin || ''))
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    await new Promise(r => setTimeout(r, 800)) // slows down guessing
    return NextResponse.json({ error: 'Incorrect PIN' }, { status: 401 })
  }

  const exp = Date.now() + HOURS * 3600 * 1000
  const sig = createHmac('sha256', expected).update('admin:' + exp).digest('hex')
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE, exp + '.' + sig, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: HOURS * 3600,
  })
  return res
}
