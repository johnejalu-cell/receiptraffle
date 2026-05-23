'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function LaunchPage() {
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [ref, setRef] = useState('')
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    companyName: '', contactName: '', email: '', phone: '',
    promoName: '', description: '', minSpend: '', maxEntries: '3',
    startDate: '', endDate: '', drawDate: '', prizes: [''],
  })

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }
  function addPrize() { setForm(f => ({ ...f, prizes: [...f.prizes, ''] })) }
  function setPrize(i: number, val: string) {
    setForm(f => { const p = [...f.prizes]; p[i] = val; return { ...f, prizes: p } })
  }
  function removePrize(i: number) {
    setForm(f => ({ ...f, prizes: f.prizes.filter((_, idx) => idx !== i) }))
  }

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
        })
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error || 'Submission failed. Please try again.')
        setSubmitting(false)
        return
      }
      setRef(data.submission.ref)
      setDone(true)
    } catch (e) {
      setError('Connection error. Please try again.')
    }
    setSubmitting(false)
  }

  if (done) return (
    <main style={{ minHeight: '100vh', background: '#fafaf9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ maxWidth: 440, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Promotion submitted!</h2>
        <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>
          Our team will review and activate your promotion within 24 hours. You will receive confirmation at <strong>{form.email}</strong>.
        </p>
        <div style={{ background: '#fff', border: '2px solid #1D9E75', borderRadius: 14, padding: '1.25rem', marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>Your reference number</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#1D9E75', letterSpacing: 1 }}>{ref}</div>
          <div style={{ fontSize: 13, color: '#666', marginTop: 8 }}>{form.promoName}</div>
          <div style={{ fontSize: 13, color: '#666' }}>{form.companyName}</div>
        </div>
        <div style={{ background: '#FFF8E6', border: '1px solid #FAC775', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#633806', marginBottom: 20 }}>
          Our team will contact you at <strong>{form.phone}</strong> to process the UGX 250,000 promotion fee.
        </div>
        <Link href="/" style={{ color: '#1D9E75', fontSize: 14, textDecoration: 'none', fontWeight: 600 }}>← Back to home</Link>
      </div>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: '#fafaf9' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e5e0', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/" style={{ color: '#666', textDecoration: 'none', fontSize: 20 }}>←</Link>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Launch a promotion</div>
          <div style={{ fontSize: 12, color: '#999' }}>Step {step} of 3</div>
        </div>
      </div>
      <div style={{ height: 3, background: '#e5e5e0' }}>
        <div style={{ height: '100%', background: '#1D9E75', width: `${(step/3)*100}%`, transition: 'width 0.3s' }} />
      </div>

      <div style={{ padding: '1.5rem 1rem', maxWidth: 500, margin: '0 auto' }}>
        {error && <div style={{ background: '#FCEBEB', color: '#791F1F', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</div>}

        {step === 1 && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Your business details</h2>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>Tell us who you are so we can set up your promotion.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Company / brand name *', field: 'companyName', type: 'text', placeholder: 'e.g. FreshMart Supermarkets' },
                { label: 'Contact person name *', field: 'contactName', type: 'text', placeholder: 'Your full name' },
                { label: 'Email address *', field: 'email', type: 'email', placeholder: 'you@company.com' },
                { label: 'Phone number *', field: 'phone', type: 'tel', placeholder: '+256 7XX XXX XXX' },
              ].map(f => (
                <div key={f.field}>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>{f.label}</label>
                  <input type={f.type} value={(form as any)[f.field]} onChange={e => set(f.field, e.target.value)} placeholder={f.placeholder}
                    style={{ width: '100%', padding: '11px 14px', border: '1px solid #d0d0c8', borderRadius: 10, fontSize: 15, background: '#fff' }} />
                </div>
              ))}
              <button onClick={() => {
                if (!form.companyName || !form.contactName || !form.email || !form.phone) { alert('Please fill in all fields'); return }
                setStep(2)
              }} style={{ width: '100%', padding: '13px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                Next: Promotion details →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Promotion details</h2>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>Set the rules and dates for your promotion.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Promotion name *</label>
                <input type="text" value={form.promoName} onChange={e => set('promoName', e.target.value)} placeholder="e.g. Win Big This Summer"
                  style={{ width: '100%', padding: '11px 14px', border: '1px solid #d0d0c8', borderRadius: 10, fontSize: 15, background: '#fff' }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Description (optional)</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Brief description..."
                  style={{ width: '100%', padding: '11px 14px', border: '1px solid #d0d0c8', borderRadius: 10, fontSize: 14, background: '#fff', resize: 'vertical', minHeight: 72 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Min spend (UGX) *</label>
                  <input type="number" value={form.minSpend} onChange={e => set('minSpend', e.target.value)} placeholder="300000"
                    style={{ width: '100%', padding: '11px 14px', border: '1px solid #d0d0c8', borderRadius: 10, fontSize: 15, background: '#fff' }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Max entries/person</label>
                  <select value={form.maxEntries} onChange={e => set('maxEntries', e.target.value)}
                    style={{ width: '100%', padding: '11px 14px', border: '1px solid #d0d0c8', borderRadius: 10, fontSize: 15, background: '#fff' }}>
                    {[1,2,3,5,10].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Start date *</label>
                  <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)}
                    style={{ width: '100%', padding: '11px 14px', border: '1px solid #d0d0c8', borderRadius: 10, fontSize: 14, background: '#fff' }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>End date *</label>
                  <input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)}
                    style={{ width: '100%', padding: '11px 14px', border: '1px solid #d0d0c8', borderRadius: 10, fontSize: 14, background: '#fff' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Draw date *</label>
                <input type="date" value={form.drawDate} onChange={e => set('drawDate', e.target.value)}
                  style={{ width: '100%', padding: '11px 14px', border: '1px solid #d0d0c8', borderRadius: 10, fontSize: 14, background: '#fff' }} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(1)} style={{ flex: 1, padding: '13px', background: '#fff', color: '#1a1a18', border: '1px solid #d0d0c8', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>← Back</button>
                <button onClick={() => {
                  if (!form.promoName || !form.minSpend || !form.startDate || !form.endDate || !form.drawDate) { alert('Please fill in all fields'); return }
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
                  <div style={{ width: 28, height: 28, background: '#E8F8F2', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#085041', flexShrink: 0 }}>{i+1}</div>
                  <input type="text" value={prize} onChange={e => setPrize(i, e.target.value)} placeholder={`Prize ${i+1} e.g. UGX 1,000,000`}
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
            <div style={{ background: '#fff', border: '1px solid #e5e5e0', borderRadius: 14, padding: '1.25rem', marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5 }}>Summary</div>
              {[
                ['Company', form.companyName],
                ['Promotion', form.promoName],
                ['Min spend', `UGX ${parseInt(form.minSpend||'0').toLocaleString()}`],
                ['Draw date', form.drawDate],
                ['Prizes', `${form.prizes.filter(Boolean).length} prize(s)`],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: '#666' }}>{label}</span><span style={{ fontWeight: 600 }}>{value}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid #e5e5e0', paddingTop: 8, marginTop: 4, display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ fontWeight: 700 }}>Promotion fee</span>
                <span style={{ fontWeight: 700, color: '#1D9E75' }}>UGX 250,000</span>
              </div>
            </div>
            <div style={{ background: '#FFF8E6', border: '1px solid #FAC775', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#633806', marginBottom: 16 }}>
              Payment of UGX 250,000 will be collected by our team before your promotion goes live.
            </div>
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
