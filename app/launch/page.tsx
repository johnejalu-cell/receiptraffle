'use client'
import { useState } from 'react'

const CURRENCIES = ['UGX','KES','TZS','USD','GBP','EUR','ZAR','NGN','GHS']
const EMOJIS = ['🛍','🎁','🏆','🎯','💰','🎉','🛒','⭐','🔥','💎']
const TERMS = `TERMS AND CONDITIONS

1. PROMOTER: [Company Name], [Address].
2. ELIGIBILITY: Open to residents aged 18+. Staff excluded.
3. HOW TO ENTER: Purchase promoted product(s) meeting minimum spend. Upload receipt via ReceiptRaffle. One entry per receipt.
4. PROMOTION PERIOD: [Start Date] to [End Date].
5. PRIZES: [List prizes]. No cash alternative. Non-transferable.
6. DRAW: Winners selected at random on [Draw Date]. Notified within 7 days.
7. VERIFICATION: All receipts verified by AI. Fraudulent entries disqualified.
8. DATA: Entry data used only to administer this promotion.
9. DISPUTES: The promoter's decision is final.`

const COUNTRIES = [
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

const TIERS = [
  { value: 'starter', label: 'Starter — up to 500 entries/month', standard: '$129/mo', emerging: '$51/mo' },
  { value: 'growth', label: 'Growth — up to 2,000 entries/month', standard: '$259/mo', emerging: '$103/mo' },
  { value: 'professional', label: 'Professional — up to 5,000 entries/month', standard: '$454/mo', emerging: '$181/mo' },
  { value: 'enterprise', label: 'Enterprise — up to 20,000 entries/month', standard: '$779/mo', emerging: '$311/mo' },
  { value: 'custom', label: 'Custom — more than 20,000 entries/month', standard: 'Quote', emerging: 'Quote' },
]

interface Prize { position: string; description: string }

export default function LaunchPage() {
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [promoRef, setPromoRef] = useState('')
  const [error, setError] = useState('')
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [prizes, setPrizes] = useState<Prize[]>([{ position: '1st prize', description: '' }])
  const [countrySearch, setCountrySearch] = useState('')
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [form, setForm] = useState({
    companyName: '', contactName: '', email: '', phone: '',
    country: '', countryDisplay: '',
    promoName: '', minSpend: '', currency: 'USD',
    startDate: '', endDate: '', drawDate: '',
    entryBudgetTier: '',
    productKeywords: '', productBarcodes: [] as string[],
    termsConditions: TERMS, promoterPin: '',
    logo: null as File | null, emoji: '🛍', color: '#1D9E75',
  })

  const set = (k: string, v: string | string[] | File | null) =>
    setForm(p => ({ ...p, [k]: v }))

  const handleLogo = (file: File | null) => {
    set('logo', file)
    if (file) {
      const reader = new FileReader()
      reader.onload = e => setLogoPreview(e.target?.result as string)
      reader.readAsDataURL(file)
    } else { setLogoPreview(null) }
  }

  const selectCountry = (code: string, name: string, flag: string) => {
    setForm(p => ({ ...p, country: code, countryDisplay: `${flag} ${name}` }))
    setCountrySearch(`${flag} ${name}`)
    setShowCountryDropdown(false)
  }

  const filteredCountries = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(countrySearch.replace(/[^\w\s]/g, '').trim().toLowerCase())
  )

  const addPrize = () => setPrizes(p => [...p, { position: `${p.length + 1}${ordinal(p.length + 1)} prize`, description: '' }])
  const updatePrize = (i: number, field: keyof Prize, val: string) =>
    setPrizes(p => p.map((prize, n) => n === i ? { ...prize, [field]: val } : prize))
  const removePrize = (i: number) => setPrizes(p => p.filter((_, n) => n !== i))

  function ordinal(n: number) {
    if (n === 1) return 'st'; if (n === 2) return 'nd'; if (n === 3) return 'rd'; return 'th'
  }

  const addBarcode = () => set('productBarcodes', [...form.productBarcodes, ''])
  const setBarcode = (i: number, v: string) => {
    const b = [...form.productBarcodes]; b[i] = v; set('productBarcodes', b)
  }
  const removeBarcode = (i: number) =>
    set('productBarcodes', form.productBarcodes.filter((_, n) => n !== i))

  const next = () => {
    setError('')
    if (step === 1 && (!form.companyName || !form.contactName || !form.email || !form.phone))
      return setError('Please fill in all required fields.')
    if (step === 1 && !form.country)
      return setError('Please select your country.')
    if (step === 2 && (!form.promoName || !form.minSpend || !form.startDate || !form.endDate || !form.drawDate))
      return setError('Please fill in all required fields.')
    if (step === 2 && prizes.every(p => !p.description))
      return setError('Please add at least one prize.')
    if (step === 2 && !form.entryBudgetTier)
      return setError('Please select an entry budget tier.')
    if (step === 3 && (!form.promoterPin || form.promoterPin.length < 4))
      return setError('Please set a PIN of at least 4 characters.')
    setStep(s => s + 1)
  }

  const submit = async () => {
    setSubmitting(true); setError('')
    try {
      const prizesText = prizes.filter(p => p.description).map(p => `${p.position}: ${p.description}`).join('\n')
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'logo' && v instanceof File) fd.append('logo', v)
        else if (k === 'productBarcodes') fd.append('productBarcodes', JSON.stringify(v))
        else if (k === 'countryDisplay') return
        else if (v !== null) fd.append(k, String(v))
      })
      fd.append('prizes', prizesText)
      const res = await fetch('/api/promotions', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Submission failed')
      setPromoRef(data.ref); setSubmitted(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally { setSubmitting(false) }
  }

  const selectedTier = TIERS.find(t => t.value === form.entryBudgetTier)
  const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid #ccc', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '5px', color: '#333' }
  const fld: React.CSSProperties = { marginBottom: '18px' }

  if (submitted) return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: 'white', borderRadius: '16px', padding: '40px', maxWidth: '440px', width: '100%', textAlign: 'center', boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: '48px' }}>🎉</div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, margin: '12px 0 8px' }}>Promotion submitted!</h1>
        <p style={{ color: '#666', marginBottom: '16px' }}>Your reference:</p>
        <div style={{ background: '#f0fdf4', border: '2px solid #1D9E75', borderRadius: '8px', padding: '14px', fontSize: '20px', fontWeight: 700, color: '#1D9E75', letterSpacing: '2px', marginBottom: '16px' }}>{promoRef}</div>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '6px' }}>We will review your submission within 24 hours and send a confirmation and invoice to <strong>{form.email}</strong>.</p>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '28px' }}>Your PIN: <strong>{form.promoterPin}</strong> — save this to access your promoter portal once your promotion goes live.</p>
        <a href="/promoter" style={{ display: 'block', background: '#1D9E75', color: 'white', padding: '13px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, marginBottom: '10px' }}>Go to Promoter Portal →</a>
        <a href="/" style={{ display: 'block', color: '#1D9E75', padding: '10px', textDecoration: 'none' }}>Back to home</a>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '24px' }}>
      <div style={{ maxWidth: '540px', margin: '0 auto' }}>
        <a href="/" style={{ color: '#1D9E75', fontSize: '14px', textDecoration: 'none' }}>← Back</a>
        <h1 style={{ fontSize: '22px', fontWeight: 700, margin: '10px 0 2px' }}>Launch a promotion</h1>
        <p style={{ color: '#888', fontSize: '14px', marginBottom: '8px' }}>Step {step} of 4</p>
        <div style={{ height: '4px', background: '#e5e7eb', borderRadius: '2px', marginBottom: '24px' }}>
          <div style={{ height: '4px', background: '#1D9E75', borderRadius: '2px', width: `${step * 25}%`, transition: 'width 0.3s' }} />
        </div>

        <div style={{ background: 'white', borderRadius: '16px', padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>

          {/* STEP 1 */}
          {step === 1 && <>
            <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '20px' }}>Your business details</h2>
            <div style={fld}><label style={lbl}>Company / brand name *</label><input style={inp} value={form.companyName} onChange={e => set('companyName', e.target.value)} placeholder="Your company name" /></div>
            <div style={fld}><label style={lbl}>Contact person name *</label><input style={inp} value={form.contactName} onChange={e => set('contactName', e.target.value)} placeholder="Full name" /></div>
            <div style={fld}><label style={lbl}>Email address *</label><input style={inp} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="your@email.com" /></div>
            <div style={fld}><label style={lbl}>Phone number *</label><input style={inp} type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+1 234 567 8900" /></div>

            {/* Country selector */}
            <div style={{ ...fld, position: 'relative' }}>
              <label style={lbl}>Country *</label>
              <p style={{ fontSize: '13px', color: '#888', marginBottom: '6px' }}>The country where your promotion will run</p>
              <input
                value={countrySearch}
                onChange={e => { setCountrySearch(e.target.value); setShowCountryDropdown(true) }}
                onFocus={() => setShowCountryDropdown(true)}
                placeholder="🔍 Type or select your country..."
                style={inp}
              />
              {showCountryDropdown && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', borderRadius: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', zIndex: 100, maxHeight: '200px', overflowY: 'auto', border: '1px solid #e5e7eb', marginTop: '4px' }}>
                  {filteredCountries.map(country => (
                    <div key={country.code} onClick={() => selectCountry(country.code, country.name, country.flag)} style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #f9fafb', background: form.country === country.code ? '#f0fdf4' : 'white', fontSize: '14px' }}>
                      <span>{country.flag}</span>
                      <span style={{ fontWeight: form.country === country.code ? 700 : 400 }}>{country.name}</span>
                      {form.country === country.code && <span style={{ marginLeft: 'auto', color: '#1D9E75' }}>✓</span>}
                    </div>
                  ))}
                </div>
              )}
              {showCountryDropdown && <div onClick={() => setShowCountryDropdown(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />}
            </div>

            <div style={fld}>
              <label style={lbl}>Logo (optional)</label>
              <input type="file" accept="image/*" onChange={e => handleLogo(e.target.files?.[0] || null)} style={{ fontSize: '14px', marginBottom: '10px' }} />
              {logoPreview && (
                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src={logoPreview} alt="Logo preview" style={{ width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e5e7eb' }} />
                  <button onClick={() => handleLogo(null)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Remove</button>
                </div>
              )}
            </div>
          </>}

          {/* STEP 2 */}
          {step === 2 && <>
            <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '20px' }}>Promotion details</h2>
            <div style={fld}><label style={lbl}>Promotion name *</label><input style={inp} value={form.promoName} onChange={e => set('promoName', e.target.value)} placeholder="e.g. Win Big This Summer!" /></div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
              <div style={{ flex: 1 }}><label style={lbl}>Minimum spend *</label><input style={inp} type="number" value={form.minSpend} onChange={e => set('minSpend', e.target.value)} placeholder="e.g. 20" /></div>
              <div style={{ width: '110px' }}><label style={lbl}>Currency *</label>
                <select style={inp} value={form.currency} onChange={e => set('currency', e.target.value)}>
                  {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
              <div style={{ flex: 1 }}><label style={lbl}>Start date *</label><input style={inp} type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} /></div>
              <div style={{ flex: 1 }}><label style={lbl}>End date *</label><input style={inp} type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} /></div>
            </div>
            <div style={fld}><label style={lbl}>Draw date *</label><input style={inp} type="date" value={form.drawDate} onChange={e => set('drawDate', e.target.value)} /></div>

            <div style={fld}>
              <label style={lbl}>Prizes *</label>
              {prizes.map((prize, i) => (
                <div key={i} style={{ background: '#f9fafb', borderRadius: '10px', padding: '14px', marginBottom: '10px', border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                    <input value={prize.position} onChange={e => updatePrize(i, 'position', e.target.value)} style={{ ...inp, fontWeight: 600, background: 'white' }} placeholder="e.g. 1st prize" />
                    {prizes.length > 1 && <button onClick={() => removePrize(i)} style={{ width: '32px', height: '32px', background: '#fee2e2', border: 'none', borderRadius: '6px', color: '#dc2626', cursor: 'pointer', fontWeight: 700, fontSize: '18px', flexShrink: 0 }}>×</button>}
                  </div>
                  <input value={prize.description} onChange={e => updatePrize(i, 'description', e.target.value)} style={{ ...inp, background: 'white' }} placeholder="Describe the prize, e.g. $500 cash, return flights, Samsung TV" />
                </div>
              ))}
              <button onClick={addPrize} style={{ padding: '8px 14px', background: '#f0fdf4', border: '1px solid #1D9E75', borderRadius: '8px', color: '#1D9E75', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>+ Add another prize</button>
            </div>

            <div style={fld}>
              <label style={lbl}>How many entries do you wish to budget for? *</label>
              <p style={{ fontSize: '13px', color: '#888', marginBottom: '10px' }}>This sets your pricing tier. If you are unsure, start with Starter — you can discuss with us before going live.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {TIERS.map(tier => (
                  <div key={tier.value} onClick={() => set('entryBudgetTier', tier.value)} style={{ border: `2px solid ${form.entryBudgetTier === tier.value ? '#1D9E75' : '#e5e7eb'}`, borderRadius: '10px', padding: '12px 16px', cursor: 'pointer', background: form.entryBudgetTier === tier.value ? '#f0fdf4' : 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: '#111' }}>{tier.label}</div>
                      <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>Standard: {tier.standard} · Emerging: {tier.emerging}</div>
                    </div>
                    {form.entryBudgetTier === tier.value && <div style={{ color: '#1D9E75', fontWeight: 700, fontSize: '18px', flexShrink: 0 }}>✓</div>}
                  </div>
                ))}
              </div>
              {selectedTier && (
                <div style={{ marginTop: '12px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#15803d' }}>
                  First 500 entries included free. Additional entries at $10 per 1,000. Our team will confirm your exact pricing on review.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
              <div><label style={lbl}>Emoji</label>
                <select style={{ ...inp, width: '70px' }} value={form.emoji} onChange={e => set('emoji', e.target.value)}>
                  {EMOJIS.map(e => <option key={e}>{e}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}><label style={lbl}>Colour</label>
                <input type="color" value={form.color} onChange={e => set('color', e.target.value)} style={{ height: '40px', width: '100%', borderRadius: '8px', border: '1px solid #ccc', cursor: 'pointer' }} />
              </div>
            </div>
          </>}

          {/* STEP 3 */}
          {step === 3 && <>
            <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px' }}>Products &amp; verification</h2>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>Help the AI know what to look for on receipts.</p>
            <div style={fld}>
              <label style={lbl}>Product keywords (optional)</label>
              <p style={{ fontSize: '13px', color: '#888', marginBottom: '6px' }}>Comma-separated — brand names, product names the AI should look for</p>
              <input style={inp} value={form.productKeywords} onChange={e => set('productKeywords', e.target.value)} placeholder="e.g. Brand X, product name, category" />
            </div>
            <div style={fld}>
              <label style={lbl}>Product barcodes (optional)</label>
              <p style={{ fontSize: '13px', color: '#888', marginBottom: '8px' }}>Add barcodes from your product packaging for more accurate verification</p>
              {form.productBarcodes.map((bc, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                  <input value={bc} onChange={e => setBarcode(i, e.target.value.replace(/[^0-9]/g, ''))} style={{ flex: 1, padding: '10px 12px', border: '1px solid #ccc', borderRadius: '8px', fontSize: '15px' }} placeholder="e.g. 5901234123457" maxLength={20} />
                  <button onClick={() => removeBarcode(i)} style={{ width: '32px', height: '32px', background: '#fee2e2', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#dc2626', fontWeight: 700, fontSize: '18px' }}>×</button>
                </div>
              ))}
              <button onClick={addBarcode} style={{ marginTop: '6px', padding: '8px 14px', background: '#f0fdf4', border: '1px solid #1D9E75', borderRadius: '8px', color: '#1D9E75', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>+ Add barcode</button>
            </div>
            <div style={fld}>
              <label style={lbl}>Set your promoter PIN *</label>
              <p style={{ fontSize: '13px', color: '#888', marginBottom: '6px' }}>You will use this to log in to your promoter portal. Min 4 characters.</p>
              <input style={inp} type="password" value={form.promoterPin} onChange={e => set('promoterPin', e.target.value)} placeholder="Choose a PIN (min 4 characters)" />
            </div>
          </>}

          {/* STEP 4 */}
          {step === 4 && <>
            <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px' }}>Terms &amp; Conditions</h2>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '14px' }}>Edit the template below to match your promotion.</p>
            <textarea style={{ ...inp, minHeight: '300px', fontFamily: 'monospace', fontSize: '13px', resize: 'vertical' }} value={form.termsConditions} onChange={e => set('termsConditions', e.target.value)} />
          </>}

          {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '12px', color: '#dc2626', fontSize: '14px', marginTop: '14px' }}>{error}</div>}

          <div style={{ display: 'flex', gap: '10px', marginTop: '28px' }}>
            {step > 1 && <button onClick={() => setStep(s => s - 1)} style={{ flex: 1, padding: '13px', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '15px' }}>← Back</button>}
            {step < 4 && <button onClick={next} style={{ flex: 1, padding: '13px', background: '#1D9E75', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '15px', color: 'white' }}>
              {step === 1 ? 'Next: Promotion details →' : step === 2 ? 'Next: Products & verification →' : 'Next: Terms & Conditions →'}
            </button>}
            {step === 4 && <button onClick={submit} disabled={submitting} style={{ flex: 1, padding: '13px', background: submitting ? '#9ca3af' : '#1D9E75', border: 'none', borderRadius: '8px', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '15px', color: 'white' }}>
              {submitting ? 'Submitting...' : 'Submit promotion →'}
            </button>}
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#888' }}>
          Already have a promotion? <a href="/promoter" style={{ color: '#1D9E75', fontWeight: 600 }}>Manage it here →</a>
        </p>
      </div>
    </div>
  )
}
