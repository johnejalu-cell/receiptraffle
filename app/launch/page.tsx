'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface FormData {
  companyName: string
  contactName: string
  email: string
  phone: string
  promoName: string
  minSpend: string
  currency: string
  startDate: string
  endDate: string
  drawDate: string
  prizes: string
  productKeywords: string
  productBarcodes: string[]
  termsConditions: string
  promoterPin: string
  logo: File | null
  emoji: string
  color: string
}

const CURRENCIES = ['UGX', 'KES', 'TZS', 'USD', 'GBP', 'EUR', 'ZAR', 'NGN', 'GHS']

const EMOJIS = ['🛍', '🎁', '🏆', '🎯', '💰', '🎉', '🛒', '⭐', '🔥', '💎']

const DEFAULT_TERMS = `TERMS AND CONDITIONS

1. PROMOTER: [Company Name], [Address].

2. ELIGIBILITY: Open to residents of Uganda aged 18 and over. Employees of the promoter and their families are excluded.

3. HOW TO ENTER: Purchase the promoted product(s) with a minimum spend of [amount]. Upload your receipt via ReceiptRaffle. One entry per receipt. Multiple entries permitted with separate qualifying purchases.

4. PROMOTION PERIOD: [Start Date] to [End Date].

5. PRIZES: [List prizes here]. No cash alternative. Non-transferable.

6. DRAW: Winner(s) selected at random from all valid entries on [Draw Date]. Winners notified by phone/email within 7 days.

7. RECEIPT VERIFICATION: All receipts verified by AI. The promoter reserves the right to request original receipts. Fraudulent entries will be disqualified.

8. WINNER ANNOUNCEMENT: Winners published on [platform/social media] within 14 days of draw.

9. DATA: Entry data used only to administer this promotion and will not be shared with third parties.

10. DISPUTES: The promoter's decision is final. No correspondence will be entered into.`

