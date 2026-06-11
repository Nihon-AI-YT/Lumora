'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface WrongQuestion {
  question: string
  selected: string
  correct: string
}

interface Attempt {
  id: string
  subject: string
  topic: string
  score: number
  total: number
  created_at: string
  wrong_questions: WrongQuestion[]
}

interface WeakTopic {
  subject: string
  topic: string
  attempts: number
  totalWrong: number
  totalQuestions: number
}

export default function ReviewPage() {
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'mistakes' | 'topics'>('overview')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('mcq_attempts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (data) {
      setAttempts(data)
      computeWeakTopics(data)
    }
    setLoading(false)
  }

  const computeWeakTopics = (data: Attempt[]) => {
    const map: Record<string, WeakTopic> = {}
    data.forEach(a => {
      const key = `${a.subject}__${a.topic}`
      if (!map[key]) {
        map[key] = { subject: a.subject, topic: a.topic, attempts: 0, totalWrong: 0, totalQuestions: 0 }
      }
      map[key].attempts++
      map[key].totalWrong += (a.total - a.score)
      map[key].totalQuestions += a.total
    })
    const sorted = Object.values(map).sort((a, b) => b.totalWrong - a.totalWrong)
    setWeakTopics(sorted)
  }

  const totalAttempts = attempts.length
  const totalQuestions = attempts.reduce((a, b) => a + b.total, 0)
  const totalCorrect = attempts.reduce((a, b) => a + b.score, 0)
  const avgScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0
  const allWrongQuestions = attempts.flatMap(a => a.wrong_questions.map(q => ({ ...q, subject: a.subject, topic: a.topic })))

  const formatDate = (str: string) => {
    const d = new Date(str)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto" style={{ paddingTop: '80px', textAlign: 'center' }}>
        <p className="text-sm animate-pulse" style={{ color: '#a855f7' }}>Loading your progress...</p>
      </div>
    )
  }

  return (
    <>
      <style>{`
        .review-card {
          background: rgba(255,255,255,0.75);
          backdrop-filter: blur(12px);
          border: 1px solid #e8e0f0;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 16px;
        }
        .stat-card {
          background: rgba(255,255,255,0.75);
          backdrop-filter: blur(12px);
          border: 1px solid #e8e0f0;
          border-radius: 16px;
          padding: 20px 24px;
          flex: 1;
          text-align: center;
        }
        .tab-btn {
          padding: 8px 20px;
          border-radius: 20px;
          border: 1px solid #e8e0f0;
          background: rgba(255,255,255,0.6);
          color: #6b7280;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .tab-btn.active {
          background: linear-gradient(135deg, #a855f7, #ec4899);
          color: white;
          border-color: transparent;
        }
        .tab-btn:hover:not(.active) { border-color: #a855f7; color: #a855f7; }
        .weak-bar-bg {
          height: 6px;
          background: #e8e0f0;
          border-radius: 6px;
          margin-top: 8px;
        }
        .weak-bar-fill {
          height: 6px;
          border-radius: 6px;
          background: linear-gradient(135deg, #a855f7, #ec4899);
          transition: width 0.4s;
        }
        .mistake-card {
          background: rgba(239,68,68,0.04);
          border: 1px solid rgba(239,68,68,0.12);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 10px;
        }
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
        .attempt-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 0;
          border-bottom: 1px solid #f0eaf8;
        }
        .attempt-row:last-child { border-bottom: none; }
      `}</style>

      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1" style={{ color: '#1a1a2e' }}>Review</h1>
          <p className="text-sm" style={{ color: '#9ca3af' }}>Track your progress and learn from your mistakes</p>
        </div>

        {attempts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <p className="font-semibold mb-1" style={{ color: '#1a1a2e' }}>No attempts yet</p>
            <p className="text-sm" style={{ color: '#9ca3af' }}>Complete an MCQ session to start tracking your progress</p>
          </div>
        ) : (
          <>
            {/* Stats row */}
            <div className="flex gap-3 mb-8">
              <div className="stat-card">
                <p className="text-3xl font-bold" style={{ color: '#a855f7' }}>{totalAttempts}</p>
                <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>Sessions</p>
              </div>
              <div className="stat-card">
                <p className="text-3xl font-bold" style={{ color: '#a855f7' }}>{totalQuestions}</p>
                <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>Questions Done</p>
              </div>
              <div className="stat-card">
                <p className="text-3xl font-bold" style={{ color: avgScore >= 70 ? '#10b981' : avgScore >= 40 ? '#a855f7' : '#ef4444' }}>{avgScore}%</p>
                <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>Avg Score</p>
              </div>
              <div className="stat-card">
                <p className="text-3xl font-bold" style={{ color: '#ef4444' }}>{allWrongQuestions.length}</p>
                <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>Mistakes</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
              <button className={`tab-btn ${activeTab === 'topics' ? 'active' : ''}`} onClick={() => setActiveTab('topics')}>Weak Topics</button>
              <button className={`tab-btn ${activeTab === 'mistakes' ? 'active' : ''}`} onClick={() => setActiveTab('mistakes')}>Mistakes</button>
            </div>

            {/* Overview tab */}
            {activeTab === 'overview' && (
              <div className="review-card">
                <p className="text-xs uppercase tracking-wider mb-4" style={{ color: '#9ca3af' }}>Recent Sessions</p>
                {attempts.map(a => {
                  const pct = Math.round((a.score / a.total) * 100)
                  return (
                    <div key={a.id} className="attempt-row">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: '#1a1a2e' }}>{a.subject} — {a.topic.slice(0, 40)}{a.topic.length > 40 ? '...' : ''}</p>
                        <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>{formatDate(a.created_at)}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p className="text-sm font-bold" style={{ color: pct >= 70 ? '#10b981' : pct >= 40 ? '#a855f7' : '#ef4444' }}>{a.score}/{a.total}</p>
                        <p className="text-xs" style={{ color: '#9ca3af' }}>{pct}%</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Weak topics tab */}
            {activeTab === 'topics' && (
              <div className="review-card">
                <p className="text-xs uppercase tracking-wider mb-4" style={{ color: '#9ca3af' }}>Topics by mistake rate</p>
                {weakTopics.map((t, i) => {
                  const errorRate = Math.round((t.totalWrong / t.totalQuestions) * 100)
                  return (
                    <div key={i} style={{ marginBottom: '20px' }}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-semibold" style={{ color: '#1a1a2e' }}>{t.topic.slice(0, 50)}{t.topic.length > 50 ? '...' : ''}</p>
                          <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{t.subject} · {t.attempts} session{t.attempts > 1 ? 's' : ''} · {t.totalWrong} wrong</p>
                        </div>
                        <span style={{
                          fontSize: '0.75rem', fontWeight: '700', padding: '2px 10px',
                          borderRadius: '20px',
                          background: errorRate >= 60 ? 'rgba(239,68,68,0.08)' : errorRate >= 30 ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)',
                          color: errorRate >= 60 ? '#ef4444' : errorRate >= 30 ? '#f59e0b' : '#10b981'
                        }}>
                          {errorRate}% error
                        </span>
                      </div>
                      <div className="weak-bar-bg">
                        <div className="weak-bar-fill" style={{ width: `${errorRate}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Mistakes tab */}
            {activeTab === 'mistakes' && (
              <div>
                <p className="text-xs uppercase tracking-wider mb-4" style={{ color: '#9ca3af' }}>{allWrongQuestions.length} total mistakes</p>
                {allWrongQuestions.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">🎉</div>
                    <p className="font-semibold mb-1" style={{ color: '#1a1a2e' }}>No mistakes!</p>
                    <p className="text-sm" style={{ color: '#9ca3af' }}>You got everything right</p>
                  </div>
                ) : (
                  allWrongQuestions.map((q, i) => (
                    <div key={i} className="mistake-card">
                      <p className="text-xs font-semibold mb-2" style={{ color: '#9ca3af' }}>{q.subject} · {q.topic.slice(0, 40)}</p>
                      <p className="text-sm font-medium mb-3" style={{ color: '#1a1a2e' }}>{q.question}</p>
                      <div className="flex flex-col gap-1">
                        <p className="text-xs" style={{ color: '#ef4444' }}>✗ Your answer: {q.selected}</p>
                        <p className="text-xs" style={{ color: '#10b981' }}>✓ Correct: {q.correct}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}