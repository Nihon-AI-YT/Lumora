'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Subject {
  id: string
  name: string
  color: string
}

export default function PinnedSubjectWidget() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [pinned, setPinned] = useState<Subject | null>(null)
  const [loading, setLoading] = useState(true)
  const [picking, setPicking] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data } = await supabase
        .from('subjects')
        .select('id, name, color')
        .eq('user_id', user.id)

      setSubjects(data || [])

      const savedId = localStorage.getItem(`lumora_pinned_subject_${user.id}`)
      if (savedId && data) {
        const found = data.find(s => s.id === savedId)
        if (found) setPinned(found)
      }
      setLoading(false)
    }
    load()
  }, [])

  const pin = async (subject: Subject) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    localStorage.setItem(`lumora_pinned_subject_${user.id}`, subject.id)
    setPinned(subject)
    setPicking(false)
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.75)',
      backdropFilter: 'blur(12px)',
      borderRadius: '16px',
      padding: '20px',
      height: '100%',
      minHeight: '200px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      border: '1px solid #e8e0f0',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>📌</span>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '14px', color: '#1a1a2e' }}>Pinned Subject</p>
        </div>
        <button onClick={() => setPicking(true)}
          style={{
            background: 'white', border: '1px solid #e8e0f0', cursor: 'pointer',
            fontSize: '13px', padding: '4px 8px', borderRadius: '8px',
            color: '#9ca3af', lineHeight: 1, transition: 'border-color 0.15s'
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = '#a855f7')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = '#e8e0f0')}
        >✏️</button>
      </div>

      {loading ? (
        <p style={{ color: '#9ca3af', fontSize: '13px' }}>Loading...</p>
      ) : picking ? (
        <div>
          <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#1a1a2e' }}>Pick a subject:</p>
          {subjects.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: '13px' }}>No subjects yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {subjects.map(s => (
                <button key={s.id} onClick={() => pin(s)} style={{
                  padding: '8px 12px', borderRadius: '10px', border: '1px solid #e8e0f0',
                  background: 'white', cursor: 'pointer', textAlign: 'left',
                  fontSize: '13px', fontWeight: 600, color: '#1a1a2e',
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                  <span style={{
                    width: '10px', height: '10px', borderRadius: '50%',
                    background: s.color || '#a855f7', flexShrink: 0
                  }} />
                  {s.name}
                </button>
              ))}
            </div>
          )}
          <button onClick={() => setPicking(false)} style={{
            marginTop: '8px', background: 'none', border: 'none',
            cursor: 'pointer', fontSize: '12px', color: '#9ca3af'
          }}>Cancel</button>
        </div>
      ) : !pinned ? (
        <div>
          <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '12px' }}>
            Pin a favourite subject for quick access.
          </p>
          <button onClick={() => setPicking(true)} style={{
            padding: '8px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #a855f7, #ec4899)',
            color: 'white', fontSize: '13px', fontWeight: 600
          }}>
            Pick Subject
          </button>
        </div>
      ) : (
        <div>
          <div style={{
            padding: '16px', borderRadius: '12px', marginBottom: '12px',
            background: (pinned.color || '#a855f7') + '15',
            border: `1px solid ${pinned.color || '#a855f7'}40`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{
                width: '12px', height: '12px', borderRadius: '50%',
                background: pinned.color || '#a855f7'
              }} />
              <p style={{ margin: 0, fontWeight: 700, fontSize: '16px', color: '#1a1a2e' }}>{pinned.name}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => router.push(`/subjects`)} style={{
              flex: 1, padding: '8px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #a855f7, #ec4899)',
              color: 'white', fontSize: '12px', fontWeight: 600
            }}>
              📚 Open
            </button>
            <button onClick={() => router.push(`/tutor?subject=${encodeURIComponent(pinned.name)}`)} style={{
              flex: 1, padding: '8px', borderRadius: '10px',
              border: '1px solid #e8e0f0', background: 'white',
              cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#1a1a2e'
            }}>
              🤖 Tutor
            </button>
          </div>
        </div>
      )}
    </div>
  )
}