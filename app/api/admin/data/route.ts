import { NextResponse } from 'next/server'
import { z } from 'zod'
import { ADMIN_TABLES, isAdminAuthenticated, isSameOriginRequest, requireAdmin, type AdminTable, getAdminClient } from '@/lib/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const patchSchema = z.object({ table: z.string(), id: z.string().min(1).max(200), record: z.record(z.string(), z.unknown()) })

function isAdminTable(value: string): value is AdminTable {
  return Object.hasOwn(ADMIN_TABLES, value)
}

export async function GET(request: Request) {
  if (!await isAdminAuthenticated()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
  const url = new URL(request.url)
  const tableName = url.searchParams.get('table') || 'courses'
  if (!isAdminTable(tableName)) return NextResponse.json({ error: 'Unknown table.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
  const page = Math.max(1, Math.min(1000, Number(url.searchParams.get('page')) || 1))
  const pageSize = 25
  const table = ADMIN_TABLES[tableName]
  const { data, error, count } = await getAdminClient().from(tableName).select('*', { count: 'exact' }).order(table.orderBy, { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1)
  if (error) return NextResponse.json({ error: 'Records could not be loaded.' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  return NextResponse.json({ table: tableName, label: table.label, primaryKey: table.primaryKey, editable: table.editable, records: data ?? [], count: count ?? 0, page, pageSize }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function PATCH(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'Request rejected.' }, { status: 403 })
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized
  const parsed = patchSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success || !isAdminTable(parsed.data.table)) return NextResponse.json({ error: 'Invalid record update.' }, { status: 400 })
  const { table: tableName, id, record } = parsed.data
  const table = ADMIN_TABLES[tableName]
  const update = Object.fromEntries(Object.entries(record).filter(([key]) => (table.editable as readonly string[]).includes(key)))
  if (!Object.keys(update).length) return NextResponse.json({ error: 'There are no editable fields to save.' }, { status: 400 })
  const { data, error } = await getAdminClient().from(tableName).update(update).eq(table.primaryKey, id).select('*').maybeSingle()
  if (error) return NextResponse.json({ error: 'Record could not be updated. Check its values and try again.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
  if (!data) return NextResponse.json({ error: 'Record not found.' }, { status: 404, headers: { 'Cache-Control': 'no-store' } })
  return NextResponse.json({ record: data }, { headers: { 'Cache-Control': 'no-store' } })
}
