import { NextResponse } from 'next/server'
import { adminCookieName, adminCookieOptions, isSameOriginRequest, requireAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'Request rejected.' }, { status: 403 })
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized
  const response = NextResponse.json({ authenticated: false }, { headers: { 'Cache-Control': 'no-store' } })
  response.cookies.set(adminCookieName, '', { ...adminCookieOptions, maxAge: 0, expires: new Date(0) })
  return response
}
