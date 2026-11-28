'use client'

import type { Dispatch, FormEvent, SetStateAction } from 'react'
import { ArrowRight, Check, LoaderCircle, Sparkles } from 'lucide-react'

export type ExamFormState = {
  mode: string
  count: number
  duration: number
  difficulty: string
  topics: string
  questionTypes: string[]
  typeWeights: Record<string, number>
  topicStrategy: string
  transformationPrompt: string
  negativeMarking: boolean
  penaltyPercent: number
  partialCredit: boolean
}

type Props = {
  form: ExamFormState
  setForm: Dispatch<SetStateAction<ExamFormState>>
  selectedCourse: string
  setSelectedCourse: (courseId: string) => void
  courses: { id: string; code: string; title: string }[]
  hasMaterials: boolean
  loading: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

const formats = [
  ['multiple_choice', 'Multiple choice'], ['true_false', 'True / false'], ['fill_blank', 'Fill in the blank'], ['matching', 'Matching'],
  ['short_answer', 'Short answer'], ['definition', 'Definitions'], ['calculation', 'Calculations'], ['scenario', 'Scenarios'],
  ['application', 'Application'], ['case_study', 'Case study'], ['theory', 'Theory'], ['essay', 'Essay'],
]
const modes = [
  ['comprehensive', 'Full course', 'Balanced coverage across your indexed materials.'],
  ['weakness', 'Target my gaps', 'Use your saved answers to focus on topics you miss.'],
  ['rapid', 'Quick recall', 'Short retrieval questions for a focused review.'],
  ['challenge', 'Deep challenge', 'Practice transfer, synthesis and harder applications.'],
  ['lecturer', 'Lecturer patterns', 'Use patterns actually observed in uploaded papers.'],
  ['mock', 'Past-paper format', 'Mirror evidenced structure, not future predictions.'],
  ['transformation', 'Transform a question', 'Create fresh problems from a question you provide.'],
  ['random', 'Fresh mix', 'Sample a varied mix of course concepts.'],
]

function rebalance(form: ExamFormState, selected: string[], changed: string, value: number) {
  const bounded = Math.min(100, Math.max(0, Math.round(value)))
  const others = selected.filter((type) => type !== changed)
  if (!others.length) return { ...form.typeWeights, [changed]: 100 }
  const remaining = 100 - bounded
  const previousTotal = others.reduce((sum, type) => sum + (form.typeWeights[type] || 0), 0)
  const weights = { ...form.typeWeights, [changed]: bounded }
  let assigned = 0
  others.forEach((type, index) => {
    const next = index === others.length - 1 ? remaining - assigned : Math.round(remaining * ((form.typeWeights[type] || 1) / Math.max(previousTotal, 1)))
    weights[type] = Math.max(0, next)
    assigned += weights[type]
  })
  return weights
}

export function ExamBuilderForm({ form, setForm, selectedCourse, setSelectedCourse, courses, hasMaterials, loading, onSubmit }: Props) {
  function toggleFormat(type: string) {
    const adding = !form.questionTypes.includes(type)
    const next = adding ? [...form.questionTypes, type] : form.questionTypes.filter((item) => item !== type)
    if (!next.length) return
    const share = Math.floor(100 / next.length)
    const weights = Object.fromEntries(next.map((item, index) => [item, index === next.length - 1 ? 100 - share * (next.length - 1) : share]))
    setForm({ ...form, questionTypes: next, typeWeights: weights })
  }

  return <>
    <div className="modal-icon mint"><Sparkles /></div>
    <p className="eyebrow">BUILT FROM YOUR COURSE MATERIALS</p>
    <h2 id="modal-title">Make a practice exam.</h2>
    <p className="modal-copy">Build a custom practice set around what you need to learn. Every answer is graded and saved privately.</p>
    <form className="stacked-form exam-builder-form" onSubmit={onSubmit}>
      <label>Course<select value={selectedCourse} onChange={(event) => setSelectedCourse(event.target.value)} required>{courses.map((course) => <option key={course.id} value={course.id}>{course.code} · {course.title}</option>)}</select></label>
      <fieldset className="exam-mode-picker"><legend>What do you want to practice?</legend><div className="exam-mode-grid">{modes.map(([value, title, description]) => <label className={`exam-mode-option ${form.mode === value ? 'selected' : ''}`} key={value}><input type="radio" name="exam-mode" value={value} checked={form.mode === value} onChange={() => setForm({ ...form, mode: value })} /><span className="exam-mode-check"><Check /></span><b>{title}</b><small>{description}</small></label>)}</div></fieldset>
      {form.mode === 'transformation' && <label>Question or concept to transform<textarea required minLength={12} maxLength={1800} rows={4} value={form.transformationPrompt} onChange={(event) => setForm({ ...form, transformationPrompt: event.target.value })} placeholder="Paste a question or describe the concept. EXAMMIND will create new questions that test the same underlying idea." /></label>}
      <div className="form-row"><label>Question count<input type="number" min={5} max={100} step={1} required value={form.count} onChange={(event) => setForm({ ...form, count: Number(event.target.value) })} /><small>Choose any number from 5 to 100.</small></label><label>Time limit (minutes)<input type="number" min={5} max={720} step={1} required value={form.duration} onChange={(event) => setForm({ ...form, duration: Number(event.target.value) })} /><small>5 min to 12 hours, including custom durations.</small></label></div>
      <label>Difficulty<select value={form.difficulty} onChange={(event) => setForm({ ...form, difficulty: event.target.value })}><option value="gentle">Build confidence</option><option value="balanced">Balanced</option><option value="hard">Stretch me</option><option value="expert">Expert level</option><option value="mixed">Mixed difficulty</option></select></label>
      <label>Choose question formats <span className="optional-label">AT LEAST ONE</span></label>
      <div className="question-format-grid">{formats.map(([value, label]) => <label key={value} className={`format-chip ${form.questionTypes.includes(value) ? 'selected' : ''}`}><input type="checkbox" checked={form.questionTypes.includes(value)} onChange={() => toggleFormat(value)} /><span>{form.questionTypes.includes(value) ? <Check /> : null}</span>{label}</label>)}</div>
      {form.questionTypes.length > 1 && <fieldset className="format-distribution"><legend>Format mix <span>{Object.values(form.typeWeights).reduce((sum, weight) => sum + weight, 0)}% total</span></legend>{form.questionTypes.map((type) => <label className="distribution-row" key={type}><span>{formats.find(([value]) => value === type)?.[1]}</span><input type="range" min="0" max="100" value={form.typeWeights[type] ?? 0} onChange={(event) => setForm({ ...form, typeWeights: rebalance(form, form.questionTypes, type, Number(event.target.value)) })} aria-label={`${formats.find(([value]) => value === type)?.[1]} percentage`} /><output>{form.typeWeights[type] ?? 0}%</output></label>)}</fieldset>}
      <label>Topic strategy<select value={form.topicStrategy} onChange={(event) => setForm({ ...form, topicStrategy: event.target.value })}><option value="whole_course">Balanced across the course</option><option value="specific">Focus on topics I choose</option><option value="weakest">My lowest-scoring topics</option><option value="unpracticed">Topics I have not practiced</option><option value="random">A new, mixed selection</option></select></label>
      {(form.topicStrategy === 'specific' || form.topicStrategy === 'whole_course') && <label>Topic focus <span className="optional-label">OPTIONAL · COMMA SEPARATED</span><input maxLength={240} placeholder="e.g. neural pathways, memory" value={form.topics} onChange={(event) => setForm({ ...form, topics: event.target.value })} /></label>}
      <fieldset className="grading-options"><legend>Marking preferences</legend><label className="switch-row"><span><b>Partial credit</b><small>Recognize correct reasoning even when an answer is incomplete.</small></span><input type="checkbox" checked={form.partialCredit} onChange={(event) => setForm({ ...form, partialCredit: event.target.checked })} /></label><label className="switch-row"><span><b>Negative marking</b><small>Deduct marks for incorrect multiple-choice answers. Unanswered questions are not penalized.</small></span><input type="checkbox" checked={form.negativeMarking} onChange={(event) => setForm({ ...form, negativeMarking: event.target.checked })} /></label>{form.negativeMarking && <label>Wrong-answer penalty<select value={form.penaltyPercent} onChange={(event) => setForm({ ...form, penaltyPercent: Number(event.target.value) })}><option value={10}>10% of question marks</option><option value={25}>25% of question marks</option><option value={33}>One third of question marks</option><option value={50}>50% of question marks</option></select></label>}</fieldset>
      {!hasMaterials && <p className="form-notice">Add readable course material first. We don&apos;t generate questions from unsupported sources.</p>}
      {form.mode === 'weakness' && <p className="form-notice">Target my gaps requires at least one completed practice exam in this course.</p>}
      {form.mode === 'lecturer' && <p className="form-notice">Lecturer patterns uses only observed patterns from the past papers you&apos;ve analyzed; it doesn&apos;t predict a future exam.</p>}
      <button className="button button-dark modal-submit" disabled={loading || !hasMaterials || (form.mode === 'weakness' && false)}>{loading ? <LoaderCircle className="spin" /> : <Sparkles />} {loading ? 'Creating your exam…' : `Generate ${form.count} original questions`} <ArrowRight /></button>
    </form>
  </>
}
