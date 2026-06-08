'use client'
import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function TutorPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm Lumora, your AI tutor. Ask me anything — I'll explain it clearly, step by step."
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
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
        body: JSON.stringify({ messages: updated })
      })
      const data = await res.json()
      setMessages([...updated, { role: 'assistant', content: data.reply }])
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
          max-width: 760px;
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
          max-width: 72%;
          padding: 12px 16px;
          border-radius: 18px;
          border-bottom-left-radius: 4px;
          font-size: 0.875rem;
          line-height: 1.6;
          white-space: normal;
          background: rgba(255,255,255,0.8);
          border: 1px solid #e8e0f0;
          color: #1a1a2e;
          align-self: flex-start;
        }
        .bubble-ai strong { font-weight: 600; color: #1a1a2e; }
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
          width: 7px;
          height: 7px;
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

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1" style={{ color: '#1a1a2e' }}>AI Tutor</h1>
          <p className="text-sm" style={{ color: '#9ca3af' }}>Ask anything — get clear, step-by-step explanations</p>
        </div>

        {/* Messages */}
        <div className="messages">
          {messages.map((m, i) => (
            m.role === 'user' ? (
              <div key={i} className="bubble-user">{m.content}</div>
            ) : (
              <div
                key={i}
                className="bubble-ai"
                dangerouslySetInnerHTML={{
                  __html: m.content
                    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.+?)\*/g, '<em>$1</em>')
                    .replace(/\n/g, '<br/>')
                }}
              />
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

        {/* Input */}
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Ask a question — e.g. Explain Newton's Second Law"
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