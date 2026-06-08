'use client'
import { useState, useEffect } from 'react'
import 'katex/dist/katex.min.css'
import katex from 'katex'

interface Card {
  front: string
  back: string
}

function renderMath(text: string) {
  // Replace $$...$$ and $...$ with rendered KaTeX
  try {
    let result = text
    result = result.replace(/\$\$([^$]+)\$\$/g, (_, expr) => {
      return katex.renderToString(expr, { throwOnError: false, displayMode: true })
    })
    result = result.replace(/\$([^$]+)\$/g, (_, expr) => {
      return katex.renderToString(expr, { throwOnError: false, displayMode: false })
    })
    return result
  } catch {
    return text
  }
}

function CardText({ text }: { text: string }) {
  return (
    <span
      dangerouslySetInnerHTML={{ __html: renderMath(text) }}
    />
  )
}

export default function FlashcardsPage() {
  const [subject, setSubject] = useState('')
  const [topic, setTopic] = useState('')
  const [cards, setCards] = useState<Card[]>([])
  const [flipped, setFlipped] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const generateCards = async () => {
    if (!subject || !topic) return
    setLoading(true)
    setError('')
    setCards([])
    setFlipped(null)
    try {
      const res = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, topic, count: 8 })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setCards(data.cards)
    } catch {
      setError('Failed to generate cards. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        .fc-input {
          background: rgba(255,255,255,0.8);
          border: 1px solid #e8e0f0;
          border-radius: 12px;
          padding: 12px 16px;
          color: #1a1a2e;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.15s;
        }
        .fc-input:focus { border-color: #a855f7; }
        .fc-input::placeholder { color: #9ca3af; }
        .fc-btn {
          background: linear-gradient(135deg, #a855f7, #ec4899);
          color: white;
          font-weight: 600;
          font-size: 0.875rem;
          padding: 12px 24px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          transition: opacity 0.15s;
          white-space: nowrap;
        }
        .fc-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .fc-btn:hover:not(:disabled) { opacity: 0.9; }
        .card-wrap {
          cursor: pointer;
          background: rgba(255,255,255,0.75);
          backdrop-filter: blur(12px);
          border: 1px solid #e8e0f0;
          border-radius: 16px;
          padding: 24px;
          min-height: 160px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .card-wrap:hover {
          border-color: #a855f7;
          box-shadow: 0 4px 20px rgba(168,85,247,0.10);
        }
        .card-wrap.flipped {
          border-color: #a855f7;
          background: rgba(168,85,247,0.05);
        }
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 20px;
          text-align: center;
        }
        .empty-icon {
          width: 64px;
          height: 64px;
          border-radius: 20px;
          background: rgba(168,85,247,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          margin-bottom: 20px;
        }
      `}</style>

      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1" style={{ color: '#1a1a2e' }}>Flashcards</h1>
          <p className="text-sm" style={{ color: '#9ca3af' }}>Generate smart flashcards for any subject and topic</p>
        </div>

        {/* Controls */}
        <div className="flex gap-3 mb-8">
          <input
            type="text"
            placeholder="Subject — e.g. Physics, History, Japanese"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            className="fc-input"
            style={{ width: '220px' }}
          />
          <input
            type="text"
            placeholder="Topic — e.g. Newton's Laws, World War II"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && generateCards()}
            className="fc-input flex-1"
          />
          <button onClick={generateCards} disabled={loading || !subject || !topic} className="fc-btn">
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </div>

        {error && <p className="text-sm mb-4" style={{ color: '#ef4444' }}>{error}</p>}

        {/* Empty state */}
        {!loading && cards.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">▦</div>
            <p className="font-semibold mb-1" style={{ color: '#1a1a2e' }}>No cards yet</p>
            <p className="text-sm" style={{ color: '#9ca3af' }}>Enter a subject and topic above, then hit Generate</p>
          </div>
        )}

        {loading && (
          <div className="empty-state">
            <div className="empty-icon" style={{ fontSize: '22px' }}>✦</div>
            <p className="text-sm animate-pulse" style={{ color: '#a855f7' }}>Generating your flashcards...</p>
          </div>
        )}

        {cards.length > 0 && (
          <>
            <p className="text-xs uppercase tracking-wider mb-4" style={{ color: '#9ca3af' }}>
              {cards.length} cards — click any card to flip
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cards.map((card, i) => (
                <div
                  key={i}
                  onClick={() => setFlipped(flipped === i ? null : i)}
                  className={`card-wrap ${flipped === i ? 'flipped' : ''}`}
                >
                  <div>
                    <p className="text-xs uppercase tracking-wider mb-3" style={{ color: flipped === i ? '#a855f7' : '#9ca3af' }}>
                      {flipped === i ? 'Answer' : `Card ${i + 1}`}
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: '#1a1a2e' }}>
                      <CardText text={flipped === i ? card.back : card.front} />
                    </p>
                  </div>
                  <p className="text-xs mt-4" style={{ color: '#c4b5d4' }}>
                    {flipped === i ? 'Click to see question' : 'Click to reveal answer'}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </>
  )
}