export default function LaunchPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [promoRef, setPromoRef] = useState('')
  const [error, setError] = useState('')

  const [form, setForm] = useState<FormData>({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    promoName: '',
    minSpend: '',
    currency: 'UGX',
    startDate: '',
    endDate: '',
    drawDate: '',
    prizes: '',
    productKeywords: '',
    productBarcodes: [],
    termsConditions: DEFAULT_TERMS,
    promoterPin: '',
    logo: null,
    emoji: '🛍',
    color: '#1D9E75',
  })

  const update = (field: keyof FormData, value: string | string[] | File | null) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  // Barcode management functions
  const addBarcode = () => {
    setForm(prev => ({ ...prev, productBarcodes: [...prev.productBarcodes, ''] }))
  }

  const setBarcode = (index: number, value: string) => {
    setForm(prev => {
      const updated = [...prev.productBarcodes]
      updated[index] = value
      return { ...prev, productBarcodes: updated }
    })
  }

  const removeBarcode = (index: number) => {
    setForm(prev => {
      const updated = prev.productBarcodes.filter((_, i) => i !== index)
      return { ...prev, productBarcodes: updated }
    })
  }

  const nextStep = () => {
    setError('')
    if (step === 1) {
      if (!form.companyName || !form.contactName || !form.email || !form.phone) {
        setError('Please fill in all required fields.')
        return
      }
    }
    if (step === 2) {
      if (!form.promoName || !form.minSpend || !form.startDate || !form.endDate || !form.drawDate || !form.prizes) {
        setError('Please fill in all required fields.')
        return
      }
    }
    if (step === 3) {
      if (!form.promoterPin || form.promoterPin.length < 4) {
        setError('Please set a PIN of at least 4 characters.')
        return
      }
    }
    setStep(s => s + 1)
  }

  const prevStep = () => setStep(s => s - 1)

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      const formData = new FormData()
      Object.entries(form).forEach(([key, value]) => {
        if (key === 'logo' && value instanceof File) {
          formData.append('logo', value)
        } else if (key === 'productBarcodes') {
          formData.append('productBarcodes', JSON.stringify(value))
        } else if (value !== null && value !== undefined) {
          formData.append(key, String(value))
        }
      })

      const res = await fetch('/api/promotions', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Submission failed')

      setPromoRef(data.ref)
      setSubmitted(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ background: 'white', borderRadius: '16px', padding: '40px', maxWidth: '480px', width: '100%', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px', color: '#111' }}>Promotion submitted!</h1>
          <p style={{ color: '#666', marginBottom: '24px' }}>Your promotion reference is:</p>
          <div style={{ background: '#f0fdf4', border: '2px solid #1D9E75', borderRadius: '8px', padding: '16px', fontSize: '20px', fontWeight: 700, color: '#1D9E75', marginBottom: '24px', letterSpacing: '2px' }}>
            {promoRef}
          </div>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>
            We&apos;ll review and activate your promotion within 24 hours. You&apos;ll receive a confirmation email at <strong>{form.email}</strong>.
          </p>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '32px' }}>
            Save your PIN: <strong>{form.promoterPin}</strong> — you&apos;ll need it to access your promoter portal.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <a href="/promoter" style={{ display: 'block', background: '#1D9E75', color: 'white', padding: '14px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>
              Go to Promoter Portal →
            </a>
            <a href="/" style={{ display: 'block', color: '#1D9E75', padding: '14px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>
              Back to home
            </a>
          </div>
        </div>
      </div>
    )
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 14px',
    border: '1px solid #d0d0c8',
    borderRadius: '8px',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 600,
    color: '#333',
    marginBottom: '6px',
  }

  const fieldStyle: React.CSSProperties = {
    marginBottom: '20px',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '24px' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <a href="/" style={{ color: '#1D9E75', textDecoration: 'none', fontSize: '14px' }}>← Back</a>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: '12px 0 4px', color: '#111' }}>Launch a promotion</h1>
          <p style={{ color: '#888', fontSize: '14px' }}>Step {step} of 4</p>
          {/* Progress bar */}
          <div style={{ height: '4px', background: '#e5e7eb', borderRadius: '2px', marginTop: '12px' }}>
            <div style={{ height: '4px', background: '#1D9E75', borderRadius: '2px', width: `${(step / 4) * 100}%`, transition: 'width 0.3s' }} />
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>

          {/* ── STEP 1: Business details ── */}
          {step === 1 && (
            <>
              <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px', color: '#111' }}>Your business details</h2>
              <div style={fieldStyle}>
                <label style={labelStyle}>Company / brand name *</label>
                <input style={inputStyle} value={form.companyName} onChange={e => update('companyName', e.target.value)} placeholder="e.g. Mukwano Industries" />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Contact person name *</label>
                <input style={inputStyle} value={form.contactName} onChange={e => update('contactName', e.target.value)} placeholder="e.g. Sarah Nakato" />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Email address *</label>
                <input style={inputStyle} type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="sarah@company.com" />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Phone number *</label>
                <input style={inputStyle} type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+256 7XX XXX XXX" />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Promotion logo (optional)</label>
                <input type="file" accept="image/*" onChange={e => update('logo', e.target.files?.[0] || null)} style={{ fontSize: '14px' }} />
              </div>
            </>
          )}

          {/* ── STEP 2: Promotion details ── */}
          {step === 2 && (
            <>
              <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px', color: '#111' }}>Promotion details</h2>
              <div style={fieldStyle}>
                <label style={labelStyle}>Promotion name *</label>
                <input style={inputStyle} value={form.promoName} onChange={e => update('promoName', e.target.value)} placeholder="e.g. Win Big with Mukwano!" />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Minimum spend *</label>
                  <input style={inputStyle} type="number" value={form.minSpend} onChange={e => update('minSpend', e.target.value)} placeholder="e.g. 10000" />
                </div>
                <div style={{ width: '120px' }}>
                  <label style={labelStyle}>Currency *</label>
                  <select style={inputStyle} value={form.currency} onChange={e => update('currency', e.target.value)}>
                    {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Start date *</label>
                  <input style={inputStyle} type="date" value={form.startDate} onChange={e => update('startDate', e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>End date *</label>
                  <input style={inputStyle} type="date" value={form.endDate} onChange={e => update('endDate', e.target.value)} />
                </div>
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Draw date *</label>
                <input style={inputStyle} type="date" value={form.drawDate} onChange={e => update('drawDate', e.target.value)} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Prizes *</label>
                <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={form.prizes} onChange={e => update('prizes', e.target.value)} placeholder="e.g. 1st prize: UGX 1,000,000 cash&#10;2nd prize: Samsung TV&#10;10x consolation: Shopping vouchers" />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={labelStyle}>Emoji</label>
                  <select style={{ ...inputStyle, width: '80px' }} value={form.emoji} onChange={e => update('emoji', e.target.value)}>
                    {EMOJIS.map(e => <option key={e}>{e}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Colour</label>
                  <input type="color" value={form.color} onChange={e => update('color', e.target.value)} style={{ height: '42px', width: '100%', borderRadius: '8px', border: '1px solid #d0d0c8', cursor: 'pointer' }} />
                </div>
              </div>
            </>
          )}

          {/* ── STEP 3: Products & verification ── */}
          {step === 3 && (
            <>
              <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: '#111' }}>Products &amp; verification</h2>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>Tell the AI what to look for on receipts. The more specific, the better.</p>

              <div style={fieldStyle}>
                <label style={labelStyle}>Product keywords (optional)</label>
                <p style={{ fontSize: '13px', color: '#888', marginBottom: '8px' }}>Comma-separated words the AI will look for on receipts (product names, brands, categories)</p>
                <input style={inputStyle} value={form.productKeywords} onChange={e => update('productKeywords', e.target.value)} placeholder="e.g. Mukwano, cooking oil, soap, detergent" />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>Product barcodes (optional)</label>
                <p style={{ fontSize: '13px', color: '#888', marginBottom: '12px' }}>Add barcodes from your product packaging for more accurate AI verification</p>
                {form.productBarcodes.map((bc: string, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: '8px' }}>
                    <input
                      value={bc}
                      onChange={e => setBarcode(i, e.target.value.replace(/[^0-9]/g, ''))}
                      style={{ flex: 1, padding: '11px 14px', border: '1px solid #d0d0c8', borderRadius: '8px', fontSize: '15px' }}
                      placeholder="e.g. 5901234123457"
                      maxLength={20}
                    />
                    {form.productBarcodes.length > 1 && (
                      <button onClick={() => removeBarcode(i)} style={{ width: 32, height: 32, background: '#fee2e2', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#dc2626', fontWeight: 700, fontSize: '18px' }}>×</button>
                    )}
                  </div>
                ))}
                <button onClick={addBarcode} style={{ marginTop: '8px', padding: '8px 16px', background: '#f0fdf4', border: '1px solid #1D9E75', borderRadius: '8px', color: '#1D9E75', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
                  + Add barcode
                </button>
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>Set your promoter PIN *</label>
                <p style={{ fontSize: '13px', color: '#888', marginBottom: '8px' }}>You&apos;ll use this to log in to your promoter portal. Min 4 characters.</p>
                <input
                  style={inputStyle}
                  type="password"
                  value={form.promoterPin}
                  onChange={e => update('promoterPin', e.target.value)}
                  placeholder="Choose a PIN (min 4 characters)"
                  minLength={4}
                />
              </div>
            </>
          )}

          {/* ── STEP 4: Terms & Conditions ── */}
          {step === 4 && (
            <>
              <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: '#111' }}>Terms &amp; Conditions</h2>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>We&apos;ve pre-filled a UK CAP Code compliant template. Edit to match your promotion details.</p>
              <textarea
                style={{ ...inputStyle, minHeight: '320px', fontFamily: 'monospace', fontSize: '13px', resize: 'vertical' }}
                value={form.termsConditions}
                onChange={e => update('termsConditions', e.target.value)}
              />
            </>
          )}

          {/* Error */}
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '12px', color: '#dc2626', fontSize: '14px', marginTop: '16px' }}>
              {error}
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', gap: '12px' }}>
            {step > 1 && (
              <button onClick={prevStep} style={{ flex: 1, padding: '14px', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '15px', color: '#333' }}>
                ← Back
              </button>
            )}
            {step < 4 && (
              <button onClick={nextStep} style={{ flex: 1, padding: '14px', background: '#1D9E75', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '15px', color: 'white' }}>
                Next: {step === 1 ? 'Promotion details' : step === 2 ? 'Products & verification' : 'Terms & Conditions'} →
              </button>
            )}
            {step === 4 && (
              <button onClick={handleSubmit} disabled={submitting} style={{ flex: 1, padding: '14px', background: submitting ? '#9ca3af' : '#1D9E75', border: 'none', borderRadius: '8px', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '15px', color: 'white' }}>
                {submitting ? 'Submitting...' : 'Submit promotion →'}
              </button>
            )}
          </div>
        </div>

        {/* Footer link */}
        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#888' }}>
          Already have a promotion?{' '}
          <a href="/promoter" style={{ color: '#1D9E75', fontWeight: 600 }}>Manage it here →</a>
        </p>
      </div>
    </div>
  )
}
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface FormData {
  companyName: string
  contactName: string
  email: string
  phone: string
  promoName: string
  minSpend: string
  currency: string
  startDate: string
  endDate: string
  drawDate: string
  prizes: string
  productKeywords: string
  productBarcodes: string[]
  termsConditions: string
  promoterPin: string
  logo: File | null
  emoji: string
  color: string
}

