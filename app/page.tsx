'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const FALLBACK_PROMOTIONS = [
  { id: '1', promo_name: "Summer Braai Bonanza", company_name: "FreshMart Supermarkets", prizes: ["UGX 5,000,000 cash"], min_spend: 300000, currency: "UGX", draw_date: "30 Jun 2025", entries_count: 1842, emoji: "🛒", color: "#1D9E75" },
  { id: '2', promo_name: "Back-to-School Win Big", company_name: "EduMart Uganda", prizes: ["Laptop x 2"], min_spend: 150000, currency: "UGX", draw_date: "15 Jun 2025", entries_count: 3204, emoji: "🎒", color: "#534AB7" },
  { id: '3', promo_name: "Family Pack Jackpot", company_name: "CityLodge Hotels", prizes: ["Weekend stay for 4"], min_spend: 500000, currency: "UGX", draw_date: "31 Jul 2025", entries_count: 411, emoji: "🏨", color: "#854F0B" },
]

export default function Home() {
  const [promotions, setPromotions] = useState(FALLBACK_PROMOTIONS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/promotions')
      .then(r => r.json())
      .then(data => {
        if (data.promotions && data.promotions.length > 0) {
          setPromotions(data.promotions)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <main style={{ minHeight: '100vh', background: '#fafaf9' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e5e0', padding: '1.25rem 1.5rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 6 }}>
          <div style={{ width: 58, height: 58, background: '#1D9E75', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>&#x1F9FE;</div>
          <span style={{ fontSize: 42, fontWeight: 900, letterSpacing: -2, lineHeight: 1 }}>Receipt<span style={{ color: '#1D9E75' }}>Raffle</span></span>
        </div>
        <p style={{ fontSize: 14, color: '#999', margin: 0, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 500 }}>Shop &middot; Upload &middot; Win</p>
      </div>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '2rem 1.5rem 1.5rem' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, letterSpacing: -0.5 }}>
          Upload your receipt.<br /><span style={{ color: '#1D9E75' }}>Enter to win big.</span>
        </h1>
        <p style={{ fontSize: 14, color: '#666', maxWidth: 320, margin: '0 auto 1.5rem' }}>
          Pick a promotion below, upload your receipt and you could win amazing prizes!
        </p>

        {/* How it works */}
        <div style={{ display: 'flex', justifyContent: 'center', maxWidth: 360, margin: '0 auto 1.5rem' }}>
          {[
            { label: 'Shop', icon: '&#x1F6CD;' }, { arrow: true },
            { label: 'Upload', icon: '&#x1F4F8;' }, { arrow: true },
            { label: 'AI checks', icon: '&#x1F916;' }, { arrow: true },
            { label: "You're in!", icon: '&#x1F39F;' },
          ].map((s: any, i) => (
            s.arrow
              ? <div key={i} style={{ color: '#ccc', fontSize: 14, display: 'flex', alignItems: 'center', padding: '0 2px', marginBottom: 16 }}>&rarr;</div>
              : <div key={i} style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }} dangerouslySetInnerHTML={{ __html: s.icon }} />
                  <div style={{ fontSize: 10, color: '#888', fontWeight: 600 }}>{s.label}</div>
                </div>
          ))}
        </div>

        {/* AI badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#E8F8F2', border: '1.5px solid #9FE1CB', borderRadius: 14, padding: '14px 20px', maxWidth: 360, width: '100%' }}>
          <span style={{ fontSize: 28, flexShrink: 0 }}>&#x26A1;</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#085041', marginBottom: 2 }}>Instant AI receipt scanning</div>
            <div style={{ fontSize: 12, color: '#0F6E56', lineHeight: 1.4 }}>Read and verified in seconds by Claude AI &mdash; no waiting, no manual checks.</div>
          </div>
          <div style={{ background: '#1D9E75', borderRadius: 20, padding: '3px 10px', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>LIVE</div>
        </div>
      </div>

      {/* Promotions */}
      <div style={{ padding: '0 1rem 2rem', maxWidth: 500, margin: '0 auto' }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
          Active promotions {!loading && `(${promotions.length})`}
        </p>

        {loading && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#999', fontSize: 14 }}>
            Loading promotions...
          </div>
        )}

        {promotions.map((p: any) => (
          <Link key={p.id} href={`/enter/${p.id}`} style={{ textDecoration: 'none' }}>
            <div style={{ background: '#fff', border: '1px solid #e5e5e0', borderRadius: 14, padding: '1.25rem', marginBottom: 12, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 50, height: 50, background: (p.color || '#1D9E75') + '18', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
                {p.emoji || '&#x1F381;'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2, color: '#1a1a18' }}>{p.promo_name}</div>
                <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>{p.company_name}</div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    &#x1F3C6; <strong style={{ color: '#1a1a18' }}>{Array.isArray(p.prizes) ? p.prizes[0] : p.prizes}</strong>
                  </div>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    Min: <strong style={{ color: '#1a1a18' }}>{p.currency} {parseInt(p.min_spend).toLocaleString()}</strong>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ fontSize: 11, color: '#aaa' }}>Draw: {p.draw_date}</div>
                  <div style={{ fontSize: 11, color: '#aaa' }}>{(p.entries_count || 0).toLocaleString()} entries</div>
                </div>
              </div>
              <div style={{ color: p.color || '#1D9E75', fontSize: 22, flexShrink: 0, marginTop: 4 }}>&rsaquo;</div>
            </div>
          </Link>
        ))}

        {/* For businesses */}
        <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)', borderRadius: 14, padding: '1.5rem', marginTop: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Are you a business?</div>
          <div style={{ fontSize: 13, color: '#9BA4B5', marginBottom: 4 }}>Launch your own AI-powered prize promotion</div>
          <Link href="/for-business" style={{ fontSize: 12, color: '#1D9E75', textDecoration: 'none', display: 'block', marginBottom: 16 }}>Learn more &rarr;</Link>
          <Link href="/launch" style={{ display: 'inline-block', padding: '11px 28px', background: '#1D9E75', color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
            Launch a promotion &rarr;
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #e5e5e0', padding: '1.25rem', textAlign: 'center' }}>
        <Link href="/admin" style={{ fontSize: 11, color: '#ddd', textDecoration: 'none' }}>Admin</Link>
      </div>
    </main>
  )
}
