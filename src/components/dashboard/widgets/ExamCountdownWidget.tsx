'use client'

import { useEffect, useState } from 'react'

interface Exam {
  id: string
  name: string
  exam_date: string
  priority: 'high' | 'medium' | 'low'
}

export default function ExamCountdownWidget() {
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/exams')
      .then(r => r.json())
      .then(data => { setExams(data.exams || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const getDaysLeft = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - new Date().getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const priorityColor: Record<string, string> = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' }

  const nearest = exams
    .filter(e => getDaysLeft(e.exam_date) >= 0)
    .sort((a, b) => {
      const po: Record<string, number> = { high: 0, medium: 1, low: 2 }
      return po[a.priority] - po[b.priority] || getDaysLeft(a.exam_date) - getDaysLeft(b.exam_date)
    })[0]

  const priority = nearest?.priority || 'medium'
  const color = priorityColor[priority]

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
        <span style={{ fontSize: '18px' }}>📅</span>
        <p style={{ margin: 0, fontWeight: 700, fontSize: '14px', color: '#1a1a2e' }}>Exam Countdown</p>
      </div>

      {loading ? (
        <p style={{ color: '#9ca3af', fontSize: '13px' }}>Loading...</p>
      ) : !nearest ? (
        <p style={{ color: '#9ca3af', fontSize: '13px' }}>No upcoming exams. Add one!</p>
      ) : (
        <div>
          <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#9ca3af' }}>Next up</p>
          <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: '16px', color: '#1a1a2e' }}>{nearest.name}</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '48px', fontWeight: 800, color, lineHeight: 1 }}>
              {getDaysLeft(nearest.exam_date)}
            </span>
            <span style={{ fontSize: '14px', color: '#9ca3af' }}>days left</span>
          </div>
          <div style={{
            display: 'inline-block',
            marginTop: '10px',
            padding: '3px 10px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 600,
            background: color + '20',
            color,
          }}>
            {priority.toUpperCase()} PRIORITY
          </div>
        </div>
      )}
    </div>
  )
}