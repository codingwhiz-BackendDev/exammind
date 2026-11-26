import Link from 'next/link'

export default function AuthErrorPage() {
  return (
    <main className="auth-error-page">
      <section className="auth-error-card" aria-labelledby="auth-error-title">
        <span className="auth-error-mark" aria-hidden="true">!</span>
        <p className="eyebrow">SIGN-IN LINK</p>
        <h1 id="auth-error-title">This link couldn&apos;t be verified.</h1>
        <p>It may have expired or already been used. Return to EXAMMIND and request a fresh sign-in link.</p>
        <Link className="button button-dark" href="/">Back to EXAMMIND</Link>
      </section>
    </main>
  )
}
