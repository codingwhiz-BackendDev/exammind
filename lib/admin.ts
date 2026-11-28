import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const COOKIE_NAME = 'exammind_admin_session'
const SESSION_SECONDS = 60 * 60 * 8
const COOKIE_PATH = '/api/admin'

export const ADMIN_TABLES = {
  courses: { label: 'Courses', primaryKey: 'id', orderBy: 'created_at', editable: ['code', 'title', 'instructor', 'color', 'updated_at'] },
  materials: { label: 'Materials', primaryKey: 'id', orderBy: 'created_at', editable: ['title', 'storage_path', 'mime_type', 'material_type', 'extracted_text', 'page_count'] },
  lecturer_profiles: { label: 'Lecturer profiles', primaryKey: 'id', orderBy: 'analyzed_at', editable: ['profile', 'source_material_ids', 'analyzed_at'] },
  exams: { label: 'Exams', primaryKey: 'id', orderBy: 'created_at', editable: ['title', 'mode', 'duration_minutes', 'total_marks', 'questions', 'settings'] },
  exam_attempts: { label: 'Exam attempts', primaryKey: 'id', orderBy: 'created_at', editable: ['answers', 'score', 'total_marks', 'submitted_at', 'feedback'] },
  revision_messages: { label: 'Revision messages', primaryKey: 'id', orderBy: 'created_at', editable: ['role', 'content'] },
  exam_answer_keys: { label: 'Exam answer keys', primaryKey: 'exam_id', orderBy: 'created_at', editable: ['answer_key'] },
  study_plans: { label: 'Study plans', primaryKey: 'id', orderBy: 'updated_at', editable: ['exam_date', 'hours_per_day', 'understood_topics', 'focus_topics', 'plan', 'updated_at'] },
  question_bookmarks: { label: 'Question bookmarks', primaryKey: 'id', orderBy: 'created_at', editable: ['exam_id', 'question_index'] },
} as const

export type AdminTable = keyof typeof ADMIN_TABLES

export function getAdminClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Admin data access is not configured.')
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

function signSession(expiresAt: number) {
  const password = process.env.ADMIN_PASSWORD
  const sessionSecret = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!password || !sessionSecret) throw new Error('Admin session signing is not configured.')
  const signingKey = createHmac('sha256', sessionSecret).update(`exammind-admin-session:v1:${password}`).digest()
  return createHmac('sha256', signingKey).update(`exammind-admin:${expiresAt}`).digest('base64url')
}

export function createAdminSession() {
  const expiresAt = Date.now() + SESSION_SECONDS * 1000
  return { value: `${expiresAt}.${signSession(expiresAt)}`, maxAge: SESSION_SECONDS }
}

export async function isAdminAuthenticated() {
  const secret = process.env.ADMIN_PASSWORD
  if (!secret) return false
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return false
  const [expiresText, signature, extra] = token.split('.')
  const expiresAt = Number(expiresText)
  if (extra || !signature || !Number.isSafeInteger(expiresAt) || expiresAt <= Date.now() || expiresAt > Date.now() + SESSION_SECONDS * 1000 + 60_000) return false
  const expected = signSession(expiresAt)
  const providedBytes = Buffer.from(signature)
  const expectedBytes = Buffer.from(expected)
  return providedBytes.length === expectedBytes.length && timingSafeEqual(providedBytes, expectedBytes)
}

export const adminCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: COOKIE_PATH,
}

export async function requireAdmin() {
  if (!await isAdminAuthenticated()) {
    return Response.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
  }
  return null
}

export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get('origin')
  return !origin || origin === new URL(request.url).origin
}

export const adminCookieName = COOKIE_NAME
