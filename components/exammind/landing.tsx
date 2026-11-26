'use client'

import { ArrowDown, ArrowRight, ArrowUpRight, BookOpenCheck, BrainCircuit, ChartNoAxesCombined, Check, Clock3, FileText, Sparkles, Target } from 'lucide-react'
import { AuthPanel } from './auth-panel'

type Props = { onComplete: () => void; showAuth: boolean; setShowAuth: (show: boolean) => void }

export function Landing({ onComplete, showAuth, setShowAuth }: Props) {
  return (
    <main className="marketing">
      <header className="marketing-nav">
        <a className="brand" href="#top" aria-label="EXAMMIND home"><span className="brand-mark"><BrainCircuit /></span><span>exam<span className="brand-light">mind</span></span></a>
        <nav className="marketing-links" aria-label="Main navigation"><a href="#how-it-works">How it works</a><a href="#features">The method</a></nav>
        <div className="marketing-actions"><button className="nav-login" onClick={() => setShowAuth(true)}>Sign in</button><button className="button button-dark nav-cta" onClick={() => setShowAuth(true)}>Start studying <ArrowUpRight /></button></div>
      </header>
      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="hero-kicker"><span className="live-dot" /> YOUR PERSONAL EXAMINATION COACH</div>
          <h1>Study smarter.<br /><span>Understand</span> deeper.</h1>
          <p className="hero-description">The first study partner that learns how your course is taught. Turn your notes into a clearer path to your best work.</p>
          <div className="hero-actions"><button className="button button-dark hero-button" onClick={() => setShowAuth(true)}>Build your study plan <ArrowRight /></button><a className="text-link" href="#how-it-works">See how it works <ArrowDown /></a></div>
          <div className="hero-proof"><div className="avatar-stack" aria-hidden="true"><span /><span /><span /><span /></div><p><strong>Made for the way you learn</strong><br />Private by design · Built around your materials</p></div>
        </div>
        <div className="hero-visual" aria-label="Illustration of a personalized exam preparation dashboard">
          <div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" />
          <div className="hero-note note-left"><span className="mini-icon"><FileText /></span><span><b>Your lecture notes</b><small>Sample illustration</small></span><Check className="note-check" /></div>
          <div className="study-card">
            <div className="study-card-top"><span className="tiny-label">ILLUSTRATIVE COURSE PREVIEW</span><span className="sparkle-mark"><Sparkles /></span></div>
            <div className="study-card-title">A clearer path through your course.</div>
            <div className="study-chart"><div className="chart-axis"><span>100%</span><span>50%</span><span>0%</span></div><div className="chart-field"><div className="chart-grid" /><svg viewBox="0 0 300 115" role="img" aria-label="Your understanding trend is improving"><defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#a48cff" stopOpacity=".3" /><stop offset="1" stopColor="#a48cff" stopOpacity="0" /></linearGradient></defs><path d="M0 96 C28 89 28 82 58 84 S92 65 116 70 S147 43 174 54 S201 27 229 38 S265 8 300 14 L300 115 L0 115Z" fill="url(#chartFill)" /><path d="M0 96 C28 89 28 82 58 84 S92 65 116 70 S147 43 174 54 S201 27 229 38 S265 8 300 14" fill="none" stroke="#9274ef" strokeWidth="3" strokeLinecap="round" /></svg></div><div className="chart-days"><span>WEEK 01</span><span>WEEK 02</span><span>WEEK 03</span><span>WEEK 04</span></div></div>
            <div className="study-insight"><div className="insight-icon"><Target /></div><span><b>Your next focus</b><small>Synaptic transmission · 8 min read</small></span><ArrowRight /></div>
          </div>
          <div className="hero-note note-right"><div className="note-ring"><Check /></div><span><b>A first check-in</b><small>Ready when you are</small></span></div>
          <div className="floating-star star-a" aria-hidden="true"><Sparkles /></div><div className="floating-star star-b" aria-hidden="true"><Sparkles /></div><div className="mockup-caption">Illustrative preview · sample data</div>
        </div>
        <a className="scroll-cue" href="#how-it-works"><span>SCROLL TO EXPLORE</span><div /></a>
      </section>
      <section className="trust-strip"><span>LESS GENERIC QUIZZES.</span><i /><span>MORE GENUINE UNDERSTANDING.</span><i /><span>YOUR MATERIALS. YOUR MOMENTUM.</span></section>
      <section className="how-section" id="how-it-works">
        <div className="section-intro"><p className="eyebrow">A BETTER WAY TO PREPARE</p><h2>From “where do I start?”<br /><em>to “I’ve got this.”</em></h2><p>EXAMMIND connects what you’ve learned to how you’ll be tested, then helps you close the gap with intention.</p></div>
        <div className="steps-grid"><article className="step-card"><span className="step-number">01</span><div className="step-icon lavender"><FileText /></div><h3>Bring your course in</h3><p>Add lecture notes and past papers. Your materials stay private and belong to you.</p><span className="step-caption">YOUR MATERIAL, NOT THE INTERNET</span></article><article className="step-card"><span className="step-number">02</span><div className="step-icon peach"><BrainCircuit /></div><h3>Find the real patterns</h3><p>See what appears, how questions are framed, and where your attention matters most.</p><span className="step-caption">GROUNDED IN YOUR UPLOADS</span></article><article className="step-card"><span className="step-number">03</span><div className="step-icon mint"><BookOpenCheck /></div><h3>Practice with purpose</h3><p>Take original, course-aware exams. Learn from every answer and keep your progress.</p><span className="step-caption">UNDERSTANDING, NOT GUESSING</span></article></div>
      </section>
      <section className="feature-section" id="features"><div className="feature-content"><p className="eyebrow">THOUGHTFUL BY DESIGN</p><h2>Your course has a story.<br />Let’s read it together.</h2><p>Not another question factory. EXAMMIND brings your notes, your instructor’s past papers, and your own progress into one quiet, focused place.</p><div className="feature-list"><span><Check /> Evidence-backed lecturer insights</span><span><Check /> Explanations that point back to source material</span><span><Check /> Progress that reflects your real attempts</span></div><button className="button button-dark" onClick={() => setShowAuth(true)}>Meet your study partner <ArrowRight /></button></div><div className="feature-art"><div className="feature-orb orb-big" /><div className="feature-orb orb-small" /><div className="insight-window"><div className="window-bar"><span /><span /><span /><i>ILLUSTRATIVE PROFILE · SAMPLE DATA</i></div><div className="insight-window-content"><div className="insight-heading"><div><small>OBSERVED PATTERN</small><b>How questions are asked</b></div><span className="confidence-pill"><span /> SAMPLE FINDING</span></div><div className="pattern-row"><span className="pattern-letter">A</span><div><b>Compare and contrast</b><small>Illustrative example · sample only</small></div><span className="pattern-meter"><i style={{ width: '78%' }} /></span><strong>78%</strong></div><div className="pattern-row"><span className="pattern-letter">B</span><div><b>Explain the process</b><small>Illustrative example · sample only</small></div><span className="pattern-meter"><i style={{ width: '64%' }} /></span><strong>64%</strong></div><div className="pattern-row"><span className="pattern-letter">C</span><div><b>Apply to a new case</b><small>Illustrative example · sample only</small></div><span className="pattern-meter"><i style={{ width: '42%' }} /></span><strong>42%</strong></div><div className="evidence-note"><Sparkles /><span><b>Based on your materials</b><small>Illustrative values · sample only</small></span><ArrowUpRight /></div></div></div><div className="decorative-book"><div /><div /><div /></div></div></section>
      <section className="final-cta"><div className="cta-spark"><Sparkles /></div><p className="eyebrow">YOUR NEXT EXAM, ON YOUR TERMS</p><h2>Make room for<br /><em>understanding.</em></h2><p>Start with one course. Find a little more clarity every day.</p><button className="button button-dark" onClick={() => setShowAuth(true)}>Start your study session <ArrowRight /></button><span className="cta-footnote"><Clock3 /> Takes a moment to set up. Completely yours.</span></section>
      <footer className="marketing-footer"><a className="brand" href="#top"><span className="brand-mark"><BrainCircuit /></span><span>exam<span className="brand-light">mind</span></span></a><p>Study smarter. Understand deeper. Perform better.</p><span>© 2026 EXAMMIND</span></footer>
      {showAuth && <AuthPanel onClose={() => setShowAuth(false)} onComplete={() => { setShowAuth(false); onComplete() }} />}
    </main>
  )
}
