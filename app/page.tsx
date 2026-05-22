import Link from 'next/link'

const PROMOTIONS = [
  {
    id: 1,
    title: "Summer Braai Bonanza",
    brand: "FreshMart Supermarkets",
    prize: "UGX 5,000,000 cash",
    minSpend: "UGX 300,000",
    draws: "30 Jun 2025",
    entries: "1,842",
    color: "#1D9E75",
    emoji: "🛒"
  },
  {
    id: 2,
    title: "Back-to-School Win Big",
    brand: "EduMart Uganda",
    prize: "Laptop × 2",
    minSpend: "UGX 150,000",
    draws: "15 Jun 2025",
    entries: "3,204",
    color: "#534AB7",
    emoji: "🎒"
  },
  {
    id: 3,
    title: "Family Pack Jackpot",
    brand: "CityLodge Hotels",
    prize: "Weekend stay for 4",
    minSpend: "UGX 500,000",
    draws: "31 Jul 2025",
    entries: "411",
    color: "#854F0B",
    emoji: "🏨"
  },
]

export default function Home() {
  return (
    <main style={{ minHeight: '100vh', background: '#fafaf9' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e5e0', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, background: '#1D9E75', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🧾</div>
          <span style={{ fontSize: 18, fontWeight: 700 }}>Receipt<span style={{ color: '#1D9E75' }}>Raffle</span></span>
        </div>
        <Link href="/auth/login" style={{ fontSize: 13, color: '#534AB7', fontWeight: 600, textDecoration: 'none' }}>
          Business login →
        </Link>
      </div>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '2.5rem 1.5rem 1.5rem' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, letterSpacing: -0.5 }}>
          Shop. Upload. <span style={{ color: '#1D9E75' }}>Win.</span>
        </h1>
        <p style={{ fontSize: 15, color: '#666', maxWidth: 340, margin: '0 auto' }}>
          Upload your receipt from any active promotion below and enter to win amazing prizes.
        </p>
      </div>

      {/* Promotions */}
      <div style={{ padding: '0 1rem 2rem', maxWidth: 500, margin: '0 auto' }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
          Active promotions
        </p>
        {PROMOTIONS.map(p => (
          <Link key={p.id} href={`/enter/${p.id}`} style={{ textDecoration: 'none' }}>
            <div style={{ background: '#fff', border: '1px solid #e5e5e0', borderRadius: 14, padding: '1.25rem', marginBottom: 12, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 48, height: 48, background: p.color + '20', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                {p.emoji}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2, color: '#1a1a18' }}>{p.title}</div>
                <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{p.brand}</div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 12, color: '#666' }}>🏆 <strong style={{ color: '#1a1a18' }}>{p.prize}</strong></div>
                  <div style={{ fontSize: 12, color: '#666' }}>Min: <strong style={{ color: '#1a1a18' }}>{p.minSpend}</strong></div>
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
                  <div style={{ fontSize: 11, color: '#999' }}>📅 Draw: {p.draws}</div>
                  <div style={{ fontSize: 11, color: '#999' }}>🎟 {p.entries} entries</div>
                </div>
              </div>
              <div style={{ color: p.color, fontSize: 20, flexShrink: 0 }}>›</div>
            </div>
          </Link>
        ))}

        {/* For businesses */}
        <div style={{ background: '#EEEDFE', borderRadius: 14, padding: '1.25rem', marginTop: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#3C3489', marginBottom: 4 }}>Are you a business?</div>
          <div style={{ fontSize: 13, color: '#534AB7', marginBottom: 12 }}>Launch your own prize promotion in minutes</div>
          <Link href="/auth/signup?role=promoter" style={{ display: 'inline-block', padding: '9px 24px', background: '#534AB7', color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            Launch a promotion →
          </Link>
        </div>
      </div>
    </main>
  )
}
