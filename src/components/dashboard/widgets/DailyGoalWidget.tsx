'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DailyGoalWidget() {
  const [goal, setGoal] = useState(60)
  const [done, setDone] = useState(0)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [inputVal, setInputVal] = useState('60')

  const load = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const savedGoal = localStorage.getItem(`lumora_daily_goal_${user.id}`)
    if (savedGoal) setGoal(parseInt(savedGoal))

    const res = await fetch('/api/study-sessions')
    const data = await res.json()
    setDone(data.minutesToday || 0)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const saveGoal = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const newGoal = parseInt(inputVal) || 60
    setGoal(newGoal)
    localStorage.setItem(`lumora_daily_goal_${user.id}`, String(newGoal))
    setEditing(false)
  }

  const pct = Math.min(Math.round((done / goal) * 100), 100)
  const completed = done >= goal

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
          <span style={{ fontSize: '18px' }}>🎯</span>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '14px', color: '#1a1a2e' }}>Daily Goal</p>
        </div>
        <button onClick={() => { setEditing(true); setInputVal(String(goal)) }}
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
      ) : editing ? (
        <div>
          <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#1a1a2e' }}>Daily study target (minutes):</p>
          <input
            type="number"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px', borderRadius: '10px',
              border: '1px solid #e8e0f0', fontSize: '14px',
              outline: 'none', marginBottom: '8px', boxSizing: 'border-box'
            }}
          />
          <button onClick={saveGoal} style={{
            width: '100%', padding: '8px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #a855f7, #ec4899)',
            color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '13px'
          }}>Save</button>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: '#1a1a2e' }}>{done} / {goal} mins today</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: completed ? '#10b981' : '#a855f7' }}>
              {completed ? '✅ Done!' : `${pct}%`}
            </span>
          </div>
          <div style={{ background: '#e8e0f0', borderRadius: '99px', height: '10px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: '99px',
              width: `${pct}%`,
              background: completed ? '#10b981' : 'linear-gradient(135deg, #a855f7, #ec4899)',
              transition: 'width 0.4s ease'
            }} />
          </div>
          {completed ? (
            <p style={{ margin: '12px 0 0', fontSize: '13px', color: '#10b981', fontWeight: 600 }}>
              🎉 Goal crushed today!
            </p>
          ) : (
            <p style={{ margin: '12px 0 0', fontSize: '13px', color: '#9ca3af' }}>
              {goal - done} mins left · complete pomodoros to track
            </p>
          )}
        </div>
      )}
    </div>
  )
}