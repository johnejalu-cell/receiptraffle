'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const DEFAULT_TCS = [
  'TERMS AND CONDITIONS',
  '',
  '1. PROMOTER',
  '[Company Name], [Registered Address], [Company Number].',
  '',
  '2. PROMOTION PERIOD',
  'This promotion runs from [Start Date] to [End Date]. The prize draw will take place on [Draw Date].',
  '',
  '3. ELIGIBILITY',
  'Open to residents of [Country/Region] aged 18 or over, except employees of the Promoter and their immediate families.',
  '',
  '4. HOW TO ENTER',
  'Purchase [Product Name] with a minimum spend of [Minimum Amount] during the promotion period. Upload your receipt at [URL] and complete the entry form. One entry per receipt. Maximum [X] entries per person.',
  '',
  '5. THE PRIZE',
  '[Describe prize(s) in full]. The prize is non-transferable and no cash alternative will be offered.',
  '',
  '6. WINNER SELECTION',
  'Winners will be selected by random draw from all valid entries on [Draw Date]. The Promoters decision is final.',
  '',
  '7. WINNER NOTIFICATION',
  'Winners will be contacted by phone or email within 14 days of the draw. If a winner cannot be contacted within 28 days, the Promoter reserves the right to select an alternative winner.',
  '',
  '8. PRIZE CLAIM',
  'The prize must be claimed within [X] days of notification. Failure to claim within this period may result in forfeiture.',
  '',
  '9. DATA PROTECTION',
  'Personal data collected will be used solely to administer this promotion and will not be shared with third parties except as required by law. Data will be deleted within 6 months of the promotion end date.',
  '',
  '10. GENERAL',
  'This promotion is subject to [Country] law. The Promoter reserves the right to amend or withdraw the promotion at any time. By entering, participants agree to these terms and conditions.',
  '',
  'Prepared in accordance with the CAP Code (UK Code of Non-broadcast Advertising and Sales Promotion) and the ASA guidelines on sales promotions.',
].join('\n')

