import Link from 'next/link'

export default function ForBusinessPage() {
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
          <h1 style={{ fontSize: '36px', fontWeight: 800, margin: '0 0 16px', lineHeight: 1.2 }}>Run smarter promotions.<br />Verify every receipt. Instantly.</h1>
          <p style={{ fontSize: '17px', opacity: 0.9, margin: '0 0 32px', lineHeight: 1.6 }}>ReceiptRaffle solves the biggest challenge in promotional marketing — verifying proof of purchase at scale, without manual checking or geographic limits.</p>
          <Link href="/launch" style={{ background: 'white', color: '#1D9E75', padding: '14px 28px', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '16px', display: 'inline-block' }}>Launch your promotion →</Link>
        </div>
      </div>

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '0 24px' }}>

        {/* Problem */}
        <div style={{ padding: '56px 0 0' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1D9E75', letterSpacing: '1px', marginBottom: '8px' }}>THE PROBLEM WE SOLVE</div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#111', margin: '0 0 40px' }}>Proof of purchase promotions are hard to run well</h2>
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
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#111', margin: '0 0 40px' }}>AI that reads every receipt in seconds</h2>
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
              ['1', 'Submit your promotion details', 'Fill in your company details, promotion rules, prizes, dates and minimum spend. Takes 5 minutes.'],
              ['2', 'Pay the one-time fee', 'A flat fee per promotion — no monthly fees, no hidden costs. Our team contacts you to confirm.'],
              ['3', 'Go live', 'Your promotion appears on ReceiptRaffle within 24 hours. Customers can start entering immediately.'],
              ['4', 'Watch entries come in', 'Your promoter dashboard shows real-time entries, verification status and any flagged receipts.'],
              ['5', 'Run the draw and contact winners', 'On draw day, run the draw from your dashboard. Winners are selected instantly with a full log.'],
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
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1D9E75', letterSpacing: '1px', marginBottom: '8px' }}>SIMPLE PRICING</div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#111', margin: '0 0 32px' }}>One flat fee per promotion</h2>
          <div style={{ background: 'white', borderRadius: '16px', padding: '36px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', textAlign: 'center', maxWidth: '400px', margin: '0 auto' }}>
            <div style={{ fontSize: '14px', color: '#888', marginBottom: '8px', fontWeight: 600 }}>Per promotion</div>
            <div style={{ fontSize: '48px', fontWeight: 800, color: '#1D9E75', marginBottom: '4px' }}>Contact us</div>
            <div style={{ color: '#888', fontSize: '14px', marginBottom: '24px' }}>One-time fee · Unlimited entries</div>
            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
              {['AI receipt verification for every entry', 'Reach customers anywhere — no geographic limits', 'Fraud detection and duplicate checking', 'Real-time dashboard and audit logs', 'Fair draw engine with full audit trail', 'Winner notification support'].map(f => (
                <div key={f} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '14px', color: '#333' }}>
                  <span style={{ color: '#1D9E75', fontWeight: 700, flexShrink: 0 }}>✓</span>
                  <span>{f}</span>
                </div>
              ))}
            </div>
            <Link href="/launch" style={{ display: 'block', background: '#1D9E75', color: 'white', padding: '14px', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '16px' }}>Launch your promotion →</Link>
          </div>
          <p style={{ textAlign: 'center', marginTop: '20px', color: '#888', fontSize: '14px' }}>Running multiple promotions? Contact us for volume pricing.</p>
        </div>

        {/* CTA */}
        <div style={{ padding: '56px 0', textAlign: 'center' }}>
          <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#111', marginBottom: '12px' }}>Ready to run a smarter promotion?</h2>
          <p style={{ color: '#666', marginBottom: '28px', fontSize: '15px' }}>Join businesses using ReceiptRaffle to run fair, verified prize promotions at scale.</p>
          <Link href="/launch" style={{ background: '#1D9E75', color: 'white', padding: '14px 28px', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '16px', display: 'inline-block', marginBottom: '20px' }}>Launch a promotion →</Link>
          <p style={{ color: '#888', fontSize: '14px' }}>Questions? Email us at <a href="mailto:hello@receiptraffle.com" style={{ color: '#1D9E75' }}>hello@receiptraffle.com</a></p>
          <div style={{ marginTop: '24px' }}>
            <Link href="/" style={{ color: '#888', fontSize: '14px', textDecoration: 'none' }}>← Back to promotions</Link>
          </div>
        </div>

      </div>
    </div>
  )
}
