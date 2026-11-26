import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EXAMMIND — Study Smarter. Understand Deeper. Perform Better.',
  description: 'Your private AI examination coach. Turn course notes and past papers into original, lecturer-aware practice, clear explanations and measurable progress.',
  keywords: ['AI study coach', 'exam preparation', 'lecturer-aware practice', 'course notes', 'practice exams'],
  openGraph: { title: 'EXAMMIND — Study Smarter. Understand Deeper.', description: 'A calmer, more personal way to prepare for your next exam.', type: 'website' },
  twitter: { card: 'summary_large_image', title: 'EXAMMIND — Study Smarter. Understand Deeper.', description: 'Your private AI examination coach, built around your course materials.' },

  applicationName: 'EXAMMIND',
  icons: { icon: '/icon.svg', apple: '/apple-icon.png' },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f8f7f4',
  width: 'device-width',
  initialScale: 1,
  userScalable: true,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
