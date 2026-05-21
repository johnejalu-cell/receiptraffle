'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('customer')
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSignup() {
    if (!fullName || !email || !password) {
      setMessage('Please fill in all fields')
      return
    }
    if (password.length < 6) {
      setMessage('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, role })
      })
      const data = await res.json()
      if (data.error) {
        setMessage(data.error)
      } else {
        setSuccess(true)
        setMessage('Account created! Please check your email to confirm.')
      }
    } catch (e) {
      setMessage('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: '#fafaf9' }}>
      <div style={{ width: '100%', maxWidth: 400, background: '#fff', border: '1px solid #e5e5e0', borderRadius: 16, padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🧾</div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Create account</h1>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, background: '#f5f5f0', borderRadius: 10, padding: 4 }}>
          {['customer', 'promoter'].map(r => (
            <button key={r} onClick={() => setRole(r)}
              style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: role === r ? '#fff' : 'transparent', color: role === r ? '#1a1a18' : '#888' }}>
              {r === 'customer' ? 'Customer' : 'Business'}
            </button>
          ))}
        </div>

        {message && (
          <div style={{ background: success ? '#E1F5EE' : '#FCEBEB', color: success ? '#085041' : '#791F1F', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
            {message}
          </div>
        )}

        {!success && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Full name</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0d0c8', borderRadius: 8, fontSize: 14 }} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0d0c8', borderRadius: 8, fontSize: 14 }} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0d0c8', borderRadius: 8, fontSize: 14 }} />
            </div>
            <button onClick={handleSignup} disabled={loading}
              style={{ width: '100%', padding: '11px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.6 : 1, marginTop: 4 }}>
              {loading ? 'Creating...' : 'Create account'}
            </button>
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: 13, color: '#666', marginTop: 20 }}>
          Already have an account? <Link href="/auth/login" style={{ color: '#1D9E75' }}>Sign in →</Link>
        </p>
      </div>
    </main>
  )
}
