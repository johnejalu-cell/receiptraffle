'use client'
import { useState, useEffect } from 'react'

interface Content {
  home_headline: string
  home_subheading: string
  home_ai_badge: string
  home_business_title: string
  home_business_subtitle: string
  biz_hero_title: string
  biz_hero_subtitle: string
  biz_problem_title: string
  biz_solution_title: string
  biz_pricing_title: string
  biz_pricing_subtitle: string
  biz_pricing_amount: string
  biz_pricing_note: string
  biz_cta_title: string
  biz_cta_subtitle: string
  contact_email: string
}

const DEFAULTS: Content = {
  home_headline: 'Upload your receipt. Enter to win big.',
  home_subheading: 'Pick a promotion below, upload your receipt and you could win amazing prizes!',
  home_ai_badge: 'Instant AI receipt scanning — verified in seconds by Claude AI',
  home_business_title: 'Are you a business?',
  home_business_subtitle: 'Launch your own AI-powered prize promotion',
  biz_hero_title: 'Run smarter promotions. Verify every receipt. Instantly.',
  biz_hero_subtitle: 'ReceiptRaffle solves the biggest challenge in promotional marketing — verifying proof of purchase at scale, without manual checking or geographic limits.',
  biz_problem_title: 'Proof of purchase promotions are hard to run well',
  biz_solution_title: 'AI that reads every receipt in seconds',
  biz_pricing_title: 'One flat fee per promotion',
  biz_pricing_subtitle: 'No subscriptions. No per-entry fees. No surprises.',
  biz_pricing_amount: 'Contact us',
  biz_pricing_note: 'Running multiple promotions? Contact us for volume pricing.',
  biz_cta_title: 'Ready to run a smarter promotion?',
  biz_cta_subtitle: 'Join businesses using ReceiptRaffle to run fair, verified prize promotions at scale.',
  contact_email: 'hello@receiptraffle.com',
}

const FIELDS: { key: keyof Content; label: string; section: string; multiline?: boolean }[] = [
  { key: 'home_headline', label: 'Main headline', section: 'Homepage', multiline: true },
  { key: 'home_subheading', label: 'Subheading', section: 'Homepage', multiline: true },
  { key: 'home_ai_badge', label: 'AI badge text', section: 'Homepage' },
  { key: 'home_business_title', label: 'Business bar title', section: 'Homepage' },
  { key: 'home_business_subtitle', label: 'Business bar subtitle', section: 'Homepage' },
  { key: 'biz_hero_title', label: 'Hero headline', section: 'For Business page', multiline: true },
  { key: 'biz_hero_subtitle', label: 'Hero subheading', section: 'For Business page', multiline: true },
  { key: 'biz_problem_title', label: 'Problem section title', section: 'For Business page' },
  { key: 'biz_solution_title', label: 'Solution section title', section: 'For Business page' },
  { key: 'biz_pricing_title', label: 'Pricing section title', section: 'For Business page' },
  { key: 'biz_pricing_subtitle', label: 'Pricing subtitle', section: 'For Business page' },
  { key: 'biz_pricing_amount', label: 'Price displayed', section: 'For Business page' },
  { key: 'biz_pricing_note', label: 'Pricing footnote', section: 'For Business page' },
  { key: 'biz_cta_title', label: 'Call to action title', section: 'For Business page' },
  { key: 'biz_cta_subtitle', label: 'Call to action subtitle', section: 'For Business page', multiline: true },
  { key: 'contact_email', label: 'Contact email address', section: 'For Business page' },
]

