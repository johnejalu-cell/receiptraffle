'use client'
import { useState } from 'react'

const SAMPLE_PROMOTIONS = [
  { id: 1, name: 'Summer Braai Bonanza', company: 'FreshMart', entries: 1842, verified: 1761, pending: 12, status: 'active', drawDate: '30 Jun 2025', fee: 'paid' },
  { id: 2, name: 'Back-to-School Win Big', company: 'EduMart Uganda', entries: 3204, verified: 3060, pending: 8, status: 'active', drawDate: '15 Jun 2025', fee: 'paid' },
  { id: 3, name: 'Family Pack Jackpot', company: 'CityLodge Hotels', entries: 411, verified: 390, pending: 3, status: 'active', drawDate: '31 Jul 2025', fee: 'paid' },
]

const SAMPLE_ENTRIES = [
  { id: 1, name: 'Amara Nakato', phone: '+256 701 234 567', promo: 'Summer Braai Bonanza', amount: 320000, ticket: 'RR-AB12CD34', status: 'approved', date: '20 May 2025' },
  { id: 2, name: 'Brian Ssekandi', phone: '+256 702 345 678', promo: 'Back-to-School Win Big', amount: 180000, ticket: 'RR-EF56GH78', status: 'pending', date: '21 May 2025' },
  { id: 3, name: 'Christine Auma', phone: '+256 703 456 789', promo: 'Family Pack Jackpot', amount: 520000, ticket: 'RR-IJ90KL12', status: 'approved', date: '21 May 2025' },
  { id: 4, name: 'David Otieno', phone: '+256 704 567 890', promo: 'Summer Braai Bonanza', amount: 280000, ticket: 'RR-MN34OP56', status: 'pending', date: '22 May 2025' },
  { id: 5, name: 'Esther Namukasa', phone: '+256 705 678 901', promo: 'Back-to-School Win Big', amount: 160000, ticket: 'RR-QR78ST90', status: 'rejected', date: '22 May 2025' },
]

const SAMPLE_SUBMISSIONS = [
  { id: 1, company: 'Rolex Hub Kampala', contact: 'Moses Byamukama', email: 'moses@rolexhub.ug', phone: '+256 771 234 567', promo: 'Rolex Festival Win', minSpend: 50000, drawDate: '31 Jul 2025', prizes: ['UGX 2,000,000', 'Rolex meal × 10'], ref: 'RRP-XK29AB', date: '22 May 2025', status: 'pending' },
  { id: 2, company: 'SafariComm Uganda', contact: 'Grace Atim', email: 'grace@safaricomm.ug', phone: '+256 772 345 678', promo: 'Data Bundle Bonanza', minSpend: 100000, drawDate: '30 Jun 2025', prizes: ['UGX 5,000,000', 'Data bundles × 20'], ref: 'RRP-YL38CD', date: '21 May 2025', status: 'pending' },
]

