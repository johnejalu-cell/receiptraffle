'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Content {
  biz_hero_title?: string
  biz_hero_subtitle?: string
  biz_problem_title?: string
  biz_solution_title?: string
  biz_pricing_title?: string
  biz_pricing_subtitle?: string
  biz_cta_title?: string
  biz_cta_subtitle?: string
  contact_email?: string
}

const DEFAULTS: Content = {
  biz_hero_title: 'Run smarter promotions. Verify every receipt. Instantly.',
  biz_hero_subtitle: 'ReceiptRaffle solves the biggest challenge in promotional marketing — verifying proof of purchase at scale, without manual checking or geographic limits.',
  biz_problem_title: 'Proof of purchase promotions are hard to run well',
  biz_solution_title: 'AI that reads every receipt in seconds',
  biz_pricing_title: 'Simple, transparent pricing',
  biz_pricing_subtitle: 'Choose the tier that matches your expected entry volume. A flat monthly fee covers your promotion — AI verification is charged at cost plus a small platform premium.',
  biz_cta_title: 'Ready to run a smarter promotion?',
  biz_cta_subtitle: 'Join businesses using ReceiptRaffle to run fair, verified prize promotions at scale.',
  contact_email: 'hello@receiptraffle.com',
}

export default function ForBusinessPage() {
  const [content, setContent] = useState<Content>(DEFAULTS)

  useEffect(() => {
    fetch('/api/content')
      .then(r => r.json())
      .then(d => { if (d.content) setContent({ ...DEFAULTS, ...d.content }) })
      .catch(() => {})
  }, [])

  const c = content

  const tiers = [
    { name: 'Starter', entries: 'Up to 500', standard: '$129', emerging: '$51' },
    { name: 'Growth', entries: 'Up to 2,000', standard: '$259', emerging: '$103' },
    { name: 'Professional', entries: 'Up to 5,000', standard: '$454', emerging: '$181' },
    { name: 'Enterprise', entries: 'Up to 20,000', standard: '$779', emerging: '$311' },
    { name: 'Custom', entries: '20,000+', standard: 'Contact us', emerging: 'Contact us' },
  ]

  const examples = [
    { name: 'Small local promotion', detail: 'Starter · Emerging · 1 month · 200 entries', total: '$51' },
    { name: 'Regional campaign', detail: 'Growth · Emerging · 2 months · 1,500 entries', total: '$216' },
    { name: 'National promotion', detail: 'Professional · Standard · 3 months · 4,000 entries', total: '$1,397' },
    { name: 'Large FMCG brand', detail: 'Enterprise · Standard · 6 months · 15,000 entries', total: '$4,819' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'system-ui, sans-serif' }}>

      {/* Nav */}
      <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ textDecoration: 'none', fontWeight: 800, fontSize: '18px', color: '#1D9E75' }}>🧾 ReceiptRaffle</Link>
        <Link href="/launch" style={{ background: '#1D9E75', color: 'white', padding: '9px 18px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }}>Launch a promotion</Link>
      </div>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #1D9E75 0%, #157a5a 100%)', color: 'white', padding: '64px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '2px', opacity: 0.8, marginBottom: '12px' }}>FOR BUSINESSES</div>
          <h1 style={{ fontSize: '36px', fontWeight: 800, margin: '0 0 16px', lineHeight: 1.2 }}>{c.biz_hero_title}</h1>
          <p style={{ fontSize: '17px', opacity: 0.9, margin: '0 0 32px', lineHeight: 1.6 }}>{c.biz_hero_subtitle}</p>
          <Link href="/launch" style={{ background: 'white', color: '#1D9E75', padding: '14px 28px', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '16px', display: 'inline-block' }}>Launch your promotion →</Link>
        </div>
      </div>

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '0 24px' }}>

        {/* Problem */}
        <div style={{ padding: '56px 0 0' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1D9E75', letterSpacing: '1px', marginBottom: '8px' }}>THE PROBLEM WE SOLVE</div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#111', margin: '0 0 40px' }}>{c.biz_problem_title}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {[
              ['💸', 'Expensive manual verification', 'Hiring teams to manually check thousands of receipts costs a fortune and takes weeks.'],
              ['🌍', 'Geographic limitations', 'Physical collection points only reach customers nearby. Remote customers are excluded.'],
              ['🚫', 'Fraud risk', 'Fake receipts, duplicate submissions and dishonest entries are almost impossible to catch manually.'],
              ['⏳', 'Slow results', 'By the time receipts are counted and verified, the promotional momentum has already faded.'],
            ].map(([icon, title, desc]) => (
              <div key={title as string} style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: '28px', marginBottom: '10px' }}>{icon}</div>
                <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '6px', color: '#111' }}>{title}</div>
                <div style={{ color: '#666', fontSize: '14px', lineHeight: 1.5 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Solution */}
        <div style={{ padding: '56px 0 0' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1D9E75', letterSpacing: '1px', marginBottom: '8px' }}>THE RECEIPTRAFFLE SOLUTION</div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#111', margin: '0 0 40px' }}>{c.biz_solution_title}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {[
              ['🤖', 'AI-powered verification', 'Every receipt is scanned and verified by Claude AI. Retailer, amount, date and products are extracted automatically. Results in under 5 seconds.'],
              ['📱', 'Enter from anywhere', 'Customers enter from their phone — no physical collection points, no geography limits. Anyone with a receipt can participate.'],
              ['🛡', 'Built-in fraud detection', 'Duplicate receipt detection and AI confidence scoring catch suspicious entries before they reach the draw.'],
              ['⚡', 'Real-time dashboard', 'See entries, verification rates and draw results live. No waiting days or weeks for reports.'],
              ['🎲', 'Fair draw engine', 'Winners are selected at random from verified entries only. Draw results are logged with a full audit trail.'],
              ['📊', 'Full audit trail', 'Every entry, every verification decision and every draw result is logged with timestamps for complete transparency.'],
            ].map(([icon, title, desc]) => (
              <div key={title as string} style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: '28px', marginBottom: '10px' }}>{icon}</div>
                <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '6px', color: '#111' }}>{title}</div>
                <div style={{ color: '#666', fontSize: '14px', lineHeight: 1.5 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div style={{ padding: '56px 0 0' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1D9E75', letterSpacing: '1px', marginBottom: '8px' }}>HOW IT WORKS</div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#111', margin: '0 0 40px' }}>Live in 24 hours</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              ['1', 'Submit your promotion details', 'Fill in your company details, promotion rules, prizes, dates, minimum spend and your entry budget. Takes 5 minutes.'],
              ['2', 'We review and confirm your quote', 'Our team reviews your submission within 24 hours, confirms your pricing tier and sends you an invoice.'],
              ['3', 'Go live', 'Once payment is received your promotion goes live on ReceiptRaffle. Customers can start entering immediately from anywhere.'],
              ['4', 'Watch entries come in', 'Your promoter dashboard shows real-time entries, verification status and any flagged receipts.'],
              ['5', 'Run the draw and contact winners', 'On draw day, run the draw from your dashboard. Winners are selected instantly with a full audit log.'],
            ].map(([num, title, desc]) => (
              <div key={num as string} style={{ background: 'white', borderRadius: '12px', padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#1D9E75', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '16px', flexShrink: 0 }}>{num}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px', color: '#111' }}>{title}</div>
                  <div style={{ color: '#666', fontSize: '14px', lineHeight: 1.5 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div style={{ padding: '56px 0 0' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1D9E75', letterSpacing: '1px', marginBottom: '8px' }}>PRICING</div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#111', margin: '0 0 8px' }}>{c.biz_pricing_title}</h2>
          <p style={{ color: '#666', fontSize: '15px', margin: '0 0 40px', lineHeight: 1.6 }}>{c.biz_pricing_subtitle}</p>

          {/* Pricing table */}
          <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', marginBottom: '32px' }}>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', background: '#f9fafb', padding: '14px 20px', borderBottom: '2px solid #e5e7eb' }}>
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#555' }}>Tier</div>
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#555' }}>Entry budget</div>
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#1D9E75' }}>Standard /mo</div>
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#1D9E75' }}>Emerging /mo</div>
            </div>
            {tiers.map((tier, i) => (
              <div key={tier.name} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', padding: '16px 20px', borderBottom: i < tiers.length - 1 ? '1px solid #f3f4f6' : 'none', alignItems: 'center', background: tier.name === 'Growth' ? '#f0fdf4' : 'white' }}>
                <div style={{ fontWeight: 700, fontSize: '15px', color: '#111' }}>
                  {tier.name}
                  {tier.name === 'Growth' && <span style={{ marginLeft: '8px', fontSize: '10px', background: '#1D9E75', color: 'white', padding: '2px 6px', borderRadius: '10px', fontWeight: 600 }}>POPULAR</span>}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>{tier.entries}</div>
                <div style={{ fontWeight: 700, fontSize: '15px', color: tier.standard === 'Contact us' ? '#888' : '#111' }}>{tier.standard}</div>
                <div style={{ fontWeight: 700, fontSize: '15px', color: tier.emerging === 'Contact us' ? '#888' : '#111' }}>{tier.emerging}</div>
              </div>
            ))}
          </div>

          {/* AI cost note */}
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '20px 24px', marginBottom: '32px' }}>
            <div style={{ fontWeight: 700, fontSize: '15px', color: '#92400e', marginBottom: '8px' }}>⚡ AI verification cost</div>
            <p style={{ color: '#78350f', fontSize: '14px', lineHeight: 1.6, margin: '0 0 8px' }}>
              The first 500 entries are included free on all tiers. Beyond that, AI verification is charged at <strong>$10 per 1,000 entries</strong> — billed monthly based on actual usage.
            </p>
            <p style={{ color: '#78350f', fontSize: '13px', margin: 0, opacity: 0.8 }}>
              If your promotion receives fewer entries than your budget, you only pay for actual verifications. No minimum overage charge.
            </p>
          </div>

          {/* Example costs */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '20px', color: '#111' }}>Example total costs</h3>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {examples.map((ex, i) => (
                <div key={ex.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: i < examples.length - 1 ? '1px solid #f3f4f6' : 'none', gap: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#111' }}>{ex.name}</div>
                    <div style={{ fontSize: '13px', color: '#888', marginTop: '2px' }}>{ex.detail}</div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '20px', color: '#1D9E75', whiteSpace: 'nowrap' }}>{ex.total}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Emerging markets note */}
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '12px', padding: '20px 24px', marginBottom: '20px' }}>
            <div style={{ fontWeight: 700, fontSize: '15px', color: '#15803d', marginBottom: '6px' }}>🌍 Emerging markets rate</div>
            <p style={{ color: '#166534', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
              The emerging markets rate applies to businesses based in Africa, South Asia and Southeast Asia. Same platform, same AI quality, same features — at a rate appropriate for local market conditions. Contact us to confirm eligibility.
            </p>
          </div>

          <p style={{ textAlign: 'center', color: '#888', fontSize: '14px' }}>
            Need a custom plan for high-volume or enterprise promotions?{' '}
            <a href={`mailto:${c.contact_email}`} style={{ color: '#1D9E75', fontWeight: 600 }}>Contact us</a>
          </p>
        </div>

        {/* CTA */}
        <div style={{ padding: '56px 0', textAlign: 'center' }}>
          <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#111', marginBottom: '12px' }}>{c.biz_cta_title}</h2>
          <p style={{ color: '#666', marginBottom: '28px', fontSize: '15px' }}>{c.biz_cta_subtitle}</p>
          <Link href="/launch" style={{ background: '#1D9E75', color: 'white', padding: '14px 28px', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '16px', display: 'inline-block', marginBottom: '20px' }}>Launch a promotion →</Link>
          <p style={{ color: '#888', fontSize: '14px' }}>Questions? Email us at <a href={`mailto:${c.contact_email}`} style={{ color: '#1D9E75' }}>{c.contact_email}</a></p>
          <div style={{ marginTop: '24px' }}>
            <Link href="/" style={{ color: '#888', fontSize: '14px', textDecoration: 'none' }}>← Back to promotions</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
