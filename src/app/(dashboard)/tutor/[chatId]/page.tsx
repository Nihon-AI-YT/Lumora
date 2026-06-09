'use client'
import { useState, useRef, useEffect } from 'react'
import { useParams } from 'next/navigation'
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
}

function AIBubble({ content }: { content: string }) {
  const [copied, setCopied] = useState(false)
  const [reaction, setReaction] = useState<'up' | 'down' | null>(null)
  const [showEmoji, setShowEmoji] = useState<'up' | 'down' | null>(null)

  function handleCopy() {
    // Strip markdown to get clean plain text
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
          position: 'absolute',
          top: '-20px',
          left: '50%',
          fontSize: '2rem',
          animation: 'floatUp 1.2s ease forwards',
          pointerEvents: 'none',
          zIndex: 10,
        }}>
          {showEmoji === 'up' ? '👍' : '👎'}
        </div>
      )}
      <div
        className="bubble-ai"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
      />
      <div style={{ display: 'flex', gap: '4px', marginTop: '6px', paddingLeft: '4px' }}>
        <button
          onClick={handleCopy}
          style={{
            background: copied ? 'rgba(16,185,129,0.08)' : 'none',
            border: 'none', cursor: 'pointer', padding: '4px 8px',
            borderRadius: '6px',
            color: copied ? '#10b981' : '#9ca3af',
            fontSize: '0.75rem', transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', gap: '4px'
          }}
          onMouseEnter={e => { if (!copied) { (e.currentTarget as HTMLElement).style.background = 'rgba(168,85,247,0.08)'; (e.currentTarget as HTMLElement).style.color = '#a855f7' }}}
          onMouseLeave={e => { if (!copied) { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = '#9ca3af' }}}
        >
          {copied ? '✓ Copied' : '📋 Copy'}
        </button>
        <button
          onClick={() => handleReaction('up')}
          style={{
            background: reaction === 'up' ? 'rgba(16,185,129,0.08)' : 'none',
            border: 'none', cursor: 'pointer', padding: '4px 6px',
            borderRadius: '6px',
            color: reaction === 'up' ? '#10b981' : '#9ca3af',
            fontSize: '0.75rem', transition: 'all 0.15s'
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(16,185,129,0.08)'; (e.currentTarget as HTMLElement).style.color = '#10b981' }}
          onMouseLeave={e => { if (reaction !== 'up') { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = '#9ca3af' }}}
        >
          👍
        </button>
        <button
          onClick={() => handleReaction('down')}
          style={{
            background: reaction === 'down' ? 'rgba(239,68,68,0.08)' : 'none',
            border: 'none', cursor: 'pointer', padding: '4px 6px',
            borderRadius: '6px',
            color: reaction === 'down' ? '#ef4444' : '#9ca3af',
            fontSize: '0.75rem', transition: 'all 0.15s'
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'; (e.currentTarget as HTMLElement).style.color = '#ef4444' }}
          onMouseLeave={e => { if (reaction !== 'down') { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = '#9ca3af' }}}
        >
          👎
        </button>
      </div>
    </div>
  )
}

export default function ChatPage() {
  const { chatId } = useParams<{ chatId: string }>()
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<{ full_name: string, age: number, level: string } | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadChat()
    loadProfile()
  }, [chatId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('profiles')
      .select('full_name, age, level')
      .eq('id', user.id)
      .single()
    if (data) setProfile(data)
  }

  async function loadChat() {
    const { data } = await supabase
      .from('tutor_messages')
      .select('role, content')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })
    if (data && data.length > 0) {
      setMessages(data as Message[])
    } else {
      setMessages([{
        role: 'assistant',
        content: "Hi! I'm Lumora, your AI tutor. Ask me anything — I'll explain it clearly, step by step."
      }])
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
            content: `Generate a short 3-5 word chat title for this student question: "${firstMessage}". Reply with ONLY the title, no quotes, no punctuation, no explanation.`
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
      const aiMessage: Message = { role: 'assistant', content: data.reply }
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
              <AIBubble key={i} content={m.content} />
            )
          ))}
          {loading && (
            <div className="dots-wrap">
              <span className="dot" style={{ animationDelay: '0ms' }} />
              <span className="dot" style={{ animationDelay: '150ms' }} />
              <span className="dot" style={{ animationDelay: '300ms' }} />
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
    </>
  )
}