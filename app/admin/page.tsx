'use client'
import { useState } from 'react'

const PROMOTIONS = [
  { id: 1, name: 'Summer Braai Bonanza', company: 'FreshMart', entries: 1842, verified: 1761, pending: 12, status: 'active', drawDate: '30 Jun 2025', fee: 'paid' },
  { id: 2, name: 'Back-to-School Win Big', company: 'EduMart Uganda', entries: 3204, verified: 3060, pending: 8, status: 'active', drawDate: '15 Jun 2025', fee: 'paid' },
  { id: 3, name: 'Family Pack Jackpot', company: 'CityLodge Hotels', entries: 411, verified: 390, pending: 3, status: 'active', drawDate: '31 Jul 2025', fee: 'paid' },
]

const ALL_ENTRIES = [
  { id: 1, name: 'Amara Nakato', phone: '+256 701 234 567', email: 'amara@gmail.com', promo: 'Summer Braai Bonanza', promoId: 1, amount: 320000, ticket: 'RR-AB12CD34', status: 'approved', date: '20 May 2025', retailer: 'FreshMart Ntinda', aiConfidence: 94 },
  { id: 2, name: 'Brian Ssekandi', phone: '+256 702 345 678', email: '', promo: 'Back-to-School Win Big', promoId: 2, amount: 180000, ticket: 'RR-EF56GH78', status: 'pending', date: '21 May 2025', retailer: 'EduMart Kampala', aiConfidence: 61 },
  { id: 3, name: 'Christine Auma', phone: '+256 703 456 789', email: 'christine@yahoo.com', promo: 'Family Pack Jackpot', promoId: 3, amount: 520000, ticket: 'RR-IJ90KL12', status: 'approved', date: '21 May 2025', retailer: 'CityLodge', aiConfidence: 88 },
  { id: 4, name: 'David Otieno', phone: '+256 704 567 890', email: '', promo: 'Summer Braai Bonanza', promoId: 1, amount: 280000, ticket: 'RR-MN34OP56', status: 'pending', date: '22 May 2025', retailer: 'FreshMart Lugogo', aiConfidence: 45 },
  { id: 5, name: 'Esther Namukasa', phone: '+256 705 678 901', email: 'esther@gmail.com', promo: 'Back-to-School Win Big', promoId: 2, amount: 160000, ticket: 'RR-QR78ST90', status: 'rejected', date: '22 May 2025', retailer: 'Unknown', aiConfidence: 22 },
  { id: 6, name: 'Felix Okello', phone: '+256 706 789 012', email: '', promo: 'Summer Braai Bonanza', promoId: 1, amount: 450000, ticket: 'RR-UV12WX34', status: 'approved', date: '22 May 2025', retailer: 'FreshMart Entebbe Rd', aiConfidence: 97 },
]

const SUBMISSIONS = [
  { id: 1, company: 'Rolex Hub Kampala', contact: 'Moses Byamukama', email: 'moses@rolexhub.ug', phone: '+256 771 234 567', promo: 'Rolex Festival Win', minSpend: 50000, drawDate: '31 Jul 2025', prizes: ['UGX 2,000,000', 'Rolex meal x 10'], ref: 'RRP-XK29AB', date: '22 May 2025' },
  { id: 2, company: 'SafariComm Uganda', contact: 'Grace Atim', email: 'grace@safaricomm.ug', phone: '+256 772 345 678', promo: 'Data Bundle Bonanza', minSpend: 100000, drawDate: '30 Jun 2025', prizes: ['UGX 5,000,000', 'Data bundles x 20'], ref: 'RRP-YL38CD', date: '21 May 2025' },
  { id: 3, company: 'Freshlands Hotel', contact: 'John Ejalu', email: 'john@stalwartug.com', phone: '+256 775 123 456', promo: 'Win a weekend break', minSpend: 200000, drawDate: '31 Aug 2025', prizes: ['Weekend stay x 2', 'Dinner for 2 x 5'], ref: 'RRP-ZM47EF', date: '22 May 2025' },
]

const NAMES = ['Amara Nakato','Brian Ssekandi','Christine Auma','David Otieno','Esther Namukasa','Felix Okello','Grace Atim','Hassan Waiswa']

