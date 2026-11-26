import { generateText } from 'ai'
import JSZip from 'jszip'
import mammoth from 'mammoth'
import { PDFParse } from 'pdf-parse'
import { createClient } from '@/lib/supabase/server'

const OCR_MODEL = 'anthropic/claude-sonnet-5.5'

async function extractWithOcr(buffer: Buffer, mediaType: string, fileName: string) {
  const { text } = await generateText({
    model: OCR_MODEL,
    maxOutputTokens: 12000,
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: 'Transcribe the legible text from this course document in natural reading order. Preserve headings, numbered questions, equations, table rows, marks, and visible page breaks. Do not answer questions or add interpretation. If a word is unreadable, mark it [unreadable] rather than guessing. Return only the transcription.' },
        { type: 'file', mediaType, data: buffer, filename: fileName },
      ],
    }],
  })
  return text
}

export const runtime = 'nodejs'
const MAX_FILE_SIZE = 25 * 1024 * 1024

function decodeXml(value: string) {
  return value.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim()
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Sign in to process course materials.' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file')
  if (!(file instanceof File)) return Response.json({ error: 'Choose a file to upload.' }, { status: 400 })
  if (file.size > MAX_FILE_SIZE) return Response.json({ error: 'This file is larger than 25 MB.' }, { status: 413 })

  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  const buffer = Buffer.from(await file.arrayBuffer())
  let text = ''
  let pageCount: number | null = null

  try {
    if (extension === 'pdf') {
      const parser = new PDFParse({ data: buffer })
      const result = await parser.getText()
      text = result.text
      pageCount = result.pages?.length ?? null
      await parser.destroy()
      if (text.trim().length < 40) text = await extractWithOcr(buffer, 'application/pdf', file.name)
    } else if (extension === 'docx') {
      const result = await mammoth.extractRawText({ buffer })
      text = result.value
    } else if (extension === 'pptx') {
      const archive = await JSZip.loadAsync(buffer)
      const slidePaths = Object.keys(archive.files).filter((path) => /^ppt\/slides\/slide\d+\.xml$/.test(path)).sort((a, b) => Number(a.match(/slide(\d+)/)?.[1]) - Number(b.match(/slide(\d+)/)?.[1]))
      pageCount = slidePaths.length
      text = (await Promise.all(slidePaths.map(async (path, index) => {
        const xml = await archive.file(path)?.async('text') ?? ''
        const slideText = [...xml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((match) => decodeXml(match[1])).filter(Boolean).join(' ')
        return slideText ? `Slide ${index + 1}: ${slideText}` : ''
      }))).filter(Boolean).join('\n\n')
    } else if (['txt', 'md', 'csv', 'html'].includes(extension)) {
      text = buffer.toString('utf8')
      if (extension === 'html') text = decodeXml(text)
    } else if (['png', 'jpg', 'jpeg', 'webp'].includes(extension)) {
      text = await extractWithOcr(buffer, file.type || `image/${extension === 'jpg' ? 'jpeg' : extension}`, file.name)
    } else {
      return Response.json({ error: 'This file type can be stored, but we cannot extract its text yet. Use PDF, PowerPoint, Word, or a text file.' }, { status: 415 })
    }
  } catch {
    return Response.json({ error: 'We could not read this file. Make sure it is not damaged or password protected.' }, { status: 422 })
  }

  const normalized = text.replace(/\u0000/g, '').replace(/\n{3,}/g, '\n\n').trim()
  if (normalized.length < 20) return Response.json({ error: 'We could not find enough selectable text in this file. Scanned documents may need OCR before they can be indexed.' }, { status: 422 })
  if (normalized.length > 300_000) return Response.json({ error: 'This document contains too much text to index at once. Split it into smaller files.' }, { status: 413 })
  return Response.json({ text: normalized, pageCount })
}