export default function LaunchPage() {
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [ref, setRef] = useState('')
  const [error, setError] = useState('')
  const [fee, setFee] = useState<{ amount: number, currency: string, description: string } | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState('')
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoUrl, setLogoUrl] = useState('')

  const [form, setForm] = useState({
    companyName: '', contactName: '', email: '', phone: '', pin: '',
    promoName: '', description: '', minSpend: '', currency: 'USD', maxEntries: '3',
    startDate: '', endDate: '', drawDate: '',
    prizes: [''],
    productKeywords: [''],
    productBarcodes: [''],
    termsConditions: DEFAULT_TCS,
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

  function handleLogoFile(f: File) {
    setLogoFile(f)
    setLogoPreview(URL.createObjectURL(f))
  }

  async function uploadLogo(): Promise<string> {
    if (!logoFile) return ''
    setLogoUploading(true)
    try {
      const toBase64 = (f: File) => new Promise<string>((res, rej) => {
        const r = new FileReader()
        r.onload = () => res((r.result as string).split(',')[1])
        r.onerror = rej
        r.readAsDataURL(f)
      })
      const base64 = await toBase64(logoFile)
      const res = await fetch('/api/upload-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64, mediaType: logoFile.type || 'image/jpeg', fileName: logoFile.name })
      })
      const data = await res.json()
      setLogoUploading(false)
      if (data.error) {
        console.error('Logo upload error:', data.error)
        setError('Logo upload failed: ' + data.error + ' — continuing without logo')
        return ''
      }
      return data.url || ''
    } catch (e: any) {
      setLogoUploading(false)
      console.error('Logo upload exception:', e.message)
      return ''
    }
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError('')
    try {
      let finalLogoUrl = logoUrl
      if (logoFile && !logoUrl) {
        finalLogoUrl = await uploadLogo()
        setLogoUrl(finalLogoUrl)
      }
      const res = await fetch('/api/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: form.companyName,
          pin: form.pin,
          contactName: form.contactName,
          email: form.email,
          phone: form.phone,
          promoName: form.promoName,
          description: form.description,
          minSpend: form.minSpend,
          currency: form.currency,
          maxEntries: form.maxEntries,
          startDate: form.startDate,
          endDate: form.endDate,
          drawDate: form.drawDate,
          prizes: form.prizes.filter(Boolean),
          productKeywords: form.productKeywords.filter(Boolean),
          productBarcodes: form.productBarcodes.filter(Boolean),
          logoUrl: finalLogoUrl,
          termsConditions: form.termsConditions,
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
        <div style={{ background: '#E8F8F2', borderRadius: 12, padding: '1rem', marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#0F6E56', marginBottom: 4 }}>Your reference number</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#085041', letterSpacing: 2 }}>{ref}</div>
        </div>
        <div style={{ background: '#f5f5f0', borderRadius: 10, padding: '12px 16px', marginBottom: 24, fontSize: 13, color: '#444' }}>
          <strong>Keep your PIN safe.</strong> You will need your email address and PIN to access your promoter portal at <strong>receiptraffle-ygef.vercel.app/promoter</strong>
        </div>
        {fee && (
          <div style={{ background: '#FFF8E6', border: '1px solid #FAC775', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#633806', marginBottom: 20 }}>
            Our team will contact you to collect the promotion fee of <strong>{fee.currency} {fee.amount.toLocaleString()}</strong> before your promotion goes live.
            {fee.description && <div style={{ marginTop: 6, fontSize: 12 }}>{fee.description}</div>}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <Link href="/promoter" style={{ display: 'inline-block', padding: '12px 28px', background: '#1D9E75', color: '#fff', borderRadius: 10, fontWeight: 700, textDecoration: 'none' }}>
            Access your promoter portal →
          </Link>
          <Link href="/" style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>← Back to home</Link>
        </div>
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
          {[1, 2, 3, 4].map(s => (
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
              <div>
                <label style={labelStyle}>Set your portal PIN *</label>
                <p style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>Choose a 4-6 digit PIN you will use to access your promoter portal. Keep it safe.</p>
                <input style={inputStyle} type="password" inputMode="numeric" maxLength={6} value={form.pin} onChange={e => set('pin', e.target.value.replace(/\D/g, ''))} placeholder="e.g. 1234" />
              </div>

              {/* Logo upload */}
              <div>
                <label style={labelStyle}>Brand logo (optional)</label>
                <p style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>Shown next to your promotion. Square image works best. PNG or JPG.</p>
                {!logoPreview ? (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', border: '1.5px dashed #d0d0c8', borderRadius: 10, cursor: 'pointer', fontSize: 14, color: '#666' }}>
                    <span style={{ fontSize: 24 }}>🖼</span>
                    Upload logo
                    <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoFile(f) }} style={{ display: 'none' }} />
                  </label>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img src={logoPreview} alt="Logo preview" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 10, border: '1px solid #e5e5e0' }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1D9E75', marginBottom: 4 }}>✓ Logo uploaded</div>
                      <label style={{ fontSize: 12, color: '#888', cursor: 'pointer', textDecoration: 'underline' }}>
                        Change
                        <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoFile(f) }} style={{ display: 'none' }} />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <button onClick={() => { if (!form.companyName || !form.contactName || !form.email || !form.phone) { alert('Please fill in all required fields'); return } if (!form.pin || form.pin.length < 4) { alert('Please set a PIN of at least 4 digits'); return } setStep(2) }}
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
              <div>
                <label style={labelStyle}>Product barcodes (optional)</label>
                <p style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>Add the barcode numbers printed on your products. The AI will look for these on customer receipts for extra verification accuracy.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
                  {form.productBarcodes.map((bc: string, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input value={bc} onChange={e => setBarcode(i, e.target.value.replace(/[^0-9]/g, ''))} placeholder="e.g. 5012345678900" inputMode="numeric"
                        style={{ flex: 1, padding: '11px 14px', border: '1px solid #d0d0c8', borderRadius: 10, fontSize: 14, background: '#fff', fontFamily: 'monospace' }} />
                      {form.productBarcodes.length > 1 && (
                        <button onClick={() => removeBarcode(i)} style={{ width: 32, height: 32, background: '#FCEBEB', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 16, color: '#A32D2D', flexShrink: 0 }}>x</button>
                      )}
                    </div>
                  ))}
                </div>
                <button onClick={addBarcode} style={{ width: '100%', padding: '10px', background: '#fff', border: '1.5px dashed #d0d0c8', borderRadius: 10, fontSize: 14, color: '#666', cursor: 'pointer' }}>+ Add another barcode</button>
              </div>
              <div>
                <label style={labelStyle}>Minimum spend on promoted products *</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <select value={form.currency} onChange={e => set('currency', e.target.value)}
                    style={{ padding: '12px 10px', border: '1px solid #d0d0c8', borderRadius: 10, fontSize: 14, background: '#fff', flexShrink: 0 }}>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                    <option value="EUR">EUR</option>
                    <option value="UGX">UGX</option>
                    <option value="KES">KES</option>
                    <option value="NGN">NGN</option>
                    <option value="ZAR">ZAR</option>
                    <option value="GHS">GHS</option>
                    <option value="TZS">TZS</option>
                    <option value="AUD">AUD</option>
                    <option value="CAD">CAD</option>
                  </select>
                  <input style={{ ...inputStyle, flex: 1 }} type="number" value={form.minSpend} onChange={e => set('minSpend', e.target.value)} placeholder="e.g. 50" />
                </div>
              </div>
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
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(2)} style={{ flex: 1, padding: '13px', background: '#fff', color: '#1a1a18', border: '1px solid #d0d0c8', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>← Back</button>
              <button onClick={() => {
                if (form.prizes.filter(Boolean).length === 0) { alert('Please add at least one prize'); return }
                setStep(4)
              }} style={{ flex: 2, padding: '13px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                Next: Terms & Conditions →
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Terms & Conditions</h2>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
              We have pre-filled a template based on UK sales promotion regulations. Please review and edit all fields marked with [brackets] to match your promotion details. Customers will be able to read these before entering.
            </p>
            <div style={{ background: '#FFF8E6', border: '1px solid #FAC775', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#633806', marginBottom: 14 }}>
              Important: Replace all [bracketed] placeholders with your actual details before submitting.
            </div>
            <textarea
              value={form.termsConditions}
              onChange={e => set('termsConditions', e.target.value)}
              rows={20}
              style={{ width: '100%', padding: '12px 14px', border: '1px solid #d0d0c8', borderRadius: 10, fontSize: 13, background: '#fff', fontFamily: 'monospace', lineHeight: 1.6, resize: 'vertical' }}
            />

            {/* Summary */}
            <div style={{ background: '#fff', border: '1px solid #e5e5e0', borderRadius: 14, padding: '1.25rem', marginTop: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5 }}>Summary</div>
              {[
                ['Company', form.companyName],
                ['Promotion', form.promoName],
                ['Min spend', form.minSpend ? `${form.currency} ${form.minSpend}` : '—'],
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
              <button onClick={() => setStep(3)} style={{ flex: 1, padding: '13px', background: '#fff', color: '#1a1a18', border: '1px solid #d0d0c8', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>← Back</button>
              <button onClick={handleSubmit} disabled={submitting || logoUploading}
                style={{ flex: 2, padding: '13px', background: submitting || logoUploading ? '#9BA4B5' : '#1D9E75', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: submitting || logoUploading ? 'not-allowed' : 'pointer' }}>
                {logoUploading ? 'Uploading logo...' : submitting ? 'Submitting...' : 'Submit promotion'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
