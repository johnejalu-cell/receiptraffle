import Link from 'next/link'

export default function ForBusinessPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#fafaf9' }}>

      {/* Header */}
      <div style={{ background: '#1a1a2e', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, background: '#1D9E75', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>&#x1F9FE;</div>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>Receipt<span style={{ color: '#1D9E75' }}>Raffle</span></span>
        </Link>
        <Link href="/launch" style={{ padding: '8px 18px', background: '#1D9E75', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
          Launch a promotion
        </Link>
      </div>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #0d2137)', padding: '3rem 1.5rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: '#1D9E75', borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 16, letterSpacing: 0.5 }}>
          FOR BUSINESSES
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 900, color: '#fff', marginBottom: 12, letterSpacing: -0.5, lineHeight: 1.2 }}>
          Run nationwide promotions.<br />
          <span style={{ color: '#1D9E75' }}>Verify every receipt. Instantly.</span>
        </h1>
        <p style={{ fontSize: 15, color: '#9BA4B5', maxWidth: 380, margin: '0 auto 2rem', lineHeight: 1.6 }}>
          ReceiptRaffle solves the biggest challenge in promotional marketing — verifying proof of purchase at scale, across the country, without a team of manual checkers.
        </p>
        <Link href="/launch" style={{ display: 'inline-block', padding: '14px 32px', background: '#1D9E75', color: '#fff', borderRadius: 10, fontSize: 16, fontWeight: 700, textDecoration: 'none' }}>
          Launch your promotion &rarr;
        </Link>
      </div>

      {/* The problem */}
      <div style={{ padding: '2.5rem 1.5rem', maxWidth: 540, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>The problem we solve</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Proof of purchase promotions are broken in Africa</h2>
          <p style={{ fontSize: 14, color: '#666', lineHeight: 1.7 }}>
            Every year, brands run "buy and win" promotions — but verifying receipts means hiring armies of staff, setting up collection points, or accepting fraud. Most brands give up and run simple lucky draws instead, leaving their best customers unrewarded.
          </p>
        </div>

        {/* Pain points */}
        {[
          { icon: '&#x1F4B8;', title: 'Expensive manual verification', desc: 'Hiring teams to manually check thousands of receipts costs a fortune and takes weeks.' },
          { icon: '&#x1F4CD;', title: 'Geographic limitations', desc: 'Physical collection points only work in major cities. Customers upcountry are excluded.' },
          { icon: '&#x1F6AB;', title: 'Rampant fraud', desc: 'Fake receipts, duplicate submissions and dishonest staff are impossible to catch manually.' },
          { icon: '&#x23F3;', title: 'Slow results', desc: 'By the time receipts are counted and verified, the promotion buzz has long died down.' },
        ].map((p, i) => (
          <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 20, alignItems: 'flex-start' }}>
            <div style={{ width: 44, height: 44, background: '#FCEBEB', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}
              dangerouslySetInnerHTML={{ __html: p.icon }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{p.title}</div>
              <div style={{ fontSize: 13, color: '#666', lineHeight: 1.5 }}>{p.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* The solution */}
      <div style={{ background: '#fff', padding: '2.5rem 1.5rem', borderTop: '1px solid #e5e5e0', borderBottom: '1px solid #e5e5e0' }}>
        <div style={{ maxWidth: 540, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#1D9E75', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>The ReceiptRaffle solution</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>AI that reads every receipt in seconds</h2>
            <p style={{ fontSize: 14, color: '#666', lineHeight: 1.7 }}>
              Our Claude AI engine reads receipt images, extracts the total amount, date and retailer, and verifies eligibility instantly. No staff. No collection points. No fraud.
            </p>
          </div>
          {[
            { icon: '&#x1F916;', title: 'AI-powered verification', desc: 'Every receipt is scanned and verified by Claude AI — the same technology used by leading global companies. Results in under 5 seconds.', color: '#E8F8F2' },
            { icon: '&#x1F30D;', title: 'Truly nationwide reach', desc: 'Customers anywhere in Uganda — Kampala, Gulu, Mbarara, Arua — can enter from their phone. No physical collection points needed.', color: '#E6F1FB' },
            { icon: '&#x1F6E1;', title: 'Built-in fraud detection', desc: 'Duplicate receipt detection, device fingerprinting and AI confidence scoring catch fake entries before they enter the draw.', color: '#FCEBEB' },
            { icon: '&#x26A1;', title: 'Real-time results', desc: 'See entries, verification rates and draw results in your dashboard as they happen. No waiting weeks for reports.', color: '#FFF8E6' },
            { icon: '&#x1F3B2;', title: 'Tamper-proof draws', desc: 'Every draw is cryptographically signed with an audit hash — winners are selected fairly and results are independently verifiable.', color: '#EEEDFE' },
            { icon: '&#x1F4CA;', title: 'Full audit trail', desc: 'Every entry, every verification decision, every draw result is logged with timestamps. Full compliance and transparency.', color: '#E8F8F2' },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 20, alignItems: 'flex-start' }}>
              <div style={{ width: 44, height: 44, background: s.color, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}
                dangerouslySetInnerHTML={{ __html: s.icon }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: '#666', lineHeight: 1.5 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works for businesses */}
      <div style={{ padding: '2.5rem 1.5rem', maxWidth: 540, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>How it works</div>
          <h2 style={{ fontSize: 22, fontWeight: 800 }}>Live in 24 hours</h2>
        </div>
        {[
          { num: '1', title: 'Submit your promotion details', desc: 'Fill in your company details, promotion rules, prizes, dates and minimum spend. Takes 5 minutes.' },
          { num: '2', title: 'Pay the one-time fee', desc: 'UGX 250,000 per promotion. No monthly fees, no hidden costs. Our team contacts you to process payment.' },
          { num: '3', title: 'Go live', desc: 'Your promotion appears on ReceiptRaffle within 24 hours. Customers can start entering immediately.' },
          { num: '4', title: 'Watch entries come in', desc: 'Your admin dashboard shows real-time entries, verification status and any flagged receipts for review.' },
          { num: '5', title: 'Run the draw & contact winners', desc: 'On draw day, run the tamper-proof draw from your dashboard. Winners are selected instantly with a full audit log.' },
        ].map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 20, alignItems: 'flex-start' }}>
            <div style={{ width: 32, height: 32, background: '#1D9E75', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {s.num}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{s.title}</div>
              <div style={{ fontSize: 13, color: '#666', lineHeight: 1.5 }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Pricing */}
      <div style={{ background: '#fff', borderTop: '1px solid #e5e5e0', borderBottom: '1px solid #e5e5e0', padding: '2.5rem 1.5rem' }}>
        <div style={{ maxWidth: 540, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Simple pricing</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>One flat fee per promotion</h2>
          <p style={{ fontSize: 14, color: '#666', marginBottom: 24 }}>No subscriptions. No per-entry fees. No surprises.</p>
          <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #0d2137)', borderRadius: 16, padding: '2rem', marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: '#9BA4B5', marginBottom: 8 }}>Per promotion</div>
            <div style={{ fontSize: 48, fontWeight: 900, color: '#fff', marginBottom: 4 }}>UGX 250K</div>
            <div style={{ fontSize: 13, color: '#9BA4B5', marginBottom: 20 }}>One-time fee · Unlimited entries</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left', marginBottom: 20 }}>
              {['AI receipt verification for every entry', 'Nationwide reach — any customer, any location', 'Fraud detection and duplicate checking', 'Real-time dashboard and audit logs', 'Tamper-proof draw engine', 'Winner notification support'].map((f, i) => (
                <div key={i} style={{ fontSize: 13, color: '#9BA4B5', display: 'flex', gap: 8 }}>
                  <span style={{ color: '#1D9E75', fontWeight: 700 }}>&#x2713;</span> {f}
                </div>
              ))}
            </div>
            <Link href="/launch" style={{ display: 'block', padding: '13px', background: '#1D9E75', color: '#fff', borderRadius: 10, fontSize: 15, fontWeight: 700, textDecoration: 'none', textAlign: 'center' }}>
              Launch your promotion &rarr;
            </Link>
          </div>
          <p style={{ fontSize: 12, color: '#999' }}>Running multiple promotions simultaneously? Contact us for volume pricing.</p>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', maxWidth: 540, margin: '0 auto' }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Ready to run a smarter promotion?</h2>
        <p style={{ fontSize: 14, color: '#666', marginBottom: 24 }}>Join businesses already using ReceiptRaffle to run fair, verified, nationwide prize promotions.</p>
        <Link href="/launch" style={{ display: 'inline-block', padding: '14px 36px', background: '#1D9E75', color: '#fff', borderRadius: 10, fontSize: 16, fontWeight: 700, textDecoration: 'none', marginBottom: 16 }}>
          Launch a promotion &rarr;
        </Link>
        <div style={{ fontSize: 13, color: '#999' }}>
          Questions? Email us at <span style={{ color: '#1D9E75' }}>hello@receiptraffle.com</span>
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #e5e5e0', padding: '1.5rem', textAlign: 'center' }}>
        <Link href="/" style={{ fontSize: 13, color: '#999', textDecoration: 'none' }}>&#x2190; Back to promotions</Link>
        <span style={{ color: '#e5e5e0', margin: '0 12px' }}>|</span>
        <Link href="/admin" style={{ fontSize: 11, color: '#ddd', textDecoration: 'none' }}>Admin</Link>
      </div>
    </main>
  )
}
