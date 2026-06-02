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

export default function LaunchPage() {
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [promoRef, setPromoRef] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    companyName: '', contactName: '', email: '', phone: '',
    promoName: '', minSpend: '', currency: 'UGX',
    startDate: '', endDate: '', drawDate: '',
    prizes: '', productKeywords: '', productBarcodes: [] as string[],
    termsConditions: TERMS, promoterPin: '',
    logo: null as File | null, emoji: '🛍', color: '#1D9E75',
  })

  const set = (k: string, v: string | string[] | File | null) =>
    setForm(p => ({ ...p, [k]: v }))

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
    if (step === 2 && (!form.promoName || !form.minSpend || !form.startDate || !form.endDate || !form.drawDate || !form.prizes))
      return setError('Please fill in all required fields.')
    if (step === 3 && (!form.promoterPin || form.promoterPin.length < 4))
      return setError('Please set a PIN of at least 4 characters.')
    setStep(s => s + 1)
  }

  const submit = async () => {
    setSubmitting(true); setError('')
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'logo' && v instanceof File) fd.append('logo', v)
        else if (k === 'productBarcodes') fd.append('productBarcodes', JSON.stringify(v))
        else if (v !== null) fd.append(k, String(v))
      })
      const res = await fetch('/api/promotions', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Submission failed')
      setPromoRef(data.ref); setSubmitted(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally { setSubmitting(false) }
  }

  const inp: React.CSSProperties = { width:'100%', padding:'10px 12px', border:'1px solid #ccc', borderRadius:'8px', fontSize:'15px', boxSizing:'border-box' }
  const lbl: React.CSSProperties = { display:'block', fontWeight:600, fontSize:'14px', marginBottom:'5px', color:'#333' }
  const fld: React.CSSProperties = { marginBottom:'18px' }

  if (submitted) return (
    <div style={{ minHeight:'100vh', background:'#f9fafb', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}>
      <div style={{ background:'white', borderRadius:'16px', padding:'40px', maxWidth:'440px', width:'100%', textAlign:'center' }}>
        <div style={{ fontSize:'48px' }}>🎉</div>
        <h1 style={{ fontSize:'22px', fontWeight:700, margin:'12px 0 8px' }}>Promotion submitted!</h1>
        <p style={{ color:'#666', marginBottom:'16px' }}>Your reference:</p>
        <div style={{ background:'#f0fdf4', border:'2px solid #1D9E75', borderRadius:'8px', padding:'14px', fontSize:'20px', fontWeight:700, color:'#1D9E75', letterSpacing:'2px', marginBottom:'16px' }}>{promoRef}</div>
        <p style={{ color:'#666', fontSize:'14px', marginBottom:'6px' }}>Confirmation sent to <strong>{form.email}</strong></p>
        <p style={{ color:'#666', fontSize:'14px', marginBottom:'28px' }}>Your PIN: <strong>{form.promoterPin}</strong> — save this to access your promoter portal.</p>
        <a href="/promoter" style={{ display:'block', background:'#1D9E75', color:'white', padding:'13px', borderRadius:'8px', textDecoration:'none', fontWeight:600, marginBottom:'10px' }}>Go to Promoter Portal →</a>
        <a href="/" style={{ display:'block', color:'#1D9E75', padding:'10px', textDecoration:'none' }}>Back to home</a>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#f9fafb', padding:'24px' }}>
      <div style={{ maxWidth:'540px', margin:'0 auto' }}>
        <a href="/" style={{ color:'#1D9E75', fontSize:'14px', textDecoration:'none' }}>← Back</a>
        <h1 style={{ fontSize:'22px', fontWeight:700, margin:'10px 0 2px' }}>Launch a promotion</h1>
        <p style={{ color:'#888', fontSize:'14px', marginBottom:'8px' }}>Step {step} of 4</p>
        <div style={{ height:'4px', background:'#e5e7eb', borderRadius:'2px', marginBottom:'24px' }}>
          <div style={{ height:'4px', background:'#1D9E75', borderRadius:'2px', width:`${step*25}%`, transition:'width 0.3s' }} />
        </div>

        <div style={{ background:'white', borderRadius:'16px', padding:'28px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>

          {step === 1 && <>
            <h2 style={{ fontSize:'17px', fontWeight:700, marginBottom:'20px' }}>Your business details</h2>
            <div style={fld}><label style={lbl}>Company / brand name *</label><input style={inp} value={form.companyName} onChange={e=>set('companyName',e.target.value)} placeholder="e.g. Mukwano Industries" /></div>
            <div style={fld}><label style={lbl}>Contact person name *</label><input style={inp} value={form.contactName} onChange={e=>set('contactName',e.target.value)} /></div>
            <div style={fld}><label style={lbl}>Email address *</label><input style={inp} type="email" value={form.email} onChange={e=>set('email',e.target.value)} /></div>
            <div style={fld}><label style={lbl}>Phone number *</label><input style={inp} type="tel" value={form.phone} onChange={e=>set('phone',e.target.value)} /></div>
            <div style={fld}><label style={lbl}>Logo (optional)</label><input type="file" accept="image/*" onChange={e=>set('logo', e.target.files?.[0]||null)} /></div>
          </>}

          {step === 2 && <>
            <h2 style={{ fontSize:'17px', fontWeight:700, marginBottom:'20px' }}>Promotion details</h2>
            <div style={fld}><label style={lbl}>Promotion name *</label><input style={inp} value={form.promoName} onChange={e=>set('promoName',e.target.value)} placeholder="e.g. Win Big with Mukwano!" /></div>
            <div style={{ display:'flex', gap:'10px', marginBottom:'18px' }}>
              <div style={{ flex:1 }}><label style={lbl}>Minimum spend *</label><input style={inp} type="number" value={form.minSpend} onChange={e=>set('minSpend',e.target.value)} /></div>
              <div style={{ width:'110px' }}><label style={lbl}>Currency *</label>
                <select style={inp} value={form.currency} onChange={e=>set('currency',e.target.value)}>
                  {CURRENCIES.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display:'flex', gap:'10px', marginBottom:'18px' }}>
              <div style={{ flex:1 }}><label style={lbl}>Start date *</label><input style={inp} type="date" value={form.startDate} onChange={e=>set('startDate',e.target.value)} /></div>
              <div style={{ flex:1 }}><label style={lbl}>End date *</label><input style={inp} type="date" value={form.endDate} onChange={e=>set('endDate',e.target.value)} /></div>
            </div>
            <div style={fld}><label style={lbl}>Draw date *</label><input style={inp} type="date" value={form.drawDate} onChange={e=>set('drawDate',e.target.value)} /></div>
            <div style={fld}><label style={lbl}>Prizes *</label><textarea style={{...inp, minHeight:'80px', resize:'vertical'}} value={form.prizes} onChange={e=>set('prizes',e.target.value)} placeholder="1st: UGX 1,000,000&#10;2nd: Samsung TV" /></div>
            <div style={{ display:'flex', gap:'10px', marginBottom:'18px' }}>
              <div><label style={lbl}>Emoji</label>
                <select style={{...inp, width:'70px'}} value={form.emoji} onChange={e=>set('emoji',e.target.value)}>
                  {EMOJIS.map(e=><option key={e}>{e}</option>)}
                </select>
              </div>
              <div style={{ flex:1 }}><label style={lbl}>Colour</label><input type="color" value={form.color} onChange={e=>set('color',e.target.value)} style={{ height:'40px', width:'100%', borderRadius:'8px', border:'1px solid #ccc', cursor:'pointer' }} /></div>
            </div>
          </>}

          {step === 3 && <>
            <h2 style={{ fontSize:'17px', fontWeight:700, marginBottom:'8px' }}>Products &amp; verification</h2>
            <p style={{ color:'#666', fontSize:'14px', marginBottom:'20px' }}>Help the AI know what to look for on receipts.</p>
            <div style={fld}>
              <label style={lbl}>Product keywords (optional)</label>
              <p style={{ fontSize:'13px', color:'#888', marginBottom:'6px' }}>Comma-separated — brand names, product names</p>
              <input style={inp} value={form.productKeywords} onChange={e=>set('productKeywords',e.target.value)} placeholder="e.g. Mukwano, cooking oil, soap" />
            </div>
            <div style={fld}>
              <label style={lbl}>Product barcodes (optional)</label>
              <p style={{ fontSize:'13px', color:'#888', marginBottom:'8px' }}>Add barcodes from your product packaging</p>
              {form.productBarcodes.map((bc, i) => (
                <div key={i} style={{ display:'flex', gap:'8px', marginBottom:'8px', alignItems:'center' }}>
                  <input value={bc} onChange={e=>setBarcode(i, e.target.value.replace(/[^0-9]/g,''))} style={{ flex:1, padding:'10px 12px', border:'1px solid #ccc', borderRadius:'8px', fontSize:'15px' }} placeholder="e.g. 5901234123457" maxLength={20} />
                  {form.productBarcodes.length > 1 && (
                    <button onClick={()=>removeBarcode(i)} style={{ width:'32px', height:'32px', background:'#fee2e2', border:'none', borderRadius:'6px', cursor:'pointer', color:'#dc2626', fontWeight:700, fontSize:'18px' }}>×</button>
                  )}
                </div>
              ))}
              <button onClick={addBarcode} style={{ marginTop:'6px', padding:'8px 14px', background:'#f0fdf4', border:'1px solid #1D9E75', borderRadius:'8px', color:'#1D9E75', cursor:'pointer', fontSize:'14px', fontWeight:600 }}>+ Add barcode</button>
            </div>
            <div style={fld}>
              <label style={lbl}>Set your promoter PIN *</label>
              <p style={{ fontSize:'13px', color:'#888', marginBottom:'6px' }}>You will use this to log in to your promoter portal. Min 4 characters.</p>
              <input style={inp} type="password" value={form.promoterPin} onChange={e=>set('promoterPin',e.target.value)} placeholder="Choose a PIN (min 4 characters)" />
            </div>
          </>}

          {step === 4 && <>
            <h2 style={{ fontSize:'17px', fontWeight:700, marginBottom:'8px' }}>Terms &amp; Conditions</h2>
            <p style={{ color:'#666', fontSize:'14px', marginBottom:'14px' }}>Edit the template below to match your promotion.</p>
            <textarea style={{...inp, minHeight:'300px', fontFamily:'monospace', fontSize:'13px', resize:'vertical'}} value={form.termsConditions} onChange={e=>set('termsConditions',e.target.value)} />
          </>}

          {error && <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:'8px', padding:'12px', color:'#dc2626', fontSize:'14px', marginTop:'14px' }}>{error}</div>}

          <div style={{ display:'flex', gap:'10px', marginTop:'28px' }}>
            {step > 1 && <button onClick={()=>setStep(s=>s-1)} style={{ flex:1, padding:'13px', background:'#f3f4f6', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:600, fontSize:'15px' }}>← Back</button>}
            {step < 4 && <button onClick={next} style={{ flex:1, padding:'13px', background:'#1D9E75', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:600, fontSize:'15px', color:'white' }}>
              {step===1?'Next: Promotion details →':step===2?'Next: Products & verification →':'Next: Terms & Conditions →'}
            </button>}
            {step === 4 && <button onClick={submit} disabled={submitting} style={{ flex:1, padding:'13px', background:submitting?'#9ca3af':'#1D9E75', border:'none', borderRadius:'8px', cursor:submitting?'not-allowed':'pointer', fontWeight:700, fontSize:'15px', color:'white' }}>
              {submitting?'Submitting...':'Submit promotion →'}
            </button>}
          </div>
        </div>

        <p style={{ textAlign:'center', marginTop:'20px', fontSize:'14px', color:'#888' }}>
          Already have a promotion? <a href="/promoter" style={{ color:'#1D9E75', fontWeight:600 }}>Manage it here →</a>
        </p>
      </div>
    </div>
  )
}