const CURRENCIES = ['UGX', 'KES', 'TZS', 'USD', 'GBP', 'EUR', 'ZAR', 'NGN', 'GHS']

const EMOJIS = ['🛍', '🎁', '🏆', '🎯', '💰', '🎉', '🛒', '⭐', '🔥', '💎']

const DEFAULT_TERMS = `TERMS AND CONDITIONS

1. PROMOTER: [Company Name], [Address].

2. ELIGIBILITY: Open to residents of Uganda aged 18 and over. Employees of the promoter and their families are excluded.

3. HOW TO ENTER: Purchase the promoted product(s) with a minimum spend of [amount]. Upload your receipt via ReceiptRaffle. One entry per receipt. Multiple entries permitted with separate qualifying purchases.

4. PROMOTION PERIOD: [Start Date] to [End Date].

5. PRIZES: [List prizes here]. No cash alternative. Non-transferable.

6. DRAW: Winner(s) selected at random from all valid entries on [Draw Date]. Winners notified by phone/email within 7 days.

7. RECEIPT VERIFICATION: All receipts verified by AI. The promoter reserves the right to request original receipts. Fraudulent entries will be disqualified.

8. WINNER ANNOUNCEMENT: Winners published on [platform/social media] within 14 days of draw.

9. DATA: Entry data used only to administer this promotion and will not be shared with third parties.

10. DISPUTES: The promoter's decision is final. No correspondence will be entered into.`

