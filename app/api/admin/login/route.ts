import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { adminCookieName, adminCookieOptions, createAdminSession, isSameOriginRequest } from '@/lib/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const loginSchema = z.object({ password: z.string().min(1).max(512) })
const attempts = new Map<string, { count: number; resetAt: number }>()

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'Request rejected.' }, { status: 403 })
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const now = Date.now()
  const current = attempts.get(forwarded)
  if (current && current.resetAt > now && current.count >= 8) {
    return NextResponse.json({ error: 'Too many attempts. Try again in a few minutes.' }, { status: 429, headers: { 'Cache-Control': 'no-store' } })
  }
  if (!current || current.resetAt <= now) attempts.set(forwarded, { count: 0, resetAt: now + 15 * 60 * 1000 })

  const parsed = loginSchema.safeParse(await request.json().catch(() => null))
  const expected = process.env.ADMIN_PASSWORD
  if (!parsed.success || !expected) return NextResponse.json({ error: 'Admin sign-in is not configured.' }, { status: 503 })
  const receivedBytes = Buffer.from(parsed.data.password)
  const expectedBytes = Buffer.from(expected)
  const valid = receivedBytes.length === expectedBytes.length && timingSafeEqual(receivedBytes, expectedBytes)
  if (!valid) {
    const updated = attempts.get(forwarded) ?? { count: 0, resetAt: now + 15 * 60 * 1000 }
    updated.count += 1
    attempts.set(forwarded, updated)
    return NextResponse.json({ error: 'That password did not match.' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
  }

  attempts.delete(forwarded)
  const session = createAdminSession()
  const response = NextResponse.json({ authenticated: true }, { headers: { 'Cache-Control': 'no-store' } })
  response.cookies.set(adminCookieName, session.value, { ...adminCookieOptions, maxAge: session.maxAge, expires: new Date(Date.now() + session.maxAge * 1000) })
  return response
}
