'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface SubjectStat {
  name: string
  color: string
  score: number
  total: number
}

export default function SubjectProgressWidget() {
  const [subjects, setSubjects] = useState<SubjectStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: subjectData } = await supabase
        .from('subjects')
        .select('name, color')
        .eq('user_id', user.id)

      const { data: attempts } = await supabase
        .from('mcq_attempts')
        .select('subject, score, total')
        .eq('user_id', user.id)

      if (!subjectData) { setLoading(false); return }

      const stats: SubjectStat[] = subjectData.map(s => {
        const related = (attempts || []).filter(a =>
          a.subject?.toLowerCase().includes(s.name.toLowerCase())
        )
        const score = related.reduce((sum, a) => sum + (a.score || 0), 0)
        const total = related.reduce((sum, a) => sum + (a.total || 0), 0)
        return { name: s.name, color: s.color || '#a855f7', score, total }
      })

      setSubjects(stats)
      setLoading(false)
    }
    load()
  }, [])

  const getPct = (s: SubjectStat) => s.total > 0 ? Math.round((s.score / s.total) * 100) : 0
  const getColor = (pct: number) => pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : pct > 0 ? '#ef4444' : '#e8e0f0'

  const r = 18
  const circ = 2 * Math.PI * r

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
      border: '1px solid #e8e0f0',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <span style={{ fontSize: '18px' }}>📊</span>
        <p style={{ margin: 0, fontWeight: 700, fontSize: '14px', color: '#1a1a2e' }}>Subject Progress</p>
      </div>

      {loading ? (
        <p style={{ color: '#9ca3af', fontSize: '13px' }}>Loading...</p>
      ) : subjects.length === 0 ? (
        <p style={{ color: '#9ca3af', fontSize: '13px' }}>No subjects yet. Add some in My Subjects!</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {subjects.slice(0, 4).map(s => {
            const pct = getPct(s)
            const color = getColor(pct)
            const fill = (pct / 100) * circ
            return (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <svg width="44" height="44" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
                  <circle cx="22" cy="22" r={r} fill="none" stroke="#e8e0f0" strokeWidth="4" />
                  <circle cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="4"
                    strokeDasharray={`${fill} ${circ}`} strokeLinecap="round" />
                </svg>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#1a1a2e',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {s.name}
                  </p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
                    {s.total > 0 ? `${pct}% · ${s.score}/${s.total} correct` : 'No attempts yet'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}