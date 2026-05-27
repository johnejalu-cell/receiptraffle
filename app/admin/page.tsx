'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Entry {
  id: string
  customer_name: string
  customer_phone: string
  ticket_number: string
  receipt_url: string
  amount: number
  currency: string
  verification_status: string
  ai_confidence: number
  ai_result: any
  created_at: string
  promotions?: { name: string; brand: string; min_spend: number }
}

const S: Record<string, React.CSSProperties> = {
  page: { maxWidth: 720, margin: '0 auto', padding: '1.5rem 1rem 4rem', fontFamily: 'system-ui, sans-serif' },
  hdr: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #e5e5e0' },
  logoBox: { width: 36, height: 36, background: '#A32D2D', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 },
  title: { fontSize: 18, fontWeight: 600, margin: 0 },
  tabs: { display: 'flex', gap: 4, marginBottom: '1.25rem', borderBottom: '1px solid #e5e5e0' },
  tab: { padding: '8px 16px', fontSize: 13, background: 'none', border: 'none', borderBottom: '2px solid transparent', cursor: 'pointer', color: '#888', fontFamily: 'inherit' },
  tabOn: { padding: '8px 16px', fontSize: 13, background: 'none', border: 'none', borderBottom: '2px solid #A32D2D', cursor: 'pointer', color: '#A32D2D', fontWeight: 600, fontFamily: 'inherit' },
  card: { background: '#fff', border: '1px solid #e5e5e0', borderRadius: 12, padding: '1.25rem', marginBottom: 10 },
  cardFraud: { background: '#fff', border: '1px solid #F09595', borderRadius: 12, padding: '1.25rem', marginBottom: 10 },
  row: { display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  name: { fontSize: 14, fontWeight: 600, marginBottom: 2 },
  meta: { fontSize: 12, color: '#666', lineHeight: 1.6 },
  badge: { display: 'inline-block', fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 500 },
  aiNote: { fontSize: 12, padding: '8px 12px', borderRadius: 8, marginBottom: 10, lineHeight: 1.5, background: '#FAEEDA', color: '#633806' },
  btnRow: { display: 'flex', gap: 8, flexWrap: 'wrap' as const },
  btn: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer', border: '1px solid #d0d0c8', background: 'transparent', fontFamily: 'inherit' },
  btnApprove: { background: '#E1F5EE', color: '#085041', border: '1px solid #5DCAA5', borderRadius: 8, padding: '7px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
  btnReject: { background: '#FCEBEB', color: '#791F1F', border: '1px solid #F09595', borderRadius: 8, padding: '7px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
  btnView: { background: '#E6F1FB', color: '#0C447C', border: '1px solid #90C4F0', borderRadius: 8, padding: '7px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
  empty: { textAlign: 'center' as const, padding: '3rem 1rem', color: '#888', fontSize: 14 },
  stat: { background: '#f5f5f0', borderRadius: 10, padding: '12px 16px' },
  statVal: { fontSize: 24, fontWeight: 600, margin: '0 0 2px' },
  statLbl: { fontSize: 12, color: '#666', margin: 0 },
  metrics: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: '1.5rem' },
  overlay: { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' },
  modal: { background: '#fff', borderRadius: 16, maxWidth: 540, width: '100%', maxHeight: '90vh', overflow: 'auto', padding: '1.5rem' },
  modalHdr: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  receiptImg: { width: '100%', borderRadius: 8, border: '1px solid #e5e5e0', marginBottom: '1rem' },
  fieldGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  field: { background: '#f5f5f0', borderRadius: 8, padding: '8px 12px' },
  fieldLbl: { fontSize: 11, color: '#888', marginBottom: 2 },
  fieldVal: { fontSize: 14, fontWeight: 500 },
}

const ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN || '1234'

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)

  if (!authed) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', fontFamily: 'system-ui' }}>
        <div style={{ width: '100%', maxWidth: 320, background: '#fff', border: '1px solid #e5e5e0', borderRadius: 16, padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔐</div>
          <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: '1.25rem' }}>Admin access</h1>
          <input
            type="password"
            placeholder="Enter admin PIN"
            value={pin}
            onChange={e => { setPin(e.target.value); setPinError(false) }}
            onKeyDown={e => { if (e.key === 'Enter') { if (pin === ADMIN_PIN) setAuthed(true); else setPinError(true) } }}
            style={{ width: '100%', padding: '10px 12px', border: `1px solid ${pinError ? '#F09595' : '#d0d0c8'}`, borderRadius: 8, fontSize: 16, textAlign: 'center', marginBottom: 10, letterSpacing: 6, fontFamily: 'inherit' }}
          />
          {pinError && <p style={{ color: '#A32D2D', fontSize: 13, margin: '0 0 10px' }}>Incorrect PIN</p>}
          <button onClick={() => { if (pin === ADMIN_PIN) setAuthed(true); else setPinError(true) }}
            style={{ width: '100%', padding: 10, background: '#A32D2D', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
            Enter
          </button>
        </div>
      </main>
    )
  }

  return <AdminDashboard />
}

function AdminDashboard() {
  const [tab, setTab] = useState<'review' | 'approved' | 'all'>('review')
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [viewingEntry, setViewingEntry] = useState<Entry | null>(null)
  const [receiptImgUrl, setReceiptImgUrl] = useState<string | null>(null)
  const [imgLoading, setImgLoading] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => { loadEntries() }, [])

  async function loadEntries() {
    setLoading(true)
    const { data, error } = await supabase
      .from('entries')
      .select('*, promotions(name, brand, min_spend)')
      .order('created_at', { ascending: false })
    if (!error && data) setEntries(data as Entry[])
    setLoading(false)
  }

  async function viewReceipt(entry: Entry) {
    setViewingEntry(entry)
    setReceiptImgUrl(null)
    setImgLoading(true)
    if (entry.receipt_url) {
      const { data } = await supabase.storage
        .from('receipts')
        .createSignedUrl(entry.receipt_url, 300)
      if (data?.signedUrl) setReceiptImgUrl(data.signedUrl)
    }
    setImgLoading(false)
  }

  async function updateStatus(id: string, status: 'approved' | 'rejected') {
    const { error } = await supabase
      .from('entries')
      .update({ verification_status: status, reviewed_at: new Date().toISOString() })
      .eq('id', id)
    if (!error) {
      setEntries(prev => prev.map(e => e.id === id ? { ...e, verification_status: status } : e))
      if (viewingEntry?.id === id) setViewingEntry(null)
      showToast(status === 'approved' ? '✅ Entry approved' : '❌ Entry rejected')
    }
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const filtered = entries.filter(e =>
    tab === 'review' ? e.verification_status === 'manual_review' :
    tab === 'approved' ? e.verification_status === 'approved' : true
  )

  const reviewCount = entries.filter(e => e.verification_status === 'manual_review').length
  const approvedCount = entries.filter(e => e.verification_status === 'approved').length
  const totalCount = entries.length

  function statusBadge(s: string) {
    const map: Record<string, { bg: string; color: string; label: string }> = {
      approved:      { bg: '#E1F5EE', color: '#085041', label: 'Approved' },
      manual_review: { bg: '#FAEEDA', color: '#633806', label: 'Needs review' },
      rejected:      { bg: '#FCEBEB', color: '#791F1F', label: 'Rejected' },
      pending:       { bg: '#f0f0ea', color: '#666',    label: 'Pending' },
    }
    const m = map[s] || map.pending
    return <span style={{ ...S.badge, background: m.bg, color: m.color }}>{m.label}</span>
  }

  return (
    <div style={S.page}>
      <div style={S.hdr}>
        <div style={S.logoBox}>🛡️</div>
        <div>
          <h1 style={S.title}>ReceiptRaffle Admin</h1>
          <p style={{ margin: 0, fontSize: 12, color: '#888' }}>Receipt review &amp; verification</p>
        </div>
        <button onClick={loadEntries} style={{ ...S.btn, marginLeft: 'auto' }}>↻ Refresh</button>
      </div>

      <div style={S.metrics}>
        <div style={S.stat}><p style={S.statVal}>{reviewCount}</p><p style={S.statLbl}>Needs review</p></div>
        <div style={S.stat}><p style={S.statVal}>{approvedCount}</p><p style={S.statLbl}>Approved</p></div>
        <div style={S.stat}><p style={S.statVal}>{totalCount}</p><p style={S.statLbl}>Total entries</p></div>
      </div>

      <div style={S.tabs}>
        <button style={tab === 'review' ? S.tabOn : S.tab} onClick={() => setTab('review')}>
          Needs review {reviewCount > 0 && <span style={{ background: '#E24B4A', color: '#fff', fontSize: 10, padding: '1px 6px', borderRadius: 10, marginLeft: 4 }}>{reviewCount}</span>}
        </button>
        <button style={tab === 'approved' ? S.tabOn : S.tab} onClick={() => setTab('approved')}>Approved</button>
        <button style={tab === 'all' ? S.tabOn : S.tab} onClick={() => setTab('all')}>All entries</button>
      </div>

      {toast && (
        <div style={{ background: '#1a1a18', color: '#fff', padding: '10px 16px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{toast}</div>
      )}

      {loading ? (
        <div style={S.empty}>Loading entries…</div>
      ) : filtered.length === 0 ? (
        <div style={S.empty}>
          {tab === 'review' ? '✅ No entries waiting for review' : 'No entries found'}
        </div>
      ) : (
        filtered.map(entry => (
          <div key={entry.id} style={entry.verification_status === 'manual_review' ? S.cardFraud : S.card}>
            <div style={S.row}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={S.name}>{entry.customer_name || 'Anonymous'}</div>
                <div style={S.meta}>
                  {entry.promotions?.name} · {entry.promotions?.brand}<br />
                  Ticket: {entry.ticket_number} · {new Date(entry.created_at).toLocaleString('en-GB')}<br />
                  Amount: <strong>UGX {(entry.amount || 0).toLocaleString()}</strong>
                  {entry.promotions?.min_spend && (
                    <span style={{ color: entry.amount >= entry.promotions.min_spend ? '#085041' : '#A32D2D' }}>
                      {' '}(min: UGX {entry.promotions.min_spend.toLocaleString()})
                    </span>
                  )}
                  {entry.customer_phone && <><br />Phone: {entry.customer_phone}</>}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                {statusBadge(entry.verification_status)}
                {entry.ai_confidence != null && (
                  <span style={{ fontSize: 11, color: '#888' }}>AI: {entry.ai_confidence}% confidence</span>
                )}
              </div>
            </div>

            {entry.ai_result?.verification_reason && (
              <div style={S.aiNote}>
                🤖 <strong>AI note:</strong> {entry.ai_result.verification_reason}
                {entry.ai_result.retailer && entry.ai_result.retailer !== 'Unknown' && (
                  <> · Retailer: {entry.ai_result.retailer}</>
                )}
              </div>
            )}

            <div style={S.btnRow}>
              <button style={S.btnView} onClick={() => viewReceipt(entry)}>
                🖼 View receipt
              </button>
              {entry.verification_status !== 'approved' && (
                <button style={S.btnApprove} onClick={() => updateStatus(entry.id, 'approved')}>
                  ✅ Approve
                </button>
              )}
              {entry.verification_status !== 'rejected' && (
                <button style={S.btnReject} onClick={() => updateStatus(entry.id, 'rejected')}>
                  ❌ Reject
                </button>
              )}
            </div>
          </div>
        ))
      )}

      {viewingEntry && (
        <div style={S.overlay} onClick={e => { if (e.target === e.currentTarget) setViewingEntry(null) }}>
          <div style={S.modal}>
            <div style={S.modalHdr}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>{viewingEntry.customer_name}</div>
                <div style={{ fontSize: 12, color: '#888' }}>{viewingEntry.ticket_number} · {viewingEntry.promotions?.name}</div>
              </div>
              <button onClick={() => setViewingEntry(null)}
                style={{ background: 'none', border: '1px solid #d0d0c8', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
                ✕ Close
              </button>
            </div>

            <div style={{ marginBottom: '1rem', minHeight: 200, background: '#f5f5f0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {imgLoading ? (
                <div style={{ color: '#888', fontSize: 14 }}>Loading receipt image…</div>
              ) : receiptImgUrl ? (
                <img src={receiptImgUrl} alt="Receipt" style={S.receiptImg} />
              ) : (
                <div style={{ color: '#888', fontSize: 14, padding: '2rem', textAlign: 'center' }}>
                  🧾 No image available<br />
                  <span style={{ fontSize: 12 }}>The receipt may not have been stored correctly</span>
                </div>
              )}
            </div>

            {viewingEntry.ai_result && (
              <div style={S.fieldGrid}>
                <div style={S.field}><div style={S.fieldLbl}>Retailer</div><div style={S.fieldVal}>{viewingEntry.ai_result.retailer || '—'}</div></div>
                <div style={S.field}><div style={S.fieldLbl}>Date</div><div style={S.fieldVal}>{viewingEntry.ai_result.date || '—'}</div></div>
                <div style={S.field}><div style={S.fieldLbl}>Amount</div><div style={S.fieldVal}>UGX {(viewingEntry.amount || 0).toLocaleString()}</div></div>
                <div style={S.field}><div style={S.fieldLbl}>AI confidence</div><div style={S.fieldVal}>{viewingEntry.ai_confidence ?? '—'}%</div></div>
              </div>
            )}

            <div style={{ ...S.btnRow, marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e5e0' }}>
              {viewingEntry.verification_status !== 'approved' && (
                <button style={{ ...S.btnApprove, flex: 1, justifyContent: 'center' }}
                  onClick={() => updateStatus(viewingEntry.id, 'approved')}>
                  ✅ Approve entry
                </button>
              )}
              {viewingEntry.verification_status !== 'rejected' && (
                <button style={{ ...S.btnReject, flex: 1, justifyContent: 'center' }}
                  onClick={() => updateStatus(viewingEntry.id, 'rejected')}>
                  ❌ Reject entry
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
