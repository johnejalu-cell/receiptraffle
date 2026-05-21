'use client'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setMessage(error.message)
      setLoading(false)
    } else {
      window.location.href = '/'
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: 380, background: '#fff', border: '1px solid #e5e5e0', borderRadius: 16, padding: '2rem' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, textAlign: 'center' }}>
          Sign in to <span style={{ color: '#1D9E75' }}>ReceiptRaffle</span>
        </h1>
        {message && <div style={{ background: '#FCEBEB', color: '#791F1F', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{message}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0d0c8', borderRadius: 8, fontSize: 14 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0d0c8', borderRadius: 8, fontSize: 14 }} />
          </div>
          <button onClick={handleLogin} disabled={loading}
            style={{ width: '100%', padding: '11px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </div>
        <p style={{ textAlign: 'center', fontSize: 13, color: '#666', marginTop: 20 }}>
          No account? <Link href="/auth/signup" style={{ color: '#1D9E75' }}>Create one →</Link>
        </p>
      </div>
    </main>
  )
}
