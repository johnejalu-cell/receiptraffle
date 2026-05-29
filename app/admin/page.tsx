'use client'
import { useState, useEffect } from 'react'

export default function AdminPage() {
  const [tab, setTab] = useState('overview')
  const [pin, setPin] = useState('')
  const [authed, setAuthed] = useState(false)
  const [pinError, setPinError] = useState('')
  const [promotions, setPromotions] = useState<any[]>([])
  const [entries, setEntries] = useState<any[]>([])
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [entryFilter, setEntryFilter] = useState('all')
  const [promoFilter, setPromoFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [drawingId, setDrawingId] = useState<string | null>(null)
  const [winners, setWinners] = useState<Record<string, {name:string,time:string}[]>>({})
  const [receiptModal, setReceiptModal] = useState<{url:string, name:string} | null>(null)
  const [fee, setFee] = useState<{amount: number, currency: string, description: string} | null>(null)
  const [feeForm, setFeeForm] = useState({ amount: '', currency: 'USD', description: '' })
  const [feeSaving, setFeeSaving] = useState(false)
  const [feeSaved, setFeeSaved] = useState(false)

  async function viewReceipt(entry: any) {
    const path = entry.receipt_image_path || entry.ai_result?.receipt_image_path
    if (!path) { alert('No receipt image stored for this entry'); return }
    const SUPABASE_URL = 'https://qnpjawyeekhkzvrorqyv.supabase.co'
    const url = `${SUPABASE_URL}/storage/v1/object/public/receipts/${path}`
    setReceiptModal({ url, name: entry.customer_name })
  }

  function checkPin() {
    if (pin === '2580') { setAuthed(true); loadData() }
    else { setPinError('Incorrect PIN') }
  }

  async function loadData() {
    setLoading(true)
    try {
      const [promRes, entRes, subRes] = await Promise.all([
        fetch('/api/admin/promotions'),
        fetch('/api/admin/entries'),
        fetch('/api/admin/submissions'),
      ])
      const [promData, entData, subData] = await Promise.all([
        promRes.json(), entRes.json(), subRes.json()
      ])
      setPromotions(promData.promotions || [])
      setEntries(entData.entries || [])
      setSubmissions(subData.submissions || [])
      fetch('/api/admin/fees').then(r => r.json()).then(d => {
        if (d.fee) {
          setFee(d.fee)
          setFeeForm({ amount: String(d.fee.amount), currency: d.fee.currency || 'USD', description: d.fee.description || '' })
        }
      }).catch(() => {})
    } catch (e) {
      console.error('Load error:', e)
    }
    setLoading(false)
  }

  async function activateSubmission(id: string) {
    await fetch('/api/admin/submissions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'active' })
    })
    loadData()
  }

  async function declineSubmission(id: string) {
    await fetch('/api/admin/submissions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'declined' })
    })
    loadData()
  }

  async function updateEntry(id: string, status: string) {
    await fetch('/api/admin/entries', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, verification_status: status })
    })
    loadData()
  }

  async function saveFee() {
    setFeeSaving(true)
    setFeeSaved(false)
    try {
      const res = await fetch('/api/admin/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(feeForm.amount) || 0, currency: feeForm.currency, description: feeForm.description })
      })
      const data = await res.json()
      if (data.success) { setFee(data.fee); setFeeSaved(true); setTimeout(() => setFeeSaved(false), 3000) }
    } catch (e) {}
    setFeeSaving(false)
  }

  async function runDraw(promoId: string, promoName: string) {
    setDrawingId(promoId)
    await new Promise(r => setTimeout(r, 2000))
    const approved = entries.filter(e => e.promotion_id === promoId && e.verification_status === 'approved')
    if (approved.length === 0) { alert('No approved entries for this promotion'); setDrawingId(null); return }
    const winner = approved[Math.floor(Math.random() * approved.length)]
    const time = new Date().toLocaleString('en-GB')
    setWinners(w => ({ ...w, [promoId]: [...(w[promoId] || []), { name: winner.customer_name, time }] }))
    setDrawingId(null)
  }

  function exportCSV(promoId: string | 'all') {
    const data = promoId === 'all' ? entries : entries.filter(e => e.promotion_id === promoId)
    const header = 'Ticket,Name,Phone,Email,Amount,Retailer,Date,Status,AI%'
    const rows = data.map((e: any) => `${e.ticket_number},"${e.customer_name}",${e.customer_phone},${e.customer_email || '-'},${e.amount},"${e.retailer}",${e.created_at?.split('T')[0]},${e.verification_status},${e.ai_confidence}%`)
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `entries-${promoId}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  function printEntries(promo: any) {
    const data = entries.filter(e => e.promotion_id === promo.id)
    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    document.body.appendChild(iframe)
    iframe.contentWindow!.document.open()
    iframe.contentWindow!.document.write(`
      <html><head><title>${promo.promo_name} - Entries</title>
      <style>body{font-family:Arial;padding:20px;font-size:13px}h1{font-size:18px;margin-bottom:4px}.meta{color:#666;margin-bottom:20px;font-size:12px}table{width:100%;border-collapse:collapse}th{background:#1D9E75;color:white;padding:8px;text-align:left;font-size:12px}td{padding:7px 8px;border-bottom:1px solid #eee;font-size:12px}tr:nth-child(even){background:#f9f9f9}.approved{color:#085041;font-weight:bold}.pending{color:#633806}.rejected{color:#791F1F}@media print{.no-print{display:none}}</style>
      </head><body>
      <h1>ReceiptRaffle - ${promo.promo_name}</h1>
      <div class="meta">${promo.company_name} | Draw: ${promo.draw_date} | Printed: ${new Date().toLocaleString('en-GB')} | Total: ${data.length} entries</div>
      <button class="no-print" onclick="window.print()" style="margin-bottom:16px;padding:8px 16px;background:#1D9E75;color:white;border:none;border-radius:6px;cursor:pointer">Print</button>
      <table><tr><th>#</th><th>Ticket</th><th>Name</th><th>Phone</th><th>Email</th><th>Amount</th><th>Retailer</th><th>Date</th><th>Status</th><th>AI%</th></tr>
      ${data.map((e: any, i: number) => `<tr><td>${i+1}</td><td>${e.ticket_number}</td><td><strong>${e.customer_name}</strong></td><td>${e.customer_phone}</td><td>${e.customer_email || '-'}</td><td>UGX ${parseInt(e.amount).toLocaleString()}</td><td>${e.retailer}</td><td>${e.created_at?.split('T')[0]}</td><td class="${e.verification_status}">${e.verification_status}</td><td>${e.ai_confidence}%</td></tr>`).join('')}
      </table></body></html>`)
    iframe.contentWindow!.document.close()
    setTimeout(() => { iframe.contentWindow!.print(); document.body.removeChild(iframe) }, 500)
  }

  // Build a lookup: promotion_id -> promo_name
  const promotionMap: Record<string, string> = {}
  promotions.forEach(p => { promotionMap[p.id] = p.promo_name })

  const filteredEntries = entries.filter(e => {
    const matchFilter = entryFilter === 'all' || e.verification_status === entryFilter
    const matchPromo = promoFilter === 'all' || e.promotion_id === promoFilter
    const matchSearch = !search || e.customer_name?.toLowerCase().includes(search.toLowerCase()) || e.ticket_number?.toLowerCase().includes(search.toLowerCase()) || e.customer_phone?.includes(search)
    return matchFilter && matchPromo && matchSearch
  })

  const pendingEntries = entries.filter(e => e.verification_status === 'manual_review')
  const pendingSubmissions = submissions.filter(s => s.status === 'pending')

  if (!authed) return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafaf9', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: 340, background: '#fff', border: '1px solid #e5e5e0', borderRadius: 16, padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>&#x1F510;</div>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Admin access</h1>
        <p style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>Enter your admin PIN</p>
        {pinError && <div style={{ background: '#FCEBEB', color: '#791F1F', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{pinError}</div>}
        <input type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="" maxLength={6}
          onKeyDown={e => e.key === 'Enter' && checkPin()}
          style={{ width: '100%', padding: '12px', border: '1px solid #d0d0c8', borderRadius: 10, fontSize: 22, textAlign: 'center', letterSpacing: 8, marginBottom: 12, background: '#f5f5f0' }} />
        <button onClick={checkPin} style={{ width: '100%', padding: '12px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Enter</button>
      </div>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: '#fafaf9' }}>
      <div style={{ background: '#1a1a2e', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 22 }}>&#x1F9FE;</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>ReceiptRaffle Admin</div>
            <div style={{ fontSize: 11, color: '#9BA4B5' }}>Live data</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={loadData} style={{ background: 'none', border: '1px solid #444', borderRadius: 8, padding: '5px 12px', color: '#9BA4B5', fontSize: 12, cursor: 'pointer' }}>&#x21BB; Refresh</button>
          <button onClick={() => setAuthed(false)} style={{ background: 'none', border: '1px solid #444', borderRadius: 8, padding: '5px 12px', color: '#9BA4B5', fontSize: 12, cursor: 'pointer' }}>Sign out</button>
        </div>
      </div>

      <div style={{ background: '#fff', borderBottom: '1px solid #e5e5e0', padding: '0 1rem', display: 'flex', overflowX: 'auto' }}>
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'submissions', label: `New promos${pendingSubmissions.length > 0 ? ` (${pendingSubmissions.length})` : ''}` },
          { id: 'promotions', label: 'Promotions' },
          { id: 'entries', label: 'Entries' },
          { id: 'review', label: `Review${pendingEntries.length > 0 ? ` (${pendingEntries.length})` : ''}` },
          { id: 'draws', label: 'Draws' },
          { id: 'fees', label: 'Fees' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: '12px 14px', background: 'none', border: 'none', borderBottom: tab === t.id ? '2px solid #1D9E75' : '2px solid transparent', cursor: 'pointer', fontSize: 12, fontWeight: tab === t.id ? 700 : 400, color: tab === t.id ? '#1D9E75' : '#666', whiteSpace: 'nowrap' }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '1.25rem 1rem', maxWidth: 620, margin: '0 auto' }}>
        {loading && <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>Loading...</div>}

        {tab === 'overview' && !loading && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Active promotions', value: promotions.filter(p => p.status === 'active').length, color: '#1D9E75' },
                { label: 'Total entries', value: entries.length, color: '#534AB7' },
                { label: 'Pending review', value: pendingEntries.length, color: '#854F0B' },
                { label: 'Pending submissions', value: pendingSubmissions.length, color: '#534AB7' },
              ].map((m, i) => (
                <div key={i} style={{ background: '#fff', border: '1px solid #e5e5e0', borderRadius: 12, padding: '1rem' }}>
                  <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: m.color }}>{m.value}</div>
                </div>
              ))}
            </div>
            {pendingEntries.length > 0 && (
              <div style={{ background: '#FFF8E6', border: '1px solid #FAC775', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#633806', marginBottom: 10 }}>
                &#x26A0; <strong>{pendingEntries.length} entries</strong> need manual review.
                <button onClick={() => setTab('review')} style={{ background: 'none', border: 'none', color: '#854F0B', textDecoration: 'underline', cursor: 'pointer', fontSize: 13, marginLeft: 4 }}>Review now</button>
              </div>
            )}
            {pendingSubmissions.length > 0 && (
              <div style={{ background: '#E6F1FB', border: '1px solid #93C5FD', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#0C447C' }}>
                &#x1F4CB; <strong>{pendingSubmissions.length} promotion submissions</strong> awaiting approval.
                <button onClick={() => setTab('submissions')} style={{ background: 'none', border: 'none', color: '#0C447C', textDecoration: 'underline', cursor: 'pointer', fontSize: 13, marginLeft: 4 }}>View</button>
              </div>
            )}
          </div>
        )}

        {tab === 'submissions' && !loading && (
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Promotion submissions</p>
            {submissions.length === 0 && <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>No submissions yet</div>}
            {submissions.map(s => (
              <div key={s.id} style={{ background: '#fff', border: '1px solid #e5e5e0', borderRadius: 14, padding: '1.25rem', marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{s.promo_name}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{s.company_name} · Ref: {s.ref}</div>
                  </div>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600,
                    background: s.status === 'active' ? '#E1F5EE' : s.status === 'declined' ? '#FCEBEB' : '#FFF8E6',
                    color: s.status === 'active' ? '#085041' : s.status === 'declined' ? '#791F1F' : '#633806' }}>
                    {s.status}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 12, color: '#666', marginBottom: 10 }}>
                  <div>Contact: <strong>{s.contact_name}</strong></div>
                  <div>Phone: <strong>{s.phone}</strong></div>
                  <div>Email: <strong>{s.email}</strong></div>
                  <div>Min spend: <strong>UGX {parseInt(s.min_spend).toLocaleString()}</strong></div>
                  <div>Draw: <strong>{s.draw_date}</strong></div>
                  <div>Submitted: <strong>{s.created_at?.split('T')[0]}</strong></div>
                </div>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 10 }}>
                  Prizes: {Array.isArray(s.prizes) ? s.prizes.join(' · ') : s.prizes}
                </div>
                {s.status === 'pending' && (
                  <>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => activateSubmission(s.id)} style={{ flex: 1, padding: '10px', background: '#E1F5EE', color: '#085041', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>&#x2713; Activate</button>
                      <button onClick={() => declineSubmission(s.id)} style={{ flex: 1, padding: '10px', background: '#FCEBEB', color: '#791F1F', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>&#x2717; Decline</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'promotions' && !loading && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <p style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Active promotions</p>
              <button onClick={() => exportCSV('all')} style={{ padding: '6px 14px', background: '#534AB7', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Export all CSV</button>
            </div>
            {promotions.length === 0 && <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>No active promotions yet</div>}
            {promotions.map(p => {
              const promoEntries = entries.filter(e => e.promotion_id === p.id)
              const approved = promoEntries.filter(e => e.verification_status === 'approved').length
              const pending = promoEntries.filter(e => e.verification_status === 'manual_review').length
              return (
                <div key={p.id} style={{ background: '#fff', border: '1px solid #e5e5e0', borderRadius: 14, padding: '1.25rem', marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{p.promo_name}</div>
                      <div style={{ fontSize: 12, color: '#888' }}>{p.company_name} · Draw: {p.draw_date}</div>
                    </div>
                    <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#E1F5EE', color: '#085041', fontWeight: 600 }}>Active</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
                    <div style={{ background: '#f5f5f0', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: '#999' }}>Total</div>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>{promoEntries.length}</div>
                    </div>
                    <div style={{ background: '#E8F8F2', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: '#0F6E56' }}>Approved</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#1D9E75' }}>{approved}</div>
                    </div>
                    <div style={{ background: '#FFF8E6', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: '#854F0B' }}>Review</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#854F0B' }}>{pending}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => exportCSV(p.id)} style={{ flex: 1, padding: '8px', background: '#EEEDFE', color: '#3C3489', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>CSV</button>
                    <button onClick={() => printEntries(p)} style={{ flex: 1, padding: '8px', background: '#E6F1FB', color: '#0C447C', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Print</button>
                    <button onClick={() => { setPromoFilter(p.id); setTab('entries') }} style={{ flex: 1, padding: '8px', background: '#f5f5f0', color: '#1a1a18', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>View entries</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {tab === 'entries' && !loading && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <p style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Entries ({filteredEntries.length})</p>
              <button onClick={() => exportCSV(promoFilter)} style={{ padding: '6px 14px', background: '#534AB7', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Export CSV</button>
            </div>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, phone or ticket..."
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #d0d0c8', borderRadius: 10, fontSize: 14, marginBottom: 10, background: '#fff' }} />
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <select value={promoFilter} onChange={e => setPromoFilter(e.target.value)}
                style={{ padding: '6px 10px', border: '1px solid #d0d0c8', borderRadius: 8, fontSize: 12, background: '#fff' }}>
                <option value="all">All promotions</option>
                {promotions.map(p => <option key={p.id} value={p.id}>{p.promo_name}</option>)}
              </select>
              {['all','approved','manual_review','rejected'].map(f => (
                <button key={f} onClick={() => setEntryFilter(f)}
                  style={{ padding: '5px 12px', borderRadius: 20, border: '1px solid #d0d0c8', background: entryFilter === f ? '#1D9E75' : '#fff', color: entryFilter === f ? '#fff' : '#666', fontSize: 12, cursor: 'pointer', fontWeight: entryFilter === f ? 700 : 400 }}>
                  {f === 'manual_review' ? 'Pending' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            {filteredEntries.length === 0 && <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>No entries found</div>}
            {filteredEntries.map(e => (
              <div key={e.id} style={{ background: '#fff', border: '1px solid #e5e5e0', borderRadius: 12, padding: '1rem', marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{e.customer_name}</div>
                    <div style={{ fontSize: 12, color: '#1D9E75', fontWeight: 600 }}>{promotionMap[e.promotion_id] || 'Unknown promotion'}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{e.customer_phone}{e.customer_email ? ` · ${e.customer_email}` : ''}</div>
                    <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>UGX {parseInt(e.amount).toLocaleString()} · {e.retailer}</div>
                    <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>Ticket: {e.ticket_number} · AI: {e.ai_confidence}% · {e.created_at?.split('T')[0]}</div>
                  </div>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600, marginLeft: 8, flexShrink: 0,
                    background: e.verification_status === 'approved' ? '#E1F5EE' : e.verification_status === 'manual_review' ? '#FFF8E6' : '#FCEBEB',
                    color: e.verification_status === 'approved' ? '#085041' : e.verification_status === 'manual_review' ? '#633806' : '#791F1F' }}>
                    {e.verification_status === 'manual_review' ? 'Pending' : e.verification_status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'review' && !loading && (
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Manual review queue ({pendingEntries.length})</p>
            {pendingEntries.length === 0 && <div style={{ textAlign: 'center', padding: '2rem', color: '#1D9E75', fontWeight: 600 }}>&#x2713; All clear  no entries need review</div>}
            {pendingEntries.map(e => (
              <div key={e.id} style={{ background: '#fff', border: '1px solid #FAC775', borderRadius: 14, padding: '1.25rem', marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{e.customer_name}</div>
                    <div style={{ fontSize: 12, color: '#1D9E75', fontWeight: 600 }}>{promotionMap[e.promotion_id] || 'Unknown promotion'}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{e.customer_phone} · {e.created_at?.split('T')[0]}</div>
                  </div>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#FFF8E6', color: '#633806', fontWeight: 600 }}>AI: {e.ai_confidence}%</span>
                </div>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                  UGX {parseInt(e.amount).toLocaleString()} · {e.retailer} · Ticket: {e.ticket_number}
                </div>
                {e.ai_result?.verification_reason && (
                  <div style={{ background: '#FFF8E6', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#633806', marginBottom: 10 }}>
                    AI note: {e.ai_result.verification_reason}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <button onClick={() => viewReceipt(e)} style={{ flex: 1, padding: '8px', background: '#f5f5f0', color: '#333', border: '1px solid #d0d0c8', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>&#x1F5BC; View receipt</button>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => updateEntry(e.id, 'approved')} style={{ flex: 1, padding: '8px', background: '#E1F5EE', color: '#085041', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>&#x2713; Approve</button>
                  <button onClick={() => updateEntry(e.id, 'rejected')} style={{ flex: 1, padding: '8px', background: '#FCEBEB', color: '#791F1F', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>&#x2717; Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'draws' && !loading && (
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Prize draws</p>
            {promotions.length === 0 && <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>No active promotions</div>}
            {promotions.map(p => {
              const eligible = entries.filter(e => e.promotion_id === p.id && e.verification_status === 'approved').length
              return (
                <div key={p.id} style={{ background: '#fff', border: '1px solid #e5e5e0', borderRadius: 14, padding: '1.25rem', marginBottom: 10 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{p.promo_name}</div>
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>{eligible} eligible entries · Draw: {p.draw_date}</div>
                  {(winners[p.id] || []).map((w, i) => (
                    <div key={i} style={{ background: '#E1F5EE', borderRadius: 10, padding: '10px 14px', marginBottom: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#085041' }}>&#x1F3C6; Winner #{i+1}: {w.name}</div>
                      <div style={{ fontSize: 11, color: '#0F6E56' }}>{w.time}</div>
                    </div>
                  ))}
                  <button onClick={() => runDraw(p.id, p.promo_name)} disabled={drawingId === p.id || eligible === 0}
                    style={{ width: '100%', padding: '10px', background: drawingId === p.id ? '#9BA4B5' : eligible === 0 ? '#ddd' : '#534AB7', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: drawingId === p.id || eligible === 0 ? 'not-allowed' : 'pointer' }}>
                    {drawingId === p.id ? 'Drawing...' : eligible === 0 ? 'No eligible entries' : '🎲 Run draw'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
      {tab === 'fees' && !loading && (
        <div>
          <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Promotion fee settings</p>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>Set the fee promoters pay before their promotion goes live. This appears automatically on the promoter submission form.</p>
          <div style={{ background: '#fff', border: '1px solid #e5e5e0', borderRadius: 14, padding: '1.25rem', marginBottom: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Fee amount</label>
                <input type="number" value={feeForm.amount} onChange={e => setFeeForm(f => ({ ...f, amount: e.target.value }))} placeholder="e.g. 250"
                  style={{ width: '100%', padding: '12px 14px', border: '1px solid #d0d0c8', borderRadius: 10, fontSize: 15, background: '#fff' }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Currency</label>
                <select value={feeForm.currency} onChange={e => setFeeForm(f => ({ ...f, currency: e.target.value }))}
                  style={{ width: '100%', padding: '12px 14px', border: '1px solid #d0d0c8', borderRadius: 10, fontSize: 15, background: '#fff' }}>
                  <option value="USD">USD - US Dollar</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="UGX">UGX - Ugandan Shilling</option>
                  <option value="KES">KES - Kenyan Shilling</option>
                  <option value="NGN">NGN - Nigerian Naira</option>
                  <option value="ZAR">ZAR - South African Rand</option>
                  <option value="GHS">GHS - Ghanaian Cedi</option>
                  <option value="TZS">TZS - Tanzanian Shilling</option>
                  <option value="AUD">AUD - Australian Dollar</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Payment instructions (optional)</label>
                <input type="text" value={feeForm.description} onChange={e => setFeeForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g. Pay via bank transfer or mobile money"
                  style={{ width: '100%', padding: '12px 14px', border: '1px solid #d0d0c8', borderRadius: 10, fontSize: 15, background: '#fff' }} />
              </div>
              <button onClick={saveFee} disabled={feeSaving || !feeForm.amount}
                style={{ width: '100%', padding: '12px', background: feeSaving ? '#9BA4B5' : feeSaved ? '#085041' : '#1D9E75', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: feeSaving ? 'not-allowed' : 'pointer' }}>
                {feeSaving ? 'Saving...' : feeSaved ? 'Saved!' : 'Save fee settings'}
              </button>
            </div>
          </div>
          {fee && (
            <div style={{ background: '#E8F8F2', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#085041' }}>
              Current fee: <strong>{fee.currency} {fee.amount.toLocaleString()}</strong>
              {fee.description && <span> - {fee.description}</span>}
            </div>
          )}
        </div>
      )}

      {receiptModal && (
        <div onClick={() => setReceiptModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: '1.25rem', maxWidth: 480, width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Receipt  {receiptModal.name}</div>
              <button onClick={() => setReceiptModal(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#666' }}>&times;</button>
            </div>
            <img src={receiptModal.url} alt="Receipt" style={{ width: '100%', borderRadius: 8, border: '1px solid #e5e5e0' }}
              onError={() => alert('Could not load receipt image. It may not have been stored.')} />
          </div>
        </div>
      )}
    </main>
  )
}
