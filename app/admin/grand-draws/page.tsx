'use client'
import { useState, useEffect } from 'react'

interface GrandDraw {
  id: string
  name: string
  prize_description: string
  prize_value_usd: number
  draw_date: string
  status: string
  created_at: string
  linked_promotions: LinkedPromotion[]
  total_entries: number
}

interface LinkedPromotion {
  id: string
  promo_name: string
  company_name: string
  emoji: string
  color: string
  status: string
}

interface Promotion {
  id: string
  promo_name: string
  company_name: string
  emoji: string
  status: string
  grand_draw_id: string | null
}

interface Winner {
  name: string
  phone: string
  email: string
  ticket: string
  promotion_id: string
}

export default function AdminGrandDrawsPage() {
  const [pin, setPin] = useState('')
  const [authed, setAuthed] = useState(false)
  const [pinError, setPinError] = useState('')
  const [draws, setDraws] = useState<GrandDraw[]>([])
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDraw, setSelectedDraw] = useState<GrandDraw | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [drawRunning, setDrawRunning] = useState(false)
  const [winner, setWinner] = useState<Winner | null>(null)
  const [drawError, setDrawError] = useState('')
  const [newDraw, setNewDraw] = useState({
    name: '', prize_description: '', prize_value_usd: '', draw_date: ''
  })

  const adminPin = process.env.NEXT_PUBLIC_ADMIN_PIN || '1234'

  const login = () => {
    if (pin === adminPin) { setAuthed(true); loadData() }
    else setPinError('Incorrect PIN')
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [drawsRes, promosRes] = await Promise.all([
        fetch('/api/admin/grand-draws'),
        fetch('/api/admin/submissions'),
      ])
      const drawsData = await drawsRes.json()
      const promosData = await promosRes.json()
      setDraws(drawsData.draws || [])
      setPromotions(promosData.submissions || promosData.promotions || [])
    } catch { }
    finally { setLoading(false) }
  }

  const createDraw = async () => {
    if (!newDraw.name) return
    setCreating(true)
    try {
      const res = await fetch('/api/admin/grand-draws', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', ...newDraw, prize_value_usd: parseFloat(newDraw.prize_value_usd) || 0 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setShowCreate(false)
      setNewDraw({ name: '', prize_description: '', prize_value_usd: '', draw_date: '' })
      loadData()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to create draw')
    } finally { setCreating(false) }
  }

  const linkPromotion = async (drawId: string, promotionId: string) => {
    await fetch('/api/admin/grand-draws', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'link', grand_draw_id: drawId, promotion_id: promotionId }),
    })
    loadData()
    if (selectedDraw?.id === drawId) {
      const res = await fetch('/api/admin/grand-draws')
      const data = await res.json()
      const updated = data.draws?.find((d: GrandDraw) => d.id === drawId)
      if (updated) setSelectedDraw(updated)
    }
  }

  const unlinkPromotion = async (promotionId: string) => {
    if (!confirm('Remove this promotion from the grand draw?')) return
    await fetch('/api/admin/grand-draws', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'unlink', promotion_id: promotionId }),
    })
    loadData()
    if (selectedDraw) {
      const res = await fetch('/api/admin/grand-draws')
      const data = await res.json()
      const updated = data.draws?.find((d: GrandDraw) => d.id === selectedDraw.id)
      if (updated) setSelectedDraw(updated)
    }
  }

  const runDraw = async (drawId: string) => {
    if (!confirm('Run the grand draw now? A winner will be selected at random from ALL approved entries across all linked promotions.')) return
    setDrawRunning(true); setDrawError(''); setWinner(null)
    try {
      const res = await fetch('/api/admin/grand-draws', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run_draw', grand_draw_id: drawId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setWinner(data.winner)
      loadData()
    } catch (e: unknown) {
      setDrawError(e instanceof Error ? e.message : 'Draw failed')
    } finally { setDrawRunning(false) }
  }

  const updateStatus = async (drawId: string, status: string) => {
    await fetch('/api/admin/grand-draws', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_status', grand_draw_id: drawId, status }),
    })
    loadData()
  }

  const unlinkedPromotions = promotions.filter(p =>
    !p.grand_draw_id && p.status === 'active'
  )

  const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid #ccc', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { display: 'block', fontWeight: 600, fontSize: '13px', marginBottom: '4px', color: '#333' }

  if (!authed) return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: 'white', borderRadius: '16px', padding: '40px', maxWidth: '360px', width: '100%', boxShadow: '0 2px 16px rgba(0,0,0,0.08)', textAlign: 'center' }}>
        <div style={{ fontSize: '36px', marginBottom: '12px' }}>🏆</div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Grand Draw Management</h1>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>Admin access required</p>
        <input type="password" value={pin} onChange={e => setPin(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()} placeholder="Admin PIN" style={{ ...inp, textAlign: 'center', letterSpacing: '4px', fontSize: '18px', marginBottom: '12px' }} />
        {pinError && <p style={{ color: '#dc2626', fontSize: '13px', marginBottom: '12px' }}>{pinError}</p>}
        <button onClick={login} style={{ width: '100%', padding: '12px', background: '#1D9E75', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 700, fontSize: '15px', cursor: 'pointer' }}>Enter →</button>
        <div style={{ marginTop: '20px' }}><a href="/admin" style={{ color: '#888', fontSize: '13px', textDecoration: 'none' }}>← Back to admin</a></div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <a href="/admin" style={{ color: '#1D9E75', fontSize: '14px', textDecoration: 'none', fontWeight: 600 }}>← Back to admin</a>
            <h1 style={{ fontSize: '22px', fontWeight: 700, margin: '6px 0 2px' }}>🏆 Grand Draw Management</h1>
            <p style={{ color: '#888', fontSize: '14px', margin: 0 }}>Create grand draws, link promotions and run draws from here.</p>
          </div>
          <button onClick={() => setShowCreate(true)} style={{ padding: '12px 20px', background: '#1D9E75', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
            + Create grand draw
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '28px', marginBottom: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '2px solid #1D9E75' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '20px' }}>New Grand Draw</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>Draw name *</label>
                <input style={inp} value={newDraw.name} onChange={e => setNewDraw(d => ({ ...d, name: e.target.value }))} placeholder="e.g. Jetour Dashing Grand Draw 2026" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>Prize description *</label>
                <textarea style={{ ...inp, minHeight: '70px', resize: 'vertical' }} value={newDraw.prize_description} onChange={e => setNewDraw(d => ({ ...d, prize_description: e.target.value }))} placeholder="e.g. 1x Jetour Dashing SUV (value approx. USD 20,000)" />
              </div>
              <div>
                <label style={lbl}>Prize value (USD)</label>
                <input style={inp} type="number" value={newDraw.prize_value_usd} onChange={e => setNewDraw(d => ({ ...d, prize_value_usd: e.target.value }))} placeholder="e.g. 20000" />
              </div>
              <div>
                <label style={lbl}>Draw date</label>
                <input style={inp} type="date" value={newDraw.draw_date} onChange={e => setNewDraw(d => ({ ...d, draw_date: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowCreate(false)} style={{ flex: 1, padding: '12px', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button onClick={createDraw} disabled={creating || !newDraw.name} style={{ flex: 1, padding: '12px', background: creating || !newDraw.name ? '#9ca3af' : '#1D9E75', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 700, cursor: creating || !newDraw.name ? 'not-allowed' : 'pointer' }}>
                {creating ? 'Creating...' : 'Create grand draw'}
              </button>
            </div>
          </div>
        )}

        {loading && <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading...</div>}

        {!loading && draws.length === 0 && !showCreate && (
          <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏆</div>
            <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '8px', color: '#555' }}>No grand draws yet</div>
            <div style={{ color: '#888', fontSize: '14px', marginBottom: '20px' }}>Create your first grand draw to get started</div>
            <button onClick={() => setShowCreate(true)} style={{ padding: '12px 24px', background: '#1D9E75', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 600, cursor: 'pointer' }}>+ Create grand draw</button>
          </div>
        )}

        {/* Draws list */}
        {draws.map(draw => (
          <div key={draw.id} style={{ background: 'white', borderRadius: '16px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>

            {/* Draw header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#111' }}>{draw.name}</h2>
                  <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: draw.status === 'active' ? '#dcfce7' : draw.status === 'drawn' ? '#ede9fe' : '#fef9c3', color: draw.status === 'active' ? '#16a34a' : draw.status === 'drawn' ? '#5b21b6' : '#92400e' }}>{draw.status}</span>
                </div>
                <p style={{ color: '#666', fontSize: '14px', margin: '0 0 6px' }}>{draw.prize_description}</p>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  {draw.prize_value_usd > 0 && <span style={{ fontSize: '13px', color: '#888' }}>💰 USD {draw.prize_value_usd.toLocaleString()}</span>}
                  {draw.draw_date && <span style={{ fontSize: '13px', color: '#888' }}>🗓 {new Date(draw.draw_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
                  <span style={{ fontSize: '13px', color: '#1D9E75', fontWeight: 600 }}>🎫 {draw.total_entries.toLocaleString()} total entries</span>
                  <span style={{ fontSize: '13px', color: '#888' }}>🏢 {draw.linked_promotions.length} promotions</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {draw.status === 'pending' && (
                  <button onClick={() => updateStatus(draw.id, 'active')} style={{ padding: '8px 14px', background: '#dcfce7', border: 'none', borderRadius: '8px', color: '#16a34a', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>Activate</button>
                )}
                {draw.status === 'active' && (
                  <button onClick={() => runDraw(draw.id)} disabled={drawRunning || draw.total_entries === 0} style={{ padding: '8px 14px', background: draw.total_entries > 0 ? '#7c3aed' : '#e5e7eb', border: 'none', borderRadius: '8px', color: draw.total_entries > 0 ? 'white' : '#9ca3af', fontWeight: 600, cursor: draw.total_entries > 0 ? 'pointer' : 'not-allowed', fontSize: '13px' }}>
                    {drawRunning ? 'Drawing...' : '🎰 Run draw'}
                  </button>
                )}
                <button onClick={() => setSelectedDraw(selectedDraw?.id === draw.id ? null : draw)} style={{ padding: '8px 14px', background: '#f3f4f6', border: 'none', borderRadius: '8px', color: '#333', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>
                  {selectedDraw?.id === draw.id ? 'Close ↑' : 'Manage ↓'}
                </button>
              </div>
            </div>

            {/* Draw error */}
            {drawError && selectedDraw?.id === draw.id && (
              <div style={{ padding: '12px 24px', background: '#fef2f2', color: '#dc2626', fontSize: '14px' }}>{drawError}</div>
            )}

            {/* Winner */}
            {winner && selectedDraw?.id === draw.id && (
              <div style={{ padding: '24px', background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', borderBottom: '1px solid #86efac', textAlign: 'center' }}>
                <div style={{ fontSize: '40px', marginBottom: '8px' }}>🏆</div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#15803d', marginBottom: '4px' }}>Grand Draw Winner!</h3>
                <p style={{ fontSize: '18px', fontWeight: 700, margin: '8px 0 2px' }}>{winner.name}</p>
                <p style={{ color: '#555', margin: '2px 0' }}>📞 {winner.phone}</p>
                {winner.email && <p style={{ color: '#555', margin: '2px 0' }}>✉ {winner.email}</p>}
                <p style={{ color: '#1D9E75', fontWeight: 600, marginTop: '8px' }}>Ticket: {winner.ticket}</p>
              </div>
            )}

            {/* Manage panel */}
            {selectedDraw?.id === draw.id && (
              <div style={{ padding: '24px' }}>

                {/* Linked promotions */}
                <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', color: '#111' }}>Linked promotions ({draw.linked_promotions.length})</h3>
                {draw.linked_promotions.length === 0 ? (
                  <p style={{ color: '#888', fontSize: '14px', marginBottom: '20px' }}>No promotions linked yet. Add promotions below.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                    {draw.linked_promotions.map(p => (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: '#f9fafb', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                        <span style={{ fontSize: '22px' }}>{p.emoji || '🛍'}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '14px' }}>{p.promo_name}</div>
                          <div style={{ color: '#888', fontSize: '12px' }}>{p.company_name}</div>
                        </div>
                        <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: p.status === 'active' ? '#dcfce7' : '#fef9c3', color: p.status === 'active' ? '#16a34a' : '#92400e' }}>{p.status}</span>
                        <button onClick={() => unlinkPromotion(p.id)} style={{ padding: '6px 12px', background: '#fee2e2', border: 'none', borderRadius: '6px', color: '#dc2626', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Remove</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add promotion */}
                {unlinkedPromotions.length > 0 && (
                  <>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', color: '#111' }}>Add promotion to this draw</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {unlinkedPromotions.map(p => (
                        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: '#f9fafb', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                          <span style={{ fontSize: '22px' }}>{p.emoji || '🛍'}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '14px' }}>{p.promo_name}</div>
                            <div style={{ color: '#888', fontSize: '12px' }}>{p.company_name}</div>
                          </div>
                          <button onClick={() => linkPromotion(draw.id, p.id)} style={{ padding: '8px 14px', background: '#1D9E75', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>+ Add</button>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {unlinkedPromotions.length === 0 && draw.linked_promotions.length > 0 && (
                  <p style={{ color: '#888', fontSize: '13px', marginTop: '8px' }}>All active promotions are already linked to this draw.</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
