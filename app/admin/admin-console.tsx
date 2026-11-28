'use client'

import { FormEvent, useMemo, useState } from 'react'
import useSWR from 'swr'
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronDown, Database, LogOut, LockKeyhole, Pencil, Search, ShieldCheck, Users, X } from 'lucide-react'
import styles from './admin.module.css'

type UserRecord = {
  id: string
  email: string
  phone: string
  createdAt: string
  lastSignInAt: string | null
  emailConfirmedAt: string | null
  bannedUntil: string | null
  userMetadata: Record<string, unknown>
}

type DataResponse = {
  table: string
  label: string
  primaryKey: string
  editable: string[]
  records: Record<string, unknown>[]
  count: number
  page: number
  pageSize: number
}

const tableOptions = [
  ['courses', 'Courses'], ['materials', 'Materials'], ['lecturer_profiles', 'Lecturer profiles'],
  ['exams', 'Exams'], ['exam_attempts', 'Exam attempts'], ['exam_answer_keys', 'Exam answer keys'],
  ['revision_messages', 'Revision messages'], ['study_plans', 'Study plans'], ['question_bookmarks', 'Question bookmarks'],
] as const

async function jsonFetcher<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: 'no-store' })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.error || 'Something went wrong.')
  return result as T
}

function formatDate(value: string | null) {
  if (!value) return 'Never'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

function shortValue(value: unknown) {
  if (value === null || value === undefined || value === '') return '—'
  const text = typeof value === 'string' ? value : JSON.stringify(value)
  return text.length > 88 ? `${text.slice(0, 85)}…` : text
}

export default function AdminConsole() {
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [busy, setBusy] = useState(false)
  const [activeSection, setActiveSection] = useState<'users' | 'data'>('users')
  const [activeTable, setActiveTable] = useState('courses')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null)
  const [userEmail, setUserEmail] = useState('')
  const [userMetadata, setUserMetadata] = useState('')
  const [selectedRecord, setSelectedRecord] = useState<Record<string, unknown> | null>(null)
  const [recordDraft, setRecordDraft] = useState('')
  const [notice, setNotice] = useState('')

  const { data: session, error: sessionError, mutate: mutateSession, isLoading: checkingSession } = useSWR<{ authenticated: boolean }>(
    '/api/admin/session',
    async (url: string) => {
      const response = await fetch(url, { cache: 'no-store' })
      if (response.status === 401) return { authenticated: false }
      if (!response.ok) throw new Error('Admin sign-in could not be checked.')
      return response.json()
    },
    { shouldRetryOnError: false, revalidateOnFocus: false },
  )
  const authenticated = session?.authenticated === true
  const usersKey = authenticated && activeSection === 'users' ? `/api/admin/users?page=${page}` : null
  const dataKey = authenticated && activeSection === 'data' ? `/api/admin/data?table=${encodeURIComponent(activeTable)}&page=${page}` : null
  const { data: usersData, error: usersError, mutate: mutateUsers, isLoading: loadingUsers } = useSWR<{ users: UserRecord[]; page: number; hasMore: boolean }>(usersKey, jsonFetcher, { keepPreviousData: true })
  const { data: dataResponse, error: dataError, mutate: mutateData, isLoading: loadingData } = useSWR<DataResponse>(dataKey, jsonFetcher, { keepPreviousData: true })

  const filteredUsers = useMemo(() => (usersData?.users ?? []).filter((user) => `${user.email} ${user.id} ${JSON.stringify(user.userMetadata)}`.toLowerCase().includes(search.toLowerCase())), [usersData, search])
  const filteredRecords = useMemo(() => (dataResponse?.records ?? []).filter((record) => JSON.stringify(record).toLowerCase().includes(search.toLowerCase())), [dataResponse, search])

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setLoginError('')
    try {
      const response = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Sign-in failed.')
      setPassword('')
      await mutateSession({ authenticated: true }, false)
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Sign-in failed.')
    } finally {
      setBusy(false)
    }
  }

  async function signOut() {
    setBusy(true)
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
      setSelectedUser(null)
      setSelectedRecord(null)
      await mutateSession({ authenticated: false }, false)
    } finally {
      setBusy(false)
    }
  }

  function changeSection(section: 'users' | 'data') {
    setActiveSection(section)
    setPage(1)
    setSearch('')
    setSelectedUser(null)
    setSelectedRecord(null)
    setNotice('')
  }

  function changeTable(table: string) {
    setActiveTable(table)
    setPage(1)
    setSearch('')
    setSelectedRecord(null)
    setNotice('')
  }

  function chooseUser(user: UserRecord) {
    setSelectedUser(user)
    setUserEmail(user.email)
    setUserMetadata(JSON.stringify(user.userMetadata ?? {}, null, 2))
    setNotice('')
  }

  function chooseRecord(record: Record<string, unknown>) {
    setSelectedRecord(record)
    setRecordDraft(JSON.stringify(record, null, 2))
    setNotice('')
  }

  async function saveUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedUser) return
    setBusy(true)
    setNotice('')
    try {
      const parsedMetadata: unknown = JSON.parse(userMetadata)
      if (!parsedMetadata || Array.isArray(parsedMetadata) || typeof parsedMetadata !== 'object') throw new Error('User metadata must be a JSON object.')
      const response = await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: selectedUser.id, email: userEmail, userMetadata: parsedMetadata }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'User could not be saved.')
      setNotice('User changes saved.')
      await mutateUsers()
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'User could not be saved.')
    } finally {
      setBusy(false)
    }
  }

  async function saveRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedRecord || !dataResponse) return
    setBusy(true)
    setNotice('')
    try {
      const parsed: unknown = JSON.parse(recordDraft)
      if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') throw new Error('Record data must be a JSON object.')
      const response = await fetch('/api/admin/data', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ table: activeTable, id: String(selectedRecord[dataResponse.primaryKey]), record: parsed }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Record could not be saved.')
      setSelectedRecord(result.record)
      setRecordDraft(JSON.stringify(result.record, null, 2))
      setNotice('Record changes saved.')
      await mutateData()
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Record could not be saved.')
    } finally {
      setBusy(false)
    }
  }

  if (checkingSession) return <main className={styles.screen}><div className={styles.loading}>Checking secure session…</div></main>

  if (!authenticated) return <main className={styles.screen}>
    <div className={styles.loginCard}>
      <a className={styles.brand} href="/" aria-label="EXAMMIND home"><span className={styles.brandMark}><BookOpen aria-hidden="true" /></span><span>EXAMMIND <small>CONTROL ROOM</small></span></a>
      <div className={styles.lockMark}><LockKeyhole aria-hidden="true" /></div>
      <p className={styles.eyebrow}>RESTRICTED ACCESS</p>
      <h1>Good to see you.</h1>
      <p className={styles.intro}>Enter your administrator password to manage users and study data.</p>
      <form className={styles.loginForm} onSubmit={signIn}>
        <label htmlFor="admin-password">Administrator password</label>
        <input id="admin-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required autoFocus />
        {(loginError || sessionError) && <p className={styles.error} role="alert">{loginError || sessionError?.message}</p>}
        <button type="submit" disabled={busy}>{busy ? 'Verifying…' : 'Continue securely'} <ArrowRight aria-hidden="true" /></button>
      </form>
      <p className={styles.secureNote}><ShieldCheck aria-hidden="true" /> Private administrator session</p>
    </div>
  </main>

  const busyList = activeSection === 'users' ? loadingUsers : loadingData
  const activeError = activeSection === 'users' ? usersError : dataError
  const morePages = activeSection === 'users' ? usersData?.hasMore : (dataResponse?.records.length ?? 0) === dataResponse?.pageSize

  return <main className={styles.adminShell}>
    <aside className={styles.sidebar}>
      <a className={styles.brand} href="/" aria-label="EXAMMIND home"><span className={styles.brandMark}><BookOpen aria-hidden="true" /></span><span>EXAMMIND <small>CONTROL ROOM</small></span></a>
      <p className={styles.sideCaption}>ADMINISTRATION</p>
      <nav className={styles.nav} aria-label="Admin sections">
        <button className={activeSection === 'users' ? styles.navActive : ''} onClick={() => changeSection('users')}><Users aria-hidden="true" /> Users <span>{usersData?.users.length ?? '—'}</span></button>
        <button className={activeSection === 'data' ? styles.navActive : ''} onClick={() => changeSection('data')}><Database aria-hidden="true" /> Site data <ChevronDown aria-hidden="true" /></button>
      </nav>
      {activeSection === 'data' && <div className={styles.tableNav} aria-label="Site data tables">{tableOptions.map(([id, label]) => <button key={id} onClick={() => changeTable(id)} className={activeTable === id ? styles.tableActive : ''}>{label}</button>)}</div>}
      <div className={styles.sidebarFoot}><span><span className={styles.statusDot} /> Protected session</span><button onClick={() => void signOut()} disabled={busy}><LogOut aria-hidden="true" /> Sign out</button></div>
    </aside>

    <section className={styles.main}>
      <header className={styles.topbar}><a href="/" className={styles.backLink}><ArrowLeft aria-hidden="true" /> Back to EXAMMIND</a><span className={styles.sessionLabel}><ShieldCheck aria-hidden="true" /> Admin session</span></header>
      <div className={styles.content}>
        <div className={styles.pageHeading}><div><p className={styles.eyebrow}>EXAMMIND · PRIVATE WORKSPACE</p><h1>{activeSection === 'users' ? 'Users' : dataResponse?.label ?? tableOptions.find(([id]) => id === activeTable)?.[1]}</h1><p>{activeSection === 'users' ? 'Review accounts and update profile details.' : 'Browse and edit saved records across your study workspace.'}</p></div><button className={styles.signOut} onClick={() => void signOut()} disabled={busy}><LogOut aria-hidden="true" /> Sign out</button></div>

        <div className={styles.toolbar}>
          {activeSection === 'data' && <label className={styles.tableSelect}><Database aria-hidden="true" /><select aria-label="Choose data table" value={activeTable} onChange={(event) => changeTable(event.target.value)}>{tableOptions.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select><ChevronDown aria-hidden="true" /></label>}
          <label className={styles.search}><Search aria-hidden="true" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={activeSection === 'users' ? 'Search email, name or ID' : 'Search records'} aria-label={activeSection === 'users' ? 'Search users' : 'Search records'} /><kbd>⌘ K</kbd></label>
          <span className={styles.count}>{activeSection === 'users' ? `${filteredUsers.length} shown` : `${dataResponse?.count ?? '—'} total records`}</span>
        </div>

        {notice && <p className={styles.notice} role="status">{notice}<button onClick={() => setNotice('')} aria-label="Dismiss message"><X aria-hidden="true" /></button></p>}
        {activeError && <p className={styles.errorBanner} role="alert">{activeError.message} <button onClick={() => activeSection === 'users' ? void mutateUsers() : void mutateData()}>Try again</button></p>}

        <div className={styles.workspace}>
          <section className={styles.listPanel} aria-label={activeSection === 'users' ? 'Users list' : 'Site records'}>
            {activeSection === 'users' ? <>
              <div className={styles.listHeading}><span>ACCOUNT</span><span>CREATED</span><span>LAST ACTIVE</span><span>STATUS</span></div>
              {busyList ? <p className={styles.empty}>Loading accounts…</p> : filteredUsers.length ? filteredUsers.map((user) => <button key={user.id} className={`${styles.userRow} ${selectedUser?.id === user.id ? styles.rowSelected : ''}`} onClick={() => chooseUser(user)}>
                <span className={styles.userIdentity}><i>{(user.email || 'U').slice(0, 1).toUpperCase()}</i><span><b>{String(user.userMetadata.full_name || user.userMetadata.name || user.email || 'Unnamed user')}</b><small>{user.email || user.id}</small></span></span>
                <span>{formatDate(user.createdAt)}</span><span>{formatDate(user.lastSignInAt)}</span><span><i className={`${styles.statusDot} ${user.bannedUntil && new Date(user.bannedUntil) > new Date() ? styles.statusBanned : ''}`} />{user.bannedUntil && new Date(user.bannedUntil) > new Date() ? 'Suspended' : user.emailConfirmedAt ? 'Verified' : 'Unverified'}</span>
              </button>) : <p className={styles.empty}>{search ? 'No accounts match that search.' : 'No user accounts yet.'}</p>}
            </> : <>
              <div className={styles.listHeading}><span>RECORD</span><span>DETAILS</span><span>EDIT</span></div>
              {busyList ? <p className={styles.empty}>Loading records…</p> : filteredRecords.length ? filteredRecords.map((record, index) => <button key={String(record[dataResponse?.primaryKey ?? 'id'] ?? index)} className={`${styles.recordRow} ${selectedRecord === record ? styles.rowSelected : ''}`} onClick={() => chooseRecord(record)}>
                <span className={styles.recordId}>{shortValue(record[dataResponse?.primaryKey ?? 'id'])}</span><span className={styles.recordDetails}>{Object.entries(record).filter(([key]) => !['id', dataResponse?.primaryKey].includes(key)).slice(0, 3).map(([key, value]) => <small key={key}><b>{key}</b> {shortValue(value)}</small>)}</span><span className={styles.editLabel}><Pencil aria-hidden="true" /> Edit</span>
              </button>) : <p className={styles.empty}>{search ? 'No records match that search.' : 'This table is empty.'}</p>}
            </>}
            <div className={styles.pagination}><button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1 || busy}><ArrowLeft aria-hidden="true" /> Previous</button><span>Page {page}</span><button onClick={() => setPage((value) => value + 1)} disabled={!morePages || busy}>Next <ArrowRight aria-hidden="true" /></button></div>
          </section>

          <aside className={styles.detailPanel}>
            {activeSection === 'users' ? selectedUser ? <>
              <div className={styles.detailHeading}><span className={styles.detailIcon}><Users aria-hidden="true" /></span><div><p className={styles.eyebrow}>ACCOUNT PROFILE</p><h2>Edit user</h2></div><button onClick={() => setSelectedUser(null)} aria-label="Close user editor"><X aria-hidden="true" /></button></div>
              <dl className={styles.userFacts}><div><dt>User ID</dt><dd>{selectedUser.id}</dd></div><div><dt>Phone</dt><dd>{selectedUser.phone || 'Not provided'}</dd></div><div><dt>Email status</dt><dd>{selectedUser.emailConfirmedAt ? 'Verified' : 'Unverified'}</dd></div></dl>
              <form className={styles.editorForm} onSubmit={saveUser}>
                <label htmlFor="edit-email">Email address</label><input id="edit-email" type="email" value={userEmail} onChange={(event) => setUserEmail(event.target.value)} required />
                <label htmlFor="edit-metadata">Profile metadata <small>JSON object</small></label><textarea id="edit-metadata" value={userMetadata} onChange={(event) => setUserMetadata(event.target.value)} spellCheck={false} />
                <button type="submit" disabled={busy}><Check aria-hidden="true" /> {busy ? 'Saving…' : 'Save user'}</button>
              </form>
            </> : <div className={styles.emptyDetail}><Users aria-hidden="true" /><b>Select an account</b><span>Choose a user to review their profile and update their details.</span></div> : selectedRecord ? <>
              <div className={styles.detailHeading}><span className={styles.detailIcon}><Database aria-hidden="true" /></span><div><p className={styles.eyebrow}>{dataResponse?.label ?? 'SITE DATA'}</p><h2>Edit record</h2></div><button onClick={() => setSelectedRecord(null)} aria-label="Close record editor"><X aria-hidden="true" /></button></div>
              <p className={styles.editorHint}>Update editable fields in JSON. Record IDs and account ownership fields are read-only.</p>
              <form className={styles.editorForm} onSubmit={saveRecord}>
                <label htmlFor="record-json">Record data <small>JSON</small></label><textarea id="record-json" className={styles.codeEditor} value={recordDraft} onChange={(event) => setRecordDraft(event.target.value)} spellCheck={false} />
                <button type="submit" disabled={busy}><Check aria-hidden="true" /> {busy ? 'Saving…' : 'Save record'}</button>
              </form>
            </> : <div className={styles.emptyDetail}><Database aria-hidden="true" /><b>Select a record</b><span>Choose a row to review and edit its saved fields.</span></div>}
          </aside>
        </div>
        <p className={styles.footerNote}><ShieldCheck aria-hidden="true" /> Administrative changes are saved directly to the connected Supabase project.</p>
      </div>
    </section>
  </main>
}