export default function AdminPage() {
  const [tab, setTab] = useState('overview')
  const [pin, setPin] = useState('')
  const [authed, setAuthed] = useState(false)
  const [pinError, setPinError] = useState('')
  const [drawingId, setDrawingId] = useState<number | null>(null)
  const [winners, setWinners] = useState<Record<number, {name:string,time:string}[]>>({})
  const [entryFilter, setEntryFilter] = useState('all')
  const [promoFilter, setPromoFilter] = useState('all')
  const [search, setSearch] = useState('')

  function checkPin() {
    if (pin === '1234') { setAuthed(true) }
    else { setPinError('Incorrect PIN') }
  }

  async function runDraw(promoId: number) {
    setDrawingId(promoId)
    await new Promise(r => setTimeout(r, 2200))
    const winner = NAMES[Math.floor(Math.random() * NAMES.length)]
    const time = new Date().toLocaleString('en-GB')
    setWinners(w => ({ ...w, [promoId]: [...(w[promoId] || []), { name: winner, time }] }))
    setDrawingId(null)
  }

  function exportCSV(promoId: number | 'all') {
    const entries = promoId === 'all' ? ALL_ENTRIES : ALL_ENTRIES.filter(e => e.promoId === promoId)
    const promoName = promoId === 'all' ? 'all' : PROMOTIONS.find(p => p.id === promoId)?.name.replace(/\s+/g, '-') || 'promo'
    const header = 'Ticket,Name,Phone,Email,Promotion,Amount (UGX),Retailer,Date,Status,AI Confidence'
    const rows = entries.map(e => `${e.ticket},"${e.name}",${e.phone},${e.email || '-'},"${e.promo}",${e.amount},"${e.retailer}",${e.date},${e.status},${e.aiConfidence}%`)
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `receiptraffle-entries-${promoName}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function printEntries(promoId: number) {
    const promo = PROMOTIONS.find(p => p.id === promoId)!
    const entries = ALL_ENTRIES.filter(e => e.promoId === promoId)
    const printContent = `
      <html><head><title>${promo.name} - Entries</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; font-size: 13px; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        .meta { color: #666; margin-bottom: 20px; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #1D9E75; color: white; padding: 8px; text-align: left; font-size: 12px; }
        td { padding: 7px 8px; border-bottom: 1px solid #eee; font-size: 12px; }
        tr:nth-child(even) { background: #f9f9f9; }
        .approved { color: #085041; font-weight: bold; }
        .pending { color: #633806; }
        .rejected { color: #791F1F; }
        @media print { .no-print { display: none; } }
      </style></head><body>
      <h1>ReceiptRaffle - ${promo.name}</h1>
      <div class="meta">${promo.company} | Draw: ${promo.drawDate} | Printed: ${new Date().toLocaleString('en-GB')} | Total: ${entries.length} entries</div>
      <button class="no-print" onclick="window.print()" style="margin-bottom:16px;padding:8px 16px;background:#1D9E75;color:white;border:none;border-radius:6px;cursor:pointer;font-size:13px">Print this list</button>
      <table>
        <tr><th>#</th><th>Ticket</th><th>Name</th><th>Phone</th><th>Email</th><th>Amount</th><th>Retailer</th><th>Date</th><th>Status</th><th>AI%</th></tr>
        ${entries.map((e, i) => `
          <tr>
            <td>${i+1}</td><td>${e.ticket}</td><td><strong>${e.name}</strong></td>
            <td>${e.phone}</td><td>${e.email || '-'}</td>
            <td>UGX ${e.amount.toLocaleString()}</td><td>${e.retailer}</td>
            <td>${e.date}</td><td class="${e.status}">${e.status}</td><td>${e.aiConfidence}%</td>
          </tr>`).join('')}
      </table></body></html>`

    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    document.body.appendChild(iframe)
    iframe.contentWindow!.document.open()
    iframe.contentWindow!.document.write(printContent)
    iframe.contentWindow!.document.close()
    setTimeout(() => {
      iframe.contentWindow!.print()
      document.body.removeChild(iframe)
    }, 500)
  }

  const filteredEntries = ALL_ENTRIES.filter(e => {
    const matchFilter = entryFilter === 'all' || e.status === entryFilter
    const matchPromo = promoFilter === 'all' || e.promoId === parseInt(promoFilter)
    const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.ticket.toLowerCase().includes(search.toLowerCase()) || e.phone.includes(search)
    return matchFilter && matchPromo && matchSearch
  })

  if (!authed) return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafaf9', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: 340, background: '#fff', border: '1px solid #e5e5e0', borderRadius: 16, padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>&#x1F510;</div>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Admin access</h1>
        <p style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>Enter your admin PIN</p>
        {pinError && <div style={{ background: '#FCEBEB', color: '#791F1F', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{pinError}</div>}
        <input type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="••••" maxLength={6}
          onKeyDown={e => e.key === 'Enter' && checkPin()}
          style={{ width: '100%', padding: '12px', border: '1px solid #d0d0c8', borderRadius: 10, fontSize: 22, textAlign: 'center', letterSpacing: 8, marginBottom: 12, background: '#f5f5f0' }} />
        <button onClick={checkPin} style={{ width: '100%', padding: '12px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Enter</button>
        <p style={{ fontSize: 11, color: '#bbb', marginTop: 12 }}>Demo PIN: 1234</p>
      </div>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: '#fafaf9' }}>
      <div style={{ background: '#1a1a2e', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 22 }}>&#x1F9FE;</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>ReceiptRaffle</div>
            <div style={{ fontSize: 11, color: '#9BA4B5' }}>Admin panel</div>
          </div>
        </div>
        <button onClick={() => setAuthed(false)} style={{ background: 'none', border: '1px solid #444', borderRadius: 8, padding: '5px 12px', color: '#9BA4B5', fontSize: 12, cursor: 'pointer' }}>Sign out</button>
      </div>

      <div style={{ background: '#fff', borderBottom: '1px solid #e5e5e0', padding: '0 1rem', display: 'flex', gap: 0, overflowX: 'auto' }}>
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'promotions', label: 'Promotions' },
          { id: 'entries', label: 'Entries' },
          { id: 'review', label: 'Review' },
          { id: 'draws', label: 'Draws' },
          { id: 'submissions', label: 'New promos' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: '12px 14px', background: 'none', border: 'none', borderBottom: tab === t.id ? '2px solid #1D9E75' : '2px solid transparent', cursor: 'pointer', fontSize: 12, fontWeight: tab === t.id ? 700 : 400, color: tab === t.id ? '#1D9E75' : '#666', whiteSpace: 'nowrap' }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '1.25rem 1rem', maxWidth: 620, margin: '0 auto' }}>

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
            <div style={{ background: '#FFF8E6', border: '1px solid #FAC775', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#633806', marginBottom: 10 }}>
              &#x26A0; <strong>23 entries</strong> pending manual review.
              <button onClick={() => setTab('review')} style={{ background: 'none', border: 'none', color: '#854F0B', textDecoration: 'underline', cursor: 'pointer', fontSize: 13, marginLeft: 4 }}>Review now</button>
            </div>
            <div style={{ background: '#E6F1FB', border: '1px solid #93C5FD', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#0C447C' }}>
              &#x1F4CB; <strong>3 new promotion submissions</strong> awaiting approval.
              <button onClick={() => setTab('submissions')} style={{ background: 'none', border: 'none', color: '#0C447C', textDecoration: 'underline', cursor: 'pointer', fontSize: 13, marginLeft: 4 }}>View</button>
            </div>
          </div>
        )}

        {tab === 'promotions' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>All promotions</p>
              <button onClick={() => exportCSV('all')} style={{ padding: '6px 14px', background: '#534AB7', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                Export all CSV
              </button>
            </div>
            {PROMOTIONS.map(p => (
              <div key={p.id} style={{ background: '#fff', border: '1px solid #e5e5e0', borderRadius: 14, padding: '1.25rem', marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{p.company} · Draw: {p.drawDate}</div>
                  </div>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#E1F5EE', color: '#085041', fontWeight: 600 }}>Active</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
                  <div style={{ background: '#f5f5f0', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: '#999' }}>Total</div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{p.entries.toLocaleString()}</div>
                  </div>
                  <div style={{ background: '#E8F8F2', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: '#0F6E56' }}>Verified</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#1D9E75' }}>{p.verified.toLocaleString()}</div>
                  </div>
                  <div style={{ background: '#FFF8E6', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: '#854F0B' }}>Pending</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#854F0B' }}>{p.pending}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => exportCSV(p.id)} style={{ flex: 1, padding: '8px', background: '#EEEDFE', color: '#3C3489', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    CSV
                  </button>
                  <button onClick={() => printEntries(p.id)} style={{ flex: 1, padding: '8px', background: '#E6F1FB', color: '#0C447C', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    Print
                  </button>
                  <button onClick={() => { setPromoFilter(String(p.id)); setTab('entries') }} style={{ flex: 1, padding: '8px', background: '#f5f5f0', color: '#1a1a18', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    View entries
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'entries' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Entries ({filteredEntries.length})</p>
              <button onClick={() => exportCSV(promoFilter === 'all' ? 'all' : parseInt(promoFilter))} style={{ padding: '6px 14px', background: '#534AB7', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                Export CSV
              </button>
            </div>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone or ticket..."
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #d0d0c8', borderRadius: 10, fontSize: 14, marginBottom: 10, background: '#fff' }} />
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <select value={promoFilter} onChange={e => setPromoFilter(e.target.value)}
                style={{ padding: '6px 10px', border: '1px solid #d0d0c8', borderRadius: 8, fontSize: 12, background: '#fff' }}>
                <option value="all">All promotions</option>
                {PROMOTIONS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              {['all','approved','pending','rejected'].map(f => (
                <button key={f} onClick={() => setEntryFilter(f)}
                  style={{ padding: '5px 12px', borderRadius: 20, border: '1px solid #d0d0c8', background: entryFilter === f ? '#1D9E75' : '#fff', color: entryFilter === f ? '#fff' : '#666', fontSize: 12, cursor: 'pointer', fontWeight: entryFilter === f ? 700 : 400 }}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            {filteredEntries.map(e => (
              <div key={e.id} style={{ background: '#fff', border: '1px solid #e5e5e0', borderRadius: 12, padding: '1rem', marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{e.name}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{e.phone}{e.email ? ` · ${e.email}` : ''}</div>
                    <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{e.promo}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>UGX {e.amount.toLocaleString()} · {e.retailer} · {e.date}</div>
                    <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>Ticket: {e.ticket} · AI: {e.aiConfidence}%</div>
                  </div>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600, marginLeft: 8, flexShrink: 0,
                    background: e.status === 'approved' ? '#E1F5EE' : e.status === 'pending' ? '#FFF8E6' : '#FCEBEB',
                    color: e.status === 'approved' ? '#085041' : e.status === 'pending' ? '#633806' : '#791F1F' }}>
                    {e.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'review' && (
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Manual review queue</p>
            {ALL_ENTRIES.filter(e => e.status === 'pending').map((e, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid #FAC775', borderRadius: 14, padding: '1.25rem', marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{e.name}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{e.phone} · {e.date}</div>
                  </div>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#FFF8E6', color: '#633806', fontWeight: 600 }}>AI: {e.aiConfidence}%</span>
                </div>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 10 }}>
                  {e.promo} · UGX {e.amount.toLocaleString()} · {e.retailer} · {e.ticket}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={{ flex: 1, padding: '8px', background: '#E1F5EE', color: '#085041', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Approve</button>
                  <button style={{ flex: 1, padding: '8px', background: '#FCEBEB', color: '#791F1F', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'draws' && (
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Prize draws</p>
            {PROMOTIONS.map(p => (
              <div key={p.id} style={{ background: '#fff', border: '1px solid #e5e5e0', borderRadius: 14, padding: '1.25rem', marginBottom: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>{p.verified.toLocaleString()} eligible entries · Draw: {p.drawDate}</div>
                {(winners[p.id] || []).map((w, i) => (
                  <div key={i} style={{ background: '#E1F5EE', borderRadius: 10, padding: '10px 14px', marginBottom: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#085041' }}>Winner #{i+1}: {w.name}</div>
                    <div style={{ fontSize: 11, color: '#0F6E56' }}>{w.time}</div>
                  </div>
                ))}
                <button onClick={() => runDraw(p.id)} disabled={drawingId === p.id}
                  style={{ width: '100%', padding: '10px', background: drawingId === p.id ? '#9BA4B5' : '#534AB7', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: drawingId === p.id ? 'not-allowed' : 'pointer' }}>
                  {drawingId === p.id ? 'Drawing...' : 'Run draw'}
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === 'submissions' && (
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>New promotion submissions</p>
            {SUBMISSIONS.map(s => (
              <div key={s.id} style={{ background: '#fff', border: '1px solid #e5e5e0', borderRadius: 14, padding: '1.25rem', marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{s.promo}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{s.company} · Ref: {s.ref} · {s.date}</div>
                  </div>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#FFF8E6', color: '#633806', fontWeight: 600 }}>Pending</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 12, color: '#666', marginBottom: 10 }}>
                  <div>Contact: <strong>{s.contact}</strong></div>
                  <div>Phone: <strong>{s.phone}</strong></div>
                  <div>Email: <strong>{s.email}</strong></div>
                  <div>Min spend: <strong>UGX {s.minSpend.toLocaleString()}</strong></div>
                  <div style={{ gridColumn: '1/-1' }}>Draw: <strong>{s.drawDate}</strong> · Prizes: {s.prizes.join(' · ')}</div>
                </div>
                <div style={{ background: '#FFF8E6', border: '1px solid #FAC775', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#633806', marginBottom: 10 }}>
                  Collect UGX 250,000 fee before activating
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={{ flex: 1, padding: '10px', background: '#E1F5EE', color: '#085041', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Activate</button>
                  <button style={{ flex: 1, padding: '10px', background: '#FCEBEB', color: '#791F1F', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Decline</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
