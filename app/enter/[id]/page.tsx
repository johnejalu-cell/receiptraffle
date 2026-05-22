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

  if (!promo) return (
    <main style={{ padding: '2rem', textAlign: 'center' }}>
      <p>Promotion not found.</p>
      <Link href="/" style={{ color: '#1D9E75' }}>&#x2190; Back</Link>
    </main>
  )

  function handleFile(f: File) {
    setFile(f)
    setPreview(URL.createObjectURL(f))
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
      const res = await fetch('/api/verify-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mediaType: file!.type || 'image/jpeg', minSpend: promo.minSpend, currency: promo.currency })
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
        <div style={{ fontSize: 13, color: '#666', marginTop: 8 }}>{promo.title}</div>
        <div style={{ fontSize: 13, color: '#666' }}>Amount: {promo.currency} {result?.total_amount?.toLocaleString()}</div>
        <div style={{ fontSize: 13, color: '#666' }}>Name: {name} · {phone}</div>
      </div>
      <p style={{ fontSize: 13, color: '#999', marginBottom: 20 }}>Save your ticket number! You'll be contacted on {phone} if you win.</p>
      <Link href="/" style={{ color: '#1D9E75', fontSize: 14, textDecoration: 'none', fontWeight: 600 }}>&#x2190; Enter another promotion</Link>
    </main>
  )

  if (step === 'manual') return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: '#fafaf9', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>&#x23F3;</div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Entry received!</h2>
      <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>Your receipt has been submitted for manual review. We'll confirm within 24 hours.</p>
      <div style={{ background: '#fff', border: '1px solid #e5e5e0', borderRadius: 14, padding: '1.5rem', width: '100%', maxWidth: 340, marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>Reference number</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#534AB7', letterSpacing: 1 }}>{ticket}</div>
        <div style={{ fontSize: 13, color: '#666', marginTop: 8 }}>{promo.title}</div>
        <div style={{ fontSize: 13, color: '#666' }}>Contact: {phone}</div>
      </div>
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

      <div style={{ padding: '1.5rem 1rem', maxWidth: 480, margin: '0 auto' }}>
        {/* Promo summary */}
        <div style={{ background: '#fff', border: '1px solid #e5e5e0', borderRadius: 14, padding: '1rem', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ fontSize: 32 }}>{promo.icon}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: promo.color }}>&#x1F3C6; {promo.prize}</div>
            <div style={{ fontSize: 12, color: '#666' }}>Min spend: {promo.currency} {promo.minSpend.toLocaleString()}</div>
          </div>
        </div>

        {step === 'upload' && (
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Upload your receipt</h2>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>Take a clear photo of your receipt to enter this promotion.</p>

            {!preview ? (
              <label style={{ display: 'block', border: '2px dashed #d0d0c8', borderRadius: 14, padding: '3rem 1rem', textAlign: 'center', cursor: 'pointer', background: '#fff', marginBottom: 16 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>&#x1F4F7;</div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Take a photo or upload</div>
                <div style={{ fontSize: 13, color: '#999' }}>JPG, PNG &mdash; max 10MB</div>
                <input type="file" accept="image/*" capture="environment" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} style={{ display: 'none' }} />
              </label>
            ) : (
              <div style={{ marginBottom: 16 }}>
                <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid #e5e5e0', maxHeight: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f0', marginBottom: 10 }}>
                  <img src={preview} alt="Receipt" style={{ maxWidth: '100%', maxHeight: 260, objectFit: 'contain' }} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, background: '#E8F8F2', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#085041', fontWeight: 600 }}>
                    &#x2713; Receipt uploaded
                  </div>
                  <label style={{ padding: '10px 14px', background: '#fff', border: '1px solid #d0d0c8', borderRadius: 10, fontSize: 13, cursor: 'pointer', color: '#666' }}>
                    Change
                    <input type="file" accept="image/*" capture="environment" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>
            )}

            {preview && (
              <button onClick={() => setStep('details')} style={{ width: '100%', padding: '14px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
                Continue &rarr;
              </button>
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
                  style={{ width: '100%', padding: '11px 14px', border: '1px solid #d0d0c8', borderRadius: 10, fontSize: 15, background: '#fff' }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Phone number *</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+256 7XX XXX XXX"
                  style={{ width: '100%', padding: '11px 14px', border: '1px solid #d0d0c8', borderRadius: 10, fontSize: 15, background: '#fff' }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Email (optional)</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="for winner notification"
                  style={{ width: '100%', padding: '11px 14px', border: '1px solid #d0d0c8', borderRadius: 10, fontSize: 15, background: '#fff' }} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep('upload')} style={{ flex: 1, padding: '13px', background: '#fff', border: '1px solid #d0d0c8', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer', color: '#666' }}>
                  &#x2190; Back
                </button>
                <button onClick={handleVerify} style={{ flex: 2, padding: '13px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
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
