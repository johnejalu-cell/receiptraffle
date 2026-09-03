'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

interface Promotion {
  id: string
  promo_name: string
  company_name: string
  emoji: string
  color: string
  draw_date: string
  start_date: string
  end_date: string
  min_spend: number
  currency: string
  prizes: string
  product_keywords: string[]
  logo_url?: string
  terms_conditions?: string
  entries_count?: number
  grand_draw_id?: string
  grand_draw_name?: string
}

export default function PromotionMicrosite() {
  const params = useParams()
  const slug = params?.slug as string
  const [promotion, setPromotion] = useState<Promotion | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return
    fetch(`/api/promotions/slug?slug=${slug}`)
      .then(r => r.json())
      .then(d => {
        if (d.promotion) setPromotion(d.promotion)
        else setNotFound(true)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center', color: '#888' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>⏳</div>
        <div>Loading promotion...</div>
      </div>
    </div>
  )

  if (notFound || !promotion) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center', color: '#888' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>❌</div>
        <div style={{ fontWeight: 700, fontSize: '18px', marginBottom: '8px', color: '#333' }}>Promotion not found</div>
        <div style={{ marginBottom: '24px' }}>This promotion may have ended or the link may be incorrect.</div>
        <a href="/" style={{ background: '#1D9E75', color: 'white', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>Browse all promotions</a>
      </div>
    </div>
  )

  const color = promotion.color || '#1D9E75'
  const prizes = promotion.prizes?.split('\n').filter(Boolean) || []

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'system-ui, sans-serif' }}>

      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`, color: 'white', padding: '48px 24px 56px', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          {promotion.logo_url ? (
            <img src={promotion.logo_url} alt={promotion.company_name} style={{ width: '80px', height: '80px', borderRadius: '16px', objectFit: 'cover', marginBottom: '16px', border: '3px solid rgba(255,255,255,0.4)' }} />
          ) : (
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>{promotion.emoji || '🛍'}</div>
          )}
          <div style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '2px', opacity: 0.8, marginBottom: '8px' }}>{promotion.company_name}</div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 16px', lineHeight: 1.2 }}>{promotion.promo_name}</h1>

          {/* Grand draw badge */}
          {promotion.grand_draw_id && promotion.grand_draw_name && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '20px', padding: '8px 16px', fontSize: '13px', marginBottom: '16px', fontWeight: 600 }}>
              🏆 Also entered into: {promotion.grand_draw_name}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', marginTop: '8px' }}>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '10px', padding: '10px 18px', fontSize: '13px' }}>
              🗓 Draw: {promotion.draw_date ? new Date(promotion.draw_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'TBC'}
            </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '10px', padding: '10px 18px', fontSize: '13px' }}>
              💰 Min spend: {promotion.currency} {promotion.min_spend?.toLocaleString()}
            </div>
            {promotion.entries_count !== undefined && (
              <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '10px', padding: '10px 18px', fontSize: '13px' }}>
                🎫 {promotion.entries_count} entries so far
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 16px' }}>

        {/* Enter button — prominent */}
        <div style={{ textAlign: 'center', margin: '-28px 0 32px' }}>
          <a href={`/enter/${promotion.id}`} style={{ display: 'inline-block', background: color, color: 'white', padding: '18px 40px', borderRadius: '14px', textDecoration: 'none', fontWeight: 800, fontSize: '18px', boxShadow: `0 8px 32px ${color}66` }}>
            Enter now →
          </a>
        </div>

        {/* How to enter */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '16px', color: '#111' }}>How to enter</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              ['1', '🛒', 'Shop', `Spend a minimum of ${promotion.currency} ${promotion.min_spend?.toLocaleString()} on${promotion.product_keywords?.length ? ` ${promotion.product_keywords.slice(0, 3).join(', ')}` : ' promoted products'}.`],
              ['2', '📸', 'Upload your receipt', 'Take a photo of your receipt and upload it on the entry page.'],
              ['3', '🤖', 'AI verification', 'Claude AI instantly reads and verifies your receipt. No waiting.'],
              ['4', '🎟', 'Get your ticket', 'Receive your ticket number. You\'re in the draw!'],
            ].map(([num, icon, title, desc]) => (
              <div key={num as string} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px', flexShrink: 0 }}>{num}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: '#111' }}>{icon} {title}</div>
                  <div style={{ color: '#666', fontSize: '13px', marginTop: '2px', lineHeight: 1.5 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Prizes */}
        {prizes.length > 0 && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '16px', color: '#111' }}>🏆 Prizes</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {prizes.map((prize, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '12px', background: '#f9fafb', borderRadius: '10px' }}>
                  <span style={{ fontSize: '20px' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🎁'}</span>
                  <span style={{ fontSize: '14px', color: '#333', lineHeight: 1.5 }}>{prize}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grand draw info */}
        {promotion.grand_draw_id && promotion.grand_draw_name && (
          <div style={{ background: 'linear-gradient(135deg, #7c3aed11, #7c3aed22)', border: '2px solid #7c3aed44', borderRadius: '16px', padding: '24px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px', color: '#5b21b6' }}>🏆 Grand Draw</h2>
            <p style={{ color: '#6d28d9', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
              Every verified entry into this promotion also earns you a ticket in the <strong>{promotion.grand_draw_name}</strong>. One receipt, two chances to win!
            </p>
          </div>
        )}

        {/* Key dates */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '16px', color: '#111' }}>📅 Key dates</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              ['Promotion opens', promotion.start_date],
              ['Promotion closes', promotion.end_date],
              ['Prize draw', promotion.draw_date],
            ].map(([label, date]) => date && (
              <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ fontSize: '14px', color: '#666' }}>{label}</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#111' }}>{new Date(date as string).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Terms */}
        {promotion.terms_conditions && (
          <details style={{ background: 'white', borderRadius: '16px', padding: '20px 24px', marginBottom: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <summary style={{ fontWeight: 700, fontSize: '15px', cursor: 'pointer', color: '#111' }}>📋 Terms &amp; Conditions</summary>
            <pre style={{ marginTop: '16px', fontSize: '12px', color: '#666', whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: 1.7 }}>{promotion.terms_conditions}</pre>
          </details>
        )}

        {/* Enter CTA at bottom */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <a href={`/enter/${promotion.id}`} style={{ display: 'inline-block', background: color, color: 'white', padding: '16px 36px', borderRadius: '12px', textDecoration: 'none', fontWeight: 700, fontSize: '16px' }}>
            Enter this promotion →
          </a>
          <div style={{ marginTop: '16px' }}>
            <a href="/" style={{ color: '#888', fontSize: '13px', textDecoration: 'none' }}>← Back to all promotions</a>
          </div>
        </div>
      </div>
    </div>
  )
}
