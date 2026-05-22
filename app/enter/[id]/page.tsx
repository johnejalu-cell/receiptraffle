'use client'
import { useState } from 'react'
import Link from 'next/link'

const PROMOTIONS: Record<string, any> = {
  '1': { title: "Summer Braai Bonanza", brand: "FreshMart Supermarkets", prize: "UGX 5,000,000 cash", minSpend: 300000, currency: "UGX", emoji: "🛒", color: "#1D9E75" },
  '2': { title: "Back-to-School Win Big", brand: "EduMart Uganda", prize: "Laptop × 2", minSpend: 150000, currency: "UGX", emoji: "🎒", color: "#534AB7" },
  '3': { title: "Family Pack Jackpot", brand: "CityLodge Hotels", prize: "Weekend stay for 4", minSpend: 500000, currency: "UGX", emoji: "🏨", color: "#854F0B" },
}

export default function EnterPage({ params }: { params: { id: string } }) {
  const promo = PROMOTIONS[params.id]
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [step, setStep] = useState<'form' | 'verifying' | 'success' | 'manual'>('form')
  const [result, setResult] = useState<any>(null)
  const [ticket, setTicket] = useState('')

  if (!promo) return (
    <main style={{ padding: '2rem', textAlign: 'center' }}>
      <p>Promotion not found.</p>
      <Link href="/" style={{ color: '#1D9E75' }}>← Back to promotions</Link>
    </main>
  )

  function handleFile(f: File) {
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  async function handleSubmit() {
    if (!name || !phone || !file) {
      alert('Please fill in your name, phone number and upload a receipt.')
      return
    }
    setStep('verifying')

    try {
      const toBase64 = (f: File) => new Promise<string>((res, rej) => {
        const r = new FileReader()
        r.onload = () => res((r.result as string).split(',')[1])
        r.onerror = rej
        r.readAsDataURL(f)
      })

      const base64 = await toBase64(file)
      const mediaType = file.type || 'image/jpeg'

      const res = await fetch('/api/verify-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mediaType,
          minSpend: promo.minSpend,
          currency: promo.currency
        })
      })

      const data = await res.json()
      setResult(data)

      const t = 'RR-' + Math.random().toString(36).substring(2, 10).toUpperCase()
      setTicket(t)

      if (data.verification_status === 'approved' && data.total_amount >= promo.minSpend) {
        setStep('success')
      } else {
        setStep('manual')
      }
    } catch (e) {
      const t = 'RR-' + Math.random().toString(36).substring(2, 10).toUpperCase()
      setTicket(t)
      setStep('manual')
    }
  }

  if (step === 'verifying') return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: '#fafaf9', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16, animation: 'spin 1s linear infinite' }}>🔍</div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Verifying your receipt...</h2>
      <p style={{ color: '#666', fontSize: 14 }}>Our AI is reading your receipt. This takes a few seconds.</p>
    </main>
  )

  if (step === 'success') return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: '#fafaf9', textAlign: 'center' }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#1D9E75' }}>You're entered!</h2>
      <p style={{ color: '#666', fontSize: 15, marginBottom: 20 }}>Your receipt was verified successfully.</p>
      <div style={{ background: '#fff', border: '2px solid #1D9E75', borderRadius: 14, padding: '1.5rem', width: '100%', maxWidth: 340, marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>Your ticket number</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#1D9E75', letterSpacing: 1 }}>{ticket}</div>
        <div style={{ fontSize: 13, color: '#666', marginTop: 8 }}>{promo.title}</div>
        <div style={{ fontSize: 13, color: '#666' }}>Amount: {promo.currency} {result?.total_amount?.toLocaleString()}</div>
      </div>
      <p style={{ fontSize: 13, color: '#999', marginBottom: 20 }}>Save your ticket number! Draw date is shown on the promotion.</p>
      <Link href="/" style={{ color: '#1D9E75', fontSize: 14, textDecoration: 'none', fontWeight: 600 }}>← Enter another promotion</Link>
    </main>
  )

  if (step === 'manual') return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: '#fafaf9', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Entry received!</h2>
      <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>Your receipt has been submitted for manual review. We'll confirm your entry within 24 hours.</p>
      <div style={{ background: '#fff', border: '1px solid #e5e5e0', borderRadius: 14, padding: '1.5rem', width: '100%', maxWidth: 340, marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>Reference number</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#534AB7', letterSpacing: 1 }}>{ticket}</div>
        <div style={{ fontSize: 13, color: '#666', marginTop: 8 }}>{promo.title}</div>
        <div style={{ fontSize: 13, color: '#666' }}>Contact: {phone}</div>
      </div>
      <Link href="/" style={{ color: '#1D9E75', fontSize: 14, textDecoration: 'none', fontWeight: 600 }}>← Back to promotions</Link>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: '#fafaf9' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e5e0', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/" style={{ color: '#666', textDecoration: 'none', fontSize: 20 }}>←</Link>
        <span style={{ fontSize: 16, fontWeight: 600 }}>Enter promotion</span>
      </div>

      <div style={{ padding: '1.5rem', maxWidth: 480, margin: '0 auto' }}>
        {/* Promo info */}
        <div style={{ background: '#fff', border: '1px solid #e5e5e0', borderRadius: 14, padding: '1.25rem', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ fontSize: 32 }}>{promo.emoji}</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{promo.title}</div>
            <div style={{ fontSize: 13, color: '#666' }}>{promo.brand}</div>
            <div style={{ fontSize: 13, color: promo.color, fontWeight: 600, marginTop: 2 }}>🏆 {promo.prize}</div>
          </div>
        </div>

        <div style={{ background: '#FFF8E6', border: '1px solid #FAC775', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#633806', marginBottom: 20 }}>
          Minimum spend: <strong>{promo.currency} {promo.minSpend.toLocaleString()}</strong>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Your name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Full name"
              style={{ width: '100%', padding: '11px 14px', border: '1px solid #d0d0c8', borderRadius: 10, fontSize: 15, background: '#fff' }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Phone number</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+256 7XX XXX XXX"
              style={{ width: '100%', padding: '11px 14px', border: '1px solid #d0d0c8', borderRadius: 10, fontSize: 15, background: '#fff' }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Email (optional)</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="for winner notification"
              style={{ width: '100%', padding: '11px 14px', border: '1px solid #d0d0c8', borderRadius: 10, fontSize: 15, background: '#fff' }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Upload your receipt</label>
            {preview ? (
              <div style={{ position: 'relative' }}>
                <img src={preview} alt="Receipt" style={{ width: '100%', borderRadius: 10, maxHeight: 200, objectFit: 'contain', background: '#f5f5f0' }} />
                <button onClick={() => { setFile(null); setPreview('') }}
                  style={{ position: 'absolute', top: 8, right: 8, background: '#fff', border: '1px solid #e5e5e0', borderRadius: 20, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}>
                  Change
                </button>
              </div>
            ) : (
              <label style={{ display: 'block', border: '2px dashed #d0d0c8', borderRadius: 10, padding: '2rem', textAlign: 'center', cursor: 'pointer', background: '#fff' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
                <div style={{ fontSize: 14, color: '#666' }}>Tap to take a photo or upload</div>
                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>JPG, PNG — max 10MB</div>
                <input type="file" accept="image/*" capture="environment" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} style={{ display: 'none' }} />
              </label>
            )}
          </div>

          <button onClick={handleSubmit}
            style={{ width: '100%', padding: '14px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 4 }}>
            Submit entry 🎟
          </button>
        </div>
      </div>
    </main>
  )
}