export default function LaunchPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [promoRef, setPromoRef] = useState('')
  const [error, setError] = useState('')

  const [form, setForm] = useState<FormData>({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    promoName: '',
    minSpend: '',
    currency: 'UGX',
    startDate: '',
    endDate: '',
    drawDate: '',
    prizes: '',
    productKeywords: '',
    productBarcodes: [],
    termsConditions: DEFAULT_TERMS,
    promoterPin: '',
    logo: null,
    emoji: '🛍',
    color: '#1D9E75',
  })

  const update = (field: keyof FormData, value: string | string[] | File | null) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  // Barcode management functions
  const addBarcode = () => {
    setForm(prev => ({ ...prev, productBarcodes: [...prev.productBarcodes, ''] }))
  }

  const setBarcode = (index: number, value: string) => {
    setForm(prev => {
      const updated = [...prev.productBarcodes]
      updated[index] = value
      return { ...prev, productBarcodes: updated }
    })
  }

  const removeBarcode = (index: number) => {
    setForm(prev => {
      const updated = prev.productBarcodes.filter((_, i) => i !== index)
      return { ...prev, productBarcodes: updated }
    })
  }

  const nextStep = () => {
    setError('')
    if (step === 1) {
      if (!form.companyName || !form.contactName || !form.email || !form.phone) {
        setError('Please fill in all required fields.')
        return
      }
    }
    if (step === 2) {
      if (!form.promoName || !form.minSpend || !form.startDate || !form.endDate || !form.drawDate || !form.prizes) {
        setError('Please fill in all required fields.')
        return
      }
    }
    if (step === 3) {
      if (!form.promoterPin || form.promoterPin.length < 4) {
        setError('Please set a PIN of at least 4 characters.')
        return
      }
    }
    setStep(s => s + 1)
  }

  const prevStep = () => setStep(s => s - 1)

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      const formData = new FormData()
      Object.entries(form).forEach(([key, value]) => {
        if (key === 'logo' && value instanceof File) {
          formData.append('logo', value)
        } else if (key === 'productBarcodes') {
          formData.append('productBarcodes', JSON.stringify(value))
        } else if (value !== null && value !== undefined) {
          formData.append(key, String(value))
        }
      })

      const res = await fetch('/api/promotions', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Submission failed')

      setPromoRef(data.ref)
      setSubmitted(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ background: 'white', borderRadius: '16px', padding: '40px', maxWidth: '480px', width: '100%', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px', color: '#111' }}>Promotion submitted!</h1>
          <p style={{ color: '#666', marginBottom: '24px' }}>Your promotion reference is:</p>
          <div style={{ background: '#f0fdf4', border: '2px solid #1D9E75', borderRadius: '8px', padding: '16px', fontSize: '20px', fontWeight: 700, color: '#1D9E75', marginBottom: '24px', letterSpacing: '2px' }}>
            {promoRef}
          </div>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>
            We&apos;ll review and activate your promotion within 24 hours. You&apos;ll receive a confirmation email at <strong>{form.email}</strong>.
          </p>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '32px' }}>
            Save your PIN: <strong>{form.promoterPin}</strong> — you&apos;ll need it to access your promoter portal.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <a href="/promoter" style={{ display: 'block', background: '#1D9E75', color: 'white', padding: '14px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>
              Go to Promoter Portal →
            </a>
            <a href="/" style={{ display: 'block', color: '#1D9E75', padding: '14px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>
              Back to home
            </a>
          </div>
        </div>
      </div>
    )
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 14px',
    border: '1px solid #d0d0c8',
    borderRadius: '8px',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 600,
    color: '#333',
    marginBottom: '6px',
  }

  const fieldStyle: React.CSSProperties = {
    marginBottom: '20px',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '24px' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <a href="/" style={{ color: '#1D9E75', textDecoration: 'none', fontSize: '14px' }}>← Back</a>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: '12px 0 4px', color: '#111' }}>Launch a promotion</h1>
          <p style={{ color: '#888', fontSize: '14px' }}>Step {step} of 4</p>
          {/* Progress bar */}
          <div style={{ height: '4px', background: '#e5e7eb', borderRadius: '2px', marginTop: '12px' }}>
            <div style={{ height: '4px', background: '#1D9E75', borderRadius: '2px', width: `${(step / 4) * 100}%`, transition: 'width 0.3s' }} />
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>

          {/* ── STEP 1: Business details ── */}
          {step === 1 && (
            <>
              <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px', color: '#111' }}>Your business details</h2>
              <div style={fieldStyle}>
                <label style={labelStyle}>Company / brand name *</label>
                <input style={inputStyle} value={form.companyName} onChange={e => update('companyName', e.target.value)} placeholder="e.g. Mukwano Industries" />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Contact person name *</label>
                <input style={inputStyle} value={form.contactName} onChange={e => update('contactName', e.target.value)} placeholder="e.g. Sarah Nakato" />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Email address *</label>
                <input style={inputStyle} type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="sarah@company.com" />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Phone number *</label>
                <input style={inputStyle} type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+256 7XX XXX XXX" />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Promotion logo (optional)</label>
                <input type="file" accept="image/*" onChange={e => update('logo', e.target.files?.[0] || null)} style={{ fontSize: '14px' }} />
              </div>
            </>
          )}

          {/* ── STEP 2: Promotion details ── */}
          {step === 2 && (
            <>
              <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px', color: '#111' }}>Promotion details</h2>
              <div style={fieldStyle}>
                <label style={labelStyle}>Promotion name *</label>
                <input style={inputStyle} value={form.promoName} onChange={e => update('promoName', e.target.value)} placeholder="e.g. Win Big with Mukwano!" />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Minimum spend *</label>
                  <input style={inputStyle} type="number" value={form.minSpend} onChange={e => update('minSpend', e.target.value)} placeholder="e.g. 10000" />
                </div>
                <div style={{ width: '120px' }}>
                  <label style={labelStyle}>Currency *</label>
                  <select style={inputStyle} value={form.currency} onChange={e => update('currency', e.target.value)}>
                    {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Start date *</label>
                  <input style={inputStyle} type="date" value={form.startDate} onChange={e => update('startDate', e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>End date *</label>
                  <input style={inputStyle} type="date" value={form.endDate} onChange={e => update('endDate', e.target.value)} />
                </div>
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Draw date *</label>
                <input style={inputStyle} type="date" value={form.drawDate} onChange={e => update('drawDate', e.target.value)} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Prizes *</label>
                <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={form.prizes} onChange={e => update('prizes', e.target.value)} placeholder="e.g. 1st prize: UGX 1,000,000 cash&#10;2nd prize: Samsung TV&#10;10x consolation: Shopping vouchers" />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={labelStyle}>Emoji</label>
                  <select style={{ ...inputStyle, width: '80px' }} value={form.emoji} onChange={e => update('emoji', e.target.value)}>
                    {EMOJIS.map(e => <option key={e}>{e}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Colour</label>
                  <input type="color" value={form.color} onChange={e => update('color', e.target.value)} style={{ height: '42px', width: '100%', borderRadius: '8px', border: '1px solid #d0d0c8', cursor: 'pointer' }} />
                </div>
              </div>
            </>
          )}

          {/* ── STEP 3: Products & verification ── */}
          {step === 3 && (
            <>
              <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: '#111' }}>Products &amp; verification</h2>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>Tell the AI what to look for on receipts. The more specific, the better.</p>

              <div style={fieldStyle}>
                <label style={labelStyle}>Product keywords (optional)</label>
                <p style={{ fontSize: '13px', color: '#888', marginBottom: '8px' }}>Comma-separated words the AI will look for on receipts (product names, brands, categories)</p>
                <input style={inputStyle} value={form.productKeywords} onChange={e => update('productKeywords', e.target.value)} placeholder="e.g. Mukwano, cooking oil, soap, detergent" />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>Product barcodes (optional)</label>
                <p style={{ fontSize: '13px', color: '#888', marginBottom: '12px' }}>Add barcodes from your product packaging for more accurate AI verification</p>
                {form.productBarcodes.map((bc: string, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: '8px' }}>
                    <input
                      value={bc}
                      onChange={e => setBarcode(i, e.target.value.replace(/[^0-9]/g, ''))}
                      style={{ flex: 1, padding: '11px 14px', border: '1px solid #d0d0c8', borderRadius: '8px', fontSize: '15px' }}
                      placeholder="e.g. 5901234123457"
                      maxLength={20}
                    />
                    {form.productBarcodes.length > 1 && (
                      <button onClick={() => removeBarcode(i)} style={{ width: 32, height: 32, background: '#fee2e2', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#dc2626', fontWeight: 700, fontSize: '18px' }}>×</button>
                    )}
                  </div>
                ))}
                <button onClick={addBarcode} style={{ marginTop: '8px', padding: '8px 16px', background: '#f0fdf4', border: '1px solid #1D9E75', borderRadius: '8px', color: '#1D9E75', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
                  + Add barcode
                </button>
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>Set your promoter PIN *</label>
                <p style={{ fontSize: '13px', color: '#888', marginBottom: '8px' }}>You&apos;ll use this to log in to your promoter portal. Min 4 characters.</p>
                <input
                  style={inputStyle}
                  type="password"
                  value={form.promoterPin}
                  onChange={e => update('promoterPin', e.target.value)}
                  placeholder="Choose a PIN (min 4 characters)"
                  minLength={4}
                />
              </div>
            </>
          )}

          {/* ── STEP 4: Terms & Conditions ── */}
          {step === 4 && (
            <>
              <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: '#111' }}>Terms &amp; Conditions</h2>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>We&apos;ve pre-filled a UK CAP Code compliant template. Edit to match your promotion details.</p>
              <textarea
                style={{ ...inputStyle, minHeight: '320px', fontFamily: 'monospace', fontSize: '13px', resize: 'vertical' }}
                value={form.termsConditions}
                onChange={e => update('termsConditions', e.target.value)}
              />
            </>
          )}

          {/* Error */}
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '12px', color: '#dc2626', fontSize: '14px', marginTop: '16px' }}>
              {error}
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', gap: '12px' }}>
            {step > 1 && (
              <button onClick={prevStep} style={{ flex: 1, padding: '14px', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '15px', color: '#333' }}>
                ← Back
              </button>
            )}
            {step < 4 && (
              <button onClick={nextStep} style={{ flex: 1, padding: '14px', background: '#1D9E75', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '15px', color: 'white' }}>
                Next: {step === 1 ? 'Promotion details' : step === 2 ? 'Products & verification' : 'Terms & Conditions'} →
              </button>
            )}
            {step === 4 && (
              <button onClick={handleSubmit} disabled={submitting} style={{ flex: 1, padding: '14px', background: submitting ? '#9ca3af' : '#1D9E75', border: 'none', borderRadius: '8px', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '15px', color: 'white' }}>
                {submitting ? 'Submitting...' : 'Submit promotion →'}
              </button>
            )}
          </div>
        </div>

        {/* Footer link */}
        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#888' }}>
          Already have a promotion?{' '}
          <a href="/promoter" style={{ color: '#1D9E75', fontWeight: 600 }}>Manage it here →</a>
        </p>
      </div>
    </div>
  )
}
