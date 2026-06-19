'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface Topic {
  id: string
  name: string
  order_index: number
  intelligence: number | null
}

interface Subject {
  id: string
  name: string
  color: string
}

function DonutChart({ value, color }: { value: number | null, color: string }) {
  if (value === null) return (
    <div style={{
      width: 44, height: 44, borderRadius: '50%',
      border: '3px solid #e8e0f0',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <span style={{ fontSize: '0.6rem', color: '#9ca3af' }}>–</span>
    </div>
  )
  const r = 18
  const circ = 2 * Math.PI * r
  const fill = (value / 100) * circ
  const c = value >= 70 ? '#10b981' : value >= 40 ? '#f59e0b' : '#ef4444'
  return (
    <div style={{ position: 'relative', width: 44, height: 44 }}>
      <svg width="44" height="44" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="22" cy="22" r={r} fill="none" stroke="#e8e0f0" strokeWidth="4" />
        <circle cx="22" cy="22" r={r} fill="none" stroke={c} strokeWidth="4"
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round" />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <span style={{ fontSize: '0.6rem', fontWeight: 700, color: c }}>{value}%</span>
      </div>
    </div>
  )
}

export default function SubjectPage() {
  const { subjectId } = useParams<{ subjectId: string }>()
  const router = useRouter()
  const [subject, setSubject] = useState<Subject | null>(null)
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [newTopic, setNewTopic] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => { loadData() }, [subjectId])

  async function loadData() {
    const [subRes, topRes] = await Promise.all([
      fetch('/api/subjects'),
      fetch(`/api/topics?subject_id=${subjectId}`)
    ])
    const subData = await subRes.json()
    const topData = await topRes.json()
    if (subData.subjects) {
      const found = subData.subjects.find((s: Subject) => s.id === subjectId)
      if (found) setSubject(found)
    }
    if (topData.topics) setTopics(topData.topics)
    setLoading(false)
  }

  async function addTopic() {
    if (!newTopic.trim()) return
    setAdding(true)
    const res = await fetch('/api/topics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject_id: subjectId, name: newTopic.trim(), order_index: topics.length })
    })
    const data = await res.json()
    if (data.topic) {
      setTopics(prev => [...prev, data.topic])
      setNewTopic('')
    }
    setAdding(false)
  }

  async function deleteTopic(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    await fetch('/api/topics', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    setTopics(prev => prev.filter(t => t.id !== id))
  }

  return (
    <>
      <style>{`
        .topic-row {
          background: rgba(255,255,255,0.75);
          backdrop-filter: blur(12px);
          border: 1px solid #e8e0f0;
          border-radius: 14px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: box-shadow 0.15s, border-color 0.15s;
          margin-bottom: 8px;
        }
        .topic-row:hover {
          box-shadow: 0 4px 16px rgba(0,0,0,0.06);
          border-color: #d8d0e8;
        }
        .topic-delete {
          background: none; border: none; color: #d1d5db;
          cursor: pointer; font-size: 0.75rem; padding: 4px 8px;
          border-radius: 6px; opacity: 0; transition: all 0.15s;
        }
        .topic-row:hover .topic-delete { opacity: 1; }
        .topic-delete:hover { color: #ef4444 !important; background: rgba(239,68,68,0.08); }
        .add-topic-row {
          display: flex; gap: 8px; margin-top: 8px;
        }
        .topic-input {
          flex: 1; border: 1px solid #e8e0f0; border-radius: 12px;
          padding: 12px 16px; font-size: 0.875rem; color: #1a1a2e;
          outline: none; background: rgba(255,255,255,0.8);
          transition: border-color 0.15s;
        }
        .topic-input:focus { border-color: #a855f7; }
        .topic-input::placeholder { color: #9ca3af; }
      `}</style>

      <div className="max-w-3xl mx-auto">
        {/* Back + Header */}
        <button
          onClick={() => router.push('/subjects')}
          style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '0.875rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >← Back to Subjects</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '32px' }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: `${subject?.color || '#a855f7'}18`,
            border: `2px solid ${subject?.color || '#a855f7'}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem'
          }}>📖</div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#1a1a2e' }}>{subject?.name || '...'}</h1>
            <p className="text-sm" style={{ color: '#9ca3af' }}>{topics.length} topic{topics.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Topics list */}
        {loading ? (
          <p className="text-sm animate-pulse" style={{ color: '#a855f7' }}>Loading topics...</p>
        ) : (
          <>
            {topics.length === 0 && (
              <div style={{
                background: 'rgba(255,255,255,0.7)', border: '1px dashed #e8e0f0',
                borderRadius: '16px', padding: '40px', textAlign: 'center', marginBottom: '16px'
              }}>
                <p className="text-sm" style={{ color: '#9ca3af' }}>No topics yet — add your first topic below</p>
              </div>
            )}

            {topics.map((t, i) => (
              <div key={t.id} className="topic-row" onClick={() => router.push(`/subjects/${subjectId}/${t.id}`)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                  <span style={{ fontSize: '0.8rem', color: '#9ca3af', minWidth: '20px' }}>{i + 1}</span>
                  <p className="font-medium text-sm" style={{ color: '#1a1a2e' }}>{t.name}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <DonutChart value={t.intelligence} color={subject?.color || '#a855f7'} />
                  <button className="topic-delete" onClick={e => deleteTopic(t.id, e)}>✕</button>
                </div>
              </div>
            ))}

            {/* Add topic inline */}
            <div className="add-topic-row">
              <input
                className="topic-input"
                placeholder="Add a topic — e.g. Chapter 1: Newton's Laws"
                value={newTopic}
                onChange={e => setNewTopic(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTopic()}
              />
              <button
                onClick={addTopic}
                disabled={adding || !newTopic.trim()}
                style={{
                  background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                  color: 'white', border: 'none', borderRadius: '12px',
                  padding: '12px 20px', fontSize: '0.875rem', fontWeight: 600,
                  cursor: 'pointer', opacity: !newTopic.trim() ? 0.5 : 1
                }}
              >{adding ? 'Adding...' : '+ Add'}</button>
            </div>
          </>
        )}
      </div>
    </>
  )
}