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
  const [count, setCount] = useState(10)
  const [difficulty, setDifficulty] = useState('medium')
  const [examType, setExamType] = useState('mixed')
  const [exam, setExam] = useState<Exam | null>(null)
  const [loading, setLoading] = useState(false)
  const [started, setStarted] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [timerActive, setTimerActive] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

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

  const generateExam = async () => {
    if (!subject || !topic) return
    if (subject.trim().length < 2 || topic.trim().length < 2) {
      alert('Please enter a valid subject and topic.')
      return
    }
    if (!/[a-zA-Z]/.test(subject) || !/[a-zA-Z]/.test(topic)) {
      alert('Subject and topic must contain real words.')
      return
    }
    setLoading(true)
    setExam(null)
    setStarted(false)
    setSubmitted(false)
    setAnswers({})
    setScore(0)
    setShowPreview(false)
    try {
      const res = await fetch('/api/exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, topic, count, difficulty, examType })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setExam(data.exam)
      setShowPreview(true)
    } catch {
      alert('Failed to generate exam. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const startExam = () => {
    setStarted(true)
    setShowPreview(false)
    setTimeLeft((exam?.duration_minutes || 30) * 60)
    setTimerActive(true)
  }

  const handleSubmit = () => {
    if (!exam) return
    let total = 0
    exam.questions.forEach(q => {
      if (q.type === 'mcq' && answers[q.id] === (q as MCQQuestion).correct) {
        total += q.marks
      }
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
          border-radius: 12px;
          padding: 12px 16px;
          color: #1a1a2e;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.15s;
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
        .exam-card {
          background: rgba(255,255,255,0.8);
          border: 1px solid #e8e0f0;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 16px;
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
          padding: 80px 20px;
          text-align: center;
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
          <h1 className="text-2xl font-bold mb-1" style={{ color: '#1a1a2e' }}>Mock Exam</h1>
          <p className="text-sm" style={{ color: '#9ca3af' }}>AI-generated exams to test your knowledge</p>
        </div>

        {/* Controls */}
        {!started && !showPreview && (
          <div className="flex flex-col gap-3 mb-8">
            <div className="flex gap-3">
              <input type="text" placeholder="Subject — e.g. Physics" value={subject}
                onChange={e => setSubject(e.target.value)} className="exam-input flex-1" />
              <input type="text" placeholder="Topic — e.g. Newton's Laws" value={topic}
                onChange={e => setTopic(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && generateExam()}
                className="exam-input flex-1" />
            </div>
            <div className="flex gap-3">
              <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="exam-input flex-1">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              <select value={examType} onChange={e => setExamType(e.target.value)} className="exam-input flex-1">
                <option value="mixed">Mixed (MCQ + Written)</option>
                <option value="mcq">MCQ Only</option>
                <option value="written">Written Only</option>
              </select>
              <select value={count} onChange={e => setCount(Number(e.target.value))} className="exam-input">
                <option value={5}>5 questions</option>
                <option value={10}>10 questions</option>
                <option value={15}>15 questions</option>
                <option value={20}>20 questions</option>
              </select>
            </div>
            <button onClick={generateExam} disabled={loading || !subject || !topic} className="exam-btn">
              {loading ? 'Generating exam...' : 'Generate Exam'}
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="empty-state">
            <p className="text-sm animate-pulse" style={{ color: '#a855f7' }}>Generating your exam with AI...</p>
          </div>
        )}

        {/* Exam preview */}
        {exam && showPreview && !started && !loading && (
          <div className="exam-card" style={{ textAlign: 'center' }}>
            <h2 className="text-xl font-bold mb-2" style={{ color: '#1a1a2e' }}>{exam.title}</h2>
            <p className="text-sm mb-6" style={{ color: '#9ca3af' }}>
              {exam.subject} · {exam.topic} · {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </p>
            <div className="flex justify-center gap-10 mb-8">
              <div>
                <p className="text-3xl font-bold" style={{ color: '#a855f7' }}>{exam.questions.length}</p>
                <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>Questions</p>
              </div>
              <div>
                <p className="text-3xl font-bold" style={{ color: '#a855f7' }}>{exam.total_marks}</p>
                <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>Total Marks</p>
              </div>
              <div>
                <p className="text-3xl font-bold" style={{ color: '#a855f7' }}>{exam.duration_minutes}</p>
                <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>Minutes</p>
              </div>
            </div>
            <p className="text-xs mb-6" style={{ color: '#9ca3af' }}>
              ⚠️ Once started, the timer will begin. Complete all questions before time runs out.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={startExam} className="exam-btn">Start Exam</button>
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