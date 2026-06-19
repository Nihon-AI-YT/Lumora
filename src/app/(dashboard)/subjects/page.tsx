'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Subject {
  id: string
  name: string
  color: string
  created_at: string
}

const COLORS = [
  '#a855f7', '#ec4899', '#3b82f6', '#10b981',
  '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'
]

export default function SubjectsPage() {
  const router = useRouter()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#a855f7')
  const [adding, setAdding] = useState(false)

  useEffect(() => { loadSubjects() }, [])

  async function loadSubjects() {
    const res = await fetch('/api/subjects')
    const data = await res.json()
    if (data.subjects) setSubjects(data.subjects)
    setLoading(false)
  }

  async function addSubject() {
    if (!newName) return
    setAdding(true)
    const res = await fetch('/api/subjects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, color: newColor })
    })
    const data = await res.json()
    if (data.subject) {
      setSubjects(prev => [...prev, data.subject])
      setNewName('')
      setNewColor('#a855f7')
      setShowModal(false)
    }
    setAdding(false)
  }

  async function deleteSubject(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    await fetch('/api/subjects', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    setSubjects(prev => prev.filter(s => s.id !== id))
  }

  return (
    <>
      <style>{`
        .subject-card {
          background: rgba(255,255,255,0.75);
          backdrop-filter: blur(12px);
          border: 1px solid #e8e0f0;
          border-radius: 16px;
          padding: 24px;
          cursor: pointer;
          transition: box-shadow 0.15s, border-color 0.15s;
          position: relative;
        }
        .subject-card:hover {
          box-shadow: 0 4px 24px rgba(0,0,0,0.08);
          border-color: #d8d0e8;
        }
        .subject-delete {
          position: absolute;
          top: 12px; right: 12px;
          background: none; border: none;
          color: #d1d5db; cursor: pointer;
          font-size: 0.75rem; padding: 4px 8px;
          border-radius: 6px; opacity: 0;
          transition: all 0.15s;
        }
        .subject-card:hover .subject-delete { opacity: 1; }
        .subject-delete:hover { color: #ef4444 !important; background: rgba(239,68,68,0.08); }
        .modal-overlay {
          position: fixed; inset: 0; z-index: 99999;
          display: flex; align-items: center; justify-content: center;
          background: rgba(0,0,0,0.3); backdrop-filter: blur(4px);
        }
        .modal-box {
          background: white; border-radius: 20px; padding: 28px;
          width: 380px; box-shadow: 0 20px 60px rgba(0,0,0,0.15);
          border: 1px solid #e8e0f0;
        }
        .modal-input {
          width: 100%; border: 1px solid #e8e0f0; border-radius: 10px;
          padding: 10px 14px; font-size: 0.875rem; color: #1a1a2e;
          outline: none; box-sizing: border-box; transition: border-color 0.15s;
        }
        .modal-input:focus { border-color: #a855f7; }
        .color-dot {
          width: 28px; height: 28px; border-radius: 50%;
          cursor: pointer; border: 3px solid transparent;
          transition: transform 0.15s;
        }
        .color-dot:hover { transform: scale(1.15); }
      `}</style>

      <div className="max-w-4xl mx-auto">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: '#1a1a2e' }}>My Subjects</h1>
            <p className="text-sm" style={{ color: '#9ca3af' }}>Organize your studies by subject and topic</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{
              background: 'linear-gradient(135deg, #a855f7, #ec4899)',
              color: 'white', border: 'none', borderRadius: '12px',
              padding: '10px 20px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer'
            }}
          >+ Add Subject</button>
        </div>

        {loading ? (
          <p className="text-sm animate-pulse" style={{ color: '#a855f7' }}>Loading...</p>
        ) : subjects.length === 0 ? (
          <div style={{
            background: 'rgba(255,255,255,0.7)', border: '1px dashed #e8e0f0',
            borderRadius: '16px', padding: '60px', textAlign: 'center'
          }}>
            <p style={{ fontSize: '2rem', marginBottom: '12px' }}>📚</p>
            <p className="font-semibold mb-1" style={{ color: '#1a1a2e' }}>No subjects yet</p>
            <p className="text-sm mb-4" style={{ color: '#9ca3af' }}>Add your first subject to start organizing your studies</p>
            <button
              onClick={() => setShowModal(true)}
              style={{
                background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                color: 'white', border: 'none', borderRadius: '10px',
                padding: '10px 20px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer'
              }}
            >+ Add Subject</button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {subjects.map(s => (
              <div key={s.id} className="subject-card" onClick={() => router.push(`/subjects/${s.id}`)}>
                <button className="subject-delete" onClick={e => deleteSubject(s.id, e)}>✕</button>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: `${s.color}18`, border: `2px solid ${s.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.4rem', marginBottom: 14
                }}>📖</div>
                <p className="font-bold mb-1" style={{ color: '#1a1a2e' }}>{s.name}</p>
                <div style={{ width: 32, height: 4, borderRadius: 4, background: s.color, marginTop: 8 }} />
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onMouseDown={() => setShowModal(false)}>
          <div className="modal-box" onMouseDown={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1a1a2e', margin: 0 }}>Add Subject</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '1.1rem' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input
                className="modal-input"
                placeholder="Subject name — e.g. Physics, Python"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSubject()}
                autoFocus
              />
              <div>
                <p style={{ fontSize: '0.72rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>Color</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {COLORS.map(c => (
                    <div
                      key={c}
                      className="color-dot"
                      onClick={() => setNewColor(c)}
                      style={{
                        background: c,
                        borderColor: newColor === c ? c : 'transparent',
                        boxShadow: newColor === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : 'none'
                      }}
                    />
                  ))}
                </div>
              </div>
              <button
                onClick={addSubject}
                disabled={adding || !newName}
                style={{
                  width: '100%', padding: '11px',
                  background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                  color: 'white', border: 'none', borderRadius: '10px',
                  fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
                  opacity: !newName ? 0.5 : 1, marginTop: '4px'
                }}
              >{adding ? 'Adding...' : 'Add Subject'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}