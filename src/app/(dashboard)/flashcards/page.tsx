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
  const parts = text.split(/(```[\s\S]*?```|`[^`]+`)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const code = part.slice(3, -3).replace(/^\w+\n/, '')
          return (
            <pre key={i} style={{
              background: 'rgba(168,85,247,0.06)',
              border: '1px solid rgba(168,85,247,0.15)',
              borderRadius: '8px',
              padding: '10px 12px',
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              overflowX: 'auto',
              marginTop: '8px',
              color: '#1a1a2e',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>{code}</pre>
          )
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code key={i} style={{
              background: 'rgba(168,85,247,0.08)',
              borderRadius: '4px',
              padding: '1px 5px',
              fontSize: '0.8rem',
              fontFamily: 'monospace',
              color: '#9333ea'
            }}>{part.slice(1, -1)}</code>
          )
        }
        return <span key={i} dangerouslySetInnerHTML={{ __html: renderMath(part) }} />
      })}
    </>
  )
}

export default function FlashcardsPage() {
  const searchParams = useSearchParams()
  const [topic, setTopic] = useState('')
  const [detectedSubject, setDetectedSubject] = useState('')
  const [cards, setCards] = useState<Card[]>([])
  const [flipped, setFlipped] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pdfName, setPdfName] = useState('')
  const [sourceLabel, setSourceLabel] = useState('')
  const [ytUrl, setYtUrl] = useState('')
  const [ytLoading, setYtLoading] = useState(false)

  useEffect(() => {
    const autoTopic = searchParams.get('topic')
    const auto = searchParams.get('auto')
    if (autoTopic && auto === 'true') {
      setTopic(autoTopic)
      generateCards(autoTopic)
    }
  }, [])

  const generateCards = async (overrideTopic?: string) => {
    const activeTopic = overrideTopic || topic
    if (!activeTopic) return
    setLoading(true)
    setError('')
    setCards([])
    setFlipped(null)
    try {
      const res = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: activeTopic, count: 8 })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setCards(data.cards)
      setDetectedSubject(data.subject || '')
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
    setSourceLabel('')
    setError('')
    setLoading(true)
    setCards([])
    setFlipped(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/extract-pdf', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setTopic(data.text)
      await generateCards(data.text)
    } catch {
      setError('Failed to read PDF. Try again.')
      setLoading(false)
    }
  }

  const handleYouTube = async () => {
    if (!ytUrl) return
    setYtLoading(true)
    setError('')
    setCards([])
    setFlipped(null)
    try {
      const res = await fetch('/api/extract-youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: ytUrl })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setSourceLabel(`▶ ${data.title}`)
      setPdfName('')
      setTopic(data.text)
      await generateCards(data.text)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch transcript. Try again.')
    } finally {
      setYtLoading(false)
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
        .subject-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(168,85,247,0.08);
          border: 1px solid rgba(168,85,247,0.2);
          color: #9333ea;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 5px 12px;
          border-radius: 20px;
        }
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
          <p className="text-sm" style={{ color: '#9ca3af' }}>Generate smart flashcards from a topic or upload a PDF — subject is detected automatically</p>
        </div>

        <div className="flex gap-3 mb-3">
          <input type="text" placeholder="Topic — e.g. Newton's Laws"
            value={sourceLabel || pdfName || topic}
            onChange={e => { setTopic(e.target.value); setPdfName(''); setSourceLabel('') }}
            onKeyDown={e => e.key === 'Enter' && generateCards()}
            className="fc-input flex-1" />
          <button onClick={() => generateCards()} disabled={loading || !topic} className="fc-btn">
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </div>

        <div className="flex flex-col gap-3 mb-8">
          <div className="flex items-center gap-3">
            <label className="pdf-btn">
              📄 Upload PDF
              <input type="file" accept=".pdf" onChange={handlePDF} style={{ display: 'none' }} />
            </label>
            <p className="text-xs" style={{ color: '#9ca3af' }}>Upload a PDF and cards will generate automatically</p>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Paste a YouTube URL — e.g. https://youtube.com/watch?v=..."
              value={ytUrl}
              onChange={e => setYtUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleYouTube()}
              className="fc-input flex-1"
            />
            <button onClick={handleYouTube} disabled={ytLoading || !ytUrl} className="fc-btn">
              {ytLoading ? 'Fetching...' : '▶ YouTube'}
            </button>
          </div>
        </div>

        {error && <p className="text-sm mb-4" style={{ color: '#ef4444' }}>{error}</p>}

        {!loading && cards.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">▦</div>
            <p className="font-semibold mb-1" style={{ color: '#1a1a2e' }}>No cards yet</p>
            <p className="text-sm" style={{ color: '#9ca3af' }}>Enter a topic, upload a PDF, or paste a YouTube link</p>
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
            <div className="flex items-center gap-3 mb-4">
              {detectedSubject && <span className="subject-pill">📚 {detectedSubject}</span>}
              <p className="text-xs uppercase tracking-wider" style={{ color: '#9ca3af' }}>
                {cards.length} cards — click any card to flip
              </p>
            </div>
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