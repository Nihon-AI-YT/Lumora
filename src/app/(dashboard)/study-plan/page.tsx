'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Task {
  id: string
  title: string
  subject: string
  topic: string
  type: 'tutor' | 'mcq' | 'flashcards' | 'exam' | 'review'
  description: string
  completed: boolean
}

interface Week {
  week: number
  title: string
  tasks: Task[]
}

interface StudyPlan {
  id: string
  plan: Week[]
  generated_at: string
}

interface Exam {
  id: string
  name: string
  exam_date: string
  priority: 'high' | 'medium' | 'low'
}

interface WeakTopic {
  topic: string
  subject: string
  pct: number
}

const typeIcon = { tutor: '🤖', mcq: '📝', flashcards: '🃏', exam: '📋', review: '🎯' }
const typeColor = { tutor: '#a855f7', mcq: '#10b981', flashcards: '#6366f1', exam: '#f59e0b', review: '#ec4899' }
const typePath = { tutor: '/tutor', mcq: '/mcq', flashcards: '/flashcards', exam: '/exam', review: '/review' }
const priorityColor = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' }

export default function StudyPlanPage() {
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [showSetup, setShowSetup] = useState(false)

  const [exams, setExams] = useState<Exam[]>([])
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([])
  const [selectedExams, setSelectedExams] = useState<string[]>([])
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [loadingSetup, setLoadingSetup] = useState(false)

  const router = useRouter()

  const load = async () => {
    const res = await fetch('/api/study-plan')
    const data = await res.json()
    setStudyPlan(data.plan)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const loadSetupData = async () => {
    setLoadingSetup(true)
    setShowSetup(true)

    // Load exams
    const examRes = await fetch('/api/exams')
    const examData = await examRes.json()
    const examList = examData.exams || []
    setExams(examList)
    setSelectedExams(examList.map((e: Exam) => e.id))

    // Load weak topics from study-plan API
    const topicRes = await fetch('/api/study-plan?setup=true')
    const topicData = await topicRes.json()
    const topicList = topicData.weakTopics || []
    setWeakTopics(topicList)
    setSelectedTopics(topicList.map((t: WeakTopic) => t.topic))

    setLoadingSetup(false)
  }

  const generate = async () => {
    setGenerating(true)
    setShowSetup(false)
    const res = await fetch('/api/study-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        selectedExamIds: selectedExams,
        selectedTopics
      })
    })
    const data = await res.json()
    if (data.plan) setStudyPlan(data.plan)
    setGenerating(false)
  }

  const toggleTask = async (weekIndex: number, taskId: string) => {
    if (!studyPlan) return
    const updatedPlan = studyPlan.plan.map((week, wi) => {
      if (wi !== weekIndex) return week
      return {
        ...week,
        tasks: week.tasks.map(t =>
          t.id === taskId ? { ...t, completed: !t.completed } : t
        )
      }
    })
    setStudyPlan({ ...studyPlan, plan: updatedPlan })
    await fetch('/api/study-plan', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan_id: studyPlan.id, plan: updatedPlan })
    })
  }

  const totalTasks = studyPlan?.plan.reduce((sum, w) => sum + w.tasks.length, 0) || 0
  const completedTasks = studyPlan?.plan.reduce((sum, w) => sum + w.tasks.filter(t => t.completed).length, 0) || 0
  const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const getDaysLeft = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - new Date().getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  return (
    <>
      <style>{`
        .task-card {
          background: rgba(255,255,255,0.75);
          backdrop-filter: blur(12px);
          border: 1px solid #e8e0f0;
          border-radius: 14px;
          padding: 16px 20px;
          display: flex;
          align-items: flex-start;
          gap: 14px;
          transition: box-shadow 0.15s;
          cursor: pointer;
        }
        .task-card:hover { box-shadow: 0 4px 20px rgba(168,85,247,0.10); }
        .task-card.completed { opacity: 0.6; }
        .week-card {
          background: rgba(255,255,255,0.5);
          backdrop-filter: blur(12px);
          border: 1px solid #e8e0f0;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 20px;
        }
        .toggle-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-radius: 12px;
          border: 2px solid #e8e0f0;
          cursor: pointer;
          transition: all 0.15s;
          margin-bottom: 8px;
        }
        .toggle-item.selected {
          border-color: #a855f7;
          background: #f9f0ff;
        }
      `}</style>

      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div>
            <h1 className="text-3xl font-bold mb-1" style={{ color: '#1a1a2e' }}>AI Study Plan</h1>
            <p className="text-sm" style={{ color: '#9ca3af' }}>
              Personalized 4-week plan based on your exams and weak topics
            </p>
          </div>
          <button onClick={loadSetupData} disabled={generating} style={{
            padding: '10px 20px', borderRadius: '12px', border: 'none',
            cursor: generating ? 'not-allowed' : 'pointer',
            background: 'linear-gradient(135deg, #a855f7, #ec4899)',
            color: 'white', fontWeight: 700, fontSize: '14px',
            opacity: generating ? 0.7 : 1
          }}>
            {generating ? '⏳ Generating...' : studyPlan ? '🔄 Regenerate' : '✦ Generate Plan'}
          </button>
        </div>

        {loading || generating ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <p style={{ color: '#9ca3af' }}>{generating ? '⏳ Generating your personalized plan...' : 'Loading...'}</p>
          </div>
        ) : !studyPlan ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            background: 'rgba(255,255,255,0.75)', borderRadius: '16px',
            border: '2px dashed #e8e0f0'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
            <p style={{ color: '#1a1a2e', fontWeight: 600, marginBottom: '8px' }}>No study plan yet</p>
            <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '20px' }}>
              Generate a personalized plan based on your exams and weak topics
            </p>
            <button onClick={loadSetupData} style={{
              padding: '12px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #a855f7, #ec4899)',
              color: 'white', fontWeight: 700, fontSize: '14px'
            }}>
              ✦ Generate My Study Plan
            </button>
          </div>
        ) : (
          <>
            {/* Progress bar */}
            <div style={{
              background: 'rgba(255,255,255,0.75)', borderRadius: '16px',
              padding: '20px 24px', marginBottom: '24px', border: '1px solid #e8e0f0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontWeight: 700, fontSize: '15px', color: '#1a1a2e' }}>Overall Progress</span>
                <span style={{ fontWeight: 700, fontSize: '15px', color: pct === 100 ? '#10b981' : '#a855f7' }}>
                  {completedTasks}/{totalTasks} tasks · {pct}%
                </span>
              </div>
              <div style={{ background: '#e8e0f0', borderRadius: '99px', height: '10px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: '99px', width: `${pct}%`,
                  background: pct === 100 ? '#10b981' : 'linear-gradient(135deg, #a855f7, #ec4899)',
                  transition: 'width 0.4s ease'
                }} />
              </div>
              {pct === 100 && (
                <p style={{ margin: '10px 0 0', fontSize: '13px', color: '#10b981', fontWeight: 600 }}>
                  🎉 Study plan complete! Regenerate to keep going.
                </p>
              )}
              <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#9ca3af' }}>
                Generated {new Date(studyPlan.generated_at).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
              </p>
            </div>

            {/* Weeks */}
            {studyPlan.plan.map((week, wi) => {
              const weekCompleted = week.tasks.filter(t => t.completed).length
              const weekTotal = week.tasks.length
              return (
                <div key={week.week} className="week-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1a1a2e' }}>{week.title}</h3>
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#9ca3af' }}>{weekCompleted}/{weekTotal} tasks done</p>
                    </div>
                    <div style={{
                      padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                      background: weekCompleted === weekTotal ? '#10b98120' : '#a855f720',
                      color: weekCompleted === weekTotal ? '#10b981' : '#a855f7'
                    }}>
                      {weekCompleted === weekTotal ? '✅ Done' : `Week ${week.week}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {week.tasks.map(task => (
                      <div key={task.id} className={`task-card ${task.completed ? 'completed' : ''}`}
                        onClick={() => toggleTask(wi, task.id)}>
                        <div style={{
                          width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0, marginTop: '1px',
                          border: `2px solid ${task.completed ? '#10b981' : '#e8e0f0'}`,
                          background: task.completed ? '#10b981' : 'white',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          {task.completed && <span style={{ color: 'white', fontSize: '13px', fontWeight: 700 }}>✓</span>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '14px' }}>{typeIcon[task.type]}</span>
                            <p style={{
                              margin: 0, fontWeight: 600, fontSize: '14px',
                              color: task.completed ? '#9ca3af' : '#1a1a2e',
                              textDecoration: task.completed ? 'line-through' : 'none'
                            }}>{task.title}</p>
                            <span style={{
                              marginLeft: 'auto', fontSize: '11px', fontWeight: 600,
                              padding: '2px 8px', borderRadius: '20px', flexShrink: 0,
                              background: typeColor[task.type] + '20', color: typeColor[task.type]
                            }}>{task.subject}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af', lineHeight: 1.4 }}>{task.description}</p>
                        </div>
                        {!task.completed && (
                          <button onClick={e => { e.stopPropagation(); router.push(`${typePath[task.type]}?topic=${encodeURIComponent(task.topic)}&subject=${encodeURIComponent(task.subject)}`) }}
                            style={{
                              flexShrink: 0, padding: '6px 12px', borderRadius: '8px', border: 'none',
                              cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                              background: typeColor[task.type] + '20', color: typeColor[task.type]
                            }}>Start →</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>

      {/* Setup Modal */}
      {showSetup && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            background: 'white', borderRadius: '20px', padding: '28px',
            width: '100%', maxWidth: '500px', maxHeight: '85vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#1a1a2e' }}>✦ Customize Your Plan</h3>
              <button onClick={() => setShowSetup(false)} style={{
                background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#9ca3af'
              }}>✕</button>
            </div>

            {loadingSetup ? (
              <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px' }}>Loading your data...</p>
            ) : (
              <>
                {/* Exams */}
                <p style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Include these exams
                </p>
                {exams.length === 0 ? (
                  <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '20px' }}>No exams added yet. Add some in My Exams.</p>
                ) : (
                  <div style={{ marginBottom: '20px' }}>
                    {exams.map(exam => {
                      const selected = selectedExams.includes(exam.id)
                      const days = getDaysLeft(exam.exam_date)
                      return (
                        <div key={exam.id} className={`toggle-item ${selected ? 'selected' : ''}`}
                          onClick={() => setSelectedExams(prev =>
                            prev.includes(exam.id) ? prev.filter(id => id !== exam.id) : [...prev, exam.id]
                          )}>
                          <div>
                            <p style={{ margin: 0, fontWeight: 600, fontSize: '14px', color: '#1a1a2e' }}>{exam.name}</p>
                            <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>{days} days left</p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px',
                              background: priorityColor[exam.priority] + '20', color: priorityColor[exam.priority]
                            }}>{exam.priority}</span>
                            <div style={{
                              width: '20px', height: '20px', borderRadius: '50%',
                              background: selected ? 'linear-gradient(135deg, #a855f7, #ec4899)' : '#e8e0f0',
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                              {selected && <span style={{ color: 'white', fontSize: '11px', fontWeight: 700 }}>✓</span>}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Weak Topics */}
                <p style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Include these weak topics
                </p>
                {weakTopics.length === 0 ? (
                  <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '20px' }}>No weak topics yet. Practice some MCQs first.</p>
                ) : (
                  <div style={{ marginBottom: '20px' }}>
                    {weakTopics.map(t => {
                      const selected = selectedTopics.includes(t.topic)
                      const color = t.pct < 40 ? '#ef4444' : '#f59e0b'
                      return (
                        <div key={t.topic} className={`toggle-item ${selected ? 'selected' : ''}`}
                          onClick={() => setSelectedTopics(prev =>
                            prev.includes(t.topic) ? prev.filter(tp => tp !== t.topic) : [...prev, t.topic]
                          )}>
                          <div>
                            <p style={{ margin: 0, fontWeight: 600, fontSize: '14px', color: '#1a1a2e' }}>{t.topic}</p>
                            <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>{t.subject}</p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px',
                              background: color + '20', color
                            }}>{t.pct}% accuracy</span>
                            <div style={{
                              width: '20px', height: '20px', borderRadius: '50%',
                              background: selected ? 'linear-gradient(135deg, #a855f7, #ec4899)' : '#e8e0f0',
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                              {selected && <span style={{ color: 'white', fontSize: '11px', fontWeight: 700 }}>✓</span>}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                <button onClick={generate}
                  disabled={selectedExams.length === 0 && selectedTopics.length === 0}
                  style={{
                    width: '100%', padding: '12px', borderRadius: '12px', border: 'none',
                    cursor: 'pointer', background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                    color: 'white', fontWeight: 700, fontSize: '14px',
                    opacity: selectedExams.length === 0 && selectedTopics.length === 0 ? 0.5 : 1
                  }}>
                  ✦ Generate Plan
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}