export default function AdminContentPage() {
  const [pin, setPin] = useState('')
  const [authed, setAuthed] = useState(false)
  const [content, setContent] = useState<Content>(DEFAULTS)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [error, setError] = useState('')

  const adminPin = process.env.NEXT_PUBLIC_ADMIN_PIN || '1234'

  const login = () => {
    if (pin === adminPin) { setAuthed(true); loadContent() }
    else setError('Incorrect PIN')
  }

  const loadContent = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/content')
      const data = await res.json()
      if (data.content) setContent({ ...DEFAULTS, ...data.content })
    } catch { }
    finally { setLoading(false) }
  }

  const save = async () => {
    setSaving(true); setSaveMsg('')
    try {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: content }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSaveMsg('✅ Saved! Changes are now live on the website.')
    } catch (e: unknown) {
      setSaveMsg('❌ ' + (e instanceof Error ? e.message : 'Save failed'))
    } finally { setSaving(false) }
  }

  const reset = (key: keyof Content) => {
    setContent(c => ({ ...c, [key]: DEFAULTS[key] }))
  }

  const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid #ccc', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', fontFamily: 'system-ui, sans-serif' }

  if (!authed) return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: 'white', borderRadius: '16px', padding: '40px', maxWidth: '380px', width: '100%', boxShadow: '0 2px 16px rgba(0,0,0,0.08)', textAlign: 'center' }}>
        <div style={{ fontSize: '36px', marginBottom: '12px' }}>✏️</div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Content Editor</h1>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>Enter your admin PIN to edit website content.</p>
        <input
          type="password"
          value={pin}
          onChange={e => setPin(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && login()}
          placeholder="Admin PIN"
          style={{ ...inp, marginBottom: '12px', textAlign: 'center', fontSize: '18px', letterSpacing: '4px' }}
        />
        {error && <p style={{ color: '#dc2626', fontSize: '14px', marginBottom: '12px' }}>{error}</p>}
        <button onClick={login} style={{ width: '100%', padding: '12px', background: '#1D9E75', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 700, fontSize: '15px', cursor: 'pointer' }}>
          Enter →
        </button>
        <div style={{ marginTop: '20px' }}>
          <a href="/admin" style={{ color: '#888', fontSize: '14px', textDecoration: 'none' }}>← Back to admin</a>
        </div>
      </div>
    </div>
  )

  const sections = FIELDS.map(f => f.section).filter((s, i, arr) => arr.indexOf(s) === i)


  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <a href="/admin" style={{ color: '#1D9E75', fontSize: '14px', textDecoration: 'none', fontWeight: 600 }}>← Back to admin</a>
            <h1 style={{ fontSize: '22px', fontWeight: 700, margin: '6px 0 2px' }}>Website Content Editor</h1>
            <p style={{ color: '#888', fontSize: '14px', margin: 0 }}>Edit text on your homepage and for-business page. Changes go live instantly.</p>
          </div>
          <button onClick={save} disabled={saving} style={{ padding: '12px 24px', background: saving ? '#9ca3af' : '#1D9E75', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 700, fontSize: '15px', cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Saving...' : '💾 Save all changes'}
          </button>
        </div>

        {saveMsg && (
          <div style={{ background: saveMsg.startsWith('✅') ? '#f0fdf4' : '#fef2f2', border: `1px solid ${saveMsg.startsWith('✅') ? '#86efac' : '#fca5a5'}`, borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', fontSize: '14px', fontWeight: 600, color: saveMsg.startsWith('✅') ? '#15803d' : '#dc2626' }}>
            {saveMsg}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading content...</div>
        ) : (
          sections.map(section => (
            <div key={section} style={{ background: 'white', borderRadius: '16px', padding: '28px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1D9E75', marginBottom: '20px', paddingBottom: '10px', borderBottom: '2px solid #f0fdf4' }}>
                {section === 'Homepage' ? '🏠' : '🏢'} {section}
              </h2>
              {FIELDS.filter(f => f.section === section).map(field => (
                <div key={field.key} style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontWeight: 600, fontSize: '13px', color: '#333' }}>{field.label}</label>
                    <button onClick={() => reset(field.key)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '12px' }}>Reset to default</button>
                  </div>
                  {field.multiline ? (
                    <textarea
                      value={content[field.key]}
                      onChange={e => setContent(c => ({ ...c, [field.key]: e.target.value }))}
                      style={{ ...inp, minHeight: '80px', resize: 'vertical' }}
                    />
                  ) : (
                    <input
                      value={content[field.key]}
                      onChange={e => setContent(c => ({ ...c, [field.key]: e.target.value }))}
                      style={inp}
                    />
                  )}
                  <div style={{ fontSize: '11px', color: '#bbb', marginTop: '3px' }}>Default: {DEFAULTS[field.key]}</div>
                </div>
              ))}
            </div>
          ))
        )}

        <div style={{ textAlign: 'center', paddingBottom: '40px' }}>
          <button onClick={save} disabled={saving} style={{ padding: '13px 32px', background: saving ? '#9ca3af' : '#1D9E75', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 700, fontSize: '15px', cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Saving...' : '💾 Save all changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
