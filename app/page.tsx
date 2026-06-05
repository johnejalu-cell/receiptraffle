'use client'
import { useState, useEffect } from 'react'

const COUNTRIES = [
  { code: 'all', name: 'All countries', flag: '🌍' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'CI', name: 'Côte d\'Ivoire', flag: '🇨🇮' },
  { code: 'CM', name: 'Cameroon', flag: '🇨🇲' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼' },
  { code: 'SN', name: 'Senegal', flag: '🇸🇳' },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿' },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'ZM', name: 'Zambia', flag: '🇿🇲' },
  { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼' },
]

interface Promotion {
  id: string
  promo_name: string
  company_name: string
  emoji: string
  color: string
  draw_date: string
  min_spend: number
  currency: string
  entries_count: number
  logo_url?: string
  country?: string
}

interface Content {
  home_headline?: string
  home_subheading?: string
  home_ai_badge?: string
  home_business_title?: string
  home_business_subtitle?: string
}

const DEFAULTS: Content = {
  home_headline: 'The smarter way to run prize promotions.',
  home_subheading: 'ReceiptRaffle connects businesses running proof-of-purchase promotions with customers anywhere in the world — verified instantly by AI.',
  home_ai_badge: 'Every receipt verified in seconds by Claude AI',
  home_business_title: 'Are you a business?',
  home_business_subtitle: 'Launch your own AI-powered prize promotion',
}

export default function HomePage() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState<Content>(DEFAULTS)
  const [selectedCountry, setSelectedCountry] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    fetch('/api/content')
      .then(r => r.json())
      .then(d => { if (d.content) setContent({ ...DEFAULTS, ...d.content }) })
      .catch(() => {})
  }, [])

  const loadPromotions = async (countryCode: string) => {
    setLoading(true)
    setHasSearched(true)
    try {
      const url = countryCode === 'all'
        ? '/api/promotions'
        : `/api/promotions?country=${countryCode}`
      const res = await fetch(url)
      const d = await res.json()
      setPromotions(d.promotions || [])
    } catch { setPromotions([]) }
    finally { setLoading(false) }
  }

  const selectCountry = (code: string, name: string, flag: string) => {
    setSelectedCountry(code)
    setSearchTerm(`${flag} ${name}`)
    setShowDropdown(false)
    loadPromotions(code)
  }

  const filteredCountries = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(searchTerm.replace(/[^\w\s]/g, '').trim().toLowerCase()) ||
    c.code.toLowerCase() === searchTerm.toLowerCase()
  )

  const selectedCountryObj = COUNTRIES.find(c => c.code === selectedCountry)
  const c = content

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'system-ui, sans-serif' }}>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #1D9E75 0%, #157a5a 100%)', color: 'white', padding: '56px 24px 48px', textAlign: 'center' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🧾</div>
          <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '3px', opacity: 0.75, marginBottom: '14px' }}>RECEIPTRAFFLE</div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 16px', lineHeight: 1.25 }}>{c.home_headline}</h1>
          <p style={{ fontSize: '16px', opacity: 0.9, margin: '0 0 28px', lineHeight: 1.7 }}>{c.home_subheading}</p>

          {/* AI badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.15)', borderRadius: '20px', padding: '8px 18px', fontSize: '13px', marginBottom: '40px' }}>
            <span>⚡</span><span><strong>{c.home_ai_badge}</strong></span>
          </div>

          {/* Two paths */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '500px', margin: '0 auto' }}>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '20px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🛍</div>
              <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '6px' }}>I am a customer</div>
              <div style={{ fontSize: '13px', opacity: 0.85, lineHeight: 1.5 }}>Shop, upload your receipt and enter a prize draw instantly</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '20px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🏢</div>
              <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '6px' }}>I am a business</div>
              <div style={{ fontSize: '13px', opacity: 0.85, lineHeight: 1.5 }}>Run AI-verified proof-of-purchase promotions globally</div>
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div style={{ background: 'white', padding: '48px 24px', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, textAlign: 'center', marginBottom: '8px', color: '#111' }}>How it works</h2>
          <p style={{ textAlign: 'center', color: '#666', fontSize: '14px', marginBottom: '32px' }}>For customers and businesses in any country</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
            {[
              ['🛒', 'Shop', 'Purchase a promoted product from any participating retailer — in store or online.'],
              ['📸', 'Upload', 'Photograph your receipt and upload it through the promotion entry page.'],
              ['🤖', 'AI verifies', 'Claude AI reads your receipt, confirms the purchase and verifies eligibility in seconds.'],
              ['🎟', 'You\'re in!', 'Receive your ticket number instantly. Winners drawn on the promotion draw date.'],
            ].map(([icon, title, desc]) => (
              <div key={title as string} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>{icon}</div>
                <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '6px', color: '#111' }}>{title}</div>
                <div style={{ color: '#666', fontSize: '13px', lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Platform highlights */}
      <div style={{ padding: '48px 24px', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, textAlign: 'center', marginBottom: '32px', color: '#111' }}>A global platform for local promotions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            {[
              ['🌍', 'Any country', 'Businesses and customers from any country can use ReceiptRaffle — for local or international promotions.'],
              ['🤖', 'AI-powered', 'Every receipt is read and verified by Claude AI — no manual checking, no delays, no fraud.'],
              ['📱', 'Mobile first', 'Customers enter from their phone in seconds. No app download required.'],
              ['🎲', 'Fair draws', 'Winners selected at random from verified entries only, with a full audit trail.'],
            ].map(([icon, title, desc]) => (
              <div key={title as string} style={{ background: 'white', borderRadius: '12px', padding: '22px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: '28px', marginBottom: '10px' }}>{icon}</div>
                <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '6px', color: '#111' }}>{title}</div>
                <div style={{ color: '#666', fontSize: '13px', lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Country selector + promotions */}
      <div style={{ padding: '48px 24px 120px', maxWidth: '640px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, textAlign: 'center', marginBottom: '8px', color: '#111' }}>Find promotions near you</h2>
        <p style={{ textAlign: 'center', color: '#666', fontSize: '14px', marginBottom: '28px' }}>Select your country to see active promotions available to you</p>

        {/* Country search/select */}
        <div style={{ position: 'relative', marginBottom: '32px' }}>
          <input
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setShowDropdown(true) }}
            onFocus={() => setShowDropdown(true)}
            placeholder="🔍 Type or select your country..."
            style={{ width: '100%', padding: '14px 18px', border: '2px solid #1D9E75', borderRadius: '12px', fontSize: '15px', boxSizing: 'border-box', outline: 'none', background: 'white' }}
          />
          {showDropdown && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', zIndex: 100, maxHeight: '280px', overflowY: 'auto', border: '1px solid #e5e7eb', marginTop: '4px' }}>
              {filteredCountries.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#888', fontSize: '14px' }}>No countries found</div>
              ) : (
                filteredCountries.map(country => (
                  <div
                    key={country.code}
                    onClick={() => selectCountry(country.code, country.name, country.flag)}
                    style={{ padding: '12px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #f9fafb', background: selectedCountry === country.code ? '#f0fdf4' : 'white', fontSize: '15px' }}
                  >
                    <span style={{ fontSize: '20px' }}>{country.flag}</span>
                    <span style={{ fontWeight: selectedCountry === country.code ? 700 : 400, color: '#111' }}>{country.name}</span>
                    {selectedCountry === country.code && <span style={{ marginLeft: 'auto', color: '#1D9E75', fontWeight: 700 }}>✓</span>}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Click outside to close dropdown */}
        {showDropdown && (
          <div onClick={() => setShowDropdown(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
        )}

        {/* Promotions list */}
        {!hasSearched && (
          <div style={{ textAlign: 'center', padding: '40px 24px', color: '#888' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🌍</div>
            <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '8px', color: '#555' }}>Select a country above</div>
            <div style={{ fontSize: '14px' }}>Active promotions for that country will appear here</div>
          </div>
        )}

        {hasSearched && loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</div>
            <div>Finding promotions...</div>
          </div>
        )}

        {hasSearched && !loading && promotions.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📭</div>
            <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '8px', color: '#555' }}>
              No active promotions in {selectedCountryObj?.name || 'this country'} right now
            </div>
            <div style={{ fontSize: '14px', color: '#888', marginBottom: '20px' }}>Check back soon — or try selecting "All countries"</div>
            <button onClick={() => selectCountry('all', 'All countries', '🌍')} style={{ padding: '10px 20px', background: '#1D9E75', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
              Show all countries
            </button>
          </div>
        )}

        {hasSearched && !loading && promotions.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ background: '#dcfce7', color: '#16a34a', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px', letterSpacing: '1px' }}>LIVE</span>
              <span style={{ fontWeight: 700, fontSize: '15px', color: '#111' }}>
                {promotions.length} active {promotions.length === 1 ? 'promotion' : 'promotions'}
                {selectedCountryObj && selectedCountryObj.code !== 'all' ? ` in ${selectedCountryObj.flag} ${selectedCountryObj.name}` : ''}
              </span>
            </div>
            {promotions.map(p => (
              <a key={p.id} href={`/enter/${p.id}`} style={{ textDecoration: 'none', display: 'block', marginBottom: '12px' }}>
                <div style={{ background: 'white', borderRadius: '12px', padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: `4px solid ${p.color || '#1D9E75'}`, display: 'flex', gap: '14px', alignItems: 'center' }}>
                  {p.logo_url ? (
                    <img src={p.logo_url} alt={p.company_name} style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
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
        )}

        {/* Admin link */}
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <a href="/admin" style={{ color: '#ccc', fontSize: '12px', textDecoration: 'none' }}>Admin</a>
        </div>
      </div>

      {/* Sticky business bar */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '1px solid #e5e7eb', padding: '12px 16px', boxShadow: '0 -4px 16px rgba(0,0,0,0.08)', zIndex: 100 }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#111' }}>{c.home_business_title}</div>
            <div style={{ fontSize: '12px', color: '#888' }}>{c.home_business_subtitle}</div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <a href="/for-business" style={{ background: '#f3f4f6', color: '#333', padding: '9px 14px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '13px', whiteSpace: 'nowrap' }}>Learn more</a>
            <a href="/promoter" style={{ background: '#f3f4f6', color: '#333', padding: '9px 14px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '13px', whiteSpace: 'nowrap' }}>Manage →</a>
            <a href="/launch" style={{ background: '#1D9E75', color: 'white', padding: '9px 14px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '13px', whiteSpace: 'nowrap' }}>Launch →</a>
          </div>
        </div>
      </div>
    </div>
  )
}
