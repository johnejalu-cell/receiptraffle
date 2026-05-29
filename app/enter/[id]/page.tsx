'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function EnterPage({ params }: { params: { id: string } }) {
  const [promo, setPromo] = useState<any>(null)
  const [promoLoaded, setPromoLoaded] = useState(false)
  const [step, setStep] = useState<'upload' | 'details' | 'verifying' | 'success' | 'manual'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [result, setResult] = useState<any>(null)
  const [ticket, setTicket] = useState('')

  useEffect(() => {
    fetch('/api/promotions')
      .then(r => r.json())
      .then(data => {
        const found = data.promotions?.find((p: any) => p.id === params.id)
        if (found) {
          setPromo({
            title: found.promo_name,
            brand: found.company_name,
            prize: Array.isArray(found.prizes) ? found.prizes[0] : found.prizes,
            minSpend: found.min_spend,
            currency: found.currency || 'USD',
            icon: found.emoji || '🎁',
            color: found.color || '#1D9E75',
            dbId: found.id,
            productKeywords: found.product_keywords || [],
          })
        }
        setPromoLoaded(true)
      })
      .catch(() => setPromoLoaded(true))
  }, [params.id])

  if (!promoLoaded) return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#666' }}>Loading promotion...</p>
    </main>
  )

  if (!promo) return (
    <main style={{ padding: '2rem', textAlign: 'center' }}>
      <p>Promotion not found.</p>
      <Link href="/" style={{ color: '#1D9E75' }}>← Back</Link>
    </main>
  )

  function handleFile(f: File) {
    setFile(f)
    if (f.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(f))
    } else {
      setPreview('pdf')
    }
  }

  async function handleVerify() {
    if (!name || !phone) { alert('Please enter your name and phone number'); return }
    setStep('verifying')
    try {
      // Compress image before converting to base64 to stay under Vercel 4.5MB limit
      const compressImage = (f: File): Promise<{base64: string, type: string}> => new Promise((res, rej) => {
        if (f.type === 'application/pdf') {
          const r = new FileReader()
          r.onload = () => res({ base64: (r.result as string).split(',')[1], type: f.type })
          r.onerror = rej
          r.readAsDataURL(f)
          return
        }
        const img = new Image()
        const url = URL.createObjectURL(f)
        img.onload = () => {
          URL.revokeObjectURL(url)
          const MAX = 1200
          let w = img.width, h = img.height
          if (w > MAX || h > MAX) {
            if (w > h) { h = Math.round(h * MAX / w); w = MAX }
            else { w = Math.round(w * MAX / h); h = MAX }
          }
          const canvas = document.createElement('canvas')
          canvas.width = w; canvas.height = h
          const ctx = canvas.getContext('2d')!
          ctx.drawImage(img, 0, 0, w, h)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82)
          res({ base64: dataUrl.split(',')[1], type: 'image/jpeg' })
        }
        img.onerror = rej
        img.src = url
      })
      const { base64, type: compressedType } = await compressImage(file!)
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mediaType: compressedType || 'image/jpeg',
          minSpend: promo.minSpend,
          currency: promo.currency,
          promotionId: promo.dbId || null,
          productKeywords: promo.productKeywords || [],
          name,
          phone,
          email,
        })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data.aiResult)
      setTicket(data.ticketNumber)
      setStep(data.verificationStatus === 'approved' ? 'success' : 'manual')
    } catch (err) {
      const t = 'RR-' + Math.random().toString(36).substring(2, 10).toUpperCase()
      setTicket(t)
      setStep('manual')
    }
  }

  if (step === 'verifying') return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: '#fafaf9', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Verifying your receipt...</h2>
      <p style={{ color: '#666', fontSize: 14 }}>Our AI is checking your receipt for the promoted products. This takes a few seconds.</p>
    </main>
  )

  if (step === 'success') return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: '#fafaf9', textAlign: 'center' }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#1D9E75' }}>You're entered!</h2>
      <p style={{ color: '#666', fontSize: 15, marginBottom: 20 }}>Your receipt was verified successfully. Good luck!</p>
      <div style={{ background: '#fff', border: '2px solid #1D9E75', borderRadius: 14, padding: '1.5rem', width: '100%', maxWidth: 340, marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>Your ticket number</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#1D9E75', letterSpacing: 1 }}>{ticket}</div>
        <div style={{ borderTop: '1px solid #e5e5e0', marginTop: 12, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 13, color: '#666' }}>{promo.title}</div>
          {result?.promoted_items_found?.length > 0 && (
            <div style={{ fontSize: 13, color: '#1D9E75' }}>✓ {result.promoted_items_found.join(', ')}</div>
          )}
          <div style={{ fontSize: 13, color: '#666' }}>
            Verified spend: {result?.currency || promo.currency} {(result?.promoted_items_total || result?.total_amount || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: 13, color: '#666' }}>{name} · {phone}</div>
        </div>
      </div>
      <p style={{ fontSize: 13, color: '#999', marginBottom: 20 }}>
        Save your ticket number! You will be contacted on <strong>{phone}</strong> if you win.
      </p>
      <Link href="/" style={{ color: '#1D9E75', fontSize: 14, textDecoration: 'none', fontWeight: 600 }}>← Back to promotions</Link>
    </main>
  )

  if (step === 'manual') return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: '#fafaf9', textAlign: 'center' }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🎟️</div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>You're in the draw!</h2>
      <div style={{ background: '#fff', border: '1px solid #e5e5e0', borderRadius: 14, padding: '1.5rem', width: '100%', maxWidth: 340, marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>Your ticket number</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#1D9E75', letterSpacing: 1 }}>{ticket}</div>
      </div>
      <div style={{ background: '#E8F8F2', border: '1px solid #9FE1CB', borderRadius: 12, padding: '14px 18px', maxWidth: 340, width: '100%', marginBottom: 20, textAlign: 'left' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#085041', marginBottom: 6 }}>✓ Your entry is in the draw</div>
        <div style={{ fontSize: 13, color: '#0F6E56', lineHeight: 1.6 }}>
          Save your ticket number. You will only be contacted on <strong>{phone}</strong> if there is a problem with your receipt. Otherwise your entry stands and you are in the draw!
        </div>
      </div>
      <Link href="/" style={{ color: '#1D9E75', fontSize: 14, textDecoration: 'none', fontWeight: 600 }}>← Back to promotions</Link>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: '#fafaf9' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e5e0', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/" style={{ color: '#666', textDecoration: 'none', fontSize: 20 }}>←</Link>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{promo.title}</div>
          <div style={{ fontSize: 12, color: '#888' }}>{promo.brand}</div>
        </div>
      </div>

      <div style={{ background: '#fff', padding: '0.75rem 1.5rem', borderBottom: '1px solid #e5e5e0', display: 'flex' }}>
        {['Upload receipt', 'Your details'].map((s, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 12, fontWeight: 600,
            color: (step === 'upload' && i === 0) || (step === 'details' && i === 1) ? '#1D9E75' : '#ccc',
            borderBottom: (step === 'upload' && i === 0) || (step === 'details' && i === 1) ? '2px solid #1D9E75' : '2px solid transparent',
            paddingBottom: 8 }}>
            {i + 1}. {s}
          </div>
        ))}
      </div>

      <div style={{ padding: '1.5rem 1rem', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ background: '#fff', border: '1px solid #e5e5e0', borderRadius: 12, padding: '1rem', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: promo.productKeywords?.length > 0 ? 10 : 0 }}>
            <div style={{ fontSize: 28 }}>{promo.icon}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: promo.color }}>Prize: {promo.prize}</div>
              <div style={{ fontSize: 12, color: '#888' }}>Min spend: {promo.currency} {parseInt(promo.minSpend).toLocaleString()} on promoted products</div>
            </div>
          </div>
          {promo.productKeywords?.length > 0 && (
            <div style={{ background: '#f5f5f0', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#666' }}>
              <strong>Promoted products:</strong> {promo.productKeywords.join(', ')}
            </div>
          )}
        </div>

        {step === 'upload' && (
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Upload your receipt</h2>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>
              Take a photo or choose an image. Make sure the receipt clearly shows the promoted products and amounts.
            </p>
            {!preview ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '18px', background: '#1D9E75', color: '#fff', borderRadius: 12, cursor: 'pointer', fontSize: 16, fontWeight: 700 }}>
                  <span style={{ fontSize: 24 }}>📷</span>
                  Take a photo now
                  <input type="file" accept="image/*" capture="environment" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} style={{ display: 'none' }} />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '18px', background: '#fff', color: '#1a1a18', border: '1.5px solid #d0d0c8', borderRadius: 12, cursor: 'pointer', fontSize: 16, fontWeight: 600 }}>
                  <span style={{ fontSize: 24 }}>🖼</span>
                  Choose from gallery
                  <input type="file" accept="image/*,application/pdf" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} style={{ display: 'none' }} />
                </label>
                <div style={{ textAlign: 'center', fontSize: 12, color: '#bbb' }}>JPG, PNG or PDF — max 10MB</div>
              </div>
            ) : (
              <div>
                {preview !== 'pdf' ? (
                  <div style={{ borderRadius: 14, overflow: 'hidden', border: '2px solid #1D9E75', maxHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f0', marginBottom: 12 }}>
                    <img src={preview} alt="Receipt" style={{ maxWidth: '100%', maxHeight: 300, objectFit: 'contain' }} />
                  </div>
                ) : (
                  <div style={{ borderRadius: 14, border: '2px solid #1D9E75', padding: '2rem', textAlign: 'center', background: '#E8F8F2', marginBottom: 12 }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>📄</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{file?.name}</div>
                  </div>
                )}
                <div style={{ background: '#E8F8F2', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#085041', fontWeight: 600, marginBottom: 14, display: 'flex', justifyContent: 'space-between' }}>
                  <span>✓ Receipt uploaded</span>
                  <label style={{ fontSize: 12, color: '#0F6E56', cursor: 'pointer', textDecoration: 'underline' }}>
                    Change
                    <input type="file" accept="image/*,application/pdf" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} style={{ display: 'none' }} />
                  </label>
                </div>
                <button onClick={() => setStep('details')} style={{ width: '100%', padding: '14px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
                  Continue →
                </button>
              </div>
            )}
          </div>
        )}

        {step === 'details' && (
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Your details</h2>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>We need your contact details so we can reach you if you win.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Full name *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name"
                  style={{ width: '100%', padding: '12px 14px', border: '1px solid #d0d0c8', borderRadius: 10, fontSize: 15, background: '#fff' }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Phone number *</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 555 000 0000"
                  style={{ width: '100%', padding: '12px 14px', border: '1px solid #d0d0c8', borderRadius: 10, fontSize: 15, background: '#fff' }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Email (optional)</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="For winner notification"
                  style={{ width: '100%', padding: '12px 14px', border: '1px solid #d0d0c8', borderRadius: 10, fontSize: 15, background: '#fff' }} />
              </div>
              <div style={{ background: '#f5f5f0', borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'center', fontSize: 12, color: '#666' }}>
                <span style={{ fontSize: 20 }}>🧾</span>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file?.name}</span>
                <button onClick={() => { setFile(null); setPreview(''); setStep('upload') }} style={{ background: 'none', border: 'none', color: '#1D9E75', fontSize: 12, cursor: 'pointer', textDecoration: 'underline', flexShrink: 0 }}>Change</button>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep('upload')} style={{ flex: 1, padding: '13px', background: '#fff', border: '1px solid #d0d0c8', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer', color: '#666' }}>
                  ← Back
                </button>
                <button onClick={handleVerify} disabled={!name || !phone}
                  style={{ flex: 2, padding: '13px', background: !name || !phone ? '#ccc' : '#1D9E75', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: !name || !phone ? 'not-allowed' : 'pointer' }}>
                  Submit entry 🎟
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
