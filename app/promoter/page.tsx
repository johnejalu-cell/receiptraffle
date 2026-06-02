'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function PromoterPage() {
  const [stage, setStage] = useState<'login' | 'portal'>('login')
  const [email, setEmail] = useState('')
  const [pin, setPin] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [promotions, setPromotions] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [entries, setEntries] = useState<any[]>([])
  const [entriesLoading, setEntriesLoading] = useState(false)
  const [tab, setTab] = useState<'overview' | 'entries' | 'draw'>('overview')
  const [drawing, setDrawing] = useState(false)
  const [winners, setWinners] = useState<any[]>([])
  const [drawnAt, setDrawnAt] = useState('')

  async function login() {
    if (!email.trim()) { setError('Please enter your email address'); return }
    if (!pin.trim()) { setError('Please enter your PIN'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/promoter/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), pin: pin.trim() })
      })
      const data = await res.json()
      if (!res.ok || data.error) { setError(data.error); setLoading(false); return }
      setName(data.name || '')
      setStage('portal')
      loadPromotions()
    } catch (e) { setError('Connection error') }
    setLoading(false)
  }

  async function loadPromotions() {
    try {
      const res = await fetch('/api/promoter/promotions?email=' + encodeURIComponent(email.trim()))
      const data = await res.json()
      setPromotions(data.promotions || [])
    } catch (e) {}
  }

  async function selectPromotion(p: any) {
    setSelected(p)
    setTab('overview')
    setWinners([])
    setEntries([])
    setEntriesLoading(true)
    try {
      const res = await fetch(`/api/promoter/entries?email=${encodeURIComponent(email.trim())}&promotion_id=${p.id}`)
      const data = await res.json()
      setEntries(data.entries || [])
    } catch (e) {}
    setEntriesLoading(false)
  }

  async function runDraw() {
    if (!confirm('Run the prize draw now? This cannot be undone.')) return
    setDrawing(true)
    try {
      const res = await fetch('/api/promoter/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), promotion_id: selected.id })
      })
      const data = await res.json()
      if (data.error) { alert('Error: ' + data.error); setDrawing(false); return }
      setWinners(data.winners || [])
      setDrawnAt(new Date().toLocaleString())
      setTab('draw')
    } catch (e) { alert('Error running draw') }
    setDrawing(false)
  }

  function downloadCSV() {
    const approved = entries.filter(e => e.verification_status === 'approved')
    const rows = [
      ['Ticket', 'Name', 'Phone', 'Email', 'Amount', 'Currency', 'Retailer', 'Date', 'Status'],
      ...approved.map(e => [
        e.ticket_number, e.customer_name, e.customer_phone, e.customer_email || '',
        e.amount, e.currency, e.retailer, e.receipt_date || '', e.verification_status
      ])
    ]
    const csv = rows.map(r => r.map(c => '"' + String(c || '').replace(/"/g, '""') + '"').join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selected.promo_name}-entries.csv`
    a.click()
  }

  const inp = { width: '100%', padding: '13px 14px', border: '1px solid #d0d0c8', borderRadius: 10, fontSize: 15, background: '#fff' } as any
  const btn = { width: '100%', padding: '14px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer' } as any

  // Login stage
  if (stage === 'login') return (
    <main style={{ minHeight: '100vh', background: '#fafaf9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Promoter Portal</h1>
          <p style={{ fontSize: 14, color: '#666' }}>Sign in with the email and PIN you set when launching your promotion.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Email address</label>
            <input style={inp} type="email" placeholder="your@email.com" value={email}
              onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()} autoFocus />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Your PIN</label>
            <input style={{ ...inp, letterSpacing: 6, fontSize: 18 }} type="password" inputMode="numeric"
              placeholder="••••••" maxLength={6} value={pin}
              onChange={e => setPin(e.target.value.replace(/[^0-9]/g, ''))}
              onKeyDown={e => e.key === 'Enter' && login()} />
          </div>
          {error && <div style={{ background: '#FCEBEB', color: '#791F1F', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>{error}</div>}
          <button style={{ ...btn, background: loading ? '#9BA4B5' : '#1D9E75' }} onClick={login} disabled={loading}>
            {loading ? 'Signing in...' : 'Access my promotions →'}
          </button>
          <div style={{ background: '#f5f5f0', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#666' }}>
            Forgot your PIN? Contact us and we will reset it for you.
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link href="/" style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>← Back to home</Link>
        </div>
      </div>
    </main>
  )

  // Portal
  return (
    <main style={{ minHeight: '100vh', background: '#fafaf9' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e5e0', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Promoter Portal</div>
          <div style={{ fontSize: 12, color: '#888' }}>{name} · {email}</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/launch" style={{ padding: '8px 14px', background: '#1D9E75', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            + New promotion
          </Link>
          <button onClick={() => { setStage('login'); setEmail(''); setPin(''); setSelected(null); setPromotions([]) }}
            style={{ padding: '8px 14px', background: '#f5f5f0', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', color: '#666' }}>
            Sign out
          </button>
        </div>
      </div>

      <div style={{ padding: '1.5rem 1rem', maxWidth: 560, margin: '0 auto' }}>

        {/* Promotion list */}
        {!selected && (
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>Your promotions</h2>
            {promotions.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#888' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>No promotions yet</div>
                <Link href="/launch" style={{ color: '#1D9E75', fontWeight: 600, textDecoration: 'none' }}>Launch your first promotion →</Link>
              </div>
            )}
            {promotions.map(p => (
              <div key={p.id} onClick={() => selectPromotion(p)}
                style={{ background: '#fff', border: '1px solid #e5e5e0', borderRadius: 14, padding: '1.1rem', marginBottom: 10, cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{p.promo_name}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{p.company_name}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6,
                    background: p.status === 'active' ? '#E1F5EE' : p.status === 'pending' ? '#FFF8E6' : '#f5f5f0',
                    color: p.status === 'active' ? '#0F6E56' : p.status === 'pending' ? '#854F0B' : '#888' }}>
                    {p.status?.toUpperCase()}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  {[
                    ['Total entries', p.counts?.total || 0],
                    ['Approved', p.counts?.approved || 0],
                    ['Pending review', p.counts?.review || 0],
                  ].map(([label, val]) => (
                    <div key={label as string}>
                      <div style={{ fontSize: 11, color: '#888' }}>{label}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#1D9E75' }}>{val}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 12, color: '#aaa', marginTop: 8 }}>Draw: {p.draw_date} · Ref: {p.ref}</div>
              </div>
            ))}
          </div>
        )}

        {/* Selected promotion detail */}
        {selected && (
          <div>
            <button onClick={() => { setSelected(null); setWinners([]) }}
              style={{ background: 'none', border: 'none', color: '#1D9E75', fontSize: 14, cursor: 'pointer', marginBottom: 16, padding: 0, fontWeight: 600 }}>
              ← All promotions
            </button>

            <div style={{ background: '#fff', border: '1px solid #e5e5e0', borderRadius: 14, padding: '1.1rem', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{selected.promo_name}</div>
                  <div style={{ fontSize: 13, color: '#888' }}>{selected.company_name} · Ref: {selected.ref}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6,
                  background: selected.status === 'active' ? '#E1F5EE' : '#FFF8E6',
                  color: selected.status === 'active' ? '#0F6E56' : '#854F0B' }}>
                  {selected.status?.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#f5f5f0', borderRadius: 10, padding: 4 }}>
              {(['overview', 'entries', 'draw'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  style={{ flex: 1, padding: '9px', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    background: tab === t ? '#fff' : 'transparent', color: tab === t ? '#1D9E75' : '#888' }}>
                  {t === 'overview' ? 'Overview' : t === 'entries' ? `Entries (${entries.length})` : 'Draw'}
                </button>
              ))}
            </div>

            {/* Overview tab */}
            {tab === 'overview' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                  {[
                    ['Total entries', entries.length, '#1D9E75'],
                    ['Approved', entries.filter(e => e.verification_status === 'approved').length, '#085041'],
                    ['Pending review', entries.filter(e => e.verification_status === 'manual_review').length, '#854F0B'],
                    ['Rejected', entries.filter(e => e.verification_status === 'rejected').length, '#791F1F'],
                  ].map(([label, val, color]) => (
                    <div key={label as string} style={{ background: '#fff', border: '1px solid #e5e5e0', borderRadius: 12, padding: '1rem', textAlign: 'center' }}>
                      <div style={{ fontSize: 28, fontWeight: 700, color: color as string }}>{val}</div>
                      <div style={{ fontSize: 12, color: '#888' }}>{label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: '#fff', border: '1px solid #e5e5e0', borderRadius: 12, padding: '1rem', marginBottom: 12 }}>
                  {[
                    ['Prizes', Array.isArray(selected.prizes) ? selected.prizes.join(', ') : selected.prizes],
                    ['Min spend', `${selected.currency} ${parseInt(selected.min_spend).toLocaleString()}`],
                    ['Draw date', selected.draw_date],
                    ['Start date', selected.start_date],
                    ['End date', selected.end_date],
                  ].map(([label, value]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f5f5f0', fontSize: 13 }}>
                      <span style={{ color: '#888' }}>{label}</span>
                      <span style={{ fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>{value}</span>
                    </div>
                  ))}
                </div>
                {selected.status === 'pending' && (
                  <div style={{ background: '#FFF8E6', border: '1px solid #FAC775', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#633806' }}>
                    Your promotion is pending activation. Our team will activate it once payment is confirmed.
                  </div>
                )}
              </div>
            )}

            {/* Entries tab */}
            {tab === 'entries' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>Approved entries</div>
                  <button onClick={downloadCSV} style={{ padding: '8px 14px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    Download CSV
                  </button>
                </div>
                {entriesLoading && <div style={{ textAlign: 'center', color: '#888', padding: '2rem' }}>Loading entries...</div>}
                {!entriesLoading && entries.filter(e => e.verification_status === 'approved').length === 0 && (
                  <div style={{ textAlign: 'center', color: '#888', padding: '2rem', fontSize: 14 }}>No approved entries yet</div>
                )}
                {!entriesLoading && entries.filter(e => e.verification_status === 'approved').map(e => (
                  <div key={e.id} style={{ background: '#fff', border: '1px solid #e5e5e0', borderRadius: 10, padding: '12px 14px', marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{e.customer_name}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#085041', background: '#E1F5EE', padding: '2px 8px', borderRadius: 6 }}>
                        {e.ticket_number}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: '#888' }}>{e.customer_phone}{e.customer_email ? ' · ' + e.customer_email : ''}</div>
                    <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                      {e.currency} {parseInt(e.amount).toLocaleString()} · {e.retailer} · {e.receipt_date}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Draw tab */}
            {tab === 'draw' && (
              <div>
                {winners.length === 0 ? (
                  <div>
                    <div style={{ background: '#fff', border: '1px solid #e5e5e0', borderRadius: 12, padding: '1.5rem', textAlign: 'center', marginBottom: 16 }}>
                      <div style={{ fontSize: 36, marginBottom: 12 }}>🎲</div>
                      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Ready to draw</div>
                      <div style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
                        {entries.filter(e => e.verification_status === 'approved').length} approved entries in the draw
                      </div>
                      {selected.status !== 'active' ? (
                        <div style={{ background: '#FFF8E6', border: '1px solid #FAC775', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#633806' }}>
                          Your promotion must be active before running the draw.
                        </div>
                      ) : entries.filter(e => e.verification_status === 'approved').length === 0 ? (
                        <div style={{ background: '#f5f5f0', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#888' }}>
                          No approved entries yet. Entries need to be verified before a draw can be run.
                        </div>
                      ) : (
                        <button onClick={runDraw} disabled={drawing}
                          style={{ padding: '14px 32px', background: drawing ? '#9BA4B5' : '#534AB7', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: drawing ? 'not-allowed' : 'pointer' }}>
                          {drawing ? 'Drawing...' : 'Run prize draw'}
                        </button>
                      )}
                    </div>
                    <div style={{ background: '#f5f5f0', borderRadius: 10, padding: '12px 14px', fontSize: 12, color: '#666' }}>
                      The draw randomly selects winners from all approved entries. One winner per prize. Results are recorded with a timestamp for audit purposes.
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                      <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
                      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Draw complete!</div>
                      <div style={{ fontSize: 13, color: '#888' }}>Drawn: {drawnAt}</div>
                    </div>
                    {winners.map((w, i) => (
                      <div key={w.id} style={{ background: '#fff', border: '2px solid #1D9E75', borderRadius: 14, padding: '1.1rem', marginBottom: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#0F6E56', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Prize {i + 1}: {w.prize}
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 700 }}>{w.winner_name}</div>
                        <div style={{ fontSize: 13, color: '#666' }}>{w.winner_phone}</div>
                        <div style={{ fontSize: 12, color: '#1D9E75', marginTop: 4, fontWeight: 600 }}>Ticket: {w.winner_ticket}</div>
                      </div>
                    ))}
                    <button onClick={downloadCSV}
                      style={{ width: '100%', padding: '12px', background: '#f5f5f0', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#1a1a18', marginTop: 8 }}>
                      Download full entries CSV
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
