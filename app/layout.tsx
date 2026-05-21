import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ReceiptRaffle',
  description: 'Upload receipts, enter prize draws, win big.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#1D9E75" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="ReceiptRaffle" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>{children}</body>
    </html>
  )
}
