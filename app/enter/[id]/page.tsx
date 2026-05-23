'use client'
import { useState } from 'react'
import Link from 'next/link'

const PROMOTIONS: Record<string, any> = {
  '1': { title: "Summer Braai Bonanza", brand: "FreshMart Supermarkets", prize: "UGX 5,000,000 cash", minSpend: 300000, currency: "UGX", icon: "🛒", color: "#1D9E75" },
  '2': { title: "Back-to-School Win Big", brand: "EduMart Uganda", prize: "Laptop x 2", minSpend: 150000, currency: "UGX", icon: "🎒", color: "#534AB7" },
  '3': { title: "Family Pack Jackpot", brand: "CityLodge Hotels", prize: "Weekend stay for 4", minSpend: 500000, currency: "UGX", icon: "🏨", color: "#854F0B" },
}

export default function EnterPage({ params }: { params: { id: string } }) {
  const promo = PROMOTIONS[params.id]
  const [step, setStep] = useState<'upload' | 'details' | 'verifying' | 'success' | 'manual'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [result, setResult] = useState<any>(null)
  const [ticket, setTicket] = useState('')
  const [dragOver, setDragOver] = useState(false)

  if (!promo) return (
    <main style={{ padding: '2rem', textAlign: 'center' }}>
      <p>Promotion not found.</p>
      <Link href="/" style={{ color: '#1D9E75' }}>&#x2190; Back</Link>
    </main>
  )

  function handleFile(f: File) {
    if (!f.type.startsWith('image/') && f.type !== 'application/pdf') {
      alert('Please upload an image file (JPG, PNG) or PDF')
      return
    }
    setFile(f)
    if (f.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(f))
    } else {
      setPreview('pdf')
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }

  async function handleVerify() {
    if (!name || !phone) { alert('Please enter your name and phone number'); return }
    setStep('verifying')
    try {
      const toBase64 = (f: File) => new Promise<string>((res, rej) => {
        const r = new FileReader()
        r.onload = () => res((r.result as string).split(',')[1])
        r.onerror = rej
        r.readAsDataURL(f)
      })
      const base64 = await toBase64(file!)
      const mediaType = file!.type || 'image/jpeg'
      const res = await fetch('/api/verify-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mediaType, minSpend: promo.minSpend, currency: promo.currency })
      })
      const data = await res.json()
      setResult(data)
      const t = 'RR-' + Math.random().toString(36).substring(2, 10).toUpperCase()
      setTicket(t)
      setStep(data.verification_status === 'approved' && data.total_amount >= promo.minSpend ? 'success' : 'manual')
    } catch {
      const t = 'RR-' + Math.random().toString(36).substring(2, 10).toUpperCase()
      setTicket(t)
      setStep('manual')
    }
  }

  if (step === 'verifying') return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: '#fafaf9', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>&#x1F50D;</div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Verifying your receipt...</h2>
      <p style={{ color: '#666', fontSize: 14 }}>Our AI is reading your receipt. This takes a few seconds.</p>
      <div style={{ marginTop: 20, display: 'flex', gap: 6 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width: 8, height: 8, background: '#1D9E75', borderRadius: '50%', animation: `bounce 0.6s ${i * 0.2}s infinite alternate` }} />
        ))}
      </div>
      <style>{`@keyframes bounce { from { transform: translateY(0) } to { transform: translateY(-8px) } }`}</style>
    </main>
  )

  if (step === 'success') return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: '#fafaf9', textAlign: 'center' }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>&#x1F389;</div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#1D9E75' }}>You're entered!</h2>
      <p style={{ color: '#666', fontSize: 15, marginBottom: 20 }}>Your receipt was verified successfully. Good luck!</p>
      <div style={{ background: '#fff', border: '2px solid #1D9E75', borderRadius: 14, padding: '1.5rem', width: '100%', maxWidth: 340, marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>Your ticket number</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#1D9E75', letterSpacing: 1 }}>{ticket}</div>
        <div style={{ borderTop: '1px solid #e5e5e0', marginTop: 12, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 13, color: '#666' }}>&#x1F3C6; {promo.title}</div>
          <div style={{ fontSize: 13, color: '#666' }}>&#x1F4B0; Amount: {promo.currency} {result?.total_amount?.toLocaleString()}</div>
          <div style={{ fontSize: 13, color: '#666' }}>&#x1F464; {name}</div>
          <div style={{ fontSize: 13, color: '#666' }}>&#x1F4F1; {phone}</div>
        </div>
      </div>
      <p style={{ fontSize: 13, color: '#999', marginBottom: 20 }}>You will be contacted on <strong>{phone}</strong> if you win.</p>
      <Link href="/" style={{ color: '#1D9E75', fontSize: 14, textDecoration: 'none', fontWeight: 600 }}>&#x2190; Enter another promotion</Link>
    </main>
  )

  if (step === 'manual') return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: '#fafaf9', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>&#x23F3;</div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Entry received!</h2>
      <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>Your receipt has been submitted for manual review. We will confirm within 24 hours.</p>
      <div style={{ background: '#fff', border: '1px solid #e5e5e0', borderRadius: 14, padding: '1.5rem', width: '100%', maxWidth: 340, marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>Reference number</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#534AB7', letterSpacing: 1 }}>{ticket}</div>
        <div style={{ borderTop: '1px solid #e5e5e0', marginTop: 12, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 13, color: '#666' }}>{promo.title}</div>
          <div style={{ fontSize: 13, color: '#666' }}>&#x1F464; {name}</div>
          <div style={{ fontSize: 13, color: '#666' }}>&#x1F4F1; {phone}</div>
        </div>
      </div>
      <p style={{ fontSize: 13, color: '#999', marginBottom: 20 }}>We will contact you on <strong>{phone}</strong> within 24 hours.</p>
      <Link href="/" style={{ color: '#1D9E75', fontSize: 14, textDecoration: 'none', fontWeight: 600 }}>&#x2190; Back to promotions</Link>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: '#fafaf9' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e5e0', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/" style={{ color: '#666', textDecoration: 'none', fontSize: 20 }}>&#x2190;</Link>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{promo.title}</div>
          <div style={{ fontSize: 12, color: '#888' }}>{promo.brand}</div>
        </div>
      </div>

      {/* Step indicator */}
      <div style={{ background: '#fff', padding: '0.75rem 1.5rem', borderBottom: '1px solid #e5e5e0', display: 'flex', gap: 0 }}>
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

        {/* Promo summary */}
        <div style={{ background: '#fff', border: '1px solid #e5e5e0', borderRadius: 12, padding: '1rem', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ fontSize: 28 }}>{promo.icon}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: promo.color }}>&#x1F3C6; {promo.prize}</div>
            <div style={{ fontSize: 12, color: '#888' }}>Minimum spend: {promo.currency} {promo.minSpend.toLocaleString()}</div>
          </div>
        </div>

        {/* STEP 1 — UPLOAD */}
        {step === 'upload' && (
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Upload your receipt</h2>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>Take a photo of your receipt or upload an image from your phone.</p>

            {!preview ? (
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                style={{ border: `2px dashed ${dragOver ? '#1D9E75' : '#d0d0c8'}`, borderRadius: 14, padding: '2.5rem 1rem', textAlign: 'center', background: dragOver ? '#E8F8F2' : '#fff', marginBottom: 16, transition: 'all 0.2s' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>&#x1F4F7;</div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Upload your receipt</div>
                <div style={{ fontSize: 13, color: '#999', marginBottom: 20 }}>JPG, PNG or PDF &mdash; max 10MB</div>

                {/* Two buttons — camera and file */}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <label style={{ display: 'inline-block', padding: '10px 20px', background: '#1D9E75', color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                    &#x1F4F7; Take photo
                    <input type="file" accept="image/*" capture="environment" onChange={handleInputChange} style={{ display: 'none' }} />
                  </label>
                  <label style={{ display: 'inline-block', padding: '10px 20px', background: '#fff', color: '#1a1a18', border: '1px solid #d0d0c8', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                    &#x1F4C2; Choose file
                    <input type="file" accept="image/*,application/pdf" onChange={handleInputChange} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: 20 }}>
                {preview !== 'pdf' ? (
                  <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid #e5e5e0', maxHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f0', marginBottom: 12 }}>
                    <img src={preview} alt="Receipt preview" style={{ maxWidth: '100%', maxHeight: 280, objectFit: 'contain' }} />
                  </div>
                ) : (
                  <div style={{ borderRadius: 14, border: '1px solid #e5e5e0', padding: '2rem', textAlign: 'center', background: '#f5f5f0', marginBottom: 12 }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>&#x1F4C4;</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{file?.name}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>PDF uploaded</div>
                  </div>
                )}

                <div style={{ background: '#E8F8F2', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#085041', fontWeight: 600, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>&#x2713; {file?.name}</span>
                  <label style={{ fontSize: 12, color: '#0F6E56', cursor: 'pointer', textDecoration: 'underline' }}>
                    Change
                    <input type="file" accept="image/*,application/pdf" onChange={handleInputChange} style={{ display: 'none' }} />
                  </label>
                </div>

                <button onClick={() => setStep('details')} style={{ width: '100%', padding: '14px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
                  Continue &rarr;
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2 — DETAILS */}
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
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+256 7XX XXX XXX"
                  style={{ width: '100%', padding: '12px 14px', border: '1px solid #d0d0c8', borderRadius: 10, fontSize: 15, background: '#fff' }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Email address (optional)</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="For winner notification"
                  style={{ width: '100%', padding: '12px 14px', border: '1px solid #d0d0c8', borderRadius: 10, fontSize: 15, background: '#fff' }} />
              </div>

              {/* Receipt preview thumbnail */}
              <div style={{ background: '#f5f5f0', borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ fontSize: 24 }}>{preview === 'pdf' ? '&#x1F4C4;' : '&#x1F9FE;'}</div>
                <div style={{ fontSize: 12, color: '#666', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file?.name}</div>
                <button onClick={() => setStep('upload')} style={{ background: 'none', border: 'none', color: '#1D9E75', fontSize: 12, cursor: 'pointer', textDecoration: 'underline', flexShrink: 0 }}>Change</button>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep('upload')} style={{ flex: 1, padding: '13px', background: '#fff', border: '1px solid #d0d0c8', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer', color: '#666' }}>
                  &#x2190; Back
                </button>
                <button onClick={handleVerify} disabled={!name || !phone} style={{ flex: 2, padding: '13px', background: !name || !phone ? '#ccc' : '#1D9E75', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: !name || !phone ? 'not-allowed' : 'pointer' }}>
                  Submit entry &#x1F39F;
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
