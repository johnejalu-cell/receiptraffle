'use client'
import { useState, useEffect, type CSSProperties } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface ApiPromotion {
  id: string | number
  promo_name: string
  company_name: string
  prizes: string[] | string | null
  min_spend: number | string | null
  currency?: string | null
  emoji?: string | null
  color?: string | null
  product_keywords?: string[] | null
  logo_url?: string | null
  terms_conditions?: string | null
  draw_date?: string | null
  product_barcodes?: string[] | null
}

interface Promo {
  title: string
  brand: string
  prize: string
  prizes: string[]
  minSpend: number
  currency: string
  icon: string
  color: string
  dbId: string | number
  productKeywords: string[]
  productBarcodes: string[]
  logoUrl: string | null
  termsConditions: string | null
  drawDate: string
}

interface EntryResult {
  promoted_items_found?: string[]
  promoted_items_total?: number
  total_amount?: number
  currency?: string
}

type Step = 'upload' | 'details' | 'verifying' | 'success' | 'manual' | 'duplicate' | 'error'

const MAX_PDF_BYTES = 3 * 1024 * 1024 // stays under Vercel's 4.5 MB body limit after base64

const GREEN = '#1D9E75'
const centerMain: CSSProperties = { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: '#fafaf9', textAlign: 'center' }
const backLink: CSSProperties = { color: GREEN, fontSize: 14, textDecoration: 'none', fontWeight: 600 }
const primaryBtn: CSSProperties = { padding: '12px 28px', background: GREEN, color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 16 }
const inputStyle: CSSProperties = { width: '100%', padding: '12px 14px', border: '1px solid #d0d0c8', borderRadius: 10, fontSize: 15, background: '#fff' }
const labelStyle: CSSProperties = { fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }
const greenBox: CSSProperties = { background: '#E8F8F2', border: '1px solid #9FE1CB', borderRadius: 14, padding: '16px 20px', maxWidth: 340, width: '100%', marginBottom: 24, textAlign: 'left' }
const redBox: CSSProperties = { background: '#FCEBEB', border: '1px solid #f5c6c6', borderRadius: 14, padding: '16px 20px', maxWidth: 340, width: '100%', marginBottom: 24, textAlign: 'left', fontSize: 14, color: '#791F1F', lineHeight: 1.6 }
const ticketBox: CSSProperties = { background: '#fff', border: `2px solid ${GREEN}`, borderRadius: 14, padding: '1.5rem', width: '100%', maxWidth: 340, marginBottom: 20 }

