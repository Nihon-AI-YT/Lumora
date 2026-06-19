'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface Note {
  id: string
  type: 'ai' | 'manual'
  content: string
  created_at: string
}

interface Topic {
  id: string
  name: string
  intelligence: number | null
}

interface Subject {
  id: string
  name: string
  color: string
}

function DonutChart({ value }: { value: number | null }) {
  if (value === null) return (
    <div style={{
      width: 56, height: 56, borderRadius: '50%',
      border: '4px solid #e8e0f0',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>No data</span>
    </div>
  )
  const r = 22
  const circ = 2 * Math.PI * r
  const fill = (value / 100) * circ
  const c = value >= 70 ? '#10b981' : value >= 40 ? '#f59e0b' : '#ef4444'
  return (
    <div style={{ position: 'relative', width: 56, height: 56 }}>
      <svg width="56" height="56" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="28" cy="28" r={r} fill="none" stroke="#e8e0f0" strokeWidth="5" />
        <circle cx="28" cy="28" r={r} fill="none" stroke={c} strokeWidth="5"
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round" />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: c }}>{value}%</span>
      </div>
    </div>
  )
}

export default function TopicPage() {
  const { subjectId, topicId } = useParams<{ subjectId: string; topicId: string }>()
  const router = useRouter()
  const [subject, setSubject] = useState<Subject | null>(null)
  const [topic, setTopic] = useState<Topic | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai')
  const [newNote, setNewNote] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadData() }, [topicId])

  async function loadData() {
    const [subRes, topRes, noteRes] = await Promise.all([
      fetch('/api/subjects'),
      fetch(`/api/topics?subject_id=${subjectId}`),
      fetch(`/api/notes?topic_id=${topicId}`)
    ])
    const subData = await subRes.json()
    const topData = await topRes.json()
    const noteData = await noteRes.json()

    if (subData.subjects) {
      const found = subData.subjects.find((s: Subject) => s.id === subjectId)
      if (found) setSubject(found)
    }
    if (topData.topics) {
      const found = topData.topics.find((t: Topic) => t.id === topicId)
      if (found) setTopic(found)
    }
    if (noteData.notes) setNotes(noteData.notes)
    setLoading(false)
  }

  async function saveManualNote() {
    if (!newNote.trim()) return
    setSaving(true)
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic_id: topicId, type: 'manual', content: newNote.trim() })
    })
    const data = await res.json()
    if (data.note) {
      setNotes(prev => [data.note, ...prev])
      setNewNote('')
    }
    setSaving(false)
  }

  async function deleteNote(id: string) {
    await fetch('/api/notes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  const aiNotes = notes.filter(n => n.type === 'ai')
  const manualNotes = notes.filter(n => n.type === 'manual')

  const formatDate = (str: string) => new Date(str).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  return (
    <>
      <style>{`
        .tab-btn {
          padding: 7px 18px; border-radius: 20px;
          border: 1px solid #e8e0f0;
          background: rgba(255,255,255,0.6);
          color: #6b7280; font-size: 0.8rem; font-weight: 600;
          cursor: pointer; transition: all 0.15s;
        }
        .tab-btn.active {
          background: linear-gradient(135deg, #a855f7, #ec4899);
          color: white; border-color: transparent;
        }
        .note-card {
          background: rgba(255,255,255,0.75);
          backdrop-filter: blur(12px);
          border: 1px solid #e8e0f0;
          border-radius: 14px;
          padding: 16px 20px;
          margin-bottom: 10px;
          position: relative;
        }
        .note-delete {
          position: absolute; top: 10px; right: 10px;
          background: none; border: none; color: #d1d5db;
          cursor: pointer; font-size: 0.75rem; padding: 4px 8px;
          border-radius: 6px; opacity: 0; transition: all 0.15s;
        }
        .note-card:hover .note-delete { opacity: 1; }
        .note-delete:hover { color: #ef4444 !important; }
        .note-textarea {
          width: 100%; border: 1px solid #e8e0f0; border-radius: 12px;
          padding: 14px 16px; font-size: 0.875rem; color: #1a1a2e;
          outline: none; resize: vertical; min-height: 100px;
          background: rgba(255,255,255,0.8); box-sizing: border-box;
          font-family: inherit; transition: border-color 0.15s; line-height: 1.6;
        }
        .note-textarea:focus { border-color: #a855f7; }
        .note-textarea::placeholder { color: #9ca3af; }
        .action-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 16px; border-radius: 12px;
          border: 1px solid #e8e0f0;
          background: rgba(255,255,255,0.7);
          color: #6b7280; font-size: 0.8rem; font-weight: 600;
          cursor: pointer; transition: all 0.15s; text-decoration: none;
        }
        .action-btn:hover { border-color: #a855f7; color: #9333ea; background: rgba(168,85,247,0.05); }
      `}</style>

      <div className="max-w-3xl mx-auto">
        {/* Back */}
        <button
          onClick={() => router.push(`/subjects/${subjectId}`)}
          style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '0.875rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >← Back to {subject?.name || 'Subject'}</button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <DonutChart value={topic?.intelligence ?? null} />
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#1a1a2e' }}>{topic?.name || '...'}</h1>
              <p className="text-sm" style={{ color: '#9ca3af' }}>
                {topic?.intelligence !== null && topic?.intelligence !== undefined
                  ? topic.intelligence >= 70 ? '🟢 Strong understanding'
                  : topic.intelligence >= 40 ? '🟡 Needs practice'
                  : '🔴 Weak — focus here'
                  : 'No practice data yet'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', flexWrap: 'wrap' }}>
          <button className="action-btn" onClick={() => router.push(`/tutor?topic=${encodeURIComponent(topic?.name || '')}`)}>
            ✦ Study with Tutor
          </button>
          <button className="action-btn" onClick={() => router.push(`/mcq?topic=${encodeURIComponent(topic?.name || '')}&auto=true`)}>
            ◈ Practice MCQ
          </button>
          <button className="action-btn" onClick={() => router.push(`/flashcards?topic=${encodeURIComponent(topic?.name || '')}&auto=true`)}>
            ▦ Flashcards
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <button className={`tab-btn ${activeTab === 'ai' ? 'active' : ''}`} onClick={() => setActiveTab('ai')}>
            ✦ AI Notes {aiNotes.length > 0 && `(${aiNotes.length})`}
          </button>
          <button className={`tab-btn ${activeTab === 'manual' ? 'active' : ''}`} onClick={() => setActiveTab('manual')}>
            ✏️ My Notes {manualNotes.length > 0 && `(${manualNotes.length})`}
          </button>
        </div>

        {loading ? (
          <p className="text-sm animate-pulse" style={{ color: '#a855f7' }}>Loading notes...</p>
        ) : (
          <>
            {activeTab === 'ai' && (
              <div>
                {aiNotes.length === 0 ? (
                  <div style={{
                    background: 'rgba(255,255,255,0.7)', border: '1px dashed #e8e0f0',
                    borderRadius: '16px', padding: '40px', textAlign: 'center'
                  }}>
                    <p style={{ fontSize: '1.5rem', marginBottom: '8px' }}>✦</p>
                    <p className="font-semibold mb-1" style={{ color: '#1a1a2e' }}>No AI notes yet</p>
                    <p className="text-sm" style={{ color: '#9ca3af' }}>Save tutor explanations to this topic from the AI Tutor chat</p>
                  </div>
                ) : (
                  aiNotes.map(n => (
                    <div key={n.id} className="note-card">
                      <button className="note-delete" onClick={() => deleteNote(n.id)}>✕</button>
                      <p style={{ fontSize: '0.7rem', color: '#a855f7', fontWeight: 600, marginBottom: '8px' }}>✦ AI Note · {formatDate(n.created_at)}</p>
                      <p style={{ fontSize: '0.875rem', color: '#1a1a2e', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{n.content}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'manual' && (
              <div>
                <div style={{ marginBottom: '16px' }}>
                  <textarea
                    className="note-textarea"
                    placeholder="Write your own notes here..."
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                  />
                  <button
                    onClick={saveManualNote}
                    disabled={saving || !newNote.trim()}
                    style={{
                      marginTop: '8px', padding: '10px 20px',
                      background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                      color: 'white', border: 'none', borderRadius: '10px',
                      fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
                      opacity: !newNote.trim() ? 0.5 : 1
                    }}
                  >{saving ? 'Saving...' : 'Save Note'}</button>
                </div>

                {manualNotes.length === 0 ? (
                  <div style={{
                    background: 'rgba(255,255,255,0.7)', border: '1px dashed #e8e0f0',
                    borderRadius: '16px', padding: '32px', textAlign: 'center'
                  }}>
                    <p className="text-sm" style={{ color: '#9ca3af' }}>No manual notes yet — write something above</p>
                  </div>
                ) : (
                  manualNotes.map(n => (
                    <div key={n.id} className="note-card">
                      <button className="note-delete" onClick={() => deleteNote(n.id)}>✕</button>
                      <p style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 600, marginBottom: '8px' }}>✏️ My Note · {formatDate(n.created_at)}</p>
                      <p style={{ fontSize: '0.875rem', color: '#1a1a2e', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{n.content}</p>
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