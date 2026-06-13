'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Question {
  question: string
  options: string[]
  correct: string
  explanation: string
}

export default function MCQPage() {
  const searchParams = useSearchParams()
  const [subject, setSubject] = useState('')
  const [topic, setTopic] = useState('')
  const [pdfName, setPdfName] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [score, setScore] = useState(0)

  useEffect(() => {
    const autoTopic = searchParams.get('topic')
    const autoSubject = searchParams.get('subject')
    const auto = searchParams.get('auto')
    if (autoTopic && auto === 'true') {
      setTopic(autoTopic)
      if (autoSubject) setSubject(autoSubject)
      generateQuestions(autoTopic, autoSubject || 'General')
    }
  }, [])

  const generateQuestions = async (overrideTopic?: string, overrideSubject?: string) => {
    const activeTopic = overrideTopic || topic
    const activeSubject = overrideSubject || subject || 'General'
    if (!activeTopic) return
    setLoading(true)
    setQuestions([])
    setSelected([])
    setSubmitted(false)
    setScore(0)
    setError('')
    try {
      const res = await fetch('/api/mcq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: activeSubject, topic: activeTopic, count: 5 })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setQuestions(data.questions)
      setSelected(new Array(data.questions.length).fill(''))
    } catch {
      setError('Failed to generate questions. Try again.')
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
    setQuestions([])
    setSelected([])
    setSubmitted(false)
    setScore(0)
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
      await generateQuestions(data.text, subject || 'General')
    } catch {
      setError('Failed to read PDF. Try again.')
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    let s = 0
    const wrongQuestions: { question: string; selected: string; correct: string }[] = []

    questions.forEach((q, i) => {
      if (selected[i] === q.correct) {
        s++
      } else {
        wrongQuestions.push({
          question: q.question,
          selected: selected[i],
          correct: q.correct
        })
      }
    })

    setScore(s)
    setSubmitted(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('mcq_attempts').insert({
          user_id: user.id,
          subject: subject || 'General',
          topic: pdfName || topic.slice(0, 100),
          score: s,
          total: questions.length,
          wrong_questions: wrongQuestions
        })
      }
    } catch (err) {
      console.error('Failed to save attempt:', err)
    }
  }

  return (
    <>
      <style>{`
        .mcq-input {
          background: rgba(255,255,255,0.8);
          border: 1px solid #e8e0f0;
          border-radius: 12px;
          padding: 12px 16px;
          color: #1a1a2e;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.15s;
        }
        .mcq-input:focus { border-color: #a855f7; }
        .mcq-input::placeholder { color: #9ca3af; }
        .mcq-btn {
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
        .mcq-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .mcq-btn:hover:not(:disabled) { opacity: 0.9; }
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
        .question-card {
          background: rgba(255,255,255,0.75);
          backdrop-filter: blur(12px);
          border: 1px solid #e8e0f0;
          border-radius: 16px;
          padding: 24px;
        }
        .opt-btn {
          width: 100%;
          text-align: left;
          padding: 12px 16px;
          border-radius: 10px;
          border: 1px solid #e8e0f0;
          background: rgba(255,255,255,0.6);
          color: #1a1a2e;
          font-size: 0.875rem;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
        }
        .opt-btn:hover:not(:disabled) {
          border-color: #a855f7;
          background: rgba(168,85,247,0.05);
        }
        .opt-btn:disabled { cursor: default; }
        .opt-selected {
          border-color: #a855f7 !important;
          background: rgba(168,85,247,0.08) !important;
          color: #9333ea !important;
        }
        .opt-correct {
          border-color: #10b981 !important;
          background: rgba(16,185,129,0.08) !important;
          color: #059669 !important;
        }
        .opt-wrong {
          border-color: #ef4444 !important;
          background: rgba(239,68,68,0.08) !important;
          color: #dc2626 !important;
        }
        .score-card {
          background: rgba(255,255,255,0.75);
          backdrop-filter: blur(12px);
          border: 1px solid #e8e0f0;
          border-radius: 16px;
          padding: 24px 28px;
          margin-bottom: 24px;
        }
        .submit-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #a855f7, #ec4899);
          color: white;
          font-weight: 600;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          transition: opacity 0.15s;
          font-size: 0.9rem;
        }
        .submit-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .submit-btn:hover:not(:disabled) { opacity: 0.9; }
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
          font-size: 24px;
          margin-bottom: 20px;
        }
      `}</style>

      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1" style={{ color: '#1a1a2e' }}>MCQ Practice</h1>
          <p className="text-sm" style={{ color: '#9ca3af' }}>AI-generated exam-style questions with instant feedback</p>
        </div>

        {/* Controls */}
        <div className="flex gap-3 mb-3">
          <input
            type="text"
            placeholder="Subject — e.g. Physics"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            className="mcq-input"
            style={{ width: '200px' }}
          />
          <input
            type="text"
            placeholder="Topic — e.g. Newton's Laws"
            value={pdfName || topic}
            onChange={e => { setTopic(e.target.value); setPdfName('') }}
            onKeyDown={e => e.key === 'Enter' && generateQuestions()}
            className="mcq-input flex-1"
          />
          <button onClick={() => generateQuestions()} disabled={loading || !topic} className="mcq-btn">
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </div>

        {/* PDF Upload */}
        <div className="flex items-center gap-3 mb-8">
          <label className="pdf-btn">
            📄 Upload PDF
            <input
              type="file"
              accept=".pdf"
              onChange={handlePDF}
              style={{ display: 'none' }}
            />
          </label>
          <p className="text-xs" style={{ color: '#9ca3af' }}>
            Upload a PDF and questions will generate automatically
          </p>
        </div>

        {error && (
  <div className="flex items-center gap-3 mb-4">
    <p className="text-sm" style={{ color: '#ef4444' }}>{error}</p>
    <button onClick={() => generateQuestions()} className="mcq-btn" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
      Retry
    </button>
  </div>
)}

        {/* Score */}
        {submitted && (
          <div className="score-card">
            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: '#9ca3af' }}>Your Score</p>
            <p className="text-3xl font-bold mb-1" style={{ color: score === questions.length ? '#10b981' : score >= questions.length / 2 ? '#a855f7' : '#ef4444' }}>
              {score} / {questions.length}
            </p>
            <p className="text-sm mb-2" style={{ color: '#9ca3af' }}>
              {score === questions.length ? '🎉 Perfect score!' : score >= questions.length / 2 ? '👍 Good job — review the ones you missed.' : '📚 Keep practicing — check the explanations below.'}
            </p>
            {score < questions.length && (
              <p className="text-xs" style={{ color: '#a855f7' }}>
                ✦ Your mistakes have been saved — check the Review tab to see weak topics.
              </p>
            )}
          </div>
        )}

        {/* Empty state */}
        {!loading && questions.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">◈</div>
            <p className="font-semibold mb-1" style={{ color: '#1a1a2e' }}>No questions yet</p>
            <p className="text-sm" style={{ color: '#9ca3af' }}>Enter a subject and topic, or upload a PDF</p>
          </div>
        )}

        {loading && (
          <div className="empty-state">
            <div className="empty-icon" style={{ fontSize: '22px' }}>✦</div>
            <p className="text-sm animate-pulse" style={{ color: '#a855f7' }}>
              {pdfName ? `Reading ${pdfName}...` : 'Generating your questions...'}
            </p>
          </div>
        )}

        {/* Questions */}
        {questions.length > 0 && (
          <div className="flex flex-col gap-4">
            {questions.map((q, i) => (
              <div key={i} className="question-card">
                <p className="text-sm font-semibold mb-4" style={{ color: '#1a1a2e' }}>
                  <span style={{ color: '#a855f7' }}>{i + 1}. </span>{q.question}
                </p>
                <div className="flex flex-col gap-2">
                  {q.options.map((opt, j) => {
                    let cls = 'opt-btn'
                    if (submitted) {
                      if (opt === q.correct) cls += ' opt-correct'
                      else if (opt === selected[i]) cls += ' opt-wrong'
                    } else if (selected[i] === opt) {
                      cls += ' opt-selected'
                    }
                    return (
                      <button
                        key={j}
                        disabled={submitted}
                        onClick={() => {
                          const updated = [...selected]
                          updated[i] = opt
                          setSelected(updated)
                        }}
                        className={cls}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
                {submitted && (
                  <p className="text-xs mt-4 leading-relaxed" style={{ color: '#6b7280' }}>
                    💡 {q.explanation}
                  </p>
                )}
              </div>
            ))}

            {!submitted && (
              <button
                onClick={handleSubmit}
                disabled={selected.includes('')}
                className="submit-btn"
              >
                Submit Answers
              </button>
            )}
          </div>
        )}
      </div>
    </>
  )
}