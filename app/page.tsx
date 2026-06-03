'use client'
import { useState, useEffect } from 'react'

interface Promotion {
  id: string
  promo_name: string
  company_name: string
  emoji: string
  color: string
  draw_date: string
  prizes: string
  min_spend: number
  currency: string
  entries_count: number
  logo_url?: string
}

export default function HomePage() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/promotions')
      .then(r => r.json())
      .then(d => { setPromotions(d.promotions || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'system-ui, sans-serif' }}>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #1D9E75 0%, #157a5a 100%)', color: 'white', padding: '48px 24px 40px', textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '8px' }}>🧾</div>
        <div style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '2px', opacity: 0.8, marginBottom: '8px' }}>ReceiptRaffle</div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 10px', lineHeight: 1.2 }}>Upload your receipt.<br />Enter to win big.</h1>
        <p style={{ opacity: 0.85, fontSize: '15px', margin: '0 0 24px' }}>Pick a promotion below, upload your receipt and you could win amazing prizes!</p>

        {/* Steps */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '28px' }}>
          {[['🛍', 'Shop'], ['📸', 'Upload'], ['🤖', 'AI checks'], ['🎟', "You're in!"]].map(([icon, label], i, arr) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '20px', padding: '6px 14px', fontSize: '14px', fontWeight: 600 }}>{icon} {label}</div>
              {i < arr.length - 1 && <span style={{ opacity: 0.6 }}>→</span>}
            </div>
          ))}
        </div>

        {/* AI badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.15)', borderRadius: '20px', padding: '8px 16px', fontSize: '13px' }}>
          <span>⚡</span>
          <span><strong>Instant AI receipt scanning</strong> — verified in seconds by Claude AI</span>
        </div>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 16px' }}>

        {/* Active promotions */}
        <div style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span style={{ background: '#dcfce7', color: '#16a34a', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px', letterSpacing: '1px' }}>LIVE</span>
            <span style={{ fontWeight: 700, fontSize: '16px', color: '#111' }}>Active promotions</span>
          </div>

          {loading && (
            <div style={{ background: 'white', borderRadius: '12px', padding: '32px', textAlign: 'center', color: '#888', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              🎫 Loading promotions...
            </div>
          )}

          {!loading && promotions.length === 0 && (
            <div style={{ background: 'white', borderRadius: '12px', padding: '32px', textAlign: 'center', color: '#888', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              No active promotions right now. Check back soon!
            </div>
          )}

          {promotions.map(p => (
            <a key={p.id} href={`/enter/${p.id}`} style={{ textDecoration: 'none', display: 'block', marginBottom: '12px' }}>
              <div style={{ background: 'white', borderRadius: '12px', padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: `4px solid ${p.color || '#1D9E75'}`, display: 'flex', gap: '14px', alignItems: 'center' }}>
                {p.logo_url ? (
                  <img src={p.logo_url} alt={p.company_name} style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: p.color || '#1D9E75', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>{p.emoji || '🛍'}</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '16px', color: '#111', marginBottom: '2px' }}>{p.promo_name}</div>
                  <div style={{ color: '#666', fontSize: '13px', marginBottom: '6px' }}>{p.company_name}</div>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', color: '#888' }}>🗓 Draw: {p.draw_date ? new Date(p.draw_date).toLocaleDateString() : 'TBC'}</span>
                    <span style={{ fontSize: '12px', color: '#888' }}>💰 Min: {p.currency} {p.min_spend?.toLocaleString()}</span>
                    <span style={{ fontSize: '12px', color: '#1D9E75', fontWeight: 600 }}>🎫 {p.entries_count || 0} {p.entries_count === 1 ? 'entry' : 'entries'}</span>
                  </div>
                </div>
                <div style={{ color: p.color || '#1D9E75', fontWeight: 700, fontSize: '20px', flexShrink: 0 }}>→</div>
              </div>
            </a>
          ))}
        </div>

        <div style={{ textAlign: 'center', paddingBottom: '100px' }}>
          <a href="/admin" style={{ color: '#ccc', fontSize: '12px', textDecoration: 'none' }}>Admin</a>
        </div>
      </div>

      {/* Sticky business bar — always visible at bottom */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '1px solid #e5e7eb', padding: '12px 16px', boxShadow: '0 -4px 16px rgba(0,0,0,0.08)', zIndex: 100 }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#111' }}>Are you a business?</div>
            <div style={{ fontSize: '12px', color: '#888' }}>Launch or manage your promotion</div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <a href="/promoter" style={{ background: '#f3f4f6', color: '#333', padding: '9px 14px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '13px', whiteSpace: 'nowrap' }}>Manage →</a>
            <a href="/launch" style={{ background: '#1D9E75', color: 'white', padding: '9px 14px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '13px', whiteSpace: 'nowrap' }}>Launch →</a>
          </div>
        </div>
      </div>
    </div>
  )
}
