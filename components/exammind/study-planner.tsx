'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, LoaderCircle, RefreshCw, Sparkles, Target } from 'lucide-react'

type StudyPlan = {
  id: string
  course_id: string
  exam_date: string
  hours_per_day: number
  understood_topics: string[]
  focus_topics: string[]
  updated_at: string
  plan: {
    overview?: string
    phases?: { title: string; startDate: string; endDate: string; goal: string; sessions?: { date?: string; dayOffset?: number; title: string; durationMinutes: number; topic?: string; activity: string; source?: string; selfCheck?: string }[] }[]
    examWeek?: string
    restGuidance?: string
    adjustmentRule?: string
  }
}

type Props = {
  courses: { id: string; code: string; title: string }[]
  selectedCourse: string
  onSelectCourse: (courseId: string) => void
  plan?: StudyPlan
  loading: boolean
  onBuild: (input: { courseId: string; examDate: string; hoursPerDay: number; understoodTopics: string; focusTopics: string }) => Promise<void>
}

function nextWeekday(date: Date) {
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
}

export function StudyPlanner({ courses, selectedCourse, onSelectCourse, plan, loading, onBuild }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const maxDate = useMemo(() => { const date = new Date(); date.setDate(date.getDate() + 180); return date.toISOString().slice(0, 10) }, [])
  const [examDate, setExamDate] = useState(plan?.exam_date || '')
  const [hoursPerDay, setHoursPerDay] = useState(String(plan?.hours_per_day || 1.5))
  const [understoodTopics, setUnderstoodTopics] = useState(plan?.understood_topics?.join(', ') || '')
  const [focusTopics, setFocusTopics] = useState(plan?.focus_topics?.join(', ') || '')

  useEffect(() => {
    setExamDate(plan?.exam_date || '')
    setHoursPerDay(String(plan?.hours_per_day || 1.5))
    setUnderstoodTopics(plan?.understood_topics?.join(', ') || '')
    setFocusTopics(plan?.focus_topics?.join(', ') || '')
  }, [selectedCourse, plan?.id, plan?.updated_at])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedCourse) return
    await onBuild({ courseId: selectedCourse, examDate, hoursPerDay: Number(hoursPerDay), understoodTopics, focusTopics })
  }

  return <section className="page-section planner-page">
    <div className="page-heading"><div><p className="eyebrow">A PLAN THAT FITS YOUR LIFE</p><h1>Make a little<br />room to learn.</h1><p>A course-grounded revision plan that leaves space for breaks, too.</p></div></div>
    <div className="planner-layout">
      <form className="panel planner-form" onSubmit={submit}>
        <div className="panel-heading"><div><p className="eyebrow">YOUR STARTING POINT</p><h2>Tell us what you&apos;re working toward.</h2></div><CalendarDays /></div>
        <label>Course<select required value={selectedCourse} onChange={(event) => onSelectCourse(event.target.value)}>{courses.map((course) => <option key={course.id} value={course.id}>{course.code} · {course.title}</option>)}</select></label>
        <div className="form-row"><label>Exam date<input type="date" required min={today} max={maxDate} value={examDate} onChange={(event) => setExamDate(event.target.value)} /></label><label>Study time per day<select value={hoursPerDay} onChange={(event) => setHoursPerDay(event.target.value)}><option value="0.5">30 minutes</option><option value="1">1 hour</option><option value="1.5">1.5 hours</option><option value="2">2 hours</option><option value="3">3 hours</option><option value="4">4 hours</option><option value="6">6 hours</option></select></label></div>
        <label>Topics that feel familiar <span className="optional-label">OPTIONAL · COMMA SEPARATED</span><input maxLength={240} value={understoodTopics} onChange={(event) => setUnderstoodTopics(event.target.value)} placeholder="e.g. cell structure, basic genetics" /></label>
        <label>Topics to spend more time on <span className="optional-label">OPTIONAL · COMMA SEPARATED</span><input maxLength={240} value={focusTopics} onChange={(event) => setFocusTopics(event.target.value)} placeholder="e.g. gene expression, inheritance" /></label>
        <p className="planner-privacy"><Target /> The plan uses only your indexed course materials and your saved practice results. Your answers stay private.</p>
        <button className="button button-dark modal-submit" disabled={loading || !courses.length || !examDate}>{loading ? <LoaderCircle className="spin" /> : plan ? <RefreshCw /> : <Sparkles />} {loading ? 'Building your plan…' : plan ? 'Refresh my plan' : 'Build my study plan'} <ArrowRight /></button>
        {!courses.length && <p className="form-notice">Create a course and add readable materials before building a study plan.</p>}
      </form>
      <div className="panel planner-output">
        <div className="panel-heading"><div><p className="eyebrow">YOUR REVISION ROADMAP</p><h2>{plan ? courses.find((course) => course.id === plan.course_id)?.code || 'Your course plan' : 'A plan, not a pressure.'}</h2></div><Clock3 /></div>
        {!plan ? <div className="planner-empty"><span><CalendarDays /></span><b>Made for your course, your calendar and your pace.</b><p>Choose an exam date and daily study time. Your plan will turn the material you&apos;ve uploaded into a set of manageable next steps.</p><div><CheckCircle2 /> Active recall <CheckCircle2 /> Spaced review <CheckCircle2 /> Real rest days</div></div> : <>
          <div className="planner-date-strip"><span><small>EXAM DATE</small><b>{new Date(`${plan.exam_date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</b></span><span><small>TIME TO STUDY</small><b>{plan.hours_per_day} hours per day</b></span></div>
          {plan.plan?.overview && <p className="planner-overview">{plan.plan.overview}</p>}
          <div className="planner-phases">{(plan.plan?.phases ?? []).map((phase, index) => <section className="planner-phase" key={`${phase.title}-${index}`}><div className="planner-phase-heading"><span>{String(index + 1).padStart(2, '0')}</span><div><h3>{phase.title}</h3><small>{phase.startDate ? nextWeekday(new Date(`${phase.startDate}T12:00:00`)) : ''}{phase.endDate ? ` — ${nextWeekday(new Date(`${phase.endDate}T12:00:00`))}` : ''}</small></div></div><p>{phase.goal}</p><div className="planner-session-list">{(phase.sessions ?? []).map((session, sessionIndex) => <article className="planner-session" key={`${session.title}-${sessionIndex}`}><span className="planner-session-icon"><CheckCircle2 /></span><div><b>{session.title}</b>{session.date && <small>{nextWeekday(new Date(`${session.date}T12:00:00`))}</small>}<p>{session.activity}</p>{session.topic && <small>Focus: {session.topic}</small>}{session.source && <small>From: {session.source}</small>}{session.selfCheck && <small>Check yourself: {session.selfCheck}</small>}</div><span className="planner-session-time">{session.durationMinutes} min</span></article>)}</div></section>)}</div>
          <div className="planner-guidance"><b>Keep it sustainable</b><p>{plan.plan?.restGuidance || plan.plan?.adjustmentRule || plan.plan?.examWeek || 'Take regular breaks and adjust this plan to fit your week.'}</p></div>
          <p className="planner-saved">Saved privately · Updated {new Date(plan.updated_at).toLocaleDateString()}</p>
        </>}
      </div>
    </div>
  </section>
}
