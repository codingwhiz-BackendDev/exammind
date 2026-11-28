'use client'

import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowDown, ArrowRight, ArrowUpRight, BookOpen, BookOpenCheck, BrainCircuit, Check, ChevronDown, CircleHelp, Clock3, FileText, Gauge, LockKeyhole, Sparkles, Target } from 'lucide-react'
import { AuthPanel } from './auth-panel'

type Props = { onComplete: () => void; showAuth: boolean; setShowAuth: (show: boolean) => void }
type Preview = 'patterns' | 'practice' | 'progress'

const previewCopy: Record<Preview, { eyebrow: string; title: string; note: string }> = {
  patterns: { eyebrow: 'LECTURER PATTERNS', title: 'See how your course is examined.', note: 'Observed from uploaded past papers' },
  practice: { eyebrow: 'ORIGINAL PRACTICE', title: 'Turn course material into a focused set.', note: 'Questions stay grounded in your sources' },
  progress: { eyebrow: 'YOUR PROGRESS', title: 'Know what to revisit next.', note: 'Built from your submitted attempts' },
}

const faqs = [
  ['Does EXAMMIND predict my next exam?', 'No. Lecturer analysis describes patterns observed in the past papers you provide. It is a study aid, not a prediction of future questions.'],
  ['What materials can I use?', 'Upload course notes, slides, past examination papers, and supported documents or images. EXAMMIND uses readable material from the course you select.'],
  ['Can I use EXAMMIND without past papers?', 'Yes. You can create course-grounded practice from readable lecture materials. Lecturer-pattern analysis specifically needs readable past papers.'],
  ['Are my answers and materials private?', 'Your study workspace is tied to your account. Materials and saved attempts are scoped to your account and are not used to make claims about other students.'],
  ['How are written answers marked?', 'Written answers can receive partial credit. EXAMMIND provides a rubric and explanation so a score is a starting point for review, not a substitute for your instructor.'],
  ['Can I change an exam after generating it?', 'You can choose the course, duration, question count, difficulty, format mix, and topic strategy before generation. Generated exams can be taken again and reviewed.'],
]

