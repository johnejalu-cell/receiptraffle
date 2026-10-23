import { NextRequest, NextResponse } from 'next/server'

const COOKIE = 'rr_admin'

async function hmacHex(key: string, msg: string) {
  const enc = new TextEncoder()
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', k, enc.encode(msg))
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let r = 0
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return r === 0
}

async function validSession(value: string | undefined, secret: string | undefined) {
  if (!value || !secret) return false
  const [exp, sig] = value.split('.')
  if (!exp || !sig || !(Number(exp) > Date.now())) return false
  return safeEqual(sig, await hmacHex(secret, 'admin:' + exp))
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (pathname === '/api/admin/login') return NextResponse.next()
  const needsAdmin = pathname.startsWith('/api/admin') || (pathname === '/api/content' && req.method !== 'GET')
  if (!needsAdmin) return NextResponse.next()
  const ok = await validSession(req.cookies.get(COOKIE)?.value, process.env.ADMIN_PIN)
  if (!ok) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  return NextResponse.next()
}

export const config = { matcher: ['/api/admin/:path*', '/api/content'] }
