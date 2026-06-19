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

function AIBubble({ content, onSave }: { content: string, onSave?: () => void }) {
  const [copied, setCopied] = useState(false)
  const [reaction, setReaction] = useState<'up' | 'down' | null>(null)
  const [showEmoji, setShowEmoji] = useState<'up' | 'down' | null>(null)

  function handleCopy() {
    const plain = content
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
        <div style={{
          position: 'absolute', top: '-20px', left: '50%',
          fontSize: '2rem', animation: 'floatUp 1.2s ease forwards',
          pointerEvents: 'none', zIndex: 10,
        }}>
          {showEmoji === 'up' ? '👍' : '👎'}
        </div>
      )}
      <div className="bubble-ai" dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
      <div style={{ display: 'flex', gap: '4px', marginTop: '6px', paddingLeft: '4px' }}>
        <button
          onClick={handleCopy}
          style={{
            background: copied ? 'rgba(16,185,129,0.08)' : 'none',
            border: 'none', cursor: 'pointer', padding: '4px 8px',
            borderRadius: '6px', color: copied ? '#10b981' : '#9ca3af',
            fontSize: '0.75rem', transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', gap: '4px'
          }}
          onMouseEnter={e => { if (!copied) { (e.currentTarget as HTMLElement).style.background = 'rgba(168,85,247,0.08)'; (e.currentTarget as HTMLElement).style.color = '#a855f7' }}}
          onMouseLeave={e => { if (!copied) { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = '#9ca3af' }}}
        >
          {copied ? '✓ Copied' : '📋 Copy'}
        </button>
        {onSave && (
          <button
            onClick={onSave}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px',
              borderRadius: '6px', color: '#9ca3af', fontSize: '0.75rem', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: '4px'
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(168,85,247,0.08)'; (e.currentTarget as HTMLElement).style.color = '#a855f7' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = '#9ca3af' }}
          >📌 Save to Notes</button>
        )}
        <button
          onClick={() => handleReaction('up')}
          style={{
            background: reaction === 'up' ? 'rgba(16,185,129,0.08)' : 'none',
            border: 'none', cursor: 'pointer', padding: '4px 6px',
            borderRadius: '6px', color: reaction === 'up' ? '#10b981' : '#9ca3af',
            fontSize: '0.75rem', transition: 'all 0.15s'
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(16,185,129,0.08)'; (e.currentTarget as HTMLElement).style.color = '#10b981' }}
          onMouseLeave={e => { if (reaction !== 'up') { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = '#9ca3af' }}}
        >👍</button>
        <button
          onClick={() => handleReaction('down')}
          style={{
            background: reaction === 'down' ? 'rgba(239,68,68,0.08)' : 'none',
            border: 'none', cursor: 'pointer', padding: '4px 6px',
            borderRadius: '6px', color: reaction === 'down' ? '#ef4444' : '#9ca3af',
            fontSize: '0.75rem', transition: 'all 0.15s'
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'; (e.currentTarget as HTMLElement).style.color = '#ef4444' }}
          onMouseLeave={e => { if (reaction !== 'down') { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = '#9ca3af' }}}
        >👎</button>
      </div>
    </div>
  )
}

export default function ChatPage() {
  const { chatId } = useParams<{ chatId: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
 const [profile, setProfile] = useState<{ full_name: string, age: number, level: string, exams?: { name: string, exam_date: string, priority: string }[] } | null>(null)
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

  useEffect(() => {
    loadChat()
    loadProfile()
    loadSubjects()
  }, [chatId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [inlineMCQ])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [inlineFlashcards])

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
    await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic_id: saveTopicId, type: 'ai', content: saveModal.content })
    })
    setSaving(false)
    setSaveModal(null)
    setSaveSubjectId('')
    setSaveTopicId('')
  }

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('profiles')
      .select('full_name, age, level')
      .eq('id', user.id)
      .single()
    const { data: exams } = await supabase
      .from('exams')
      .select('name, exam_date, priority')
      .eq('user_id', user.id)
      .order('exam_date', { ascending: true })
    if (data) setProfile({ ...data, exams: exams || [] })
  }

  async function loadChat() {
    const { data } = await supabase
      .from('tutor_messages')
      .select('role, content')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })

    if (data && data.length > 0) {
      const displayMessages = data.filter(m => m.role !== 'system_context') as Message[]
      const contextMessage = data.find(m => m.role === 'system_context')

      setMessages(displayMessages)

      const isReviewChat = displayMessages.length === 1 &&
                           displayMessages[0].role === 'user' &&
                           contextMessage

      if (isReviewChat && !autoSentRef.current) {
        autoSentRef.current = true
        autoSendReviewMessage(displayMessages[0].content, displayMessages, contextMessage.content)
      }
    } else {
      setMessages([{
        role: 'assistant',
        content: "Hi! I'm Lumora, your AI tutor. Ask me anything — I'll explain it clearly, step by step."
      }])
    }
  }

  async function autoSendReviewMessage(displayContent: string, existingMessages: Message[], contextContent: string) {
    setLoading(true)
    try {
      const messagesForAI = [{ role: 'user', content: contextContent }]
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messagesForAI, profile })
      })
      const data = await res.json()

      let replyText = data.reply
      const readyMatch = replyText.match(/\[?READY_TO_TEST:\s*(.+?)\]?$/im)
      if (readyMatch) {
        setReadyToTest(readyMatch[1].trim())
        replyText = replyText.replace(/\[?READY_TO_TEST:\s*.+?\]?$/im, '').trim()
      }

      const aiMessage: Message = { role: 'assistant', content: replyText }
      setMessages([...existingMessages, aiMessage])

      await supabase.from('tutor_messages').insert({
        chat_id: chatId,
        role: 'assistant',
        content: aiMessage.content
      })

      const title = await generateTitle(displayContent)
      await supabase.from('tutor_chats')
        .update({ title, updated_at: new Date().toISOString() })
        .eq('id', chatId)
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Try again.' }])
    } finally {
      setLoading(false)
    }
  }

  async function generateTitle(firstMessage: string): Promise<string> {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{
            role: 'user',
            content: `Generate a short 3-5 word chat title for this student question: "${firstMessage.slice(0, 200)}". Reply with ONLY the title, no quotes, no punctuation, no explanation.`
          }],
          max_tokens: 20,
          temperature: 0.7
        })
      })
      const data = await res.json()
      return data.choices?.[0]?.message?.content?.trim() || firstMessage.slice(0, 40)
    } catch {
      return firstMessage.slice(0, 40)
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading) return
    setInlineMCQ(null)
    setInlineFlashcards(null)
    const userMessage: Message = { role: 'user', content: input }
    const updated = [...messages, userMessage]
    setMessages(updated)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated, profile })
      })
      const data = await res.json()

      let replyText = data.reply
      const readyMatch = replyText.match(/\[?READY_TO_TEST:\s*(.+?)\]?$/im)
      if (readyMatch) {
        setReadyToTest(readyMatch[1].trim())
        replyText = replyText.replace(/\[?READY_TO_TEST:\s*.+?\]?$/im, '').trim()
      }

      const aiMessage: Message = { role: 'assistant', content: replyText }
      setMessages([...updated, aiMessage])

      await supabase.from('tutor_messages').insert([
        { chat_id: chatId, role: 'user', content: userMessage.content },
        { chat_id: chatId, role: 'assistant', content: aiMessage.content }
      ])

      const userMsgCount = updated.filter(m => m.role === 'user').length
      if (userMsgCount === 1) {
        const title = await generateTitle(input)
        await supabase.from('tutor_chats')
          .update({ title, updated_at: new Date().toISOString() })
          .eq('id', chatId)
      } else {
        await supabase.from('tutor_chats')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', chatId)
      }
    } catch {
      setMessages([...updated, { role: 'assistant', content: 'Sorry, something went wrong. Try again.' }])
    } finally {
      setLoading(false)
    }
  }

  function handleTestYourself(type: 'mcq' | 'flashcards' | 'exam') {
    if (!readyToTest) return
    if (type === 'mcq') {
      generateInlineMCQ()
      return
    }
    if (type === 'flashcards') {
      generateInlineFlashcards()
      return
    }
    const params = new URLSearchParams({ topic: readyToTest, subject: 'General', auto: 'true' })
    router.push(`/${type}?${params.toString()}`)
  }

  async function generateInlineFlashcards() {
    if (!readyToTest) return
    setInlineFlashcards({ cards: [], flipped: null, loading: true })
    setInlineMCQ(null)
    try {
      const res = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: 'General', topic: readyToTest, count: 8 })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setInlineFlashcards({ cards: data.cards, flipped: null, loading: false })
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch {
      setInlineFlashcards(null)
    }
  }

  async function generateInlineMCQ() {
    if (!readyToTest) return
    setInlineMCQ({ questions: [], selected: [], submitted: false, score: 0, loading: true })
    setInlineFlashcards(null)
    try {
      const res = await fetch('/api/mcq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: 'General', topic: readyToTest, count: inlineMCQCount })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setInlineMCQ({
        questions: data.questions,
        selected: new Array(data.questions.length).fill(''),
        submitted: false,
        score: 0,
        loading: false
      })
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch {
      setInlineMCQ(null)
    }
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
      if (inlineMCQ.selected[i] === q.correct) {
        score++
      } else {
        wrong.push({ question: q.question, selected: inlineMCQ.selected[i], correct: q.correct })
      }
    })
    setInlineMCQ({ ...inlineMCQ, submitted: true, score })

    // Send MCQ results to tutor as context
    const resultMsg = `MCQ Results: ${score}/${inlineMCQ.questions.length} on ${readyToTest}.${wrong.length > 0 ? ` Wrong answers:\n${wrong.map(w => `- "${w.question}" — I answered "${w.selected}" but correct was "${w.correct}"`).join('\n')}` : ' Got everything correct!'}`

    const userMessage: Message = { role: 'user', content: resultMsg }
    const updated = [...messages, userMessage]
    setMessages(updated)
    setLoading(true)

    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated, profile })
      })
      const data = await res.json()
      let replyText = data.reply
      const readyMatch = replyText.match(/\[?READY_TO_TEST:\s*(.+?)\]?$/im)
      if (readyMatch) {
        setReadyToTest(readyMatch[1].trim())
        replyText = replyText.replace(/\[?READY_TO_TEST:\s*.+?\]?$/im, '').trim()
      }
      const aiMessage: Message = { role: 'assistant', content: replyText }
      setMessages([...updated, aiMessage])
      await supabase.from('tutor_messages').insert([
        { chat_id: chatId, role: 'user', content: resultMsg },
        { chat_id: chatId, role: 'assistant', content: aiMessage.content }
      ])
    } catch {
      // silent fail — MCQ results still show
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        .tutor-wrap {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 64px);
          max-width: 780px;
          margin: 0 auto;
        }
        .messages {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding-right: 4px;
          margin-bottom: 16px;
        }
        .messages::-webkit-scrollbar { width: 4px; }
        .messages::-webkit-scrollbar-track { background: transparent; }
        .messages::-webkit-scrollbar-thumb { background: #e8e0f0; border-radius: 4px; }
        .bubble-user {
          max-width: 72%;
          padding: 12px 16px;
          border-radius: 18px;
          border-bottom-right-radius: 4px;
          font-size: 0.875rem;
          line-height: 1.6;
          white-space: pre-wrap;
          background: linear-gradient(135deg, #a855f7, #ec4899);
          color: white;
          align-self: flex-end;
        }
        .bubble-ai {
          padding: 14px 18px;
          border-radius: 18px;
          border-bottom-left-radius: 4px;
          font-size: 0.875rem;
          line-height: 1.5;
          white-space: normal;
          background: rgba(255,255,255,0.85);
          border: 1px solid #e8e0f0;
          color: #1a1a2e;
        }
        .bubble-ai strong { font-weight: 600; }
        .bubble-ai em { font-style: italic; }
        .dots-wrap {
          background: rgba(255,255,255,0.8);
          border: 1px solid #e8e0f0;
          border-radius: 18px;
          border-bottom-left-radius: 4px;
          padding: 14px 18px;
          align-self: flex-start;
          display: flex;
          gap: 4px;
          align-items: center;
        }
        .dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #a855f7;
          animation: bounce 1s infinite;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .chat-input {
          background: rgba(255,255,255,0.8);
          border: 1px solid #e8e0f0;
          border-radius: 14px;
          padding: 14px 18px;
          color: #1a1a2e;
          font-size: 0.875rem;
          outline: none;
          flex: 1;
          transition: border-color 0.15s;
        }
        .chat-input:focus { border-color: #a855f7; }
        .chat-input::placeholder { color: #9ca3af; }
        .send-btn {
          background: linear-gradient(135deg, #a855f7, #ec4899);
          color: white;
          font-weight: 600;
          font-size: 0.875rem;
          padding: 14px 24px;
          border-radius: 14px;
          border: none;
          cursor: pointer;
          transition: opacity 0.15s;
          white-space: nowrap;
        }
        .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .send-btn:hover:not(:disabled) { opacity: 0.9; }
      `}</style>

      <div className="tutor-wrap">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1" style={{ color: '#1a1a2e' }}>AI Tutor</h1>
          <p className="text-sm" style={{ color: '#9ca3af' }}>
            {profile ? `Personalized for ${profile.full_name} · ${profile.level}` : 'Ask anything — get clear, step-by-step explanations'}
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
            <div style={{
              background: 'rgba(168,85,247,0.06)',
              border: '1px solid rgba(168,85,247,0.15)',
              borderRadius: '16px',
              padding: '16px 20px',
              alignSelf: 'stretch',
              marginTop: '8px'
            }}>
              <p className="text-sm font-semibold mb-1" style={{ color: '#1a1a2e' }}>
                Ready to test yourself? 🎯
              </p>
              <p className="text-xs mb-3" style={{ color: '#9ca3af' }}>
                You've got a solid understanding of <strong>{readyToTest}</strong>. Want to lock it in?
              </p>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => handleTestYourself('flashcards')} style={{
                  background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)',
                  borderRadius: '10px', padding: '8px 14px', cursor: 'pointer',
                  fontSize: '0.8rem', fontWeight: '600', color: '#a855f7', transition: 'all 0.15s'
                }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(168,85,247,0.15)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(168,85,247,0.08)'}
                >▦ Flashcards</button>

                <button onClick={() => handleTestYourself('mcq')} style={{
                  background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)',
                  borderRadius: '10px', padding: '0', cursor: 'pointer',
                  fontSize: '0.8rem', fontWeight: '600', color: '#a855f7',
                  transition: 'all 0.15s', display: 'flex', alignItems: 'center', overflow: 'hidden'
                }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(168,85,247,0.15)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(168,85,247,0.08)'}
                >
                  <span style={{ padding: '8px 10px 8px 14px' }}>◈ MCQ</span>
                  <span style={{ width: '1px', background: 'rgba(168,85,247,0.2)', alignSelf: 'stretch' }} />
                  <select
                    value={inlineMCQCount}
                    onChange={e => { e.stopPropagation(); setInlineMCQCount(Number(e.target.value)) }}
                    onClick={e => e.stopPropagation()}
                    style={{
                      background: 'transparent', border: 'none', outline: 'none',
                      padding: '8px 10px', fontSize: '0.8rem', color: '#a855f7',
                      fontWeight: '600', cursor: 'pointer'
                    }}
                  >
                    <option value={5}>5 Qs</option>
                    <option value={10}>10 Qs</option>
                    <option value={15}>15 Qs</option>
                    <option value={20}>20 Qs</option>
                  </select>
                </button>

                <button onClick={() => handleTestYourself('exam')} style={{
                  background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)',
                  borderRadius: '10px', padding: '8px 14px', cursor: 'pointer',
                  fontSize: '0.8rem', fontWeight: '600', color: '#a855f7', transition: 'all 0.15s'
                }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(168,85,247,0.15)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(168,85,247,0.08)'}
                >📝 Mock Exam</button>
              </div>
            </div>
          )}

          {/* Inline Flashcards */}
          {inlineFlashcards && (
            <div style={{
              background: 'rgba(255,255,255,0.85)',
              border: '1px solid #e8e0f0',
              borderRadius: '16px',
              padding: '20px',
              alignSelf: 'stretch',
              marginTop: '8px'
            }}>
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
                      <div key={i}
                        onClick={() => setInlineFlashcards({ ...inlineFlashcards, flipped: inlineFlashcards.flipped === i ? null : i })}
                        style={{
                          cursor: 'pointer',
                          background: inlineFlashcards.flipped === i ? 'rgba(168,85,247,0.06)' : 'rgba(255,255,255,0.7)',
                          border: inlineFlashcards.flipped === i ? '1px solid #a855f7' : '1px solid #e8e0f0',
                          borderRadius: '12px', padding: '14px',
                          minHeight: '100px', display: 'flex', flexDirection: 'column',
                          justifyContent: 'space-between', transition: 'all 0.15s'
                        }}
                      >
                        <div>
                          <p style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: inlineFlashcards.flipped === i ? '#a855f7' : '#9ca3af', marginBottom: '6px' }}>
                            {inlineFlashcards.flipped === i ? 'Answer' : `Card ${i + 1}`}
                          </p>
                          <p style={{ fontSize: '0.8rem', color: '#1a1a2e', lineHeight: '1.5' }}>
                            {inlineFlashcards.flipped === i ? card.back : card.front}
                          </p>
                        </div>
                        <p style={{ fontSize: '0.68rem', color: '#c4b5d4', marginTop: '8px' }}>
                          {inlineFlashcards.flipped === i ? 'Click to see question' : 'Click to reveal answer'}
                        </p>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setInlineFlashcards(null)}
                    style={{
                      width: '100%', padding: '10px',
                      background: 'rgba(168,85,247,0.08)', color: '#a855f7',
                      fontWeight: '600', fontSize: '0.85rem', borderRadius: '10px',
                      border: '1px solid rgba(168,85,247,0.2)', cursor: 'pointer'
                    }}
                  >Close</button>
                </>
              )}
            </div>
          )}

          {/* Inline MCQ */}
          {inlineMCQ && (
            <div style={{
              background: 'rgba(255,255,255,0.85)',
              border: '1px solid #e8e0f0',
              borderRadius: '16px',
              padding: '20px',
              alignSelf: 'stretch',
              marginTop: '8px'
            }}>
              {inlineMCQ.loading ? (
                <p className="text-sm animate-pulse" style={{ color: '#a855f7', textAlign: 'center' }}>Generating questions...</p>
              ) : (
                <>
                  <p className="text-sm font-semibold mb-4" style={{ color: '#1a1a2e' }}>
                    ◈ Quick MCQ — {readyToTest}
                  </p>
                  {inlineMCQ.submitted && (
                    <div style={{
                      background: inlineMCQ.score >= Math.ceil(inlineMCQ.questions.length * 0.8) ? 'rgba(16,185,129,0.06)' : inlineMCQ.score >= Math.ceil(inlineMCQ.questions.length * 0.6) ? 'rgba(168,85,247,0.06)' : 'rgba(239,68,68,0.06)',
                      border: `1px solid ${inlineMCQ.score >= Math.ceil(inlineMCQ.questions.length * 0.8) ? 'rgba(16,185,129,0.2)' : inlineMCQ.score >= Math.ceil(inlineMCQ.questions.length * 0.6) ? 'rgba(168,85,247,0.2)' : 'rgba(239,68,68,0.2)'}`,
                      borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', textAlign: 'center'
                    }}>
                      <p style={{ fontSize: '1.4rem', fontWeight: '700', color: inlineMCQ.score >= Math.ceil(inlineMCQ.questions.length * 0.8) ? '#10b981' : inlineMCQ.score >= Math.ceil(inlineMCQ.questions.length * 0.6) ? '#a855f7' : '#ef4444' }}>
                        {inlineMCQ.score} / {inlineMCQ.questions.length}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '2px' }}>
                        {inlineMCQ.score >= Math.ceil(inlineMCQ.questions.length * 0.8) ? '🎉 Great job!' : inlineMCQ.score >= Math.ceil(inlineMCQ.questions.length * 0.6) ? '👍 Good effort!' : '📚 Keep studying!'}
                      </p>
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {inlineMCQ.questions.map((q, i) => (
                      <div key={i}>
                        <p style={{ fontSize: '0.8rem', fontWeight: '600', color: '#1a1a2e', marginBottom: '8px' }}>
                          <span style={{ color: '#a855f7' }}>{i + 1}. </span>{q.question}
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {q.options.map((opt, j) => {
                            let bg = 'rgba(255,255,255,0.6)'
                            let border = '1px solid #e8e0f0'
                            let color = '#1a1a2e'
                            if (inlineMCQ.submitted) {
                              if (opt === q.correct) { bg = 'rgba(16,185,129,0.08)'; border = '1px solid #10b981'; color = '#059669' }
                              else if (opt === inlineMCQ.selected[i]) { bg = 'rgba(239,68,68,0.08)'; border = '1px solid #ef4444'; color = '#dc2626' }
                            } else if (inlineMCQ.selected[i] === opt) {
                              bg = 'rgba(168,85,247,0.08)'; border = '1px solid #a855f7'; color = '#9333ea'
                            }
                            return (
                              <button key={j}
                                disabled={inlineMCQ.submitted}
                                onClick={() => handleInlineSelect(i, opt)}
                                style={{
                                  width: '100%', textAlign: 'left', padding: '8px 12px',
                                  borderRadius: '8px', border, background: bg, color,
                                  fontSize: '0.8rem', cursor: inlineMCQ.submitted ? 'default' : 'pointer',
                                  transition: 'all 0.15s', display: 'block'
                                }}
                              >{opt}</button>
                            )
                          })}
                        </div>
                        {inlineMCQ.submitted && (
                          <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '6px' }}>
                            💡 {q.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  {!inlineMCQ.submitted && (
                    <button
                      onClick={handleInlineSubmit}
                      disabled={inlineMCQ.selected.includes('')}
                      style={{
                        marginTop: '16px', width: '100%', padding: '10px',
                        background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                        color: 'white', fontWeight: '600', fontSize: '0.85rem',
                        borderRadius: '10px', border: 'none', cursor: 'pointer',
                        opacity: inlineMCQ.selected.includes('') ? 0.4 : 1
                      }}
                    >Submit Answers</button>
                  )}
                  {inlineMCQ.submitted && (
                    <button
                      onClick={() => setInlineMCQ(null)}
                      style={{
                        marginTop: '12px', width: '100%', padding: '10px',
                        background: 'rgba(168,85,247,0.08)', color: '#a855f7',
                        fontWeight: '600', fontSize: '0.85rem', borderRadius: '10px',
                        border: '1px solid rgba(168,85,247,0.2)', cursor: 'pointer'
                      }}
                    >Close</button>
                  )}
                </>
              )}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Ask a question..."
            className="chat-input"
          />
          <button onClick={sendMessage} disabled={loading || !input.trim()} className="send-btn">
            Send
          </button>
        </div>
      </div>
    {/* Save to Topic Modal */}
      {saveModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)'
        }} onMouseDown={() => setSaveModal(null)}>
          <div style={{
            background: 'white', borderRadius: '20px', padding: '28px',
            width: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            border: '1px solid #e8e0f0'
          }} onMouseDown={e => e.stopPropagation()}>
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
                <select
                  value={saveSubjectId}
                  onChange={e => { setSaveSubjectId(e.target.value); setSaveTopicId('') }}
                  style={{ width: '100%', border: '1px solid #e8e0f0', borderRadius: '10px', padding: '10px 14px', fontSize: '0.875rem', color: '#1a1a2e', outline: 'none', background: 'white' }}
                >
                  <option value=''>Select a subject...</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {saveSubjectId && (
                <div>
                  <p style={{ fontSize: '0.72rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Topic</p>
                  <select
                    value={saveTopicId}
                    onChange={e => setSaveTopicId(e.target.value)}
                    style={{ width: '100%', border: '1px solid #e8e0f0', borderRadius: '10px', padding: '10px 14px', fontSize: '0.875rem', color: '#1a1a2e', outline: 'none', background: 'white' }}
                  >
                    <option value=''>Select a topic...</option>
                    {subjects.find(s => s.id === saveSubjectId)?.topics.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={saveNoteToTopic}
                disabled={saving || !saveTopicId}
                style={{
                  width: '100%', padding: '11px',
                  background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                  color: 'white', border: 'none', borderRadius: '10px',
                  fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
                  opacity: !saveTopicId ? 0.5 : 1, marginTop: '4px'
                }}
              >{saving ? 'Saving...' : 'Save Note'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}