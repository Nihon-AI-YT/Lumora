'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import 'katex/dist/katex.min.css'
import katex from 'katex'

interface Card {
  front: string
  back: string
}

function renderMath(text: string) {
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
  return <span dangerouslySetInnerHTML={{ __html: renderMath(text) }} />
}

export default function FlashcardsPage() {
  const searchParams = useSearchParams()
  const [subject, setSubject] = useState('')
  const [topic, setTopic] = useState('')
  const [cards, setCards] = useState<Card[]>([])
  const [flipped, setFlipped] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pdfName, setPdfName] = useState('')

  useEffect(() => {
    const autoTopic = searchParams.get('topic')
    const autoSubject = searchParams.get('subject')
    const auto = searchParams.get('auto')
    if (autoTopic && auto === 'true') {
      setTopic(autoTopic)
      if (autoSubject) setSubject(autoSubject)
      generateCards(autoTopic, autoSubject || 'General')
    }
  }, [])

  const generateCards = async (overrideTopic?: string, overrideSubject?: string) => {
    const activeTopic = overrideTopic || topic
    const activeSubject = overrideSubject || subject || 'General'
    if (!activeTopic) return
    setLoading(true)
    setError('')
    setCards([])
    setFlipped(null)
    try {
      const res = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: activeSubject, topic: activeTopic, count: 8 })
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

  const handlePDF = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPdfName(file.name)
    setError('')
    setLoading(true)
    setCards([])
    setFlipped(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/extract-pdf', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setTopic(data.text)
      await generateCards(data.text, subject || 'General')
    } catch {
      setError('Failed to read PDF. Try again.')
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
        .pdf-btn {
          background: rgba(255,255,255,0.8);
          border: 1px solid #e8e0f0;
          border-radius: 12px;
          padding: 12px 16px;
          color: #6b7280;
          font-size: 0.875rem;
          cursor: pointer;
          transition: border-color 0.15s;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .pdf-btn:hover { border-color: #a855f7; color: #a855f7; }
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
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1" style={{ color: '#1a1a2e' }}>Flashcards</h1>
          <p className="text-sm" style={{ color: '#9ca3af' }}>Generate smart flashcards from a topic or upload a PDF</p>
        </div>

        <div className="flex gap-3 mb-3">
          <input type="text" placeholder="Subject — e.g. Physics, History" value={subject}
            onChange={e => setSubject(e.target.value)} className="fc-input" style={{ width: '220px' }} />
          <input type="text" placeholder="Topic — e.g. Newton's Laws"
            value={pdfName || topic}
            onChange={e => { setTopic(e.target.value); setPdfName('') }}
            onKeyDown={e => e.key === 'Enter' && generateCards()}
            className="fc-input flex-1" />
          <button onClick={() => generateCards()} disabled={loading || !topic} className="fc-btn">
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <label className="pdf-btn">
            📄 Upload PDF
            <input type="file" accept=".pdf" onChange={handlePDF} style={{ display: 'none' }} />
          </label>
          <p className="text-xs" style={{ color: '#9ca3af' }}>Upload a PDF and cards will generate automatically</p>
        </div>

        {error && <p className="text-sm mb-4" style={{ color: '#ef4444' }}>{error}</p>}

        {!loading && cards.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">▦</div>
            <p className="font-semibold mb-1" style={{ color: '#1a1a2e' }}>No cards yet</p>
            <p className="text-sm" style={{ color: '#9ca3af' }}>Enter a subject and topic, or upload a PDF</p>
          </div>
        )}

        {loading && (
          <div className="empty-state">
            <div className="empty-icon" style={{ fontSize: '22px' }}>✦</div>
            <p className="text-sm animate-pulse" style={{ color: '#a855f7' }}>
              {pdfName ? `Reading ${pdfName}...` : 'Generating your flashcards...'}
            </p>
          </div>
        )}

        {cards.length > 0 && (
          <>
            <p className="text-xs uppercase tracking-wider mb-4" style={{ color: '#9ca3af' }}>
              {cards.length} cards — click any card to flip
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cards.map((card, i) => (
                <div key={i} onClick={() => setFlipped(flipped === i ? null : i)}
                  className={`card-wrap ${flipped === i ? 'flipped' : ''}`}>
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