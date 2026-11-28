import type { Metadata } from 'next'
import AdminConsole from './admin-console'

export const metadata: Metadata = {
  title: 'Admin · EXAMMIND',
  description: 'Protected EXAMMIND administration.',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default function AdminPage() {
  return <AdminConsole />
}
