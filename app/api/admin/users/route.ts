import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminClient, isAdminAuthenticated, isSameOriginRequest, requireAdmin } from '@/lib/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const updateUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().trim().email().max(320).optional(),
  userMetadata: z.record(z.string(), z.unknown()).optional(),
}).refine((value) => value.email !== undefined || value.userMetadata !== undefined)

export async function GET(request: Request) {
  if (!await isAdminAuthenticated()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
  const page = Math.max(1, Math.min(1000, Number(new URL(request.url).searchParams.get('page')) || 1))
  const { data, error } = await getAdminClient().auth.admin.listUsers({ page, perPage: 25 })
  if (error) return NextResponse.json({ error: 'Users could not be loaded.' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  const users = data.users.map((user) => ({
    id: user.id,
    email: user.email ?? '',
    phone: user.phone ?? '',
    createdAt: user.created_at,
    lastSignInAt: user.last_sign_in_at ?? null,
    emailConfirmedAt: user.email_confirmed_at ?? null,
    bannedUntil: user.banned_until ?? null,
    userMetadata: user.user_metadata ?? {},
  }))
  return NextResponse.json({ users, page, hasMore: users.length === 25 }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function PATCH(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'Request rejected.' }, { status: 403 })
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized
  const parsed = updateUserSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Enter a valid email and user metadata.' }, { status: 400 })
  const { id, email, userMetadata } = parsed.data
  if (userMetadata && JSON.stringify(userMetadata).length > 8000) return NextResponse.json({ error: 'User metadata must be under 8 KB.' }, { status: 400 })
  const attributes = { ...(email ? { email } : {}), ...(userMetadata ? { user_metadata: userMetadata } : {}) }
  const { data, error } = await getAdminClient().auth.admin.updateUserById(id, attributes)
  if (error || !data.user) return NextResponse.json({ error: 'User could not be updated. Check the email and metadata values.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
  return NextResponse.json({ user: { id: data.user.id, email: data.user.email ?? '', userMetadata: data.user.user_metadata ?? {} } }, { headers: { 'Cache-Control': 'no-store' } })
}