export default function AdminPage() {
  const [tab, setTab] = useState('overview')
  const [pin, setPin] = useState('')
  const [authed, setAuthed] = useState(false)
  const [pinError, setPinError] = useState('')
  const [drawingId, setDrawingId] = useState<number | null>(null)
  const [winners, setWinners] = useState<Record<number, string[]>>({})
  const [entryFilter, setEntryFilter] = useState('all')
  const [search, setSearch] = useState('')

  const NAMES = ['Amara Nakato', 'Brian Ssekandi', 'Christine Auma', 'David Otieno', 'Esther Namukasa', 'Felix Okello', 'Grace Atim', 'Hassan Waiswa']

  function checkPin() {
    if (pin === '1234') {
      setAuthed(true)
    } else {
      setPinError('Incorrect PIN. Please try again.')
    }
  }

  async function runDraw(promoId: number) {
    setDrawingId(promoId)
    await new Promise(r => setTimeout(r, 2000))
    const winner = NAMES[Math.floor(Math.random() * NAMES.length)]
    setWinners(w => ({ ...w, [promoId]: [...(w[promoId] || []), winner] }))
    setDrawingId(null)
  }

  const filteredEntries = SAMPLE_ENTRIES.filter(e => {
    const matchFilter = entryFilter === 'all' || e.status === entryFilter
    const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.ticket.toLowerCase().includes(search.toLowerCase()) || e.phone.includes(search)
    return matchFilter && matchSearch
  })

  if (!authed) return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafaf9', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: 340, background: '#fff', border: '1px solid #e5e5e0', borderRadius: 16, padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🔐</div>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Admin access</h1>
        <p style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>Enter your admin PIN to continue</p>
        {pinError && <div style={{ background: '#FCEBEB', color: '#791F1F', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{pinError}</div>}
        <input type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="••••" maxLength={6}
          onKeyDown={e => e.key === 'Enter' && checkPin()}
          style={{ width: '100%', padding: '12px', border: '1px solid #d0d0c8', borderRadius: 10, fontSize: 22, textAlign: 'center', letterSpacing: 8, marginBottom: 12, background: '#f5f5f0' }} />
        <button onClick={checkPin} style={{ width: '100%', padding: '12px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
          Enter
        </button>
        <p style={{ fontSize: 11, color: '#bbb', marginTop: 16 }}>Demo PIN: 1234</p>
      </div>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: '#fafaf9' }}>
      {/* Header */}
      <div style={{ background: '#1a1a2e', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 22 }}>🧾</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>ReceiptRaffle</div>
            <div style={{ fontSize: 11, color: '#9BA4B5' }}>Admin panel</div>
          </div>
        </div>
        <button onClick={() => setAuthed(false)} style={{ background: 'none', border: '1px solid #444', borderRadius: 8, padding: '5px 12px', color: '#9BA4B5', fontSize: 12, cursor: 'pointer' }}>
          Sign out
        </button>
      </div>

      {/* Nav */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e5e0', padding: '0 1rem', display: 'flex', gap: 0, overflowX: 'auto' }}>
        {[
          { id: 'overview', label: '📊 Overview' },
          { id: 'promotions', label: '🎁 Promotions' },
          { id: 'entries', label: '🎟 Entries' },
          { id: 'review', label: '⏳ Review' },
          { id: 'draws', label: '🎰 Draws' },
          { id: 'submissions', label: '📋 New promos' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: '12px 14px', background: 'none', border: 'none', borderBottom: tab === t.id ? '2px solid #1D9E75' : '2px solid transparent', cursor: 'pointer', fontSize: 12, fontWeight: tab === t.id ? 700 : 400, color: tab === t.id ? '#1D9E75' : '#666', whiteSpace: 'nowrap' }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '1.25rem 1rem', maxWidth: 600, margin: '0 auto' }}>

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Active promotions', value: '3', color: '#1D9E75' },
                { label: 'Total entries', value: '5,457', color: '#534AB7' },
                { label: 'Pending review', value: '23', color: '#854F0B' },
                { label: 'Revenue (MTD)', value: 'UGX 750K', color: '#1D9E75' },
              ].map((m, i) => (
                <div key={i} style={{ background: '#fff', border: '1px solid #e5e5e0', borderRadius: 12, padding: '1rem' }}>
                  <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: m.color }}>{m.value}</div>
                </div>
              ))}
            </div>
            <div style={{ background: '#FFF8E6', border: '1px solid #FAC775', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#633806', marginBottom: 16 }}>
              ⚠️ <strong>23 entries</strong> are pending manual review. <button onClick={() => setTab('review')} style={{ background: 'none', border: 'none', color: '#854F0B', textDecoration: 'underline', cursor: 'pointer', fontSize: 13 }}>Review now →</button>
            </div>
            <div style={{ background: '#E6F1FB', border: '1px solid #93C5FD', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#0C447C' }}>
              📋 <strong>2 new promotion submissions</strong> awaiting your approval. <button onClick={() => setTab('submissions')} style={{ background: 'none', border: 'none', color: '#0C447C', textDecoration: 'underline', cursor: 'pointer', fontSize: 13 }}>View →</button>
            </div>
          </div>
        )}

        {/* PROMOTIONS */}
        {tab === 'promotions' && (
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>All promotions</p>
            {SAMPLE_PROMOTIONS.map(p => (
              <div key={p.id} style={{ background: '#fff', border: '1px solid #e5e5e0', borderRadius: 14, padding: '1.25rem', marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{p.company}</div>
                  </div>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#E1F5EE', color: '#085041', fontWeight: 600 }}>Active</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 10 }}>
                  <div style={{ background: '#f5f5f0', borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ fontSize: 10, color: '#999' }}>Entries</div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{p.entries.toLocaleString()}</div>
                  </div>
                  <div style={{ background: '#f5f5f0', borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ fontSize: 10, color: '#999' }}>Verified</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#1D9E75' }}>{p.verified.toLocaleString()}</div>
                  </div>
                  <div style={{ background: '#FFF8E6', borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ fontSize: 10, color: '#999' }}>Pending</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#854F0B' }}>{p.pending}</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#888' }}>Draw date: <strong style={{ color: '#1a1a18' }}>{p.drawDate}</strong> &nbsp;·&nbsp; Fee: <strong style={{ color: '#1D9E75' }}>{p.fee}</strong></div>
              </div>
            ))}
          </div>
        )}

        {/* ENTRIES */}
        {tab === 'entries' && (
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>All entries</p>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone or ticket..."
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #d0d0c8', borderRadius: 10, fontSize: 14, marginBottom: 10, background: '#fff' }} />
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              {['all', 'approved', 'pending', 'rejected'].map(f => (
                <button key={f} onClick={() => setEntryFilter(f)}
                  style={{ padding: '5px 14px', borderRadius: 20, border: '1px solid #d0d0c8', background: entryFilter === f ? '#1D9E75' : '#fff', color: entryFilter === f ? '#fff' : '#666', fontSize: 12, cursor: 'pointer', fontWeight: entryFilter === f ? 700 : 400 }}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            {filteredEntries.map(e => (
              <div key={e.id} style={{ background: '#fff', border: '1px solid #e5e5e0', borderRadius: 12, padding: '1rem', marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{e.name}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{e.phone} · {e.date}</div>
                    <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{e.promo}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>Amount: <strong>UGX {e.amount.toLocaleString()}</strong> · Ticket: <strong>{e.ticket}</strong></div>
                  </div>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600, background: e.status === 'approved' ? '#E1F5EE' : e.status === 'pending' ? '#FFF8E6' : '#FCEBEB', color: e.status === 'approved' ? '#085041' : e.status === 'pending' ? '#633806' : '#791F1F' }}>
                    {e.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* REVIEW QUEUE */}
        {tab === 'review' && (
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Manual review queue</p>
            {[
              { name: 'David Otieno', phone: '+256 704 567 890', promo: 'Summer Braai Bonanza', amount: 280000, minSpend: 300000, reason: 'Amount below minimum', ticket: 'RR-MN34OP56' },
              { name: 'Brian Ssekandi', phone: '+256 702 345 678', promo: 'Back-to-School Win Big', amount: 160000, minSpend: 150000, reason: 'Blurry image', ticket: 'RR-EF56GH78' },
              { name: 'Fatuma Nakayima', phone: '+256 706 789 012', promo: 'Family Pack Jackpot', amount: 510000, minSpend: 500000, reason: 'Date unclear', ticket: 'RR-UV12WX34' },
            ].map((item, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid #FAC775', borderRadius: 14, padding: '1.25rem', marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{item.phone}</div>
                  </div>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#FFF8E6', color: '#633806', fontWeight: 600 }}>{item.reason}</span>
                </div>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 10 }}>
                  {item.promo} · Amount: UGX {item.amount.toLocaleString()} · Min: UGX {item.minSpend.toLocaleString()} · {item.ticket}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={{ flex: 1, padding: '8px', background: '#E1F5EE', color: '#085041', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>✓ Approve</button>
                  <button style={{ flex: 1, padding: '8px', background: '#FCEBEB', color: '#791F1F', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>✗ Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* DRAWS */}
        {tab === 'draws' && (
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Prize draws</p>
            {SAMPLE_PROMOTIONS.map(p => (
              <div key={p.id} style={{ background: '#fff', border: '1px solid #e5e5e0', borderRadius: 14, padding: '1.25rem', marginBottom: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>{p.verified.toLocaleString()} eligible entries · Draw: {p.drawDate}</div>
                {winners[p.id]?.map((w, i) => (
                  <div key={i} style={{ background: '#E1F5EE', borderRadius: 10, padding: '10px 14px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#085041' }}>🏆 {w}</div>
                      <div style={{ fontSize: 11, color: '#0F6E56' }}>Draw #{i + 1} · {new Date().toLocaleString('en-GB')}</div>
                    </div>
                    <span style={{ fontSize: 11, background: '#1D9E75', color: '#fff', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>Winner</span>
                  </div>
                ))}
                <button onClick={() => runDraw(p.id)} disabled={drawingId === p.id}
                  style={{ width: '100%', padding: '10px', background: drawingId === p.id ? '#9BA4B5' : '#534AB7', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  {drawingId === p.id ? '🎰 Drawing...' : '🎰 Run draw'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* NEW PROMOTION SUBMISSIONS */}
        {tab === 'submissions' && (
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>New promotion submissions</p>
            {SAMPLE_SUBMISSIONS.map(s => (
              <div key={s.id} style={{ background: '#fff', border: '1px solid #e5e5e0', borderRadius: 14, padding: '1.25rem', marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{s.promo}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{s.company} · Ref: {s.ref}</div>
                  </div>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#FFF8E6', color: '#633806', fontWeight: 600 }}>Pending</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                  <div style={{ fontSize: 12, color: '#666' }}>Contact: <strong>{s.contact}</strong></div>
                  <div style={{ fontSize: 12, color: '#666' }}>Phone: <strong>{s.phone}</strong></div>
                  <div style={{ fontSize: 12, color: '#666' }}>Email: <strong>{s.email}</strong></div>
                  <div style={{ fontSize: 12, color: '#666' }}>Min spend: <strong>UGX {s.minSpend.toLocaleString()}</strong></div>
                  <div style={{ fontSize: 12, color: '#666' }}>Draw: <strong>{s.drawDate}</strong></div>
                  <div style={{ fontSize: 12, color: '#666' }}>Submitted: <strong>{s.date}</strong></div>
                </div>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>
                  Prizes: {s.prizes.join(' · ')}
                </div>
                <div style={{ background: '#FFF8E6', border: '1px solid #FAC775', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#633806', marginBottom: 10 }}>
                  💳 Collect UGX 250,000 fee before activating
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={{ flex: 1, padding: '10px', background: '#E1F5EE', color: '#085041', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>✓ Activate</button>
                  <button style={{ flex: 1, padding: '10px', background: '#FCEBEB', color: '#791F1F', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>✗ Decline</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
