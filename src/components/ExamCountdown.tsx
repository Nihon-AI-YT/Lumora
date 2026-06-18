'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Exam {
  id: string
  name: string
  exam_date: string
  priority?: 'high' | 'medium' | 'low'
}

interface Props {
  exams: Exam[]
}

const PRIORITY = {
  high: { label: 'High', color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
  medium: { label: 'Medium', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
  low: { label: 'Low', color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
}

export default function ExamCountdown({ exams: initialExams }: Props) {
  const router = useRouter()
  const [exams, setExams] = useState<Exam[]>(initialExams)
  const [showModal, setShowModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('medium')
  const [adding, setAdding] = useState(false)

  const getDays = (dateStr: string) => Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)

  const sorted = [...exams].sort((a, b) => {
    const po = { high: 0, medium: 1, low: 2 }
    const pa = po[a.priority || 'medium']
    const pb = po[b.priority || 'medium']
    if (pa !== pb) return pa - pb
    return new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime()
  })

  const addExam = async () => {
    if (!newName || !newDate) return
    setAdding(true)
    const res = await fetch('/api/exams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, exam_date: newDate, priority: newPriority })
    })
    const data = await res.json()
    if (data.exam) {
      setExams(prev => [...prev, data.exam])
      setNewName('')
      setNewDate('')
      setNewPriority('medium')
      setShowModal(false)
      router.refresh()
    }
    setAdding(false)
  }

  const deleteExam = async (id: string) => {
    await fetch('/api/exams', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    setExams(prev => prev.filter(e => e.id !== id))
  }

  return (
    <>
      <style>{`
        .exam-card {
          background: rgba(255,255,255,0.7);
          backdrop-filter: blur(12px);
          border: 1px solid #e8e0f0;
          border-radius: 16px;
          padding: 18px 20px;
          position: relative;
          transition: box-shadow 0.15s;
        }
        .exam-card:hover { box-shadow: 0 4px 20px rgba(168,85,247,0.08); }
        .exam-delete {
          position: absolute;
          top: 12px;
          right: 12px;
          background: none;
          border: none;
          color: #d1d5db;
          cursor: pointer;
          font-size: 0.75rem;
          padding: 2px 6px;
          border-radius: 4px;
          transition: color 0.15s;
        }
        .exam-delete:hover { color: #ef4444; }
        .priority-btn {
          flex: 1;
          padding: 8px;
          border-radius: 8px;
          border: 1px solid #e8e0f0;
          background: white;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0,0,0,0.3);
          backdrop-filter: blur(4px);
        }
        .modal-box {
          background: white;
          border-radius: 20px;
          padding: 28px;
          width: 400px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
          border: 1px solid #e8e0f0;
        }
        .modal-input {
          width: 100%;
          border: 1px solid #e8e0f0;
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 0.875rem;
          color: #1a1a2e;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.15s;
        }
        .modal-input:focus { border-color: #a855f7; }
      `}</style>

      {/* Section header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#9ca3af' }}>📅 Upcoming Exams</h2>
        <button
          onClick={() => setShowModal(true)}
          style={{
            background: 'linear-gradient(135deg, #a855f7, #ec4899)',
            color: 'white', border: 'none', borderRadius: '20px',
            padding: '6px 14px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer'
          }}
        >+ Add Exam</button>
      </div>

      {/* Exam cards grid */}
      {sorted.length === 0 ? (
        <div style={{
          background: 'rgba(255,255,255,0.7)', border: '1px dashed #e8e0f0',
          borderRadius: '16px', padding: '28px', textAlign: 'center', marginBottom: '32px'
        }}>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No exams added yet — add one to start your countdown</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 mb-10">
          {sorted.map(ex => {
            const days = getDays(ex.exam_date)
            const p = PRIORITY[ex.priority || 'medium']
            return (
              <div key={ex.id} className="exam-card" style={{ borderTop: `3px solid ${p.color}` }}>
                <button className="exam-delete" onClick={() => deleteExam(ex.id)}>✕</button>
                <span style={{
                  display: 'inline-block', fontSize: '0.7rem', fontWeight: 700,
                  color: p.color, background: p.bg, border: `1px solid ${p.border}`,
                  borderRadius: '20px', padding: '2px 8px', marginBottom: '8px'
                }}>{p.label}</span>
                <p className="font-semibold text-sm mb-1" style={{ color: '#1a1a2e', paddingRight: '16px' }}>{ex.name}</p>
                <p style={{ fontSize: '0.72rem', color: '#9ca3af', marginBottom: '12px' }}>
                  {new Date(ex.exam_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
                <p style={{ fontSize: '2rem', fontWeight: 800, color: days <= 0 ? '#9ca3af' : p.color, lineHeight: 1 }}>
                  {days > 0 ? days : 'Done'}
                </p>
                <p style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{days > 0 ? 'days left' : ''}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Add modal */}
      {showModal && (
        <div className="modal-overlay" onMouseDown={() => setShowModal(false)}>
          <div className="modal-box" onMouseDown={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1a1a2e', margin: 0 }}>Add Exam</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '1.1rem' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                className="modal-input"
                placeholder="Exam name — e.g. Physics A/L"
                value={newName}
                onChange={e => setNewName(e.target.value)}
              />
              <input
                type="date"
                className="modal-input"
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
              />

              <div>
                <p style={{ fontSize: '0.72rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Priority</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['high', 'medium', 'low'] as const).map(p => (
                    <button
                      key={p}
                      className="priority-btn"
                      onClick={() => setNewPriority(p)}
                      style={{
                        borderColor: newPriority === p ? PRIORITY[p].color : '#e8e0f0',
                        background: newPriority === p ? PRIORITY[p].bg : 'white',
                        color: newPriority === p ? PRIORITY[p].color : '#6b7280',
                      }}
                    >{PRIORITY[p].label}</button>
                  ))}
                </div>
              </div>

              <button
                onClick={addExam}
                disabled={adding || !newName || !newDate}
                style={{
                  width: '100%', padding: '11px',
                  background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                  color: 'white', border: 'none', borderRadius: '10px',
                  fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
                  opacity: (!newName || !newDate) ? 0.5 : 1, marginTop: '4px'
                }}
              >{adding ? 'Adding...' : 'Add Exam'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}