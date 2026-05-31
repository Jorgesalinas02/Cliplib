import type { Metadata, Viewport } from 'next'
import './globals.css'

export const viewport: Viewport = {
  themeColor: '#1A1A1A',
}

export const metadata: Metadata = {
  title: 'Cliplib',
  description: 'Tu biblioteca personal de videos transcritos',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Cliplib',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Cliplib" />
      </head>
      <body className="bg-brand-bg text-brand-dark antialiased">{children}</body>
    </html>
  )
}
