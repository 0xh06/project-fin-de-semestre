import type { Metadata } from 'next'
import { FloatingBackButton } from '@/components/floating-back-button'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: 'SmartStudy AI — Révisez intelligemment avec l\'IA',
  description: 'Plateforme d\'apprentissage intelligente propulsée par l\'IA. Flashcards, quiz adaptatifs, chat IA, mindmaps et bien plus.',
  keywords: 'étude, IA, flashcards, quiz, apprentissage, révision, étudiants',
  authors: [{ name: 'SmartStudy AI' }],
  openGraph: {
    title: 'SmartStudy AI',
    description: 'Révisez plus intelligemment, mémorisez plus rapidement.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased min-h-screen relative">
        <FloatingBackButton />
        {children}
      </body>
    </html>
  )
}
