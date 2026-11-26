'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useSWR from 'swr'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, BarChart3, Bell, BookOpen, BookOpenCheck, BrainCircuit, ChartNoAxesCombined, Check, CheckCircle2, ChevronDown, CircleHelp, Clock3, FileText, FolderOpen, Gauge, GraduationCap, LayoutDashboard, LoaderCircle, LogOut, Menu, MessageCircle, Plus, Search, Send, Settings2, Sparkles, Target, Upload, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Landing } from './landing'

type Course = { id: string; code: string; title: string; instructor: string | null; color: string }
type Material = { id: string; course_id: string; title: string; material_type: string; created_at: string; extracted_text?: string | null }
type LecturerProfile = { topics?: { name: string; frequency: number; confidence: string; evidence: string }[]; formats?: { name: string; frequency: number; confidence: string }[]; instructionalVerbs?: { name: string; frequency: number }[]; difficulty?: string; marksPattern?: string; observations?: string[]; paperCount?: number }
type Question = { type: string; prompt: string; options?: string[]; marks: number; topic: string }
type Exam = { id: string; course_id: string; title: string; mode: string; duration_minutes: number; total_marks: number; questions: Question[]; created_at: string }
type Attempt = { id: string; exam_id: string; course_id: string; score: number | null; total_marks: number; submitted_at: string | null; created_at: string; answers?: Record<string, string>; feedback: { summary?: string; topics?: string[]; objectiveCorrect?: number; unanswered?: number; questionResults?: { topic: string; score: number; marks: number; index: number; answer: string; explanation: string; feedback: string; correct: boolean }[] } | null }
type StudyData = { courses: Course[]; materials: Material[]; lecturerProfiles: Record<string, LecturerProfile>; exams: Exam[]; attempts: Attempt[] }
type View = 'overview' | 'courses' | 'exams' | 'analytics' | 'assistant'

const navItems: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'courses', label: 'My courses', icon: BookOpen },
  { id: 'exams', label: 'Practice exams', icon: BookOpenCheck },
  { id: 'analytics', label: 'My progress', icon: BarChart3 },
  { id: 'assistant', label: 'Study assistant', icon: MessageCircle },
]

const colors = ['#9c83ed', '#ef9d7e', '#7abfa5', '#e2b64f', '#78a9dc']
const modeLabel: Record<string, string> = { lecturer: 'LECTURER MODE', comprehensive: 'COMPREHENSIVE', challenge: 'CHALLENGE MODE' }
const EMPTY_STUDY_DATA: StudyData = { courses: [], materials: [], lecturerProfiles: {}, exams: [], attempts: [] }

