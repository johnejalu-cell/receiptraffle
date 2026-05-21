import Link from 'next/link'

export default function Home() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center', background: '#fafaf9' }}>
      <div style={{ width: 72, height: 72, background: '#1D9E75', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, fontSize: 36 }}>
        🧾
      </div>
      <h1 style={{ fontSize: 38, fontWeight: 700, marginBottom: 10, letterSpacing: -1, color: '#1a1a18' }}>
        Receipt<span style={{ color: '#1D9E75' }}>Raffle</span>
      </h1>
      <p style={{ fontSize: 17, color: '#666', marginBottom: 36, maxWidth: 360, lineHeight: 1.5 }}>
        Upload your receipts, enter prize draws, and win big.
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/auth/login" style={{ padding: '13px 32px', background: '#1D9E75', color: '#fff', borderRadius: 10, fontSize: 16, fontWeight: 600, textDecoration: 'none' }}>
          Sign in
        </Link>
        <Link href="/auth/signup" style={{ padding: '13px 32px', background: 'transparent', color: '#1D9E75', borderRadius: 10, fontSize: 16, fontWeight: 600, border: '2px solid #1D9E75', textDecoration: 'none' }}>
          Create account
        </Link>
      </div>
      <p style={{ marginTop: 36, fontSize: 14, color: '#999' }}>
        Are you a business?{' '}
        <Link href="/auth/signup?role=promoter" style={{ color: '#534AB7', textDecoration: 'none' }}>
          Launch a promotion →
        </Link>
      </p>
    </main>
  )
}
