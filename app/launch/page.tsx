'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function LaunchPage() {
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [ref, setRef] = useState('')
  const [error, setError] = useState('')
  const [fee, setFee] = useState<{ amount: number, currency: string, description: string } | null>(null)

  const [form, setForm] = useState({
    companyName: '', contactName: '', email: '', phone: '',
    promoName: '', description: '', minSpend: '', maxEntries: '3',
    startDate: '', endDate: '', drawDate: '',
    prizes: [''],
    productKeywords: [''],
  })

  useEffect(() => {
    fetch('/api/admin/fees').then(r => r.json()).then(d => { if (d.fee) setFee(d.fee) }).catch(() => {})
  }, [])

  function set(field: string, value: string) { setForm(f => ({ ...f, [field]: value })) }
  function addPrize() { setForm(f => ({ ...f, prizes: [...f.prizes, ''] })) }
  function setPrize(i: number, val: string) { setForm(f => { const p = [...f.prizes]; p[i] = val; return { ...f, prizes: p } }) }
  function removePrize(i: number) { setForm(f => ({ ...f, prizes: f.prizes.filter((_, idx) => idx !== i) })) }
  function addKeyword() { setForm(f => ({ ...f, productKeywords: [...f.productKeywords, ''] })) }
  function setKeyword(i: number, val: string) { setForm(f => { const k = [...f.productKeywords]; k[i] = val; return { ...f, productKeywords: k } }) }
  function removeKeyword(i: number) { setForm(f => ({ ...f, productKeywords: f.productKeywords.filter((_, idx) => idx !== i) })) }

  async function handleSubmit() {
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: form.companyName,
          contactName: form.contactName,
          email: form.email,
          phone: form.phone,
          promoName: form.promoName,
          description: form.description,
          minSpend: form.minSpend,
          maxEntries: form.maxEntries,
          startDate: form.startDate,
          endDate: form.endDate,
          drawDate: form.drawDate,
          prizes: form.prizes.filter(Boolean),
          productKeywords: form.productKeywords.filter(Boolean),
        })
      })
      const data = await res.json()
      if (!res.ok || data.error) { setError(data.error || 'Submission failed. Please try again.'); setSubmitting(false); return }
      setRef(data.submission.ref)
      setDone(true)
    } catch (e) {
      setError('Connection error. Please try again.')
    }
    setSubmitting(false)
  }

  if (done) return (
    <main style={{ minHeight: '100vh', background: '#fafaf9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: 480, textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Submission received!</h1>
        <p style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>Your promotion has been submitted for review. Our team will be in touch shortly.</p>
        <div style={{ background: '#E8F8F2', borderRadius: 12, padding: '1rem', marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: '#0F6E56', marginBottom: 4 }}>Your reference number</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#085041', letterSpacing: 2 }}>{ref}</div>
        </div>
        {fee && (
          <div style={{ background: '#FFF8E6', border: '1px solid #FAC775', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#633806', marginBottom: 20 }}>
            Our team will contact you to collect the promotion fee of <strong>{fee.currency} {fee.amount.toLocaleString()}</strong> before your promotion goes live.
            {fee.description && <div style={{ marginTop: 6, fontSize: 12 }}>{fee.description}</div>}
          </div>
        )}
        <Link href="/" style={{ display: 'inline-block', padding: '12px 28px', background: '#1D9E75', color: '#fff', borderRadius: 10, fontWeight: 700, textDecoration: 'none' }}>Back to home</Link>
      </div>
    </main>
  )

  const inputStyle = { width: '100%', padding: '12px 14px', border: '1px solid #d0d0c8', borderRadius: 10, fontSize: 15, background: '#fff' }
  const labelStyle = { fontSize: 13, fontWeight: 600 as const, display: 'block' as const, marginBottom: 6 }

  return (
    <main style={{ minHeight: '100vh', background: '#fafaf9', padding: '1.5rem 1rem' }}>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <Link href="/" style={{ fontSize: 13, color: '#1D9E75', textDecoration: 'none', display: 'inline-block', marginBottom: 20 }}>← Back</Link>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Launch a promotion</h1>
        <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ flex: 1, height: 4, borderRadius: 4, background: step >= s ? '#1D9E75' : '#e5e5e0' }} />
          ))}
        </div>

        {step === 1 && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Your business details</h2>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>Tell us who you are so we can set up your promotion.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label style={labelStyle}>Company / brand name *</label><input style={inputStyle} value={form.companyName} onChange={e => set('companyName', e.target.value)} placeholder="Your company name" /></div>
              <div><label style={labelStyle}>Contact person name *</label><input style={inputStyle} value={form.contactName} onChange={e => set('contactName', e.target.value)} placeholder="Your full name" /></div>
              <div><label style={labelStyle}>Email address *</label><input style={inputStyle} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@company.com" /></div>
              <div><label style={labelStyle}>Phone number *</label><input style={inputStyle} type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+1 555 000 0000" /></div>
              <button onClick={() => { if (!form.companyName || !form.contactName || !form.email || !form.phone) { alert('Please fill in all fields'); return } setStep(2) }}
                style={{ width: '100%', padding: '14px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                Next: Promotion details →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Promotion details</h2>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>Tell us about your promotion and what customers need to buy.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label style={labelStyle}>Promotion name *</label><input style={inputStyle} value={form.promoName} onChange={e => set('promoName', e.target.value)} placeholder="e.g. Summer Win Big" /></div>
              <div><label style={labelStyle}>Description</label><input style={inputStyle} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Brief description (optional)" /></div>
              <div>
                <label style={labelStyle}>Promoted products / brands *</label>
                <p style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>Customers must buy these products to qualify. Add one per line.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
                  {form.productKeywords.map((kw, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input value={kw} onChange={e => setKeyword(i, e.target.value)} placeholder={`Brand or product name ${i + 1}`}
                        style={{ flex: 1, padding: '11px 14px', border: '1px solid #d0d0c8', borderRadius: 10, fontSize: 14, background: '#fff' }} />
                      {form.productKeywords.length > 1 && (
                        <button onClick={() => removeKeyword(i)} style={{ width: 32, height: 32, background: '#FCEBEB', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 16, color: '#A32D2D', flexShrink: 0 }}>×</button>
                      )}
                    </div>
                  ))}
                </div>
                <button onClick={addKeyword} style={{ width: '100%', padding: '10px', background: '#fff', border: '1.5px dashed #d0d0c8', borderRadius: 10, fontSize: 14, color: '#666', cursor: 'pointer' }}>+ Add another product</button>
              </div>
              <div><label style={labelStyle}>Minimum spend on promoted products *</label><input style={inputStyle} type="number" value={form.minSpend} onChange={e => set('minSpend', e.target.value)} placeholder="e.g. 50" /></div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}><label style={labelStyle}>Start date *</label><input style={inputStyle} type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} /></div>
                <div style={{ flex: 1 }}><label style={labelStyle}>End date *</label><input style={inputStyle} type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} /></div>
              </div>
              <div><label style={labelStyle}>Draw date *</label><input style={inputStyle} type="date" value={form.drawDate} onChange={e => set('drawDate', e.target.value)} /></div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(1)} style={{ flex: 1, padding: '13px', background: '#fff', color: '#1a1a18', border: '1px solid #d0d0c8', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>← Back</button>
                <button onClick={() => {
                  if (!form.promoName || !form.minSpend || !form.startDate || !form.endDate || !form.drawDate) { alert('Please fill in all required fields'); return }
                  if (form.productKeywords.filter(Boolean).length === 0) { alert('Please add at least one promoted product name'); return }
                  setStep(3)
                }} style={{ flex: 2, padding: '13px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                  Next: Prizes →
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Prizes</h2>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>List the prizes for your draw.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
              {form.prizes.map((prize, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ width: 28, height: 28, background: '#E8F8F2', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#085041', flexShrink: 0 }}>{i + 1}</div>
                  <input type="text" value={prize} onChange={e => setPrize(i, e.target.value)} placeholder={`Prize ${i + 1} e.g. $1,000 cash`}
                    style={{ flex: 1, padding: '11px 14px', border: '1px solid #d0d0c8', borderRadius: 10, fontSize: 14, background: '#fff' }} />
                  {form.prizes.length > 1 && (
                    <button onClick={() => removePrize(i)} style={{ width: 32, height: 32, background: '#FCEBEB', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 16, color: '#A32D2D', flexShrink: 0 }}>×</button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={addPrize} style={{ width: '100%', padding: '10px', background: '#fff', border: '1.5px dashed #d0d0c8', borderRadius: 10, fontSize: 14, color: '#666', cursor: 'pointer', marginBottom: 20 }}>
              + Add another prize
            </button>

            {/* Summary */}
            <div style={{ background: '#fff', border: '1px solid #e5e5e0', borderRadius: 14, padding: '1.25rem', marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5 }}>Summary</div>
              {[
                ['Company', form.companyName],
                ['Promotion', form.promoName],
                ['Min spend on promoted products', form.minSpend ? `${form.minSpend}` : '—'],
                ['Promoted products', form.productKeywords.filter(Boolean).join(', ')],
                ['Draw date', form.drawDate],
                ['Prizes', `${form.prizes.filter(Boolean).length} prize(s)`],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6, gap: 8 }}>
                  <span style={{ color: '#666', flexShrink: 0 }}>{label}</span>
                  <span style={{ fontWeight: 600, textAlign: 'right' }}>{value}</span>
                </div>
              ))}
              {fee && (
                <div style={{ borderTop: '1px solid #e5e5e0', paddingTop: 8, marginTop: 4, display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ fontWeight: 700 }}>Promotion fee</span>
                  <span style={{ fontWeight: 700, color: '#1D9E75' }}>{fee.currency} {fee.amount.toLocaleString()}</span>
                </div>
              )}
            </div>

            {fee && (
              <div style={{ background: '#FFF8E6', border: '1px solid #FAC775', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#633806', marginBottom: 16 }}>
                Payment of <strong>{fee.currency} {fee.amount.toLocaleString()}</strong> will be collected by our team before your promotion goes live.
                {fee.description && <span> {fee.description}</span>}
              </div>
            )}

            {error && <div style={{ background: '#FCEBEB', color: '#791F1F', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{error}</div>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(2)} style={{ flex: 1, padding: '13px', background: '#fff', color: '#1a1a18', border: '1px solid #d0d0c8', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>← Back</button>
              <button onClick={handleSubmit} disabled={submitting || form.prizes.filter(Boolean).length === 0}
                style={{ flex: 2, padding: '13px', background: submitting ? '#9BA4B5' : '#1D9E75', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer' }}>
                {submitting ? 'Submitting...' : 'Submit promotion 🚀'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