export function WorkspaceApp() {
  const supabase = useMemo(() => createClient(), [])
  const [user, setUser] = useState<any>(null)
  const [authReady, setAuthReady] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [view, setView] = useState<View>('overview')
  const [selectedCourse, setSelectedCourse] = useState<string>('')
  const [modal, setModal] = useState<'course' | 'upload' | 'exam' | null>(null)
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [activeExam, setActiveExam] = useState<Exam | null>(null)
  const [attemptId, setAttemptId] = useState('')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved')
  const answersRef = useRef<Record<string, string>>({})
  const saveTimeoutRef = useRef<number | null>(null)
  const [reviewed, setReviewed] = useState<number[]>([])
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [result, setResult] = useState<any>(null)
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([])
  const [courseForm, setCourseForm] = useState({ code: '', title: '', instructor: '' })
  const [examForm, setExamForm] = useState({ mode: 'comprehensive', count: 10, duration: 30, difficulty: 'balanced', topics: '' })
  const [mobileMenu, setMobileMenu] = useState(false)

  const fetchStudyData = useCallback(async (): Promise<StudyData> => {
    if (!user?.id) return EMPTY_STUDY_DATA
    const userId = user.id as string
    const [courseRes, materialRes, profileRes, examRes, attemptRes] = await Promise.all([
      supabase.from('courses').select('id,code,title,instructor,color').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('materials').select('id,course_id,title,material_type,created_at,extracted_text').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('lecturer_profiles').select('course_id,profile').eq('user_id', userId),
      supabase.from('exams').select('id,course_id,title,mode,duration_minutes,total_marks,questions,created_at').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('exam_attempts').select('id,exam_id,course_id,score,total_marks,submitted_at,created_at,answers,feedback').eq('user_id', userId).order('created_at', { ascending: false }),
    ])
    const queryError = courseRes.error || materialRes.error || profileRes.error || examRes.error || attemptRes.error
    if (queryError) throw new Error('Some course data could not be loaded. Check your connection and try again.')
    return {
      courses: (courseRes.data ?? []) as Course[],
      materials: (materialRes.data ?? []) as Material[],
      lecturerProfiles: Object.fromEntries((profileRes.data ?? []).map((row) => [row.course_id, row.profile as LecturerProfile])),
      exams: (examRes.data ?? []) as Exam[],
      attempts: (attemptRes.data ?? []) as Attempt[],
    }
  }, [supabase, user])

  const { data: studyData = EMPTY_STUDY_DATA, mutate: mutateStudyData, error: studyDataError } = useSWR(user?.id ? `exammind-study:${user.id}` : null, fetchStudyData, { revalidateOnFocus: false })
  const { courses, materials, lecturerProfiles, exams, attempts } = studyData

  useEffect(() => {
    let mounted = true
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return
      setUser(data.user)
      setAuthReady(true)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setAuthReady(true)
      if (!session?.user) {
        setSelectedCourse('')
        setChatMessages([])
      }
    })
    return () => { mounted = false; listener.subscription.unsubscribe() }
  }, [supabase])

  useEffect(() => {
    if (studyDataError) setNotice(studyDataError.message)
  }, [studyDataError])

  useEffect(() => {
    if (!selectedCourse && courses[0]) setSelectedCourse(courses[0].id)
  }, [courses, selectedCourse])

  useEffect(() => {
    if (activeExam || result) return
    const attempt = attempts.find((row) => !row.submitted_at)
    const exam = attempt && exams.find((row) => row.id === attempt.exam_id)
    if (!attempt || !exam) return
    const savedAnswers = attempt.answers ?? {}
    const elapsedSeconds = Math.floor((Date.now() - new Date(attempt.created_at).getTime()) / 1000)
    answersRef.current = savedAnswers
    setActiveExam(exam)
    setAttemptId(attempt.id)
    setAnswers(savedAnswers)
    setSaveStatus('saved')
    setSecondsLeft(Math.max(0, exam.duration_minutes * 60 - elapsedSeconds))
    setNotice('Your unfinished practice exam has been restored.')
  }, [activeExam, attempts, exams, result])

  useEffect(() => {
    if (!activeExam || result) return
    const timer = window.setInterval(() => setSecondsLeft((remaining) => {
      if (remaining <= 1) { window.clearInterval(timer); void submitExam(true); return 0 }
      return remaining - 1
    }), 1000)
    return () => window.clearInterval(timer)
  }, [activeExam, result])

  const currentCourse = courses.find((course) => course.id === selectedCourse)
  const courseMaterials = materials.filter((material) => material.course_id === selectedCourse)
  const submittedAttempts = attempts.filter((attempt) => attempt.submitted_at)
  const averageScore = submittedAttempts.length ? Math.round(submittedAttempts.reduce((sum, attempt) => sum + ((attempt.score ?? 0) / Math.max(attempt.total_marks, 1)) * 100, 0) / submittedAttempts.length) : null
  const topicTotals = submittedAttempts.reduce<Record<string, { earned: number; possible: number; questions: number }>>((totals, attempt) => {
    for (const row of attempt.feedback?.questionResults ?? []) {
      if (!row.topic || !Number.isFinite(row.marks)) continue
      const current = totals[row.topic] ?? { earned: 0, possible: 0, questions: 0 }
      current.earned += row.score
      current.possible += row.marks
      current.questions += 1
      totals[row.topic] = current
    }
    return totals
  }, {})
  const topicPerformance = Object.entries(topicTotals).map(([name, totals]) => ({ name, percentage: Math.round((totals.earned / Math.max(totals.possible, 1)) * 100), questions: totals.questions })).sort((a, b) => a.percentage - b.percentage)
  const firstName = user?.user_metadata?.display_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'
  const filteredCourses = courses.filter((course) => `${course.code} ${course.title}`.toLowerCase().includes(search.toLowerCase()))

  async function createCourse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase.from('courses').insert({ user_id: user.id, code: courseForm.code.trim().toUpperCase(), title: courseForm.title.trim(), instructor: courseForm.instructor.trim() || null, color: colors[courses.length % colors.length] }).select().single()
    setLoading(false)
    if (error) { setNotice(error.code === '23505' ? 'That course code is already in your library.' : 'Could not save this course. Please try again.'); return }
    void mutateStudyData((current) => current ? { ...current, courses: [data as Course, ...current.courses] } : current, { revalidate: false })
    setSelectedCourse(data.id)
    setCourseForm({ code: '', title: '', instructor: '' })
    setModal(null)
    setView('courses')
    setNotice('Course added to your study space.')
  }

  async function uploadMaterial(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const fileInput = form.elements.namedItem('file') as HTMLInputElement
    const typeInput = form.elements.namedItem('materialType') as HTMLSelectElement
    const file = fileInput.files?.[0]
    if (!file || !user || !selectedCourse) return
    if (file.size > 25 * 1024 * 1024) { setNotice('Choose a file under 25 MB.'); return }
    setLoading(true)
    setNotice('Reading your material…')
    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `${user.id}/${selectedCourse}/${Date.now()}-${cleanName}`
    const { error: storageError } = await supabase.storage.from('exammind-materials').upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false })
    if (storageError) { setLoading(false); setNotice('The file could not be uploaded. Please try again.'); return }
    const extractForm = new FormData()
    extractForm.append('file', file)
    const extractResponse = await fetch('/api/materials/extract', { method: 'POST', body: extractForm })
    const extracted = await extractResponse.json()
    if (!extractResponse.ok) { await supabase.storage.from('exammind-materials').remove([path]); setLoading(false); setNotice(extracted.error || 'We could not read this file.'); return }
    const extension = file.name.split('.').pop()?.toLowerCase()
    const materialType = typeInput.value
    const { data, error } = await supabase.from('materials').insert({ course_id: selectedCourse, user_id: user.id, title: file.name, storage_path: path, mime_type: file.type || 'application/octet-stream', material_type: materialType, extracted_text: extracted.text, page_count: extracted.pageCount ?? null }).select().single()
    setLoading(false)
    if (error) { await supabase.storage.from('exammind-materials').remove([path]); setNotice('The file was uploaded, but its course record could not be saved.'); return }
    void mutateStudyData((current) => current ? { ...current, materials: [data as Material, ...current.materials] } : current, { revalidate: false })
    setModal(null)
    setView('courses')
    setNotice(`${file.name} is ready to study${extension ? ` · ${extension.toUpperCase()}` : ''}.`)
  }

  async function runAI(action: string, payload: Record<string, unknown>) {
    const response = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...payload }) })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'The study assistant could not complete that request.')
    return data
  }

  async function analyzeCourse(courseId = selectedCourse) {
    if (!courseId) return
    setLoading(true); setNotice('Comparing your past papers…')
    try {
      const data = await runAI('analyze', { courseId })
      void mutateStudyData((current) => current ? { ...current, lecturerProfiles: { ...current.lecturerProfiles, [courseId]: data.profile as LecturerProfile } } : current, { revalidate: false })
      setNotice(`Profile updated from ${data.sourceCount} past-paper source${data.sourceCount === 1 ? '' : 's'}.`)
      setView('courses')
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Could not analyze the lecturer profile.') }
    setLoading(false)
  }

  async function generateExam(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedCourse) return
    setLoading(true); setNotice('Building an original practice exam from your materials…')
    try {
      const data = await runAI('generate', { courseId: selectedCourse, ...examForm })
      void mutateStudyData((current) => current ? { ...current, exams: [data.exam as Exam, ...current.exams] } : current, { revalidate: false })
      setModal(null); setView('exams'); setNotice('Your practice exam is ready. Answers stay hidden until you submit.')
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Could not generate this practice exam.') }
    setLoading(false)
  }

  async function startExam(exam: Exam) {
    if (!user) return
    const { data, error } = await supabase.from('exam_attempts').insert({ exam_id: exam.id, course_id: exam.course_id, user_id: user.id, answers: {}, total_marks: exam.total_marks }).select('id,created_at').single()
    if (error) { setNotice('This exam could not be started. Please try again.'); return }
    if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current); setActiveExam(exam); setAttemptId(data.id); answersRef.current = {}; setAnswers({}); setSaveStatus('saved'); setReviewed([]); setQuestionIndex(0); setResult(null); setSecondsLeft(exam.duration_minutes * 60)
  }

  function saveAnswer(questionId: string, answer: string) {
    const next = { ...answersRef.current, [questionId]: answer }
    answersRef.current = next
    setAnswers(next)
    if (attemptId) {
      setSaveStatus('saving')
      if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = window.setTimeout(async () => {
        const { error } = await supabase.from('exam_attempts').update({ answers: answersRef.current }).eq('id', attemptId).eq('user_id', user.id)
        setSaveStatus(error ? 'error' : 'saved')
      }, 350)
    }
  }

  async function submitExam(expired = false) {
    if (!attemptId || result) return
    setLoading(true)
    try {
      if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current)
      const latestAnswers = answersRef.current
      const { error: saveError } = await supabase.from('exam_attempts').update({ answers: latestAnswers }).eq('id', attemptId).eq('user_id', user.id)
      if (saveError) { setSaveStatus('error'); throw new Error('Your latest answers could not be saved. Please try submitting again.') }
      setSaveStatus('saved')
      const data = await runAI('grade', { attemptId, answers: latestAnswers, expired })
      setResult(data.result)
      void mutateStudyData((current) => current ? { ...current, attempts: [data.attempt as Attempt, ...current.attempts] } : current, { revalidate: false })
      setNotice(expired ? 'Time is up. Your exam was submitted.' : 'Your answers are in. Let’s see what you know.')
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Your answers could not be submitted yet.') }
    setLoading(false)
  }

  async function askAssistant(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const prompt = chatInput.trim()
    if (!prompt || !selectedCourse) return
    setChatInput('')
    setChatMessages((previous) => [...previous, { role: 'user', content: prompt }])
    setLoading(true)
    try {
      const data = await runAI('ask', { courseId: selectedCourse, question: prompt })
      setChatMessages((previous) => [...previous, { role: 'assistant', content: data.answer }])
    } catch (error) {
      setChatMessages((previous) => [...previous, { role: 'assistant', content: error instanceof Error ? error.message : 'I couldn’t answer that just now.' }])
    }
    setLoading(false)
  }

  function showAttemptResults(attempt: Attempt) {
    const exam = exams.find((item) => item.id === attempt.exam_id)
    if (!exam || !attempt.feedback?.questionResults) { setNotice('Detailed feedback for this attempt is not available.'); return }
    const savedAnswers = attempt.answers ?? {}
    answersRef.current = savedAnswers
    setAnswers(savedAnswers)
    setActiveExam(exam)
    setResult({ score: attempt.score ?? 0, percentage: Math.round(((attempt.score ?? 0) / Math.max(attempt.total_marks, 1)) * 100), summary: attempt.feedback.summary, correct: attempt.feedback.objectiveCorrect ?? 0, unanswered: attempt.feedback.unanswered ?? 0, questionResults: attempt.feedback.questionResults })
  }

  async function signOut() { await supabase.auth.signOut(); setUser(null); setView('overview') }

  if (!authReady) return <main className="boot-screen"><div className="boot-mark"><BrainCircuit /></div><span>Making a little room to think…</span></main>
  if (!user) return <Landing onComplete={() => { setShowAuth(false); setView('overview') }} showAuth={showAuth} setShowAuth={setShowAuth} />

  if (activeExam) return <main className="exam-hall">
    <header className="exam-topbar"><a className="brand" href="#" onClick={(event) => { event.preventDefault(); if (result) setActiveExam(null) }}><span className="brand-mark"><BrainCircuit /></span><span>exam<span className="brand-light">mind</span></span></a><span className="exam-top-title">{activeExam.title}</span><div className={`exam-clock ${secondsLeft < 300 && !result ? 'clock-urgent' : ''}`}><Clock3 />{result ? 'SUBMITTED' : `${Math.floor(secondsLeft / 60).toString().padStart(2, '0')}:${(secondsLeft % 60).toString().padStart(2, '0')}`}</div></header>
    {!result ? <div className="exam-layout"><aside className="exam-question-rail"><p className="eyebrow">QUESTION NAVIGATOR</p><div className="question-dots">{activeExam.questions.map((question, index) => <button aria-label={`Question ${index + 1}${answers[String(index)] ? ', answered' : ''}`} className={`${questionIndex === index ? 'active' : ''} ${answers[String(index)] ? 'answered' : ''} ${reviewed.includes(index) ? 'marked' : ''}`} key={index} onClick={() => setQuestionIndex(index)}>{index + 1}</button>)}</div><div className="exam-legend"><span><i className="legend-answered" /> Answered</span><span><i className="legend-marked" /> Review</span><span><i /> Not answered</span></div><div className="exam-progress"><span>Progress</span><b>{Object.keys(answers).length} of {activeExam.questions.length}</b><div className="progress-track"><i style={{ width: `${Object.keys(answers).length / Math.max(activeExam.questions.length, 1) * 100}%` }} /></div></div></aside><section className="exam-question"><div className="question-heading"><span>QUESTION {String(questionIndex + 1).padStart(2, '0')} <i /> {activeExam.questions[questionIndex]?.marks} MARKS</span><button className={`review-button ${reviewed.includes(questionIndex) ? 'is-marked' : ''}`} onClick={() => setReviewed((previous) => previous.includes(questionIndex) ? previous.filter((index) => index !== questionIndex) : [...previous, questionIndex])}><CheckCircle2 /> {reviewed.includes(questionIndex) ? 'Marked for review' : 'Mark for review'}</button></div><h1>{activeExam.questions[questionIndex]?.prompt}</h1>{['multiple_choice', 'true_false'].includes(activeExam.questions[questionIndex]?.type || '') ? <div className="answer-options">{(activeExam.questions[questionIndex]?.options?.length ? activeExam.questions[questionIndex]?.options : ['True', 'False'])?.map((option, index) => <button className={`answer-option ${answers[String(questionIndex)] === option ? 'selected' : ''}`} key={option} onClick={() => saveAnswer(String(questionIndex), option)}><span>{String.fromCharCode(65 + index)}</span>{option}{answers[String(questionIndex)] === option && <Check />}</button>)}</div> : <textarea className="essay-answer" value={answers[String(questionIndex)] || ''} onChange={(event) => saveAnswer(String(questionIndex), event.target.value)} placeholder="Take a moment to organise your thoughts…" aria-label="Your answer" />}</section><footer className="exam-actions"><span className={`save-status ${saveStatus}`} role="status">{loading ? <LoaderCircle className="spin" /> : saveStatus === 'saving' ? <LoaderCircle className="spin" /> : saveStatus === 'error' ? <X /> : <Check />} {loading ? 'Submitting…' : saveStatus === 'saving' ? 'Saving answers…' : saveStatus === 'error' ? 'Save failed · submit to retry' : 'All answers saved'}</span><div><button className="button button-quiet" disabled={!questionIndex} onClick={() => setQuestionIndex((index) => index - 1)}><ArrowLeft /> Previous</button>{questionIndex < activeExam.questions.length - 1 ? <button className="button button-dark" onClick={() => setQuestionIndex((index) => index + 1)}>Next question <ArrowRight /></button> : <button className="button button-dark" onClick={() => void submitExam()}>Submit exam <Check /></button>}</div></footer></div> : <div className="result-page"><div className="result-medallion"><span>{result.percentage ?? 0}<small>%</small></span></div><p className="eyebrow">EXAM COMPLETE</p><h1>{result.percentage >= 80 ? 'A strong showing.' : result.percentage >= 60 ? 'Good work. Keep building.' : 'Progress starts here.'}</h1><p className="result-summary">{result.summary || 'Your answers have been reviewed against the course materials.'}</p><div className="result-score-row"><span><b>{result.score ?? 0}/{activeExam.total_marks}</b><small>POINTS EARNED</small></span><span><b>{result.correct ?? '—'}</b><small>OBJECTIVE CORRECT</small></span><span><b>{result.unanswered ?? 0}</b><small>LEFT BLANK</small></span></div><div className="explanations"><h2>Learn from every question</h2>{activeExam.questions.map((question, index) => <article className="explanation-row" key={index}><span className={`explanation-state ${result.questionResults?.[index]?.correct ? 'right' : 'wrong'}`}>{index + 1}</span><div><p>{question.prompt}</p><small>Your answer: {answers[String(index)] || 'No answer'}</small><small>Answer: {result.questionResults?.[index]?.answer ?? 'Unavailable'}</small><p className="explanation-text">{result.questionResults?.[index]?.explanation || result.questionResults?.[index]?.feedback || 'Review your course material for this topic.'}</p></div></article>)}</div><button className="button button-dark" onClick={() => { setActiveExam(null); setResult(null); setView('exams'); void mutateStudyData() }}>Back to your study space <ArrowRight /></button></div>}
  </main>

  return <div className="app-frame">
    <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
      <a className="brand app-brand" href="#" onClick={(event) => { event.preventDefault(); setView('overview') }}><span className="brand-mark"><BrainCircuit /></span><span>exam<span className="brand-light">mind</span></span></a>
      <button className="workspace-switch"><span className="workspace-avatar">{firstName.slice(0, 1).toUpperCase()}</span><span className="workspace-name">My study space<small>Personal workspace</small></span><ChevronDown /></button>
      <div className="side-label">STUDY SPACE</div><nav className="side-nav" aria-label="Study space">{navItems.map(({ id, label, icon: Icon }) => <button className={`side-link ${view === id ? 'side-link-active' : ''}`} key={id} onClick={() => { setView(id); setMobileMenu(false) }}><Icon />{label}{id === 'courses' && courses.length > 0 && <span className="nav-count">{courses.length}</span>}</button>)}</nav>
      <div className="sidebar-course-head"><span className="side-label">YOUR COURSES</span><button className="side-plus" aria-label="Add course" onClick={() => setModal('course')}><Plus /></button></div>
      <div className="sidebar-courses">{courses.slice(0, 5).map((course) => <button key={course.id} onClick={() => { setSelectedCourse(course.id); setView('courses'); setMobileMenu(false) }} className={`sidebar-course ${selectedCourse === course.id && view === 'courses' ? 'sidebar-course-active' : ''}`}><i style={{ background: course.color }} /><span>{course.code}</span><small>{materials.filter((item) => item.course_id === course.id).length || ''}</small></button>)}{courses.length === 0 && <p className="side-empty">Add a course to start your library.</p>}</div>
      <button className="sidebar-tip" onClick={() => setView('assistant')}><div className="tip-orb"><Sparkles /></div><b>A question is a start.</b><span>Ask your study assistant to explain any topic.</span><i>Try it <ArrowRight /></i></button>
      <div className="sidebar-bottom"><button className="side-link" onClick={() => setNotice('Your courses and answers are private to your account.')}><Settings2 />Settings</button><button className="profile-button" onClick={() => void signOut()}><span className="profile-avatar">{firstName.slice(0, 1).toUpperCase()}</span><span>{firstName}<small>Personal account</small></span><LogOut /></button></div>
    </aside>
    <main className="main-panel">
      <header className="workspace-topbar"><button className="mobile-menu-button" aria-label="Open menu" onClick={() => setMobileMenu((open) => !open)}><Menu /></button><div className="crumbs">Your space <span>/</span> <b>{navItems.find((item) => item.id === view)?.label ?? 'Study'}</b></div><div className="topbar-tools"><label className="global-search"><Search /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search anything" aria-label="Search courses" /><kbd>⌘ K</kbd></label><button className="notification-button" aria-label="Notifications" onClick={() => setNotice('You’re all caught up.')}><Bell /></button><span className="top-avatar">{firstName.slice(0, 1).toUpperCase()}</span></div></header>
      {notice && <div className="toast-note" role="status"><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss notification"><X /></button></div>}
      <div className="content-area">
        {view === 'overview' && <>
          <section className="welcome-row"><div><p className="eyebrow">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}</p><h1>A little progress,<br className="mobile-break" /> {firstName}.</h1><p className="welcome-copy">Your next big understanding starts with a small step.</p></div><button className="button button-dark" onClick={() => courses.length ? setModal('exam') : setModal('course')}><Sparkles />{courses.length ? 'Create a practice exam' : 'Add your first course'}</button></section>
          <section className="stat-grid"><article className="stat-card"><div className="stat-label">IN YOUR LIBRARY <BookOpen /></div><strong>{courses.length.toString().padStart(2, '0')}</strong><span>courses in progress</span><div className="stat-bottom"><i className="stat-dot violet" />{materials.length} learning materials added</div></article><article className="stat-card"><div className="stat-label">EXAM READINESS <Gauge /></div><strong>{averageScore === null ? '—' : `${averageScore}%`}</strong><span>{averageScore === null ? 'Your first score is waiting' : 'average across your exams'}</span><div className="stat-bottom"><i className="stat-dot green" />{submittedAttempts.length} completed practice sessions</div></article><article className="stat-card stat-card-featured"><div className="stat-label">YOUR NEXT BEST STEP <Sparkles /></div><b>{courses.length === 0 ? 'Start with one course' : materials.length === 0 ? 'Bring your notes in' : 'Make your understanding visible'}</b><span>{courses.length === 0 ? 'A focused study space makes it easier to begin.' : materials.length === 0 ? 'Your materials are the starting point for better practice.' : 'Try a short exam to see what you already know.'}</span><button onClick={() => courses.length === 0 ? setModal('course') : materials.length === 0 ? setModal('upload') : setModal('exam')}>{courses.length === 0 ? 'Create a course' : materials.length === 0 ? 'Add materials' : 'Build a practice exam'} <ArrowRight /></button></article></section>
          <section className="overview-grid"><div className="panel course-panel"><div className="panel-heading"><div><p className="eyebrow">YOUR LEARNING, IN MOTION</p><h2>Continue your journey</h2></div><button className="subtle-link" onClick={() => setView('courses')}>All courses <ArrowUpRight /></button></div>{courses.length ? <div className="course-list">{courses.slice(0, 3).map((course) => <button key={course.id} className="course-list-item" onClick={() => { setSelectedCourse(course.id); setView('courses') }}><span className="course-color" style={{ background: course.color }}><BookOpen /></span><span className="course-list-main"><b>{course.title}</b><small>{course.code}{course.instructor ? ` · ${course.instructor}` : ''}</small></span><span className="course-material-count">{materials.filter((item) => item.course_id === course.id).length} materials</span><ArrowRight /></button>)}</div> : <div className="empty-state"><div className="empty-illustration"><BookOpen /></div><b>Your study space starts with one course.</b><span>Add the class you’re working toward, then bring in a few notes.</span><button className="button button-light" onClick={() => setModal('course')}>Create your first course <ArrowRight /></button></div>}</div><div className="panel focus-panel"><div className="panel-heading"><div><p className="eyebrow">A MOMENT TO CHECK IN</p><h2>Your recent work</h2></div><Clock3 /></div>{submittedAttempts.length ? <div className="recent-attempt-list">{submittedAttempts.slice(0, 4).map((attempt) => { const exam = exams.find((item) => item.id === attempt.exam_id); return <button className="recent-attempt" key={attempt.id} onClick={() => showAttemptResults(attempt)}><span className="attempt-mark"><Check /></span><span><b>{exam?.title ?? 'Practice exam'}</b><small>{attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleDateString() : 'Just now'}</small></span><strong>{Math.round(((attempt.score ?? 0) / Math.max(attempt.total_marks, 1)) * 100)}%</strong></button> })}</div> : <div className="focus-empty"><span className="focus-icon"><Target /></span><b>Your focus, at your own pace.</b><p>Completed exams will appear here with a clear view of what you’ve mastered.</p><button className="text-link" onClick={() => courses.length ? setModal('exam') : setModal('course')}>Take your first step <ArrowRight /></button></div>}</div></section>
          <section className="quote-band"><div className="quote-mark">“</div><div><p>Learning isn’t a race to the answer. It’s the moment a difficult idea finally clicks.</p><small>THE EXAMMIND APPROACH</small></div><div className="quote-decoration"><span /><span /><span /><span /><span /></div></section>
        </>}
        {view === 'courses' && <section className="page-section"><div className="page-heading"><div><p className="eyebrow">YOUR PERSONAL COURSE LIBRARY</p><h1>All the right things,<br />in one place.</h1><p>Every course becomes its own focused study space.</p></div><button className="button button-dark" onClick={() => setModal('course')}><Plus /> Add a course</button></div>{courses.length ? <div className="courses-layout"><div className="course-selector">{filteredCourses.map((course) => <button key={course.id} className={`course-selector-item ${selectedCourse === course.id ? 'selected' : ''}`} onClick={() => setSelectedCourse(course.id)}><i style={{ background: course.color }} /><span><b>{course.code}</b><small>{course.title}</small></span><ArrowRight /></button>)}</div>{currentCourse && <div className="course-detail"><div className="course-detail-top"><div className="course-detail-mark" style={{ background: `${currentCourse.color}20`, color: currentCourse.color }}><GraduationCap /></div><div><p className="eyebrow">{currentCourse.code}</p><h2>{currentCourse.title}</h2><span>{currentCourse.instructor || 'Instructor not added'}</span></div></div><div className="course-actions"><button className="button button-dark" onClick={() => setModal('upload')}><Upload /> Add course materials</button><button className="button button-light" onClick={() => setModal('exam')}><Sparkles /> Generate exam</button><button className="button button-light" disabled={loading || !courseMaterials.some((item) => item.material_type === 'past_question' && item.extracted_text)} onClick={() => void analyzeCourse()}><BrainCircuit /> Analyze lecturer</button></div><div className="course-detail-heading"><h3>Materials</h3><span>{courseMaterials.length} items</span></div>{courseMaterials.length ? <div className="material-list">{courseMaterials.map((material) => <article className="material-item" key={material.id}><span className={`file-icon ${material.material_type === 'past_question' ? 'file-icon-peach' : ''}`}><FileText /></span><span><b>{material.title}</b><small>{material.material_type.replace('_', ' ')} · Added {new Date(material.created_at).toLocaleDateString()}</small></span>{material.extracted_text ? <span className="indexed-label"><Check /> Indexed</span> : <span className="indexed-label">Uploaded</span>}</article>)}</div> : <div className="material-empty"><FolderOpen /><b>No materials yet</b><span>Add lecture notes, slides or past papers to begin.</span><button className="text-link" onClick={() => setModal('upload')}>Upload your first file <ArrowRight /></button></div>}<div className="analysis-card"><div className="analysis-spark"><BrainCircuit /></div><div><p className="eyebrow">LECTURER INTELLIGENCE</p><b>See the patterns in past papers.</b><span>Upload past questions to reveal evidence-backed topics and formats.</span></div><button className="button button-light" disabled={loading || !courseMaterials.some((item) => item.material_type === 'past_question' && item.extracted_text)} onClick={() => void analyzeCourse()}>{loading ? <LoaderCircle className="spin" /> : 'Build profile'} <ArrowRight /></button></div>{lecturerProfiles[selectedCourse] && <section className="profile-report"><div className="profile-report-head"><div><p className="eyebrow">EVIDENCE FROM YOUR PAST PAPERS</p><h3>What the papers show</h3></div><span>{lecturerProfiles[selectedCourse].paperCount || 0} sources analyzed</span></div>{lecturerProfiles[selectedCourse].topics?.length ? <div className="profile-topic-list">{lecturerProfiles[selectedCourse].topics.slice(0, 5).map((topic, index) => <article className="profile-topic" key={`${topic.name}-${index}`}><span className="profile-topic-index">{String(index + 1).padStart(2, '0')}</span><div><b>{topic.name}</b><small>{topic.evidence}</small></div><span className="profile-frequency">{topic.frequency} mentions</span><span className={`confidence-badge ${topic.confidence}`}>{topic.confidence}</span></article>)}</div> : <p className="profile-no-patterns">No recurring topics were confidently observed in these papers.</p>}<div className="profile-observations"><span><small>QUESTION FORMATS</small><b>{lecturerProfiles[selectedCourse].formats?.map((format) => `${format.name} (${format.frequency})`).join(' · ') || 'No recurring format observed'}</b></span><span><small>COMMON INSTRUCTION VERBS</small><b>{lecturerProfiles[selectedCourse].instructionalVerbs?.map((verb) => `${verb.name} (${verb.frequency})`).join(' · ') || 'No recurring verbs observed'}</b></span><span><small>MARKS PATTERN</small><b>{lecturerProfiles[selectedCourse].marksPattern || 'Not consistently visible'}</b></span></div><p className="profile-caveat">Patterns describe only the papers you uploaded. They are not predictions of a future exam.</p></section>}</div>}</div> : <div className="library-empty"><div className="empty-illustration"><GraduationCap /></div><h2>One space for every course.</h2><p>Create your first course to keep notes, practice exams and progress together.</p><button className="button button-dark" onClick={() => setModal('course')}><Plus /> Create a course</button></div>}</section>}
        {view === 'exams' && <section className="page-section"><div className="page-heading"><div><p className="eyebrow">PRACTICE WITH PURPOSE</p><h1>A little closer<br />every time.</h1><p>Original exams, shaped around what you’re learning.</p></div><button className="button button-dark" onClick={() => courses.length ? setModal('exam') : setModal('course')}><Sparkles /> Build an exam</button></div>{exams.length ? <div className="exam-grid">{exams.map((exam) => { const attempt = submittedAttempts.find((row) => row.exam_id === exam.id); const course = courses.find((row) => row.id === exam.course_id); return <article className="exam-card" key={exam.id}><div className="exam-card-top"><span className="exam-mode-tag">{modeLabel[exam.mode] || exam.mode}</span></div><h3>{exam.title}</h3><p>{course?.code} · {exam.questions.length} questions</p><div className="exam-card-meta"><span><Clock3 /> {exam.duration_minutes} min</span><span><Target /> {exam.total_marks} marks</span></div><div className="exam-complete-row">{attempt ? <span><CheckCircle2 /> Last score</span> : <span><Sparkles /> Ready when you are</span>}{attempt && <b>{Math.round(((attempt.score ?? 0) / Math.max(attempt.total_marks, 1)) * 100)}%</b>}</div>{attempt && <button className="exam-review-link" onClick={() => showAttemptResults(attempt)}>Review feedback <ArrowUpRight /></button>}<button className="button button-light exam-start" onClick={() => void startExam(exam)}>{attempt ? 'Practice again' : 'Start practice'} <ArrowRight /></button></article> })}</div> : <div className="library-empty"><div className="empty-illustration"><BookOpenCheck /></div><h2>Practice for the exam you’ll actually take.</h2><p>Add notes and past papers to create an original, course-aware practice exam.</p><button className="button button-dark" onClick={() => courses.length ? setModal('exam') : setModal('course')}>{courses.length ? 'Create a practice exam' : 'Add a course first'} <ArrowRight /></button></div>}</section>}
        {view === 'analytics' && <section className="page-section"><div className="page-heading"><div><p className="eyebrow">A CLEARER VIEW OF YOUR LEARNING</p><h1>Progress you<br />can feel.</h1><p>Your completed practice, reflected back to you.</p></div></div><div className="analytics-stats"><article className="stat-card"><div className="stat-label">PRACTICE SESSIONS <BookOpenCheck /></div><strong>{submittedAttempts.length}</strong><span>exams completed</span></article><article className="stat-card"><div className="stat-label">AVERAGE RESULT <Gauge /></div><strong>{averageScore === null ? '—' : `${averageScore}%`}</strong><span>from completed exams</span></article><article className="stat-card"><div className="stat-label">COURSES IN PLAY <BookOpen /></div><strong>{courses.length}</strong><span>active study spaces</span></article></div><div className="panel progress-panel"><div className="panel-heading"><div><p className="eyebrow">YOUR RECENT SCORES</p><h2>Learning over time</h2></div><span className="subtle-caption">Only completed attempts</span></div>{submittedAttempts.length ? <div className="score-chart">{submittedAttempts.slice(0, 8).reverse().map((attempt) => { const value = Math.round(((attempt.score ?? 0) / Math.max(attempt.total_marks, 1)) * 100); const exam = exams.find((item) => item.id === attempt.exam_id); return <div className="score-column" key={attempt.id}><span className="score-value">{value}%</span><div className="score-bar" style={{ height: `${Math.max(value, 4)}%` }} /><small>{exam?.title.slice(0, 13) || 'Exam'}</small></div> })}</div> : <div className="analytics-empty"><ChartNoAxesCombined /><b>Your progress takes shape with practice.</b><p>Complete an exam to see your scores and identify what to focus on next.</p><button className="button button-light" onClick={() => setView('exams')}>Explore practice exams <ArrowRight /></button></div>}</div><div className="panel topic-analysis"><div className="panel-heading"><div><p className="eyebrow">TOPIC-LEVEL PERFORMANCE</p><h2>Know what to revisit</h2></div><Target /></div>{topicPerformance.length ? <div className="topic-performance-columns"><div><p>WORTH ANOTHER LOOK</p>{topicPerformance.slice(0, 3).map((topic) => <div className="topic-performance-row" key={`weak-${topic.name}`}><span><b>{topic.name}</b><small>{topic.questions} question{topic.questions === 1 ? '' : 's'}</small></span><i><span style={{ width: `${topic.percentage}%` }} /></i><strong>{topic.percentage}%</strong></div>)}</div><div><p>FEELING STRONGER</p>{topicPerformance.slice(-3).reverse().map((topic) => <div className="topic-performance-row" key={`strong-${topic.name}`}><span><b>{topic.name}</b><small>{topic.questions} question{topic.questions === 1 ? '' : 's'}</small></span><i><span style={{ width: `${topic.percentage}%` }} /></i><strong>{topic.percentage}%</strong></div>)}</div></div> : <div className="topic-performance-empty"><p>Topic insights appear after you complete a practice exam. We use your actual marked answers, not estimates.</p></div>}</div><div className="panel focus-recommendation"><span className="recommend-icon"><Target /></span><div><p className="eyebrow">YOUR NEXT STUDY SESSION</p><h3>{submittedAttempts.length ? 'Review one concept you found challenging.' : 'Add course materials to get a useful recommendation.'}</h3><p>Recommendations appear as your course materials and completed practice build a clearer picture.</p></div><button className="button button-light" onClick={() => courses.length ? setView('courses') : setModal('course')}>Go to courses <ArrowRight /></button></div></section>}
        {view === 'assistant' && <section className="assistant-page"><div className="assistant-heading"><span className="assistant-emblem"><Sparkles /></span><p className="eyebrow">YOUR COURSE-AWARE STUDY PARTNER</p><h1>Ask the question<br />behind the question.</h1><p>Clear explanations, grounded in the materials you’ve added. No guesswork, no generic answers.</p></div><div className="assistant-course-select"><label htmlFor="assistant-course">Study from</label><select id="assistant-course" value={selectedCourse} onChange={(event) => setSelectedCourse(event.target.value)}><option value="">Choose a course</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.code} · {course.title}</option>)}</select><span>{materials.filter((item) => item.course_id === selectedCourse && item.extracted_text).length} indexed materials</span></div><div className="assistant-conversation">{chatMessages.length === 0 ? <div className="assistant-empty"><CircleHelp /><b>What would you like to understand?</b><p>Ask about an idea from your lecture notes, or ask for a simpler explanation.</p><div className="suggestion-prompts">{['Explain a concept in simpler terms', 'What should I focus on in this topic?', 'Give me an example to make this click'].map((prompt) => <button key={prompt} onClick={() => setChatInput(prompt)}>{prompt} <ArrowUpRight /></button>)}</div></div> : chatMessages.map((message, index) => <article className={`chat-message ${message.role}`} key={index}><span className="chat-avatar">{message.role === 'user' ? firstName.slice(0, 1).toUpperCase() : <Sparkles />}</span><div><small>{message.role === 'user' ? 'YOU' : 'EXAMMIND STUDY PARTNER'}</small><p>{message.content}</p></div></article>)}{loading && <div className="chat-thinking"><span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" /> Working from your course materials</div>}</div><form className="assistant-composer" onSubmit={askAssistant}><textarea value={chatInput} onChange={(event) => setChatInput(event.target.value)} placeholder="Ask something you’re working through…" aria-label="Ask your course assistant" rows={2} disabled={!selectedCourse || loading} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) { event.preventDefault(); event.currentTarget.form?.requestSubmit() } }} /><button type="submit" disabled={!chatInput.trim() || !selectedCourse || loading} aria-label="Send question"><Send /></button><span>Answers use your indexed course materials. Shift + Enter for a new line.</span></form></section>}
      </div>
      <footer className="app-footer"><span>EXAMMIND <i /> Built around your learning</span><button onClick={() => setNotice('Your course material remains private to your account.')}>Privacy, always <ArrowUpRight /></button></footer>
    </main>
    {modal && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !loading && setModal(null)}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title"><button className="icon-button modal-close" onClick={() => setModal(null)} aria-label="Close"><X /></button>
      {modal === 'course' && <><div className="modal-icon lavender"><BookOpen /></div><p className="eyebrow">A SPACE OF YOUR OWN</p><h2 id="modal-title">Add a course</h2><p className="modal-copy">Start with the course code. You can add the rest as you go.</p><form className="stacked-form" onSubmit={createCourse}><label>Course code<input autoFocus required maxLength={20} placeholder="BIO 241" value={courseForm.code} onChange={(event) => setCourseForm({ ...courseForm, code: event.target.value })} /></label><label>Course title<input required maxLength={100} placeholder="Foundations of neuroscience" value={courseForm.title} onChange={(event) => setCourseForm({ ...courseForm, title: event.target.value })} /></label><label>Instructor <span className="optional-label">OPTIONAL</span><input maxLength={80} placeholder="Dr. Patel" value={courseForm.instructor} onChange={(event) => setCourseForm({ ...courseForm, instructor: event.target.value })} /></label><button className="button button-dark modal-submit" disabled={loading}>{loading ? <LoaderCircle className="spin" /> : <Plus />} Create study space <ArrowRight /></button></form></>}
      {modal === 'upload' && <><div className="modal-icon peach"><Upload /></div><p className="eyebrow">BUILD YOUR COURSE LIBRARY</p><h2 id="modal-title">Bring your materials in.</h2><p className="modal-copy">Your course-aware practice is only as good as the material you give it.</p><form className="stacked-form" onSubmit={uploadMaterial}><label>Belongs to<select value={selectedCourse} onChange={(event) => setSelectedCourse(event.target.value)} required>{courses.map((course) => <option key={course.id} value={course.id}>{course.code} · {course.title}</option>)}</select></label><label>Material type<select name="materialType"><option value="notes">Lecture notes</option><option value="past_question">Past examination paper</option><option value="slides">Lecture slides</option><option value="image">Image or scanned document</option><option value="other">Other course material</option></select></label><label className="upload-drop"><input type="file" name="file" required accept=".pdf,.pptx,.docx,.txt,.md,.csv,.html,.png,.jpg,.jpeg,.webp" /><span className="upload-drop-icon"><Upload /></span><b>Choose a file to upload</b><small>PDF, PowerPoint, Word, text or image · Up to 25 MB</small></label><p className="upload-privacy"><Check /> Stored privately in your study space. Unsupported formats can still be stored but cannot be indexed.</p><button className="button button-dark modal-submit" disabled={loading}>{loading ? <LoaderCircle className="spin" /> : <Upload />} Upload and index <ArrowRight /></button></form></>}
      {modal === 'exam' && <><div className="modal-icon mint"><Sparkles /></div><p className="eyebrow">BUILT FROM YOUR COURSE MATERIALS</p><h2 id="modal-title">Make a practice exam.</h2><p className="modal-copy">Questions are original, grounded in your indexed materials, and answers stay private until submission.</p><form className="stacked-form" onSubmit={generateExam}><label>Course<select value={selectedCourse} onChange={(event) => setSelectedCourse(event.target.value)} required>{courses.map((course) => <option key={course.id} value={course.id}>{course.code} · {course.title}</option>)}</select></label><label>Practice mode<select value={examForm.mode} onChange={(event) => setExamForm({ ...examForm, mode: event.target.value })}><option value="lecturer">Lecturer mode · observed patterns only</option><option value="comprehensive">Comprehensive · full course coverage</option><option value="challenge">Challenge · deeper application</option></select></label><div className="form-row"><label>Questions<select value={examForm.count} onChange={(event) => setExamForm({ ...examForm, count: Number(event.target.value) })}><option value={5}>5 questions</option><option value={10}>10 questions</option><option value={15}>15 questions</option></select></label><label>Duration<select value={examForm.duration} onChange={(event) => setExamForm({ ...examForm, duration: Number(event.target.value) })}><option value={15}>15 minutes</option><option value={30}>30 minutes</option><option value={45}>45 minutes</option><option value={60}>60 minutes</option></select></label></div><label>Difficulty<select value={examForm.difficulty} onChange={(event) => setExamForm({ ...examForm, difficulty: event.target.value })}><option value="balanced">Balanced</option><option value="gentle">Build confidence</option><option value="hard">Stretch me</option></select></label><label>Focus topics <span className="optional-label">OPTIONAL · COMMA SEPARATED</span><input maxLength={240} placeholder="e.g. neural pathways, memory" value={examForm.topics} onChange={(event) => setExamForm({ ...examForm, topics: event.target.value })} /></label>{!courseMaterials.some((item) => item.extracted_text) && <p className="form-notice">Add readable course material first. We don’t generate questions from unsupported sources.</p>}<button className="button button-dark modal-submit" disabled={loading || !courseMaterials.some((item) => item.extracted_text)}>{loading ? <LoaderCircle className="spin" /> : <Sparkles />} {loading ? 'Creating your exam…' : 'Generate original exam'} <ArrowRight /></button></form></>}
    </section></div>}
    {notice && <div className="sr-only" aria-live="polite">{notice}</div>}
  </div>
}
