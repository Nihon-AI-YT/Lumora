'use client'

import { useEffect, useState } from 'react'

interface Exam {
  id: string
  name: string
  exam_date: string
  priority: 'high' | 'medium' | 'low'
  created_at: string
}

const priorityColor = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' }
const priorityBg = { high: '#fef2f2', medium: '#fffbeb', low: '#f0fdf4' }

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', exam_date: '', priority: 'medium' })
  const [editingExam, setEditingExam] = useState<Exam | null>(null)
  const [editForm, setEditForm] = useState({ name: '', exam_date: '', priority: 'medium' })

  const load = async () => {
    const res = await fetch('/api/exams')
    const data = await res.json()
    setExams(data.exams || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const getDaysLeft = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - new Date().getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const addExam = async () => {
    if (!form.name || !form.exam_date) return
    setSaving(true)
    await fetch('/api/exams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    setForm({ name: '', exam_date: '', priority: 'medium' })
    setShowModal(false)
    setSaving(false)
    load()
  }

  const saveEdit = async () => {
    if (!editingExam || !editForm.name || !editForm.exam_date) return
    setSaving(true)
    await fetch('/api/exams', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editingExam.id, ...editForm })
    })
    setEditingExam(null)
    setSaving(false)
    load()
  }

  const deleteExam = async (id: string) => {
    await fetch('/api/exams', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    load()
  }

  const openEdit = (exam: Exam) => {
    setEditingExam(exam)
    setEditForm({
      name: exam.name,
      exam_date: exam.exam_date,
      priority: exam.priority
    })
  }

  const sorted = [...exams].sort((a, b) => {
    const po = { high: 0, medium: 1, low: 2 }
    return po[a.priority] - po[b.priority] || new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime()
  })

  return (
    <>
      <style>{`
        .exam-card {
          background: rgba(255,255,255,0.75);
          backdrop-filter: blur(12px);
          border: 1px solid #e8e0f0;
          border-radius: 16px;
          padding: 20px 24px;
          transition: box-shadow 0.15s;
        }
        .exam-card:hover {
          box-shadow: 0 4px 24px rgba(168,85,247,0.10);
        }
        input, select {
          width: 100%;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid #e8e0f0;
          font-size: 14px;
          outline: none;
          box-sizing: border-box;
          font-family: inherit;
        }
        input:focus, select:focus {
          border-color: #a855f7;
        }
      `}</style>

      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div>
            <h1 className="text-3xl font-bold mb-1" style={{ color: '#1a1a2e' }}>My Exams</h1>
            <p className="text-sm" style={{ color: '#9ca3af' }}>Track your upcoming exams and countdowns</p>
          </div>
          <button onClick={() => setShowModal(true)} style={{
            padding: '10px 20px', borderRadius: '12px', border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #a855f7, #ec4899)',
            color: 'white', fontWeight: 700, fontSize: '14px'
          }}>
            + Add Exam
          </button>
        </div>

        {/* Exam List */}
        {loading ? (
          <p style={{ color: '#9ca3af' }}>Loading...</p>
        ) : sorted.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            background: 'rgba(255,255,255,0.75)', borderRadius: '16px',
            border: '2px dashed #e8e0f0'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
            <p style={{ color: '#1a1a2e', fontWeight: 600, marginBottom: '8px' }}>No exams added yet</p>
            <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '20px' }}>
              Add your upcoming exams to track countdowns and get tutor context
            </p>
            <button onClick={() => setShowModal(true)} style={{
              padding: '10px 20px', borderRadius: '12px', border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #a855f7, #ec4899)',
              color: 'white', fontWeight: 700, fontSize: '14px'
            }}>
              + Add Your First Exam
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sorted.map(exam => {
              const days = getDaysLeft(exam.exam_date)
              const past = days < 0
              return (
                <div key={exam.id} className="exam-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{
                        minWidth: '72px', height: '72px', borderRadius: '14px',
                        background: past ? '#f5f5f5' : priorityBg[exam.priority],
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        border: `2px solid ${past ? '#e8e0f0' : priorityColor[exam.priority]}30`
                      }}>
                        <span style={{
                          fontSize: '26px', fontWeight: 800, lineHeight: 1,
                          color: past ? '#9ca3af' : priorityColor[exam.priority]
                        }}>
                          {past ? '✓' : days}
                        </span>
                        <span style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                          {past ? 'done' : 'days'}
                        </span>
                      </div>

                      <div>
                        <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '16px', color: past ? '#9ca3af' : '#1a1a2e' }}>
                          {exam.name}
                        </p>
                        <p style={{ margin: '0 0 6px', fontSize: '13px', color: '#9ca3af' }}>
                          {new Date(exam.exam_date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                        <span style={{
                          display: 'inline-block', padding: '2px 10px', borderRadius: '20px',
                          fontSize: '11px', fontWeight: 600,
                          background: priorityColor[exam.priority] + '20',
                          color: priorityColor[exam.priority]
                        }}>
                          {exam.priority.toUpperCase()} PRIORITY
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => openEdit(exam)} style={{
                        background: 'white', border: '1px solid #e8e0f0', borderRadius: '8px',
                        padding: '6px 10px', cursor: 'pointer', color: '#9ca3af', fontSize: '13px'
                      }}>✏️</button>
                      <button onClick={() => deleteExam(exam.id)} style={{
                        background: 'white', border: '1px solid #e8e0f0', borderRadius: '8px',
                        padding: '6px 10px', cursor: 'pointer', color: '#9ca3af', fontSize: '13px'
                      }}>🗑</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Exam Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            background: 'white', borderRadius: '20px', padding: '28px',
            width: '100%', maxWidth: '420px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#1a1a2e' }}>Add Exam</h3>
              <button onClick={() => setShowModal(false)} style={{
                background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#9ca3af'
              }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1a1a2e', marginBottom: '6px' }}>Exam Name</label>
                <input type="text" placeholder="e.g. Physics A/L, Combined Maths Paper 1"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1a1a2e', marginBottom: '6px' }}>Exam Date</label>
                <input type="date" value={form.exam_date} onChange={e => setForm(f => ({ ...f, exam_date: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1a1a2e', marginBottom: '6px' }}>Priority</label>
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                  <option value="high">🔴 High — most important exam</option>
                  <option value="medium">🟡 Medium — important but manageable</option>
                  <option value="low">🟢 Low — least urgent</option>
                </select>
              </div>
              <button onClick={addExam} disabled={saving || !form.name || !form.exam_date} style={{
                width: '100%', padding: '12px', borderRadius: '12px', border: 'none',
                cursor: saving ? 'not-allowed' : 'pointer',
                background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                color: 'white', fontWeight: 700, fontSize: '14px',
                opacity: (!form.name || !form.exam_date) ? 0.6 : 1, marginTop: '4px'
              }}>
                {saving ? 'Saving...' : 'Add Exam'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Exam Modal */}
      {editingExam && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            background: 'white', borderRadius: '20px', padding: '28px',
            width: '100%', maxWidth: '420px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#1a1a2e' }}>Edit Exam</h3>
              <button onClick={() => setEditingExam(null)} style={{
                background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#9ca3af'
              }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1a1a2e', marginBottom: '6px' }}>Exam Name</label>
                <input type="text" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1a1a2e', marginBottom: '6px' }}>Exam Date</label>
                <input type="date" value={editForm.exam_date} onChange={e => setEditForm(f => ({ ...f, exam_date: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1a1a2e', marginBottom: '6px' }}>Priority</label>
                <select value={editForm.priority} onChange={e => setEditForm(f => ({ ...f, priority: e.target.value }))}>
                  <option value="high">🔴 High </option>
                  <option value="medium">🟡 Medium </option>
                  <option value="low">🟢 Low </option>
                </select>
              </div>
              <button onClick={saveEdit} disabled={saving || !editForm.name || !editForm.exam_date} style={{
                width: '100%', padding: '12px', borderRadius: '12px', border: 'none',
                cursor: saving ? 'not-allowed' : 'pointer',
                background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                color: 'white', fontWeight: 700, fontSize: '14px',
                opacity: (!editForm.name || !editForm.exam_date) ? 0.6 : 1, marginTop: '4px'
              }}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}