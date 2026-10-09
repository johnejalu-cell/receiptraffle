'use client'
import { useState, useEffect } from 'react'
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

export default function EnterPage() {
  const params = useParams()
  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : ''

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
            color: found.color || '#1D9E75',
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
      <Link href="/" style={{ color: '#1D9E75' }}>← Back</Link>
    </main>
  )

  const isPdfFile = file?.type === 'application/pdf'

  function handleFile(f: File) {
    // Camera photos on some Android devices have no MIME type
    const safeFile = f.type ? f : new File([f], f.name || 'photo.jpg', { type: 'image/jpeg' })
    setFile(safeFile)
    setPreview(URL.createObjectURL(safeFile))
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

      const data = await res.json().catch(() => ({} as Record<string, unknown>))

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
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong')
      setStep('error')
    }
  }

  if (step === 'verifying') return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: '#fafaf9', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Verifying your receipt...</h2>
      <p style={{ color: '#666', fontSize: 14 }}>Our AI is checking your receipt. This takes a few seconds.</p>
    </main>
  )

  if (step === 'error') return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: '#fafaf9', textAlign: 'center' }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>⚠️</div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: '#791F1F' }}>Your entry was not submitted</h2>
      <div style={{ background: '#FCEBEB', border: '1px solid #f5c6c6', borderRadius: 14, padding: '16px 20px', maxWidth: 340, width: '100%', marginBottom: 24, textAlign: 'left', fontSize: 14, color: '#791F1F', lineHeight: 1.6 }}>
        {errorMessage || 'Something went wrong.'} Please check your connection and try again.
      </div>
      <button onClick={() => setStep('details')} style={{ padding: '12px 28px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 12 }}>
        Try again
      </button>
      <button onClick={() => { setFile(null); setPreview(''); setStep('upload') }} style={{ background: 'none', border: 'none', color: '#1D9E75', fontSize: 14, cursor: 'pointer', textDecoration: 'underline', marginBottom: 16 }}>
        Use a different receipt
      </button>
      <Link href="/" style={{ color: '#1D9E75', fontSize: 14, textDecoration: 'none', fontWeight: 600 }}>← Back to promotions</Link>
    </main>
  )

  if (step === 'success') return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: '#fafaf9', textAlign: 'center' }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#1D9E75' }}>You&apos;re entered!</h2>
      <p style={{ color: '#666', fontSize: 15, marginBottom: 20 }}>Your receipt was verified successfully. Good luck!</p>
      <div style={{ background: '#fff', border: '2px solid #1D9E75', borderRadius: 14, padding: '1.5rem', width: '100%', maxWidth: 340, marginBottom: 20 }}>
        <div style={
