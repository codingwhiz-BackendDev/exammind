'use client'

import { useState } from 'react'
import { ArrowLeft, ArrowRight, LoaderCircle, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Props = { onComplete: () => void; onClose: () => void }

export function AuthPanel({ onComplete, onClose }: Props) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    const supabase = createClient()
    const result = mode === 'signup'
      ? await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback`,
            data: { display_name: name.trim() },
          },
        })
      : await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (result.error) {
      const message = result.error.message.toLowerCase()
      if (message.includes('confirm') || message.includes('email')) {
        setNotice('Check your inbox for a confirmation link, then come back to sign in.')
      } else if (message.includes('password')) {
        setError('Use a password with at least 6 characters.')
      } else {
        setError(mode === 'signin' ? 'Invalid email or password.' : 'We could not create your account. Please try again.')
      }
      return
    }
    if (mode === 'signup' && !result.data.session) {
      setNotice('Your account is ready. Check your inbox to confirm your email before signing in.')
      return
    }
    onComplete()
  }

  return (
    <div className="auth-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="auth-card" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="icon-button auth-back" onClick={onClose} aria-label="Close sign in"><ArrowLeft /></button>
        <div className="auth-symbol"><Sparkles /></div>
        <p className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</p>
        <h2 id="auth-title">{mode === 'signup' ? 'Make every study hour count.' : 'Welcome back.'}</h2>
        <p className="auth-copy">{mode === 'signup' ? 'Build a study practice that actually understands your course.' : 'Pick up right where your understanding left off.'}</p>
        <form onSubmit={submit} className="auth-form">
          {mode === 'signup' && <label>Your name<input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Jamie Chen" required /></label>}
          <label>Email address<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@university.edu" required /></label>
          <label>Password<input type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" required /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          {notice && <p className="form-notice" role="status">{notice}</p>}
          <button className="button button-dark auth-submit" disabled={busy} type="submit">{busy ? <LoaderCircle className="spin" /> : null}{mode === 'signup' ? 'Create your free account' : 'Sign in'}{!busy && <ArrowRight />}</button>
        </form>
        <p className="auth-switch">{mode === 'signup' ? 'Already have an account?' : 'New to EXAMMIND?'} <button onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError(''); setNotice('') }}>{mode === 'signup' ? 'Sign in' : 'Create an account'}</button></p>
        <p className="auth-legal">By continuing, you agree to our Terms and Privacy Policy.</p>
      </section>
    </div>
  )
}
