import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EXAMMIND — Evidence-led exam preparation',
  description: 'Prepare with your course materials, understand observed examination patterns, and practice with clear feedback in one private study workspace.',
  keywords: ['AI study coach', 'exam preparation', 'lecturer-aware practice', 'course notes', 'practice exams'],
  openGraph: { title: 'EXAMMIND — Evidence-led exam preparation', description: 'Prepare with your course materials, understand observed examination patterns, and practice with clear feedback.', type: 'website' },
  twitter: { card: 'summary_large_image', title: 'EXAMMIND — Evidence-led exam preparation', description: 'A private study workspace for source-led analysis, focused practice, and clear feedback.' },

  applicationName: 'EXAMMIND',
  icons: { icon: '/icon.svg', apple: '/apple-icon.png' },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f3f1e9',
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