export function Landing({ onComplete, showAuth, setShowAuth }: Props) {
  const [preview, setPreview] = useState<Preview>('patterns')
  const reducedMotion = useReducedMotion()
  const reveal = reducedMotion ? {} : { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.16 }, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } }

  return (
    <main className="marketing brand-story">
      <header className="brand-story-nav">
        <a className="brand" href="#top" aria-label="EXAMMIND home"><span className="brand-mark"><BrainCircuit /></span><span>exam<span className="brand-light">mind</span></span></a>
        <nav aria-label="Main navigation"><a href="#method">The method</a><a href="#intelligence">Lecturer intelligence</a><a href="#questions">Questions</a><a href="#faq">FAQ</a></nav>
        <div className="brand-story-actions"><button className="story-login" onClick={() => setShowAuth(true)}>Sign in</button><button className="button story-nav-cta" onClick={() => setShowAuth(true)}>Get started <ArrowUpRight /></button></div>
      </header>

      <section className="brand-story-hero" id="top">
        <div className="brand-story-copy">
          <p className="story-kicker"><span /> STUDY WITH THE EXAM IN MIND</p>
          <h1>Know what to study.<br /><em>Understand why.</em></h1>
          <p className="story-lede">EXAMMIND connects your course materials, the patterns in past papers, and your own practice—so preparation feels more deliberate and less like guesswork.</p>
          <div className="story-actions"><button className="button story-primary" onClick={() => setShowAuth(true)}>Get started <ArrowRight /></button><a className="story-secondary" href="#method">Explore the method <ArrowDown /></a></div>
          <div className="story-assurance"><span><LockKeyhole /> Private study space</span><i /><span>Grounded in your materials</span><i /><span>No exam predictions</span></div>
        </div>
        <div className="story-visual" aria-label="Interactive illustrative EXAMMIND product preview">
          <div className="story-photo" aria-hidden="true" />
          <div className="story-orbit story-orbit-a" aria-hidden="true" /><div className="story-orbit story-orbit-b" aria-hidden="true" />
          <div className="product-preview">
            <div className="preview-chrome"><span /><span /><span /><small>EXAMMIND · PRODUCT PREVIEW</small></div>
            <div className="preview-head"><div><span className="preview-kicker">YOUR STUDY SPACE</span><h2>{previewCopy[preview].title}</h2></div><span className="preview-mark"><BrainCircuit /></span></div>
            <div className="preview-tabs" role="tablist" aria-label="Product preview">
              {(['patterns', 'practice', 'progress'] as Preview[]).map((item) => <button key={item} role="tab" aria-selected={preview === item} className={preview === item ? 'is-selected' : ''} onClick={() => setPreview(item)}>{item === 'patterns' ? 'Patterns' : item === 'practice' ? 'Practice' : 'Progress'}</button>)}
            </div>
            <motion.div key={preview} className={`preview-content preview-${preview}`} initial={reducedMotion ? false : { opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} role="tabpanel">
              {preview === 'patterns' && <>
                <div className="preview-document"><FileText /><span><b>Past paper · Sample document</b><small>Source-linked observation</small></span><span className="preview-check"><Check /></span></div>
                <div className="preview-signal"><div><span>QUESTION VERB</span><b>Explain the process</b></div><div className="signal-meter"><i /></div><b className="signal-value">Observed</b></div>
                <div className="preview-source"><Target /><span><b>Evidence stays visible</b><small>Illustrative example · not a prediction</small></span></div>
              </>}
              {preview === 'practice' && <>
                <div className="practice-meta"><span><BookOpenCheck /> COURSE-GROUNDED SET</span><span>10 questions</span></div>
                <div className="practice-question"><small>QUESTION 03 <i /> 2 MARKS</small><b>Which idea from your notes best explains this outcome?</b><div className="practice-option"><span>A</span> A source-backed response option</div><div className="practice-option"><span>B</span> A second plausible response</div></div>
                <div className="preview-source"><Clock3 /><span><b>Timed · autosaved · reviewable</b><small>Illustrative product preview</small></span></div>
              </>}
              {preview === 'progress' && <>
                <div className="progress-preview-head"><span>TOPIC CHECK-IN</span><span>Example view</span></div>
                <div className="topic-bars"><div><span>Cell signalling</span><i><b style={{ width: '76%' }} /></i><strong>Review</strong></div><div><span>Membrane transport</span><i><b style={{ width: '54%' }} /></i><strong>Revisit</strong></div><div><span>Neural pathways</span><i><b style={{ width: '88%' }} /></i><strong>Steady</strong></div></div>
                <div className="preview-source"><Gauge /><span><b>Based on your submitted work</b><small>Example topics and values only</small></span></div>
              </>}
            </motion.div>
            <div className="preview-footnote"><span className="preview-dot" /> {previewCopy[preview].note}</div>
          </div>
          <span className="visual-caption">A closer look at a more considered way to prepare</span>
        </div>
      </section>

      <div className="story-proof" aria-label="Product principles"><span><FileText /> Your own materials</span><i /><span><BrainCircuit /> Evidence you can inspect</span><i /><span><BookOpenCheck /> Practice with purpose</span><i /><span><LockKeyhole /> Progress kept private</span></div>

      <motion.section className="story-section story-method" id="method" {...reveal}>
        <div className="story-section-heading"><p className="story-overline">A STUDY LOOP, BUILT AROUND YOU</p><h2>From scattered notes<br />to <em>a clearer next step.</em></h2><p>EXAMMIND brings the work you already do into a more useful sequence.</p></div>
        <div className="method-steps">
          <article><span className="method-index">01</span><div className="method-icon"><FileText /></div><p className="story-overline">GATHER</p><h3>Bring your course in</h3><p>Add notes and past papers to a private space for each course. Readable sources become the foundation for everything that follows.</p><span className="method-rule" /></article>
          <article><span className="method-index">02</span><div className="method-icon"><BrainCircuit /></div><p className="story-overline">UNDERSTAND</p><h3>Notice what repeats</h3><p>See observed topics, formats, and question wording—with the source evidence close at hand.</p><span className="method-rule" /></article>
          <article><span className="method-index">03</span><div className="method-icon"><BookOpenCheck /></div><p className="story-overline">PRACTICE</p><h3>Learn from the attempt</h3><p>Build original exams, work under a timer, then use detailed feedback to choose what to revisit.</p><span className="method-rule" /></article>
        </div>
      </motion.section>

      <motion.section className="story-feature" id="intelligence" {...reveal}>
        <div className="feature-story-copy"><p className="story-overline">LECTURER INTELLIGENCE · EVIDENCE FIRST</p><h2>Patterns are useful.<br /><em>Predictions aren’t.</em></h2><p>Analyze the past papers you upload to see recurring topics, question formats, instructional verbs, and difficulty cues. Each profile is tied to course evidence—not a promise about what comes next.</p>
          <ul><li><Check /> Observations trace back to your documents</li><li><Check /> Confidence is shown alongside each pattern</li><li><Check /> No claims about an unseen future exam</li></ul><button className="button feature-story-cta" onClick={() => setShowAuth(true)}>Explore your study space <ArrowRight /></button></div>
        <div className="evidence-board"><div className="evidence-board-top"><span>ILLUSTRATIVE ANALYSIS</span><span className="evidence-state"><i /> SOURCE-LED</span></div><div className="evidence-board-title"><div><small>COURSE PROFILE</small><b>Question patterns</b></div><span className="evidence-glyph"><BrainCircuit /></span></div>
          <div className="evidence-row"><span className="evidence-no">01</span><span><b>Explain a mechanism</b><small>Past paper · sample source</small></span><div className="evidence-lines"><i /><i /></div><span className="evidence-strength">Observed</span></div>
          <div className="evidence-row"><span className="evidence-no">02</span><span><b>Compare two processes</b><small>Past paper · sample source</small></span><div className="evidence-lines"><i /><i /></div><span className="evidence-strength">Observed</span></div>
          <div className="evidence-row"><span className="evidence-no">03</span><span><b>Apply to a new case</b><small>Past paper · sample source</small></span><div className="evidence-lines"><i /><i /></div><span className="evidence-strength">Observed</span></div>
          <div className="evidence-board-note"><FileText /><span><b>Evidence is part of the answer</b><small>Example content only—not real lecturer data</small></span><ArrowUpRight /></div>
        </div>
      </motion.section>

      <motion.section className="story-generation" id="questions" {...reveal}>
        <div className="generation-visual"><div className="generation-label"><Sparkles /> MADE FROM YOUR COURSE</div><div className="generation-paper"><div className="paper-topline"><span>EXAMMIND PRACTICE</span><span>EXAMPLE</span></div><div className="paper-question-number">03 <span>SHORT ANSWER · 2 MARKS</span></div><h3>Explain how the process in your lecture notes leads to the observed result.</h3><div className="paper-reference"><FileText /><span>Source reference<small>Course material · illustrative only</small></span><ArrowUpRight /></div><div className="paper-answer-lines"><i /><i /><i /></div></div><div className="generation-caption"><span>01</span>Original questions, grounded in supplied sources</div></div>
        <div className="generation-copy"><p className="story-overline">A BETTER QUESTION IS A BETTER START</p><h2>Practice that asks<br /><em>for understanding.</em></h2><p>Choose the course, duration, difficulty, question formats, and topic strategy. The generator creates an original set from your readable course materials, then keeps the answer key separate for secure marking.</p><div className="generation-points"><span><b>01</b> Choose a practice mode</span><span><b>02</b> Sit a timed, autosaved attempt</span><span><b>03</b> Review explanations and sources</span></div><button className="button generation-cta" onClick={() => setShowAuth(true)}>Build a practice exam <ArrowRight /></button></div>
      </motion.section>

      <motion.section className="story-results" {...reveal}>
        <div className="results-heading"><p className="story-overline">A RESULT SHOULD POINT SOMEWHERE</p><h2>Finish with a plan,<br /><em>not just a score.</em></h2><p>Every attempt becomes a more useful view of what you know and what deserves another look.</p></div>
        <div className="results-layout"><div className="results-ring"><div><span>REVIEW</span><b><Target /></b></div><small>Use explanations to choose your next focus</small></div><div className="results-list"><div><span className="results-symbol">A</span><span><b>See how each answer was marked</b><small>Objective checks, partial credit, and written feedback</small></span><ArrowRight /></div><div><span className="results-symbol">B</span><span><b>Understand the reasoning</b><small>Explanations, marking points, and worked steps</small></span><ArrowRight /></div><div><span className="results-symbol">C</span><span><b>Return to the source</b><small>Relevant course references stay in view</small></span><ArrowRight /></div></div></div>
      </motion.section>

      <motion.section className="story-benefits" {...reveal}>
        <div><p className="story-overline">THE WORK, WITHOUT THE NOISE</p><h2>Make study time<br /><em>feel more intentional.</em></h2></div>
        <div className="benefit-list"><article><BookOpen /><span><b>One home for each course</b><small>Materials, exams, lecturer profiles, and plans stay together.</small></span></article><article><Target /><span><b>Focus shaped by your work</b><small>Use saved attempts to surface topics that need attention.</small></span></article><article><Clock3 /><span><b>A pace you can sustain</b><small>Build a revision plan around your date and available time.</small></span></article><article><LockKeyhole /><span><b>Your private workspace</b><small>Practice and progress belong to your account.</small></span></article></div>
      </motion.section>

      <section className="story-faq" id="faq"><div className="faq-heading"><p className="story-overline">GOOD QUESTIONS, CLEAR ANSWERS</p><h2>Before you begin.</h2><p>What EXAMMIND can—and cannot—do.</p></div><div className="faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<ChevronDown /></summary><p>{answer}</p></details>)}</div></section>

      <section className="story-final"><div className="final-mark"><BrainCircuit /></div><p className="story-overline">YOUR NEXT STEP CAN BE SMALL</p><h2>Start with one course.<br /><em>Find your way forward.</em></h2><p>Bring in the material you already have. EXAMMIND will help you turn it into a more focused way to prepare.</p><button className="button story-primary" onClick={() => setShowAuth(true)}>Get started <ArrowRight /></button><span><LockKeyhole /> A private study space, built around your materials.</span></section>

      <footer className="story-footer"><a className="brand" href="#top"><span className="brand-mark"><BrainCircuit /></span><span>exam<span className="brand-light">mind</span></span></a><p>Study with evidence. Practice with purpose.</p><nav aria-label="Footer"><a href="#method">The method</a><a href="#intelligence">Lecturer intelligence</a><a href="#faq">FAQ</a></nav><small>© 2026 EXAMMIND</small></footer>
      {showAuth && <AuthPanel onClose={() => setShowAuth(false)} onComplete={() => { setShowAuth(false); onComplete() }} />}
    </main>
  )
}
