'use client'
import { useState } from 'react'

interface Promotion {
  id: string
  promo_name: string
  company_name: string
  status: string
  draw_date: string
  start_date: string
  end_date: string
  prizes: string
  currency: string
  min_spend: number
  emoji: string
  color: string
  ref: string
}

interface Entry {
  id: string
  customer_name: string
  customer_phone: string
  customer_email: string
  ticket_number: string
  amount: number
  currency: string
  retailer: string
  receipt_date: string
  verification_status: string
  ai_confidence: number
  created_at: string
}

interface Winner {
  name: string
  phone: string
  email: string
  ticket: string
}

export default function PromoterPage() {
  const [email, setEmail] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [selectedPromo, setSelectedPromo] = useState<Promotion | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [entriesLoading, setEntriesLoading] = useState(false)
  const [winner, setWinner] = useState<Winner | null>(null)
  const [drawLoading, setDrawLoading] = useState(false)
  const [drawError, setDrawError] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)

  const login = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/promoter/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), pin: pin.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')
      setPromotions(data.promotions)
      setLoggedIn(true)
      if (data.promotions.length === 1) loadEntries(data.promotions[0])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Login failed')
    } finally { setLoading(false) }
  }

  const loadEntries = async (promo: Promotion) => {
    setSelectedPromo(promo)
    setWinner(null)
    setDrawError('')
    setEntriesLoading(true)
    try {
      const res = await fetch('/api/promoter/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promotionId: promo.id, email: email.trim().toLowerCase(), pin: pin.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setEntries(data.entries || [])
    } catch {
      setEntries([])
    } finally { setEntriesLoading(false) }
  }

  const downloadCSV = () => {
    if (!entries.length) return
    const headers = ['Ticket', 'Name', 'Phone', 'Email', 'Amount', 'Currency', 'Retailer', 'Date', 'Status']
    const rows = entries.map(e => [
      e.ticket_number, e.customer_name, e.customer_phone, e.customer_email || '',
      e.amount, e.currency, e.retailer || '', e.receipt_date || '', e.verification_status,
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedPromo?.promo_name || 'entries'}-entries.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const runDraw = async () => {
    if (!selectedPromo) return
    if (!confirm('Run the prize draw now? A winner will be selected at random from all approved entries.')) return
    setDrawLoading(true); setDrawError(''); setWinner(null)
    try {
      const res = await fetch('/api/promoter/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promotionId: selectedPromo.id, email: email.trim().toLowerCase(), pin: pin.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setWinner(data.winner)
    } catch (e: unknown) {
      setDrawError(e instanceof Error ? e.message : 'Draw failed')
    } finally { setDrawLoading(false) }
  }

  const approvedCount = entries.filter(e => e.verification_status === 'approved').length
  const reviewCount = entries.filter(e => e.verification_status === 'manual_review').length
  const inp: React.CSSProperties = { width: '100%', padding: '11px 14px', border: '1px solid #ccc', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box' }

  if (!loggedIn) return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: 'white', borderRadius: '16px', padding: '40px', maxWidth: '420px', width: '100%', boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '40px' }}>📊</div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: '8px 0 4px' }}>Promoter Portal</h1>
          <p style={{ color: '#666', fontSize: '14px' }}>Sign in with the email and PIN you set when launching your promotion.</p>
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '5px' }}>Email address</label>
          <input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '5px' }}>Your PIN</label>
          <input style={inp} type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="Enter your PIN" onKeyDown={e => e.key === 'Enter' && login()} />
        </div>
        {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '12px', color: '#dc2626', fontSize: '14px', marginBottom: '16px' }}>{error}</div>}
        <button onClick={login} disabled={loading} style={{ width: '100%', padding: '13px', background: loading ? '#9ca3af' : '#1D9E75', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 700, fontSize: '15px', cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Signing in...' : 'Access my promotions →'}
        </button>
        <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: '#888' }}>Forgot your PIN? Contact us and we will reset it for you.</p>
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <a href="/" style={{ color: '#1D9E75', fontSize: '14px', textDecoration: 'none' }}>← Back to home</a>
        </div>
      </div>
    </div>
  )

  if (!selectedPromo) return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '24px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>Your Promotions</h1>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>Select a promotion to manage.</p>
        {promotions.map(p => (
          <div key={p.id} onClick={() => loadEntries(p)} style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '12px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: `4px solid ${p.color || '#1D9E75'}`, display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: '32px' }}>{p.emoji || '🛍'}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '16px' }}>{p.promo_name}</div>
              <div style={{ color: '#666', fontSize: '13px' }}>{p.company_name} · Draw: {p.draw_date ? new Date(p.draw_date).toLocaleDateString() : 'TBC'}</div>
              <span style={{ display: 'inline-block', marginTop: '6px', padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: p.status === 'active' ? '#dcfce7' : '#fef9c3', color: p.status === 'active' ? '#16a34a' : '#92400e' }}>{p.status}</span>
            </div>
            <div style={{ color: '#1D9E75', fontWeight: 600 }}>Manage →</div>
          </div>
        ))}
        <button onClick={() => setLoggedIn(false)} style={{ marginTop: '16px', background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '14px' }}>← Sign out</button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '24px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
          {promotions.length > 1 && (
            <button onClick={() => setSelectedPromo(null)} style={{ background: 'none', border: 'none', color: '#1D9E75', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>← Back</button>
          )}
          <div style={{ fontSize: '32px' }}>{selectedPromo.emoji || '🛍'}</div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>{selectedPromo.promo_name}</h1>
            <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>{selectedPromo.company_name} · Ref: {selectedPromo.ref}</p>
          </div>
          <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, background: selectedPromo.status === 'active' ? '#dcfce7' : '#fef9c3', color: selectedPromo.status === 'active' ? '#16a34a' : '#92400e' }}>{selectedPromo.status}</span>
        </div>

        <div style={{ display: 'flex', gap: '12px', margin: '20px 0', flexWrap: 'wrap' }}>
          {[{ label: 'Total entries', value: entries.length, color: '#1D9E75' }, { label: 'Approved', value: approvedCount, color: '#16a34a' }, { label: 'Under review', value: reviewCount, color: '#d97706' }].map(s => (
            <div key={s.label} style={{ flex: 1, minWidth: '100px', background: 'white', borderRadius: '12px', padding: '16px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '13px', color: '#666' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <button onClick={downloadCSV} disabled={!entries.length} style={{ padding: '11px 20px', background: entries.length ? '#1D9E75' : '#e5e7eb', border: 'none', borderRadius: '8px', color: entries.length ? 'white' : '#9ca3af', fontWeight: 600, fontSize: '14px', cursor: entries.length ? 'pointer' : 'not-allowed' }}>
            ⬇ Download entries CSV
          </button>
          <button onClick={runDraw} disabled={drawLoading || approvedCount === 0} style={{ padding: '11px 20px', background: approvedCount > 0 ? '#7c3aed' : '#e5e7eb', border: 'none', borderRadius: '8px', color: approvedCount > 0 ? 'white' : '#9ca3af', fontWeight: 600, fontSize: '14px', cursor: approvedCount > 0 ? 'pointer' : 'not-allowed' }}>
            {drawLoading ? 'Drawing...' : '🎰 Run prize draw'}
          </button>
        </div>

        {drawError && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '12px', color: '#dc2626', fontSize: '14px', marginBottom: '16px' }}>{drawError}</div>}

        {winner && (
          <div style={{ background: '#f0fdf4', border: '2px solid #1D9E75', borderRadius: '12px', padding: '24px', marginBottom: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>🏆</div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#15803d', marginBottom: '4px' }}>Winner drawn!</h2>
            <p style={{ fontSize: '18px', fontWeight: 700, margin: '8px 0 2px' }}>{winner.name}</p>
            <p style={{ color: '#555', margin: '2px 0' }}>📞 {winner.phone}</p>
            {winner.email && <p style={{ color: '#555', margin: '2px 0' }}>✉ {winner.email}</p>}
            <p style={{ color: '#1D9E75', fontWeight: 600, marginTop: '8px' }}>Ticket: {winner.ticket}</p>
          </div>
        )}

        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0', fontWeight: 700, fontSize: '15px' }}>
            Entries {entriesLoading ? '(loading...)' : `(${entries.length})`}
          </div>
          {entriesLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Loading entries...</div>
          ) : entries.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>No entries yet.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {['Ticket', 'Name', 'Phone', 'Email', 'Amount', 'Status', 'Date'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#555', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {entries.map(e => (
                    <tr key={e.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: '12px', color: '#1D9E75', fontWeight: 600 }}>{e.ticket_number}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 500 }}>{e.customer_name}</td>
                      <td style={{ padding: '10px 14px', color: '#555' }}>{e.customer_phone}</td>
                      <td style={{ padding: '10px 14px', color: '#555' }}>{e.customer_email || '—'}</td>
                      <td style={{ padding: '10px 14px', color: '#555' }}>{e.currency} {e.amount?.toLocaleString()}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: e.verification_status === 'approved' ? '#dcfce7' : e.verification_status === 'rejected' ? '#fee2e2' : '#fef9c3', color: e.verification_status === 'approved' ? '#16a34a' : e.verification_status === 'rejected' ? '#dc2626' : '#92400e' }}>
                          {e.verification_status === 'approved' ? 'Approved' : e.verification_status === 'rejected' ? 'Rejected' : 'Under review'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#888', fontSize: '13px' }}>{e.created_at ? new Date(e.created_at).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <button onClick={() => setLoggedIn(false)} style={{ marginTop: '20px', background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '14px' }}>← Sign out</button>
      </div>
    </div>
  )
}
