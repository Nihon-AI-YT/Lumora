'use client'
import { useState } from 'react'

interface Question {
  question: string
  options: string[]
  correct: string
  explanation: string
}

export default function MCQPage() {
  const [subject, setSubject] = useState('')
  const [topic, setTopic] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [score, setScore] = useState(0)

  const generateQuestions = async () => {
    if (!subject || !topic) return
    setLoading(true)
    setQuestions([])
    setSelected([])
    setSubmitted(false)
    setScore(0)
    try {
      const res = await fetch('/api/mcq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, topic, count: 5 })
      })
      const data = await res.json()
      setQuestions(data.questions)
      setSelected(new Array(data.questions.length).fill(''))
    } catch {
      alert('Failed to generate questions.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = () => {
    let s = 0
    questions.forEach((q, i) => { if (selected[i] === q.correct) s++ })
    setScore(s)
    setSubmitted(true)
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
        <div className="flex gap-3 mb-8">
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
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && generateQuestions()}
            className="mcq-input flex-1"
          />
          <button onClick={generateQuestions} disabled={loading || !subject || !topic} className="mcq-btn">
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </div>

        {/* Score */}
        {submitted && (
          <div className="score-card">
            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: '#9ca3af' }}>Your Score</p>
            <p className="text-3xl font-bold mb-1" style={{ color: score === questions.length ? '#10b981' : score >= questions.length / 2 ? '#a855f7' : '#ef4444' }}>
              {score} / {questions.length}
            </p>
            <p className="text-sm" style={{ color: '#9ca3af' }}>
              {score === questions.length ? '🎉 Perfect score!' : score >= questions.length / 2 ? '👍 Good job — review the ones you missed.' : '📚 Keep practicing — check the explanations below.'}
            </p>
          </div>
        )}

        {/* Empty state */}
        {!loading && questions.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">◈</div>
            <p className="font-semibold mb-1" style={{ color: '#1a1a2e' }}>No questions yet</p>
            <p className="text-sm" style={{ color: '#9ca3af' }}>Enter a subject and topic above, then hit Generate</p>
          </div>
        )}

        {loading && (
          <div className="empty-state">
            <div className="empty-icon" style={{ fontSize: '22px' }}>✦</div>
            <p className="text-sm animate-pulse" style={{ color: '#a855f7' }}>Generating your questions...</p>
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