export default function EnterPage() {
  const params = useParams()
  const rawId = params?.id
  const id = typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : ''

  const [promo, setPromo] = useState<Promo | null>(null)
  const [promoLoaded, setPromoLoaded] = useState(false)
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [result, setResult] = useState<EntryResult | null>(null)
  const [ticket, setTicket] = useState('')
  const [termsModal, setTermsModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [duplicateMessage, setDuplicateMessage] = useState('')

  useEffect(() => {
    if (!id) { setPromoLoaded(true); return }
    fetch('/api/promotions')
      .then(r => r.json())
      .then((data: { promotions?: ApiPromotion[] }) => {
        const found = data.promotions?.find(p => String(p.id) === id)
        if (found) {
          const prizes = Array.isArray(found.prizes) ? found.prizes : (found.prizes ? [found.prizes] : [])
          setPromo({
            title: found.promo_name,
            brand: found.company_name,
            prize: prizes[0] || '',
            prizes,
            minSpend: Number(found.min_spend) || 0,
            currency: found.currency || 'USD',
            icon: found.emoji || '🎁',
            color: found.color || GREEN,
            dbId: found.id,
            productKeywords: Array.isArray(found.product_keywords) ? found.product_keywords : [],
            productBarcodes: Array.isArray(found.product_barcodes) ? found.product_barcodes : [],
            logoUrl: found.logo_url || null,
            termsConditions: found.terms_conditions || null,
            drawDate: found.draw_date || '',
          })
        }
        setPromoLoaded(true)
      })
      .catch(() => setPromoLoaded(true))
  }, [id])

  if (!promoLoaded) return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#666' }}>Loading promotion...</p>
    </main>
  )

  if (!promo) return (
    <main style={{ padding: '2rem', textAlign: 'center' }}>
      <p>Promotion not found.</p>
      <Link href="/" style={{ color: GREEN }}>← Back</Link>
    </main>
  )

  const isPdfFile = file?.type === 'application/pdf'

  function handleFile(f: File) {
    // Camera photos on some Android devices have no MIME type
    const safeFile = f.type ? f : new File([f], f.name || 'photo.jpg', { type: 'image/jpeg' })
    setFile(safeFile)
    setPreview(URL.createObjectURL(safeFile))
  }

  function resetReceipt() {
    setFile(null)
    setPreview('')
    setStep('upload')
  }

  // Compress image using canvas to stay well under Vercel's 4.5MB limit
  function compressImage(f: File): Promise<{ base64: string; type: string }> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(f)
      img.onload = () => {
        URL.revokeObjectURL(url)
        const MAX = 1600
        let { width, height } = img
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX }
          else { width = Math.round(width * MAX / height); height = MAX }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('Canvas not supported')); return }
        ctx.drawImage(img, 0, 0, width, height)
        const base64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1]
        resolve({ base64, type: 'image/jpeg' })
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('We could not read this image. Please try a JPG or PNG photo.'))
      }
      img.src = url
    })
  }

  function readFileAsBase64(f: File): Promise<string> {
    return new Promise((res, rej) => {
      const reader = new FileReader()
      reader.onload = () => res(String(reader.result).split(',')[1])
      reader.onerror = () => rej(new Error('Could not read file'))
      reader.readAsDataURL(f)
    })
  }

  async function handleVerify() {
    if (!promo) return
    if (!name || !phone) { alert('Please enter your name and phone number'); return }
    if (!file) { setStep('upload'); return }

    setStep('verifying')
    try {
      let base64: string
      let mediaType: string

      if (file.type === 'application/pdf') {
        if (file.size > MAX_PDF_BYTES) {
          throw new Error('This PDF is too large. Please upload a PDF under 3 MB, or take a photo of the receipt instead.')
        }
        base64 = await readFileAsBase64(file)
        mediaType = 'application/pdf'
      } else {
        const compressed = await compressImage(file)
        base64 = compressed.base64
        mediaType = compressed.type
      }

      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mediaType,
          minSpend: promo.minSpend,
          currency: promo.currency,
          promotionId: promo.dbId || null,
          productKeywords: promo.productKeywords,
          productBarcodes: promo.productBarcodes,
          name,
          phone,
          email,
          promotionName: promo.title,
          companyName: promo.brand,
        }),
      })

      if (res.status === 413) {
        throw new Error('Your receipt file is too large. Please try a smaller photo.')
      }

      const data = await res.json().catch(() => ({}))

      if (res.status === 409 && data.error === 'duplicate_receipt') {
        setDuplicateMessage(typeof data.message === 'string' ? data.message : '')
        setStep('duplicate')
        return
      }

      if (!res.ok || data.error || !data.ticketNumber) {
        throw new Error(typeof data.error === 'string' ? data.error : 'Something went wrong (' + res.status + ')')
      }

      setResult(data.aiResult as EntryResult)
      setTicket(String(data.ticketNumber))
      setStep(data.verificationStatus === 'approved' ? 'success' : 'manual')
    } catch (err) {
      console.error('Verification error:', err)
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong.')
      setStep('error')
    }
  }

  if (step === 'verifying') return (
    <main style={centerMain}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Verifying your receipt...</h2>
      <p style={{ color: '#666', fontSize: 14 }}>Our AI is checking your receipt. This takes a few seconds.</p>
    </main>
  )

  if (step === 'error') return (
    <main style={centerMain}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>⚠️</div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: '#791F1F' }}>Your entry was not submitted</h2>
      <div style={redBox}>{errorMessage} Please check your connection and try again.</div>
      <button onClick={() => setStep('details')} style={primaryBtn}>Try again</button>
      <button onClick={resetReceipt} style={{ background: 'none', border: 'none', color: GREEN, fontSize: 14, cursor: 'pointer', textDecoration: 'underline', marginBottom: 16 }}>
        Use a different receipt
      </button>
      <Link href="/" style={backLink}>← Back to promotions</Link>
    </main>
  )

  if (step === 'success') return (
    <main style={centerMain}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: GREEN }}>You&apos;re entered!</h2>
      <p style={{ color: '#666', fontSize: 15, marginBottom: 20 }}>Your receipt was verified successfully. Good luck!</p>
      <div style={ticketBox}>
        <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>Your ticket number</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: GREEN, letterSpacing: 1 }}>{ticket}</div>
        <div style={{ borderTop: '1px solid #e5e5e0', marginTop: 12, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 13, color: '#666' }}>{promo.title}</div>
          {(result?.promoted_items_found?.length ?? 0) > 0 && (
            <div style={{ fontSize: 13, color: GREEN }}>✓ {result?.promoted_items_found?.join(', ')}</div>
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
      <Link href="/" style={backLink}>← Back to promotions</Link>
    </main>
  )

  if (step === 'duplicate') return (
    <main style={centerMain}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🧾</div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: '#791F1F' }}>Receipt already used</h2>
      <div style={redBox}>
        {duplicateMessage || 'This receipt has already been used for a promotion from this brand. Each receipt can only be used once per brand.'}
      </div>
      <div style={greenBox}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#085041', marginBottom: 6 }}>What you can do:</div>
        <div style={{ fontSize: 13, color: '#0F6E56', lineHeight: 1.7 }}>
          ✓ Use a different receipt from a new purchase<br />
          ✓ Use this receipt to enter a promotion for a different brand
        </div>
      </div>
      <button onClick={resetReceipt} style={primaryBtn}>Try a different receipt</button>
      <Link href="/" style={backLink}>← Browse other promotions</Link>
    </main>
  )

  if (step === 'manual') return (
    <main style={centerMain}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🎟️</div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>You&apos;re in the draw!</h2>
      <div style={{ ...ticketBox, border: '1px solid #e5e5e0' }}>
        <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>Your ticket number</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: GREEN, letterSpacing: 1 }}>{ticket}</div>
      </div>
      <div style={greenBox}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#085041', marginBottom: 6 }}>✓ Your entry is in the draw</div>
        <div style={{ fontSize: 13, color: '#0F6E56', lineHeight: 1.6 }}>
          Save your ticket number. You will only be contacted on <strong>{phone}</strong> if there is a problem with your receipt. Otherwise your entry stands!
        </div>
      </div>
      <Link href="/" style={backLink}>← Back to promotions</Link>
    </main>
  )

  const fileInputHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
  }

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
        {['Upload receipt', 'Your details'].map((s, i) => {
          const active = (step === 'upload' && i === 0) || (step === 'details' && i === 1)
          return (
            <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 12, fontWeight: 600, color: active ? GREEN : '#ccc', borderBottom: active ? `2px solid ${GREEN}` : '2px solid transparent', paddingBottom: 8 }}>
              {i + 1}. {s}
            </div>
          )
        })}
      </div>

      <div style={{ padding: '1.5rem 1rem', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ background: '#fff', border: '1px solid #e5e5e0', borderRadius: 12, padding: '1rem', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
            {promo.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={promo.logoUrl} alt={promo.brand} style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 10, border: '1px solid #e5e5e0', flexShrink: 0 }} />
            ) : (
              <div style={{ fontSize: 28, flexShrink: 0 }}>{promo.icon}</div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a18', marginBottom: 2 }}>{promo.title}</div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>by {promo.brand}</div>
              {promo.prizes.length > 0 ? (
                <div style={{ marginBottom: 8 }}>
                  {promo.prizes.slice(0, 3).map((p, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <div style={{ width: 20, height: 20, background: i === 0 ? '#DAA520' : i === 1 ? '#A8A8A8' : '#CD7F32', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{i + 1}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: promo.color }}>WIN: {p}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 12, fontWeight: 600, color: promo.color, marginBottom: 8 }}>WIN: {promo.prize}</div>
              )}
              <div style={{ fontSize: 12, color: '#888' }}>Min spend: {promo.currency} {promo.minSpend.toLocaleString()}</div>
              {promo.drawDate && <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Draw date: {promo.drawDate}</div>}
            </div>
          </div>
          {promo.productKeywords.length > 0 && (
            <div style={{ background: '#f5f5f0', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#666' }}>
              <strong>Promoted products:</strong> {promo.productKeywords.join(', ')}
            </div>
          )}
          {promo.termsConditions && (
            <button onClick={() => setTermsModal(true)} style={{ background: 'none', border: 'none', color: GREEN, fontSize: 12, cursor: 'pointer', padding: '4px 0', textDecoration: 'underline' }}>
              View Terms &amp; Conditions
            </button>
          )}
        </div>

        {step === 'upload' && (
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Upload your receipt</h2>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>
              Take a photo or choose from your gallery. Make sure the receipt is clear and easy to read.
            </p>
            {!preview ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '18px', background: GREEN, color: '#fff', borderRadius: 12, cursor: 'pointer', fontSize: 16, fontWeight: 700 }}>
                  <span style={{ fontSize: 24 }}>📷</span>
                  Take a photo now
                  <input type="file" accept="image/*" capture="environment" onChange={fileInputHandler} style={{ display: 'none' }} />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '18px', background: '#fff', color: '#1a1a18', border: '1.5px solid #d0d0c8', borderRadius: 12, cursor: 'pointer', fontSize: 16, fontWeight: 600 }}>
                  <span style={{ fontSize: 24 }}>🖼</span>
                  Choose from gallery
                  <input type="file" accept="image/*,application/pdf" onChange={fileInputHandler} style={{ display: 'none' }} />
                </label>
                <div style={{ textAlign: 'center', fontSize: 12, color: '#bbb' }}>JPG, PNG or PDF · Image automatically optimised before upload</div>
              </div>
            ) : (
              <div>
                <div style={{ borderRadius: 14, overflow: 'hidden', border: `2px solid ${GREEN}`, maxHeight: 300, minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f0', marginBottom: 12 }}>
                  {isPdfFile ? (
                    <div style={{ padding: 24, textAlign: 'center', color: '#444' }}>
                      <div style={{ fontSize: 40 }}>📄</div>
                      <div style={{ fontSize: 13, marginTop: 6 }}>{file?.name || 'Receipt PDF'}</div>
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt="Receipt" style={{ maxWidth: '100%', maxHeight: 300, objectFit: 'contain' }} />
                  )}
                </div>
                <div style={{ background: '#E8F8F2', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#085041', fontWeight: 600, marginBottom: 14, display: 'flex', justifyContent: 'space-between' }}>
                  <span>✓ Receipt ready</span>
                  <label style={{ fontSize: 12, color: '#0F6E56', cursor: 'pointer', textDecoration: 'underline' }}>
                    Change
                    <input type="file" accept="image/*,application/pdf" onChange={fileInputHandler} style={{ display: 'none' }} />
                  </label>
                </div>
                <button onClick={() => setStep('details')} style={{ width: '100%', padding: '14px', background: GREEN, color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
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
                <label style={labelStyle}>Full name *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Phone number *</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 555 000 0000" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Email (optional)</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="For winner notification" style={inputStyle} />
              </div>
              <div style={{ background: '#f5f5f0', borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'center', fontSize: 12, color: '#666' }}>
                <span style={{ fontSize: 20 }}>🧾</span>
                <span style={{ flex: 1 }}>Receipt ready to submit</span>
                <button onClick={resetReceipt} style={{ background: 'none', border: 'none', color: GREEN, fontSize: 12, cursor: 'pointer', textDecoration: 'underline', flexShrink: 0 }}>Change</button>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep('upload')} style={{ flex: 1, padding: '13px', background: '#fff', border: '1px solid #d0d0c8', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer', color: '#666' }}>
                  ← Back
                </button>
                <button onClick={handleVerify} disabled={!name || !phone}
                  style={{ flex: 2, padding: '13px', background: !name || !phone ? '#ccc' : GREEN, color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: !name || !phone ? 'not-allowed' : 'pointer' }}>
                  Submit entry 🎟
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {termsModal && promo.termsConditions && (
        <div onClick={() => setTermsModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '16px 16px 0 0', padding: '1.5rem', width: '100%', maxWidth: 520, maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>Terms &amp; Conditions</div>
              <button onClick={() => setTermsModal(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#666' }}>×</button>
            </div>
            <div style={{ fontSize: 12, color: '#444', lineHeight: 1.8, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{promo.termsConditions}</div>
          </div>
        </div>
      )}
    </main>
  )
}
