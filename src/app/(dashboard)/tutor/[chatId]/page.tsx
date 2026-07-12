'use client'
import { useState, useRef, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

function renderMarkdown(text: string): string {
  return text
    .replace(/^## (.+)$/gm, '<h3 style="font-size:1rem;font-weight:700;color:#1a1a2e;margin:14px 0 6px 0;">$1</h3>')
    .replace(/^### (.+)$/gm, '<h4 style="font-size:0.9rem;font-weight:600;color:#1a1a2e;margin:10px 0 4px 0;">$1</h4>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight:600;color:#1a1a2e;">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, (_, expr) => {
      const formatted = expr
        .replace(/([a-zA-Z0-9])\^([a-zA-Z0-9]+)/g, '$1<sup>$2</sup>')
        .replace(/([a-zA-Z0-9])_([a-zA-Z0-9]+)/g, '$1<sub>$2</sub>')
      return `<code style="background:rgba(168,85,247,0.08);color:#7c3aed;padding:2px 6px;border-radius:4px;font-size:0.9em;">${formatted}</code>`
    })
    .replace(/^\d+\. (.+)$/gm, '<div style="display:flex;gap:8px;margin:3px 0;"><span style="color:#a855f7;font-weight:600;min-width:16px;">•</span><span>$1</span></div>')
    .replace(/^[-•] (.+)$/gm, '<div style="display:flex;gap:8px;margin:3px 0;"><span style="color:#a855f7;min-width:16px;">•</span><span>$1</span></div>')
    .replace(/\n\n/g, '<br/>')
    .replace(/\n/g, '<br/>')
    .replace(/^#{1,3}\s*$/gm, '')
}

// Strip READY_TO_TEST markers from display text
function stripReadyMarker(text: string): string {
  return text
    .replace(/\[READY_TO_TEST:[^\]]*\]/gim, '')
    .replace(/READY_TO_TEST:[^\n]*/gim, '')
    .replace(/READY\s+TO\s+TEST:[^\n]*/gim, '')
    .trim()
}

// Extract topic from READY_TO_TEST marker
function extractReadyTopic(text: string): string | null {
  const patterns = [
    /\[READY_TO_TEST:\s*([^\]]+)\]/im,
    /READY_TO_TEST:\s*\[?([^\]\n]+)\]?/im,
    /READY\s+TO\s+TEST:\s*\[?([^\]\n]+)\]?/im,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m) return m[1].trim()
  }
  return null
}

