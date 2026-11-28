import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const authenticated = await isAdminAuthenticated()
  return NextResponse.json({ authenticated }, { status: authenticated ? 200 : 401, headers: { 'Cache-Control': 'no-store' } })
}
