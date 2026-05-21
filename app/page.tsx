import Link from 'next/link'

export default function Home() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, background: '#1D9E75', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, fontSize: 32 }}>
        🧾
      </div>
      <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 8 }}>
        Receipt<span style={{ color: '#1D9E75' }}>Raffle</span>
      </h1>
      <p style={{ fontSize: 16, color: '#666', marginBottom: 32, maxWidth: 360 }}>
        Upload your receipts, enter prize draws, and win big.
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/auth/login" style={{ padding: '12px 28px', background: '#1D9E75', color: '#fff', borderRadius: 10, fontSize: 15, fontWeight: 600 }}>
          Sign in
        </Link>
        <Link href="/auth/signup" style={{ padding: '12px 28px', background: 'transparent', color: '#1D9E75', borderRadius: 10, fontSize: 15, fontWeight: 600, border: '2px solid #1D9E75' }}>
          Create account
        </Link>
      </div>
      <p style={{ marginTop: 32, fontSize: 13, color: '#999' }}>
        Are you a business?{' '}
        <Link href="/auth/signup?role=promoter" style={{ color: '#534AB7' }}>
          Launch a promotion →
        </Link>
      </p>
    </main>
  )
}
