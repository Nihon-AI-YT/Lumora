'use client'
import { useState, useEffect } from 'react'

interface MCQQuestion {
  id: number
  type: 'mcq'
  question: string
  options: string[]
  correct: string
  marks: number
  explanation: string
}

interface ShortQuestion {
  id: number
  type: 'short'
  question: string
  sample_answer: string
  marks: number
  keywords: string[]
}

type Question = MCQQuestion | ShortQuestion

interface Exam {
  title: string
  subject: string
  topic: string
  duration_minutes: number
  questions: Question[]
  total_marks: number
}

export default function ExamPage() {
  const [subject, setSubject] = useState('')
  const [topic, setTopic] = useState('')
  const [pdfName, setPdfName] = useState('')
  const [pdfText, setPdfText] = useState('')
  const [count, setCount] = useState(10)
  const [difficulty, setDifficulty] = useState('medium')
  const [examType, setExamType] = useState('mixed')
  const [duration, setDuration] = useState(30)
  const [exam, setExam] = useState<Exam | null>(null)
  const [loading, setLoading] = useState(false)
  const [started, setStarted] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [timerActive, setTimerActive] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!timerActive) return
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setTimerActive(false)
          setSubmitted(true)
          setExam(currentExam => {
            if (currentExam) {
              setAnswers(currentAnswers => {
                let total = 0
                currentExam.questions.forEach(q => {
                  if (q.type === 'mcq' && currentAnswers[q.id] === (q as MCQQuestion).correct) {
                    total += q.marks
                  }
                })
                setScore(total)
                return currentAnswers
              })
            }
            return currentExam
          })
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [timerActive])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const generateExam = async (overrideTopic?: string, overrideSubject?: string) => {
    const activeTopic = overrideTopic || pdfText || topic
    const activeSubject = overrideSubject || subject || 'General'
    if (!activeTopic) return
    setLoading(true)
    setExam(null)
    setStarted(false)
    setSubmitted(false)
    setAnswers({})
    setScore(0)
    setShowPreview(false)
    setError('')
    try {
      const res = await fetch('/api/exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: activeSubject, topic: activeTopic, count, difficulty, examType })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setExam(data.exam)
      setShowPreview(true)
    } catch {
      setError('Failed to generate exam. Try again.')
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
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/extract-pdf', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setPdfText(data.text)
    } catch {
      setError('Failed to read PDF. Try again.')
      setPdfName('')
    } finally {
      setLoading(false)
    }
  }

  const startExam = () => {
    setStarted(true)
    setShowPreview(false)
    setTimeLeft(duration * 60)
    setTimerActive(true)
  }

  const handleSubmit = () => {
    if (!exam) return
    let total = 0
    exam.questions.forEach(q => {
      if (q.type === 'mcq' && answers[q.id] === (q as MCQQuestion).correct) total += q.marks
    })
    setScore(total)
    setSubmitted(true)
    setTimerActive(false)
  }

  const resetExam = () => {
    setExam(null)
    setStarted(false)
    setSubmitted(false)
    setAnswers({})
    setScore(0)
    setTimeLeft(0)
    setTimerActive(false)
    setShowPreview(false)
    setPdfName('')
    setPdfText('')
    setError('')
  }

  const mcqScore = submitted ? score : 0
  const mcqTotal = exam?.questions.filter(q => q.type === 'mcq').reduce((a, q) => a + q.marks, 0) || 0
  const answeredCount = Object.keys(answers).length
  const totalQuestions = exam?.questions.length || 0
  const percentage = mcqTotal > 0 ? Math.round((mcqScore / mcqTotal) * 100) : 0

  return (
    <>
      <style>{`
        .exam-input {
          background: rgba(255,255,255,0.8);
          border: 1px solid #e8e0f0;
          border-radius: 10px;
          padding: 10px 14px;
          color: #1a1a2e;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.15s;
          width: 100%;
        }
        .exam-input:focus { border-color: #a855f7; }
        .exam-input::placeholder { color: #9ca3af; }
        .exam-btn {
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
        .exam-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .exam-btn:hover:not(:disabled) { opacity: 0.9; }
        .exam-btn-secondary {
          background: rgba(255,255,255,0.8);
          color: #6b7280;
          font-weight: 600;
          font-size: 0.875rem;
          padding: 12px 24px;
          border-radius: 12px;
          border: 1px solid #e8e0f0;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .exam-btn-secondary:hover { border-color: #a855f7; color: #9333ea; }
        .settings-card {
          background: rgba(255,255,255,0.75);
          backdrop-filter: blur(12px);
          border: 1px solid #e8e0f0;
          border-radius: 20px;
          padding: 28px;
          margin-bottom: 24px;
        }
        .settings-label {
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #9ca3af;
          margin-bottom: 6px;
          display: block;
        }
        .pdf-upload-zone {
          border: 2px dashed #e8e0f0;
display: block;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          cursor: pointer;
          transition: all 0.15s;
          background: rgba(168,85,247,0.02);
        }
        .pdf-upload-zone:hover {
          border-color: #a855f7;
          background: rgba(168,85,247,0.04);
        }
        .pdf-upload-zone.has-file {
          border-color: #a855f7;
          background: rgba(168,85,247,0.06);
        }
        .exam-card {
          background: rgba(255,255,255,0.8);
          border: 1px solid #e8e0f0;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 16px;
        }
        .preview-card {
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(12px);
          border: 1px solid #e8e0f0;
          border-radius: 20px;
          padding: 36px 28px;
          text-align: center;
          margin-bottom: 24px;
        }
        .preview-stat {
          background: rgba(168,85,247,0.06);
          border: 1px solid rgba(168,85,247,0.15);
          border-radius: 14px;
          padding: 16px 24px;
          min-width: 90px;
        }
        .opt-btn {
          width: 100%;
          text-align: left;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid #e8e0f0;
          background: rgba(255,255,255,0.6);
          color: #1a1a2e;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.15s;
          margin-bottom: 6px;
          display: block;
        }
        .opt-btn:hover:not(:disabled) { border-color: #a855f7; background: rgba(168,85,247,0.05); }
        .opt-selected { border-color: #a855f7 !important; background: rgba(168,85,247,0.08) !important; color: #9333ea !important; }
        .opt-correct { border-color: #10b981 !important; background: rgba(16,185,129,0.08) !important; color: #059669 !important; }
        .opt-wrong { border-color: #ef4444 !important; background: rgba(239,68,68,0.08) !important; color: #dc2626 !important; }
        .score-card {
          background: rgba(255,255,255,0.8);
          border: 1px solid #e8e0f0;
          border-radius: 16px;
          padding: 28px;
          margin-bottom: 24px;
          text-align: center;
        }
        .short-answer {
          width: 100%;
          background: rgba(255,255,255,0.8);
          border: 1px solid #e8e0f0;
          border-radius: 10px;
          padding: 10px 14px;
          color: #1a1a2e;
          font-size: 0.875rem;
          outline: none;
          resize: vertical;
          min-height: 80px;
          transition: border-color 0.15s;
          box-sizing: border-box;
        }
        .short-answer:focus { border-color: #a855f7; }
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
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
        .timer-bar {
          position: sticky;
          top: 0;
          z-index: 10;
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(12px);
          border: 1px solid #e8e0f0;
          border-radius: 12px;
          padding: 12px 20px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .progress-bar-bg {
          width: 160px;
          height: 4px;
          background: #e8e0f0;
          border-radius: 4px;
          margin-top: 6px;
        }
        .progress-bar-fill {
          height: 4px;
          border-radius: 4px;
          background: linear-gradient(135deg, #a855f7, #ec4899);
          transition: width 0.3s;
        }
      `}</style>

      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1" style={{ color: '#1a1a2e' }}>Practice Exam</h1>
          <p className="text-sm" style={{ color: '#9ca3af' }}>Configure your exam, upload a PDF, and test yourself under real conditions</p>
        </div>

        {/* Settings card */}
        {!started && !showPreview && (
          <div className="settings-card">

            {/* Row 1 — Subject + Topic */}
            <div className="flex gap-3 mb-5">
              <div className="flex-1">
                <label className="settings-label">Subject</label>
                <input type="text" placeholder="e.g. Physics, Japanese" value={subject}
                  onChange={e => setSubject(e.target.value)} className="exam-input" />
              </div>
              <div className="flex-1">
                <label className="settings-label">Topic</label>
                <input type="text" placeholder="e.g. Newton's Laws"
                  value={pdfName || topic}
                  onChange={e => { setTopic(e.target.value); setPdfName(''); setPdfText('') }}
                  onKeyDown={e => e.key === 'Enter' && generateExam()}
                  className="exam-input" />
              </div>
            </div>

            {/* Row 2 — Difficulty + Type + Questions + Time */}
            <div className="flex gap-3 mb-5">
              <div className="flex-1">
                <label className="settings-label">Difficulty</label>
                <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="exam-input">
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="settings-label">Type</label>
                <select value={examType} onChange={e => setExamType(e.target.value)} className="exam-input">
                  <option value="mixed">Mixed</option>
                  <option value="mcq">MCQ Only</option>
                  <option value="written">Written Only</option>
                </select>
              </div>
              <div>
                <label className="settings-label">Questions</label>
                <select value={count} onChange={e => setCount(Number(e.target.value))} className="exam-input">
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={20}>20</option>
                </select>
              </div>
              <div>
                <label className="settings-label">Time</label>
                <select value={duration} onChange={e => setDuration(Number(e.target.value))} className="exam-input">
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>60 min</option>
                  <option value={90}>90 min</option>
                </select>
              </div>
            </div>

            {/* Row 3 — PDF Upload zone */}
            <div className="mb-5">
              <label className="settings-label">Upload PDF (optional)</label>
              <label className={`pdf-upload-zone ${pdfName ? 'has-file' : ''}`}>
                <input type="file" accept=".pdf" onChange={handlePDF} style={{ display: 'none' }} />
                {loading && pdfName ? (
                  <p className="text-sm animate-pulse" style={{ color: '#a855f7' }}>Reading {pdfName}...</p>
                ) : pdfName ? (
                  <div>
                    <p style={{ fontSize: '1.5rem', marginBottom: '4px' }}>📄</p>
                    <p className="text-sm font-semibold" style={{ color: '#a855f7' }}>{pdfName}</p>
                    <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>Click to replace</p>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: '1.5rem', marginBottom: '4px' }}>📂</p>
                    <p className="text-sm font-semibold" style={{ color: '#6b7280' }}>Click to upload a PDF</p>
                    <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>Exam will be generated from your document</p>
                  </div>
                )}
              </label>
            </div>

            {error && <p className="text-sm mb-4" style={{ color: '#ef4444' }}>{error}</p>}

            {/* Generate button */}
            <button
              onClick={() => generateExam()}
              disabled={loading || (!topic && !pdfText)}
              className="exam-btn"
              style={{ width: '100%', padding: '14px', fontSize: '0.95rem' }}
            >
              {loading && !pdfName ? 'Generating exam...' : loading && pdfName ? 'Reading PDF...' : '✦ Generate Exam'}
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && !pdfName && (
          <div className="empty-state">
            <div className="empty-icon" style={{ fontSize: '22px' }}>✦</div>
            <p className="text-sm animate-pulse" style={{ color: '#a855f7' }}>Generating your exam with AI...</p>
          </div>
        )}

        {/* Empty state */}
        {!started && !showPreview && !loading && !exam && (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <p className="font-semibold mb-1" style={{ color: '#1a1a2e' }}>Ready when you are</p>
            <p className="text-sm" style={{ color: '#9ca3af' }}>Configure your settings above and hit Generate Exam</p>
          </div>
        )}

        {/* Exam preview */}
        {exam && showPreview && !started && !loading && (
          <div className="preview-card">
            <div style={{
              width: '56px', height: '56px', borderRadius: '16px',
              background: 'linear-gradient(135deg, #a855f7, #ec4899)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '24px', margin: '0 auto 16px'
            }}>📝</div>
            <h2 className="text-xl font-bold mb-2" style={{ color: '#1a1a2e' }}>{exam.title}</h2>
            <p className="text-sm mb-8" style={{ color: '#9ca3af' }}>
              {exam.subject} · {pdfName || exam.topic.slice(0, 40)}{!pdfName && exam.topic.length > 40 ? '...' : ''} · {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </p>
            <div className="flex justify-center gap-4 mb-8">
              <div className="preview-stat">
                <p className="text-2xl font-bold" style={{ color: '#a855f7' }}>{exam.questions.length}</p>
                <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>Questions</p>
              </div>
              <div className="preview-stat">
                <p className="text-2xl font-bold" style={{ color: '#a855f7' }}>{exam.total_marks}</p>
                <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>Total Marks</p>
              </div>
              <div className="preview-stat">
                <p className="text-2xl font-bold" style={{ color: '#a855f7' }}>{duration}</p>
                <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>Minutes</p>
              </div>
              <div className="preview-stat">
                <p className="text-2xl font-bold" style={{ color: '#a855f7' }}>{difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</p>
                <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>Difficulty</p>
              </div>
            </div>
            <p className="text-xs mb-6" style={{ color: '#9ca3af' }}>
              ⚠️ Once started, the timer will begin. Complete all questions before time runs out.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={startExam} className="exam-btn" style={{ padding: '12px 32px' }}>Start Exam</button>
              <button onClick={() => setShowPreview(false)} className="exam-btn-secondary">Change Settings</button>
            </div>
          </div>
        )}

        {/* Active exam */}
        {exam && started && (
          <>
            {!submitted && (
              <div className="timer-bar">
                <div>
                  <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                    {answeredCount} / {totalQuestions} answered
                  </p>
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill"
                      style={{ width: `${totalQuestions > 0 ? (answeredCount / totalQuestions) * 160 : 0}px` }} />
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.7rem', color: '#9ca3af', marginBottom: '2px' }}>Time remaining</p>
                  <p style={{
                    fontSize: '1.3rem', fontWeight: '700', fontFamily: 'monospace',
                    color: timeLeft < 60 ? '#ef4444' : timeLeft < 300 ? '#f59e0b' : '#a855f7'
                  }}>
                    ⏱ {formatTime(timeLeft)}
                  </p>
                </div>
              </div>
            )}

            {submitted && (
              <div className="score-card">
                <p className="text-xs uppercase tracking-wider mb-3" style={{ color: '#9ca3af' }}>Your MCQ Score</p>
                <p className="text-5xl font-bold mb-1" style={{
                  color: percentage >= 70 ? '#10b981' : percentage >= 40 ? '#a855f7' : '#ef4444'
                }}>
                  {mcqScore} / {mcqTotal}
                </p>
                <p className="text-lg font-semibold mb-3" style={{
                  color: percentage >= 70 ? '#10b981' : percentage >= 40 ? '#a855f7' : '#ef4444'
                }}>
                  {percentage}%
                </p>
                <p className="text-sm mb-4" style={{ color: '#9ca3af' }}>
                  {percentage >= 70 ? '🎉 Excellent work! You have a strong grasp of this topic.' :
                    percentage >= 40 ? '👍 Good effort — review the explanations below to improve.' :
                      '📚 Keep studying — go through each explanation carefully.'}
                </p>
                {exam.questions.some(q => q.type === 'short') && (
                  <p className="text-xs" style={{ color: '#9ca3af' }}>
                    ✏️ Also review your written answers against the sample answers below.
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-4">
              {exam.questions.map((q, i) => (
                <div key={q.id} className="exam-card">
                  <div className="flex justify-between items-start mb-3">
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#9ca3af' }}>
                      Question {i + 1}
                    </p>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: '600', padding: '2px 8px',
                      borderRadius: '20px', background: 'rgba(168,85,247,0.08)', color: '#a855f7'
                    }}>
                      {q.marks} mark{q.marks > 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-sm font-medium mb-4" style={{ color: '#1a1a2e' }}>{q.question}</p>

                  {q.type === 'mcq' && (
                    <>
                      {(q as MCQQuestion).options.map((opt, j) => {
                        let cls = 'opt-btn'
                        if (submitted) {
                          if (opt === (q as MCQQuestion).correct) cls += ' opt-correct'
                          else if (opt === answers[q.id]) cls += ' opt-wrong'
                        } else if (answers[q.id] === opt) {
                          cls += ' opt-selected'
                        }
                        return (
                          <button key={j} disabled={submitted}
                            onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                            className={cls}>
                            {opt}
                          </button>
                        )
                      })}
                      {submitted && (
                        <p className="text-xs mt-3 leading-relaxed" style={{ color: '#6b7280' }}>
                          💡 {(q as MCQQuestion).explanation}
                        </p>
                      )}
                    </>
                  )}

                  {q.type === 'short' && (
                    <>
                      <textarea
                        disabled={submitted}
                        placeholder="Write your answer here..."
                        value={answers[q.id] || ''}
                        onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                        className="short-answer"
                      />
                      {submitted && (
                        <div className="mt-3 p-3" style={{ background: 'rgba(168,85,247,0.06)', borderRadius: '10px' }}>
                          <p className="text-xs font-semibold mb-1" style={{ color: '#a855f7' }}>Sample Answer:</p>
                          <p className="text-xs leading-relaxed mb-2" style={{ color: '#6b7280' }}>
                            {(q as ShortQuestion).sample_answer}
                          </p>
                          <p className="text-xs" style={{ color: '#9ca3af' }}>
                            <strong>Key points:</strong> {(q as ShortQuestion).keywords.join(' · ')}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}

              {!submitted && (
                <button onClick={handleSubmit} className="exam-btn" style={{ width: '100%', padding: '14px' }}>
                  Submit Exam
                </button>
              )}
              {submitted && (
                <button onClick={resetExam} className="exam-btn" style={{ width: '100%', padding: '14px' }}>
                  Generate New Exam
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}