function AIBubble({ content, onSave }: { content: string, onSave?: () => void }) {
  const [copied, setCopied] = useState(false)
  const [reaction, setReaction] = useState<'up' | 'down' | null>(null)
  const [showEmoji, setShowEmoji] = useState<'up' | 'down' | null>(null)
  const [speaking, setSpeaking] = useState(false)

  function handleSpeak() {
    if (!window.speechSynthesis) return
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return }
    const plain = stripReadyMarker(content)
      .replace(/^#{1,3} /gm, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/^\d+\. /gm, '')
      .replace(/^[-•*] /gm, '')
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
      .replace(/\n+/g, '. ')
      .trim()
    const utterance = new SpeechSynthesisUtterance(plain)
    utterance.lang = 'en-US'
    utterance.rate = 0.95
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    setSpeaking(true)
    window.speechSynthesis.speak(utterance)
  }

  function handleCopy() {
    const plain = stripReadyMarker(content)
      .replace(/^#{1,3} /gm, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/^\d+\. /gm, '')
      .replace(/^[-•] /gm, '')
      .trim()
    navigator.clipboard.writeText(plain)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleReaction(type: 'up' | 'down') {
    setReaction(type)
    setShowEmoji(type)
    setTimeout(() => setShowEmoji(null), 1200)
  }

  const displayContent = stripReadyMarker(content)

  return (
    <div style={{ alignSelf: 'flex-start', maxWidth: '82%', position: 'relative' }}>
      <style>{`
        @keyframes floatUp {
          0% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          50% { opacity: 1; transform: translateX(-50%) translateY(-20px) scale(1.3); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-50px) scale(0.8); }
        }
      `}</style>
      {showEmoji && (
        <div style={{ position: 'absolute', top: '-20px', left: '50%', fontSize: '2rem', animation: 'floatUp 1.2s ease forwards', pointerEvents: 'none', zIndex: 10 }}>
          {showEmoji === 'up' ? '👍' : '👎'}
        </div>
      )}
      <div className="bubble-ai" dangerouslySetInnerHTML={{ __html: renderMarkdown(displayContent) }} />
      <div style={{ display: 'flex', gap: '4px', marginTop: '6px', paddingLeft: '4px' }}>
        <button onClick={handleCopy} style={{ background: copied ? 'rgba(16,185,129,0.08)' : 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', color: copied ? '#10b981' : '#9ca3af', fontSize: '0.75rem', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '4px' }}
          onMouseEnter={e => { if (!copied) { (e.currentTarget as HTMLElement).style.background = 'rgba(168,85,247,0.08)'; (e.currentTarget as HTMLElement).style.color = '#a855f7' }}}
          onMouseLeave={e => { if (!copied) { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = '#9ca3af' }}}>
          {copied ? '✓ Copied' : '📋 Copy'}
        </button>
        {onSave && (
          <button onClick={onSave} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', color: '#9ca3af', fontSize: '0.75rem', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '4px' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(168,85,247,0.08)'; (e.currentTarget as HTMLElement).style.color = '#a855f7' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = '#9ca3af' }}>
            📌 Save to Notes
          </button>
        )}
        <button onClick={handleSpeak} style={{ background: speaking ? 'rgba(168,85,247,0.08)' : 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', color: speaking ? '#a855f7' : '#9ca3af', fontSize: '0.75rem', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '4px' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(168,85,247,0.08)'; (e.currentTarget as HTMLElement).style.color = '#a855f7' }}
          onMouseLeave={e => { if (!speaking) { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = '#9ca3af' }}}>
          {speaking ? '⏹ Stop' : '🔊 Read'}
        </button>
        <button onClick={() => handleReaction('up')} style={{ background: reaction === 'up' ? 'rgba(16,185,129,0.08)' : 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: '6px', color: reaction === 'up' ? '#10b981' : '#9ca3af', fontSize: '0.75rem', transition: 'all 0.15s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(16,185,129,0.08)'; (e.currentTarget as HTMLElement).style.color = '#10b981' }}
          onMouseLeave={e => { if (reaction !== 'up') { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = '#9ca3af' }}}>👍</button>
        <button onClick={() => handleReaction('down')} style={{ background: reaction === 'down' ? 'rgba(239,68,68,0.08)' : 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: '6px', color: reaction === 'down' ? '#ef4444' : '#9ca3af', fontSize: '0.75rem', transition: 'all 0.15s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'; (e.currentTarget as HTMLElement).style.color = '#ef4444' }}
          onMouseLeave={e => { if (reaction !== 'down') { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = '#9ca3af' }}}>👎</button>
      </div>
    </div>
  )
}

async function awardXP(action: string, metadata: Record<string, any> = {}) {
  try {
    await fetch('/api/xp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        metadata: { ...metadata, localHour: new Date().getHours(), localDay: new Date().getDay() }
      })
    })
  } catch (err) {
    console.error('XP award failed:', err)
  }
}

export default function ChatPage() {
  const { chatId } = useParams<{ chatId: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<{ full_name: string, age: number, education_level: string, streak_count?: number, exams?: { name: string, exam_date: string, priority: string }[], weakTopics?: { subject: string, topic: string, score: number, total: number }[], minutesToday?: number } | null>(null)
  const [subjects, setSubjects] = useState<{ id: string; name: string; topics: { id: string; name: string }[] }[]>([])
  const [saveModal, setSaveModal] = useState<{ content: string } | null>(null)
  const [saveSubjectId, setSaveSubjectId] = useState('')
  const [saveTopicId, setSaveTopicId] = useState('')
  const [saving, setSaving] = useState(false)
  const [readyToTest, setReadyToTest] = useState<string | null>(null)
  const [inlineMCQCount, setInlineMCQCount] = useState(5)
  const [inlineMCQ, setInlineMCQ] = useState<{
    questions: { question: string; options: string[]; correct: string; explanation: string }[]
    selected: string[]
    submitted: boolean
    score: number
    loading: boolean
  } | null>(null)
  const [inlineFlashcards, setInlineFlashcards] = useState<{
    cards: { front: string; back: string }[]
    flipped: number | null
    loading: boolean
  } | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const autoSentRef = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const inputZoneRef = useRef<HTMLDivElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [listening, setListening] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string } | null>(null)
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => { loadChat(); loadProfile(); loadSubjects() }, [chatId])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [inlineMCQ])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [inlineFlashcards])

  async function loadSubjects() {
    const res = await fetch('/api/subjects')
    const data = await res.json()
    if (!data.subjects) return
    const withTopics = await Promise.all(data.subjects.map(async (s: { id: string; name: string }) => {
      const res = await fetch(`/api/topics?subject_id=${s.id}`)
      const data = await res.json()
      return { ...s, topics: data.topics || [] }
    }))
    setSubjects(withTopics)
  }

  async function saveNoteToTopic() {
    if (!saveModal || !saveTopicId) return
    setSaving(true)
    await fetch('/api/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic_id: saveTopicId, type: 'ai', content: saveModal.content, local_hour: new Date().getHours(), local_day: new Date().getDay() }) })
    setSaving(false)
    setSaveModal(null)
    setSaveSubjectId('')
    setSaveTopicId('')
  }

  async function loadProfile() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { data } = await supabase.from('profiles').select('full_name, age, education_level, streak_count').eq('id', user.id).single()
  const { data: exams } = await supabase.from('exams').select('name, exam_date, priority').eq('user_id', user.id).order('exam_date', { ascending: true })
  
  // Get weak topics from mcq_attempts (last 30 days, score < 70%)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: attempts } = await supabase.from('mcq_attempts').select('subject, topic, score, total').eq('user_id', user.id).gte('created_at', thirtyDaysAgo)
  
  const weakTopics = (attempts || [])
    .filter(a => a.total > 0 && (a.score / a.total) < 0.7)
    .slice(0, 5)

  // Get minutes studied today
  const todayStart = new Date(); todayStart.setHours(0,0,0,0)
  const { data: sessions } = await supabase.from('study_sessions').select('minutes').eq('user_id', user.id).gte('created_at', todayStart.toISOString())
  const minutesToday = (sessions || []).reduce((sum, s) => sum + s.minutes, 0)

  if (data) setProfile({ ...data, exams: exams || [], weakTopics, minutesToday })
}

  async function loadChat() {
    const { data } = await supabase.from('tutor_messages').select('role, content').eq('chat_id', chatId).order('created_at', { ascending: true })
    if (data && data.length > 0) {
      const displayMessages = data.filter(m => m.role !== 'system_context') as Message[]
      const contextMessage = data.find(m => m.role === 'system_context')
      setMessages(displayMessages)
      const isReviewChat = displayMessages.length === 1 && displayMessages[0].role === 'user' && contextMessage
      if (isReviewChat && !autoSentRef.current) {
        autoSentRef.current = true
        autoSendReviewMessage(displayMessages[0].content, displayMessages, contextMessage.content)
      }
    } else {
      setMessages([{ role: 'assistant', content: "Hi! I'm Lumora, your AI tutor. Ask me anything — I'll explain it clearly, step by step." }])
    }
  }

  async function autoSendReviewMessage(displayContent: string, existingMessages: Message[], contextContent: string) {
    setLoading(true)
    try {
      const res = await fetch('/api/tutor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', content: contextContent }], profile }) })
      const data = await res.json()
      let replyText = data.reply
      const topic = extractReadyTopic(replyText)
      if (topic) setReadyToTest(topic)
      replyText = stripReadyMarker(replyText)
      const aiMessage: Message = { role: 'assistant', content: replyText }
      setMessages([...existingMessages, aiMessage])
      await supabase.from('tutor_messages').insert({ chat_id: chatId, role: 'assistant', content: replyText })
      const title = await generateTitle(displayContent)
      await supabase.from('tutor_chats').update({ title, updated_at: new Date().toISOString() }).eq('id', chatId)
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Try again.' }])
    } finally { setLoading(false) }
  }

  async function generateTitle(firstMessage: string): Promise<string> {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_GROQ_API_KEY}` },
        body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: `Generate a short 3-5 word chat title for this student question: "${firstMessage.slice(0, 200)}". Reply with ONLY the title, no quotes, no punctuation, no explanation.` }], max_tokens: 20, temperature: 0.7 })
      })
      const data = await res.json()
      return data.choices?.[0]?.message?.content?.trim() || firstMessage.slice(0, 40)
    } catch { return firstMessage.slice(0, 40) }
  }

  async function sendMessage() {
    if ((!input.trim() && !attachedFile) || loading) return
    setInlineMCQ(null)
    setInlineFlashcards(null)
    const userContent = attachedFile ? `${input}\n\n[Attached file: ${attachedFile.name}]\n${attachedFile.content}` : input
    const displayContent = input + (attachedFile ? ` 📎 ${attachedFile.name}` : '')
    const userMessage: Message = { role: 'user', content: displayContent }
    const messageForAI: Message = { role: 'user', content: userContent }
    setAttachedFile(null)
    const updated = [...messages, userMessage]
    setMessages(updated)
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/tutor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [...messages, messageForAI], profile }) })
      const data = await res.json()
      let replyText = data.reply
      const topic = extractReadyTopic(replyText)
      if (topic) setReadyToTest(topic)
      replyText = stripReadyMarker(replyText)
      const aiMessage: Message = { role: 'assistant', content: replyText }
      setMessages([...updated, aiMessage])
      await supabase.from('tutor_messages').insert([{ chat_id: chatId, role: 'user', content: displayContent }, { chat_id: chatId, role: 'assistant', content: replyText }])
      awardXP('tutor_message', { chatId })
      const userMsgCount = updated.filter(m => m.role === 'user').length
      if (userMsgCount === 1) {
        const title = await generateTitle(input)
        await supabase.from('tutor_chats').update({ title, updated_at: new Date().toISOString() }).eq('id', chatId)
      } else {
        await supabase.from('tutor_chats').update({ updated_at: new Date().toISOString() }).eq('id', chatId)
      }
    } catch {
      setMessages([...updated, { role: 'assistant', content: 'Sorry, something went wrong. Try again.' }])
    } finally { setLoading(false) }
  }

  function handleTestYourself(type: 'mcq' | 'flashcards' | 'exam') {
    if (!readyToTest) return
    if (type === 'mcq') { generateInlineMCQ(); return }
    if (type === 'flashcards') { generateInlineFlashcards(); return }
    router.push(`/${type}?${new URLSearchParams({ topic: readyToTest, subject: 'General', auto: 'true' }).toString()}`)
  }

  async function generateInlineFlashcards() {
    if (!readyToTest) return
    setInlineFlashcards({ cards: [], flipped: null, loading: true })
    setInlineMCQ(null)
    try {
      const res = await fetch('/api/flashcards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subject: 'General', topic: readyToTest, count: 8 }) })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setInlineFlashcards({ cards: data.cards, flipped: null, loading: false })
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch { setInlineFlashcards(null) }
  }

  async function generateInlineMCQ() {
    if (!readyToTest) return
    setInlineMCQ({ questions: [], selected: [], submitted: false, score: 0, loading: true })
    setInlineFlashcards(null)
    try {
      const res = await fetch('/api/mcq', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subject: 'General', topic: readyToTest, count: inlineMCQCount }) })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setInlineMCQ({ questions: data.questions, selected: new Array(data.questions.length).fill(''), submitted: false, score: 0, loading: false })
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch { setInlineMCQ(null) }
  }

  function handleInlineSelect(qIndex: number, opt: string) {
    if (!inlineMCQ || inlineMCQ.submitted) return
    const updated = [...inlineMCQ.selected]
    updated[qIndex] = opt
    setInlineMCQ({ ...inlineMCQ, selected: updated })
  }

  async function handleInlineSubmit() {
    if (!inlineMCQ) return
    let score = 0
    const wrong: { question: string; selected: string; correct: string }[] = []
    inlineMCQ.questions.forEach((q, i) => {
      if (inlineMCQ.selected[i] === q.correct) { score++ } else { wrong.push({ question: q.question, selected: inlineMCQ.selected[i], correct: q.correct }) }
    })
    setInlineMCQ({ ...inlineMCQ, submitted: true, score })
    const resultMsg = `MCQ Results: ${score}/${inlineMCQ.questions.length} on ${readyToTest}.${wrong.length > 0 ? ` Wrong answers:\n${wrong.map(w => `- "${w.question}" — I answered "${w.selected}" but correct was "${w.correct}"`).join('\n')}` : ' Got everything correct!'}`
    const userMessage: Message = { role: 'user', content: resultMsg }
    const updated = [...messages, userMessage]
    setMessages(updated)
    setLoading(true)
    try {
      const res = await fetch('/api/tutor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: updated, profile }) })
      const data = await res.json()
      let replyText = data.reply
      const topic = extractReadyTopic(replyText)
      if (topic) setReadyToTest(topic)
      replyText = stripReadyMarker(replyText)
      const aiMessage: Message = { role: 'assistant', content: replyText }
      setMessages([...updated, aiMessage])
      await supabase.from('tutor_messages').insert([{ chat_id: chatId, role: 'user', content: resultMsg }, { chat_id: chatId, role: 'assistant', content: replyText }])
    } catch { } finally { setLoading(false) }
  }

  async function handleFileDrop(file: File) {
    setUploadingFile(true)
    try {
      const ext = file.name.split('.').pop()?.toLowerCase()
      let text = ''
      if (['txt', 'md', 'csv', 'json', 'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'py'].includes(ext || '')) {
        text = await file.text()
      } else {
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch('/api/extract-pdf', { method: 'POST', body: formData })
        const data = await res.json()
        text = data.text || ''
      }
      setAttachedFile({ name: file.name, content: text.slice(0, 3000) })
    } catch {
      setAttachedFile({ name: file.name, content: '' })
    } finally { setUploadingFile(false) }
  }

  return (
    <>
      <style>{`
        .tutor-wrap { position: relative; display: flex; flex-direction: column; height: calc(100vh - 64px); max-width: 780px; margin: 0 auto; }
        .messages { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; padding-right: 4px; margin-bottom: 16px; }
        .messages::-webkit-scrollbar { width: 4px; }
        .messages::-webkit-scrollbar-track { background: transparent; }
        .messages::-webkit-scrollbar-thumb { background: #e8e0f0; border-radius: 4px; }
        .bubble-user { max-width: 72%; padding: 12px 16px; border-radius: 18px; border-bottom-right-radius: 4px; font-size: 0.875rem; line-height: 1.6; white-space: pre-wrap; background: linear-gradient(135deg, #a855f7, #ec4899); color: white; align-self: flex-end; }
        .bubble-ai { padding: 14px 18px; border-radius: 18px; border-bottom-left-radius: 4px; font-size: 0.875rem; line-height: 1.5; white-space: normal; background: rgba(255,255,255,0.85); border: 1px solid #e8e0f0; color: #1a1a2e; }
        .bubble-ai strong { font-weight: 600; }
        .bubble-ai em { font-style: italic; }
        .dots-wrap { background: rgba(255,255,255,0.8); border: 1px solid #e8e0f0; border-radius: 18px; border-bottom-left-radius: 4px; padding: 14px 18px; align-self: flex-start; display: flex; gap: 4px; align-items: center; }
        .dot { width: 7px; height: 7px; border-radius: 50%; background: #a855f7; animation: bounce 1s infinite; }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        .chat-input { background: rgba(255,255,255,0.8); border: 1px solid #e8e0f0; border-radius: 14px; padding: 14px 18px; color: #1a1a2e; font-size: 0.875rem; outline: none; width: 100%; transition: border-color 0.15s; box-sizing: border-box; }
        .chat-input:focus { border-color: #a855f7; }
        .chat-input::placeholder { color: #9ca3af; }
        .send-btn { background: linear-gradient(135deg, #a855f7, #ec4899); color: white; font-weight: 600; font-size: 0.875rem; padding: 14px 24px; border-radius: 14px; border: none; cursor: pointer; transition: opacity 0.15s; white-space: nowrap; }
        .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .send-btn:hover:not(:disabled) { opacity: 0.9; }
        .icon-btn { background: rgba(255,255,255,0.8); border: 1px solid #e8e0f0; border-radius: 14px; padding: 14px 16px; cursor: pointer; font-size: 16px; color: #9ca3af; flex-shrink: 0; transition: border-color 0.15s; }
        .icon-btn:hover { border-color: #a855f7; }
      `}</style>

      <div
        className="tutor-wrap"
        ref={wrapRef}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={e => { if (!wrapRef.current?.contains(e.relatedTarget as Node)) setDragOver(false) }}
        onDrop={async e => { e.preventDefault(); setDragOver(false); const file = e.dataTransfer.files?.[0]; if (file) handleFileDrop(file) }}
      >
        {dragOver && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 10,
            background: 'rgba(255,255,255,0.75)',
            backdropFilter: 'blur(8px)',
            borderRadius: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px',
              background: 'white',
              border: '2px dashed #a855f7',
              borderRadius: '20px',
              padding: '40px 60px',
              boxShadow: '0 8px 32px rgba(168,85,247,0.15)',
            }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(236,72,153,0.12))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '28px',
              }}>📎</div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1a1a2e' }}>Drop your file here</p>
                <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#9ca3af' }}>PDF, DOCX, TXT, CSV, code files and more</p>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(236,72,153,0.08))',
                border: '1px solid rgba(168,85,247,0.2)',
                borderRadius: '8px', padding: '6px 16px',
                fontSize: '0.75rem', fontWeight: 600, color: '#a855f7',
              }}>Release to attach</div>
            </div>
          </div>
        )}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1" style={{ color: '#1a1a2e' }}>AI Tutor</h1>
          <p className="text-sm" style={{ color: '#9ca3af' }}>
            {profile ? `Personalized for ${profile.full_name} · ${profile.education_level}` : 'Ask anything — get clear, step-by-step explanations'}
          </p>
        </div>

        <div className="messages">
          {messages.map((m, i) => (
            m.role === 'user' ? (
              <div key={i} className="bubble-user">{m.content}</div>
            ) : (
              <AIBubble key={i} content={m.content} onSave={() => setSaveModal({ content: m.content })} />
            )
          ))}
          {loading && (
            <div className="dots-wrap">
              <span className="dot" style={{ animationDelay: '0ms' }} />
              <span className="dot" style={{ animationDelay: '150ms' }} />
              <span className="dot" style={{ animationDelay: '300ms' }} />
            </div>
          )}

          {readyToTest && !loading && (
            <div style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.15)', borderRadius: '16px', padding: '16px 20px', alignSelf: 'stretch', marginTop: '8px' }}>
              <p className="text-sm font-semibold mb-1" style={{ color: '#1a1a2e' }}>Ready to test yourself? 🎯</p>
              <p className="text-xs mb-3" style={{ color: '#9ca3af' }}>You've got a solid understanding of <strong>{readyToTest}</strong>. Want to lock it in?</p>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => handleTestYourself('flashcards')} style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: '10px', padding: '8px 14px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', color: '#a855f7', transition: 'all 0.15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(168,85,247,0.15)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(168,85,247,0.08)'}>▦ Flashcards</button>
                <button onClick={() => handleTestYourself('mcq')} style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: '10px', padding: '0', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', color: '#a855f7', transition: 'all 0.15s', display: 'flex', alignItems: 'center', overflow: 'hidden' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(168,85,247,0.15)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(168,85,247,0.08)'}>
                  <span style={{ padding: '8px 10px 8px 14px' }}>◈ MCQ</span>
                  <span style={{ width: '1px', background: 'rgba(168,85,247,0.2)', alignSelf: 'stretch' }} />
                  <select value={inlineMCQCount} onChange={e => { e.stopPropagation(); setInlineMCQCount(Number(e.target.value)) }} onClick={e => e.stopPropagation()} style={{ background: 'transparent', border: 'none', outline: 'none', padding: '8px 10px', fontSize: '0.8rem', color: '#a855f7', fontWeight: '600', cursor: 'pointer' }}>
                    <option value={5}>5 Qs</option><option value={10}>10 Qs</option><option value={15}>15 Qs</option><option value={20}>20 Qs</option>
                  </select>
                </button>
                <button onClick={() => handleTestYourself('exam')} style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: '10px', padding: '8px 14px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', color: '#a855f7', transition: 'all 0.15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(168,85,247,0.15)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(168,85,247,0.08)'}>📝 Mock Exam</button>
              </div>
            </div>
          )}

          {inlineFlashcards && (
            <div style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid #e8e0f0', borderRadius: '16px', padding: '20px', alignSelf: 'stretch', marginTop: '8px' }}>
              {inlineFlashcards.loading ? (
                <p className="text-sm animate-pulse" style={{ color: '#a855f7', textAlign: 'center' }}>Generating flashcards...</p>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <p className="text-sm font-semibold" style={{ color: '#1a1a2e' }}>▦ Flashcards — {readyToTest}</p>
                    <p style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{inlineFlashcards.cards.length} cards · click to flip</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '16px' }}>
                    {inlineFlashcards.cards.map((card, i) => (
                      <div key={i} onClick={() => setInlineFlashcards({ ...inlineFlashcards, flipped: inlineFlashcards.flipped === i ? null : i })}
                        style={{ cursor: 'pointer', background: inlineFlashcards.flipped === i ? 'rgba(168,85,247,0.06)' : 'rgba(255,255,255,0.7)', border: inlineFlashcards.flipped === i ? '1px solid #a855f7' : '1px solid #e8e0f0', borderRadius: '12px', padding: '14px', minHeight: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'all 0.15s' }}>
                        <div>
                          <p style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: inlineFlashcards.flipped === i ? '#a855f7' : '#9ca3af', marginBottom: '6px' }}>{inlineFlashcards.flipped === i ? 'Answer' : `Card ${i + 1}`}</p>
                          <p style={{ fontSize: '0.8rem', color: '#1a1a2e', lineHeight: '1.5' }}>{inlineFlashcards.flipped === i ? card.back : card.front}</p>
                        </div>
                        <p style={{ fontSize: '0.68rem', color: '#c4b5d4', marginTop: '8px' }}>{inlineFlashcards.flipped === i ? 'Click to see question' : 'Click to reveal answer'}</p>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setInlineFlashcards(null)} style={{ width: '100%', padding: '10px', background: 'rgba(168,85,247,0.08)', color: '#a855f7', fontWeight: '600', fontSize: '0.85rem', borderRadius: '10px', border: '1px solid rgba(168,85,247,0.2)', cursor: 'pointer' }}>Close</button>
                </>
              )}
            </div>
          )}

          {inlineMCQ && (
            <div style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid #e8e0f0', borderRadius: '16px', padding: '20px', alignSelf: 'stretch', marginTop: '8px' }}>
              {inlineMCQ.loading ? (
                <p className="text-sm animate-pulse" style={{ color: '#a855f7', textAlign: 'center' }}>Generating questions...</p>
              ) : (
                <>
                  <p className="text-sm font-semibold mb-4" style={{ color: '#1a1a2e' }}>◈ Quick MCQ — {readyToTest}</p>
                  {inlineMCQ.submitted && (
                    <div style={{ background: inlineMCQ.score >= Math.ceil(inlineMCQ.questions.length * 0.8) ? 'rgba(16,185,129,0.06)' : inlineMCQ.score >= Math.ceil(inlineMCQ.questions.length * 0.6) ? 'rgba(168,85,247,0.06)' : 'rgba(239,68,68,0.06)', border: `1px solid ${inlineMCQ.score >= Math.ceil(inlineMCQ.questions.length * 0.8) ? 'rgba(16,185,129,0.2)' : inlineMCQ.score >= Math.ceil(inlineMCQ.questions.length * 0.6) ? 'rgba(168,85,247,0.2)' : 'rgba(239,68,68,0.2)'}`, borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', textAlign: 'center' }}>
                      <p style={{ fontSize: '1.4rem', fontWeight: '700', color: inlineMCQ.score >= Math.ceil(inlineMCQ.questions.length * 0.8) ? '#10b981' : inlineMCQ.score >= Math.ceil(inlineMCQ.questions.length * 0.6) ? '#a855f7' : '#ef4444' }}>{inlineMCQ.score} / {inlineMCQ.questions.length}</p>
                      <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '2px' }}>{inlineMCQ.score >= Math.ceil(inlineMCQ.questions.length * 0.8) ? '🎉 Great job!' : inlineMCQ.score >= Math.ceil(inlineMCQ.questions.length * 0.6) ? '👍 Good effort!' : '📚 Keep studying!'}</p>
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {inlineMCQ.questions.map((q, i) => (
                      <div key={i}>
                        <p style={{ fontSize: '0.8rem', fontWeight: '600', color: '#1a1a2e', marginBottom: '8px' }}><span style={{ color: '#a855f7' }}>{i + 1}. </span>{q.question}</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {q.options.map((opt, j) => {
                            let bg = 'rgba(255,255,255,0.6)', border = '1px solid #e8e0f0', color = '#1a1a2e'
                            if (inlineMCQ.submitted) {
                              if (opt === q.correct) { bg = 'rgba(16,185,129,0.08)'; border = '1px solid #10b981'; color = '#059669' }
                              else if (opt === inlineMCQ.selected[i]) { bg = 'rgba(239,68,68,0.08)'; border = '1px solid #ef4444'; color = '#dc2626' }
                            } else if (inlineMCQ.selected[i] === opt) { bg = 'rgba(168,85,247,0.08)'; border = '1px solid #a855f7'; color = '#9333ea' }
                            return <button key={j} disabled={inlineMCQ.submitted} onClick={() => handleInlineSelect(i, opt)} style={{ width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: '8px', border, background: bg, color, fontSize: '0.8rem', cursor: inlineMCQ.submitted ? 'default' : 'pointer', transition: 'all 0.15s', display: 'block' }}>{opt}</button>
                          })}
                        </div>
                        {inlineMCQ.submitted && <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '6px' }}>💡 {q.explanation}</p>}
                      </div>
                    ))}
                  </div>
                  {!inlineMCQ.submitted && <button onClick={handleInlineSubmit} disabled={inlineMCQ.selected.includes('')} style={{ marginTop: '16px', width: '100%', padding: '10px', background: 'linear-gradient(135deg, #a855f7, #ec4899)', color: 'white', fontWeight: '600', fontSize: '0.85rem', borderRadius: '10px', border: 'none', cursor: 'pointer', opacity: inlineMCQ.selected.includes('') ? 0.4 : 1 }}>Submit Answers</button>}
                  {inlineMCQ.submitted && <button onClick={() => setInlineMCQ(null)} style={{ marginTop: '12px', width: '100%', padding: '10px', background: 'rgba(168,85,247,0.08)', color: '#a855f7', fontWeight: '600', fontSize: '0.85rem', borderRadius: '10px', border: '1px solid rgba(168,85,247,0.2)', cursor: 'pointer' }}>Close</button>}
                </>
              )}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input Zone */}
        <div
          ref={inputZoneRef}
          style={{ position: 'relative' }}
        >

          {/* File chip */}
          {attachedFile && (() => {
            const ext = (attachedFile.name.split('.').pop() || 'FILE').toUpperCase()
            const extColors: Record<string, { bg: string; color: string }> = {
              PDF:  { bg: '#fee2e2', color: '#dc2626' },
              DOCX: { bg: '#dbeafe', color: '#2563eb' }, DOC: { bg: '#dbeafe', color: '#2563eb' },
              XLSX: { bg: '#dcfce7', color: '#16a34a' }, XLS: { bg: '#dcfce7', color: '#16a34a' }, CSV: { bg: '#dcfce7', color: '#16a34a' },
              PPTX: { bg: '#ffedd5', color: '#ea580c' }, PPT: { bg: '#ffedd5', color: '#ea580c' },
              TSX:  { bg: '#ede9fe', color: '#7c3aed' }, TS: { bg: '#ede9fe', color: '#7c3aed' },
              JSX:  { bg: '#fef9c3', color: '#ca8a04' }, JS: { bg: '#fef9c3', color: '#ca8a04' },
              PY:   { bg: '#dbeafe', color: '#1d4ed8' },
              MD:   { bg: '#f3f4f6', color: '#374151' },
              JSON: { bg: '#f3f4f6', color: '#374151' },
            }
            const { bg, color } = extColors[ext] || { bg: 'rgba(168,85,247,0.1)', color: '#7c3aed' }
            const typeLabel: Record<string, string> = {
              PDF: 'PDF Document', DOCX: 'Word Document', DOC: 'Word Document',
              XLSX: 'Spreadsheet', XLS: 'Spreadsheet', CSV: 'CSV Spreadsheet',
              PPTX: 'PowerPoint', PPT: 'PowerPoint',
              TSX: 'TypeScript React', TS: 'TypeScript', JSX: 'JavaScript React', JS: 'JavaScript',
              PY: 'Python', MD: 'Markdown', JSON: 'JSON', TXT: 'Text File',
              HTML: 'HTML', CSS: 'Stylesheet', XML: 'XML',
            }
            return (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.95)', border: '1px solid #e8e0f0', borderRadius: '12px', padding: '8px 12px 8px 8px', marginBottom: '10px', backdropFilter: 'blur(12px)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', maxWidth: '280px', position: 'relative' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.6rem', fontWeight: 800, color, letterSpacing: '0.03em' }}>{ext}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: '#1a1a2e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{attachedFile.name}</p>
                  <p style={{ margin: '1px 0 0', fontSize: '0.7rem', color: '#9ca3af' }}>{typeLabel[ext] || ext + ' File'}</p>
                </div>
                <button onClick={() => setAttachedFile(null)} style={{ background: 'rgba(0,0,0,0.06)', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '12px', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, lineHeight: 1, padding: 0 }}>✕</button>
              </div>
            )
          })()}

          <input ref={fileInputRef} type="file" accept=".pdf,.txt,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.csv,.md,.json,.py,.js,.ts,.jsx,.tsx,.html,.css,.xml" style={{ display: 'none' }}
            onChange={async e => { const file = e.target.files?.[0]; if (file) { await handleFileDrop(file) }; if (fileInputRef.current) fileInputRef.current.value = '' }} />

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button onClick={() => fileInputRef.current?.click()} disabled={uploadingFile} className="icon-btn" title="Attach file">
              {uploadingFile ? '⏳' : '📎'}
            </button>
            <button onClick={() => {
              const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
              if (!SR) { alert('Voice input not supported. Try Chrome.'); return }
              if (listening) { setListening(false); return }
              const r = new SR(); r.lang = 'en-US'; r.continuous = false; r.interimResults = false
              r.onstart = () => setListening(true); r.onend = () => setListening(false)
              r.onresult = (e: any) => { setInput(prev => prev ? `${prev} ${e.results[0][0].transcript}` : e.results[0][0].transcript) }
              r.onerror = () => setListening(false); r.start()
            }} className="icon-btn" style={{ background: listening ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.8)', borderColor: listening ? '#ef4444' : '#e8e0f0', color: listening ? '#ef4444' : '#9ca3af' }} title="Voice input">
              {listening ? '🔴' : '🎤'}
            </button>
            <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder={listening ? 'Listening...' : attachedFile ? 'Ask something about the file...' : 'Ask a question...'}
              className="chat-input" />
            <button onClick={sendMessage} disabled={loading || (!input.trim() && !attachedFile)} className="send-btn">Send</button>
          </div>
        </div>
      </div>

      {saveModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }} onMouseDown={() => setSaveModal(null)}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '28px', width: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', border: '1px solid #e8e0f0' }} onMouseDown={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1a1a2e', margin: 0 }}>📌 Save to Notes</h2>
              <button onClick={() => setSaveModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '1.1rem' }}>✕</button>
            </div>
            <div style={{ background: 'rgba(168,85,247,0.04)', border: '1px solid rgba(168,85,247,0.12)', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px' }}>
              <p style={{ fontSize: '0.78rem', color: '#6b7280', lineHeight: 1.5 }}>{saveModal.content.slice(0, 120)}...</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <p style={{ fontSize: '0.72rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Subject</p>
                <select value={saveSubjectId} onChange={e => { setSaveSubjectId(e.target.value); setSaveTopicId('') }} style={{ width: '100%', border: '1px solid #e8e0f0', borderRadius: '10px', padding: '10px 14px', fontSize: '0.875rem', color: '#1a1a2e', outline: 'none', background: 'white' }}>
                  <option value=''>Select a subject...</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              {saveSubjectId && (
                <div>
                  <p style={{ fontSize: '0.72rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Topic</p>
                  <select value={saveTopicId} onChange={e => setSaveTopicId(e.target.value)} style={{ width: '100%', border: '1px solid #e8e0f0', borderRadius: '10px', padding: '10px 14px', fontSize: '0.875rem', color: '#1a1a2e', outline: 'none', background: 'white' }}>
                    <option value=''>Select a topic...</option>
                    {subjects.find(s => s.id === saveSubjectId)?.topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              )}
              <button onClick={saveNoteToTopic} disabled={saving || !saveTopicId} style={{ width: '100%', padding: '11px', background: 'linear-gradient(135deg, #a855f7, #ec4899)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', opacity: !saveTopicId ? 0.5 : 1, marginTop: '4px' }}>
                {saving ? 'Saving...' : 'Save Note'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}