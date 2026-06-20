'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface WeakTopic {
  topic: string
  subject: string
  score: number
  total: number
  created_at: string
}

export default function WeakTopicWidget() {
  const [weak, setWeak] = useState<WeakTopic | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data } = await supabase
        .from('mcq_attempts')
        .select('topic, subject, score, total, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (!data || data.length === 0) { setLoading(false); return }

      // Group by topic, find worst performing
      const topicMap: Record<string, { score: number; total: number; subject: string; created_at: string }> = {}
      for (const a of data) {
        if (!topicMap[a.topic]) {
          topicMap[a.topic] = { score: 0, total: 0, subject: a.subject, created_at: a.created_at }
        }
        topicMap[a.topic].score += a.score
        topicMap[a.topic].total += a.total
      }

      let worst: WeakTopic | null = null
      let worstPct = 100
      for (const [topic, val] of Object.entries(topicMap)) {
        const pct = val.total > 0 ? (val.score / val.total) * 100 : 0
        if (pct < worstPct) {
          worstPct = pct
          worst = { topic, subject: val.subject, score: val.score, total: val.total, created_at: val.created_at }
        }
      }

      setWeak(worst)
      setLoading(false)
    }
    load()
  }, [])

  const pct = weak && weak.total > 0 ? Math.round((weak.score / weak.total) * 100) : 0

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span style={{ fontSize: '18px' }}>🎯</span>
        <p style={{ margin: 0, fontWeight: 700, fontSize: '14px', color: '#1a1a2e' }}>Weak Topic Alert</p>
      </div>

      {loading ? (
        <p style={{ color: '#9ca3af', fontSize: '13px' }}>Loading...</p>
      ) : !weak ? (
        <p style={{ color: '#9ca3af', fontSize: '13px' }}>No MCQ data yet. Start practicing!</p>
      ) : (
        <div>
          <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#9ca3af' }}>{weak.subject}</p>
          <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: '16px', color: '#1a1a2e' }}>{weak.topic}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              background: `conic-gradient(#ef4444 ${pct * 3.6}deg, #e8e0f0 0deg)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '50%',
                background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: 700, color: '#ef4444'
              }}>
                {pct}%
              </div>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '13px', color: '#1a1a2e' }}>{weak.score}/{weak.total} correct</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>needs practice</p>
            </div>
          </div>
          <a href={`/mcq?topic=${encodeURIComponent(weak.topic)}&subject=${encodeURIComponent(weak.subject)}&mode=drill`}
            style={{
              display: 'inline-block', marginTop: '12px',
              padding: '7px 14px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #a855f7, #ec4899)',
              color: 'white', fontSize: '12px', fontWeight: 600,
              textDecoration: 'none'
            }}>
            💪 Practice Now
          </a>
        </div>
      )}
    </div>
  )
}