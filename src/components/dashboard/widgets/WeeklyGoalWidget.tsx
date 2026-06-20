'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function WeeklyGoalWidget() {
  const [goal, setGoal] = useState(300)
  const [done, setDone] = useState(0)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [inputVal, setInputVal] = useState('300')

  const load = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const savedGoal = localStorage.getItem(`lumora_weekly_goal_${user.id}`)
    if (savedGoal) setGoal(parseInt(savedGoal))

    const res = await fetch('/api/study-sessions')
    const data = await res.json()
    setDone(data.minutesWeek || 0)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const saveGoal = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const newGoal = parseInt(inputVal) || 300
    setGoal(newGoal)
    localStorage.setItem(`lumora_weekly_goal_${user.id}`, String(newGoal))
    setEditing(false)
  }

  const pct = Math.min(Math.round((done / goal) * 100), 100)
  const completed = done >= goal

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1

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
          <span style={{ fontSize: '18px' }}>📅</span>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '14px', color: '#1a1a2e' }}>Weekly Goal</p>
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
          <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#1a1a2e' }}>Weekly study target (minutes):</p>
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
            <span style={{ fontSize: '13px', color: '#1a1a2e' }}>{done} / {goal} mins this week</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: completed ? '#10b981' : '#a855f7' }}>
              {completed ? '✅' : `${pct}%`}
            </span>
          </div>
          <div style={{ background: '#e8e0f0', borderRadius: '99px', height: '10px', overflow: 'hidden', marginBottom: '14px' }}>
            <div style={{
              height: '100%', borderRadius: '99px', width: `${pct}%`,
              background: completed ? '#10b981' : 'linear-gradient(135deg, #a855f7, #ec4899)',
              transition: 'width 0.4s ease'
            }} />
          </div>
          <div style={{ display: 'flex', gap: '4px', justifyContent: 'space-between' }}>
            {days.map((d, i) => (
              <div key={d} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '8px',
                  background: i < todayIndex ? 'linear-gradient(135deg, #a855f7, #ec4899)'
                    : i === todayIndex ? '#f3e8ff'
                    : '#f5f5f5',
                  border: i === todayIndex ? '2px solid #a855f7' : '2px solid transparent',
                }} />
                <span style={{ fontSize: '10px', color: i === todayIndex ? '#a855f7' : '#9ca3af', fontWeight: i === todayIndex ? 700 : 400 }}>
                  {d}
                </span>
              </div>
            ))}
          </div>
          {completed ? (
            <p style={{ margin: '12px 0 0', fontSize: '13px', color: '#10b981', fontWeight: 600 }}>
              🎉 Weekly goal smashed!
            </p>
          ) : (
            <p style={{ margin: '10px 0 0', fontSize: '13px', color: '#9ca3af' }}>
              {goal - done} mins left this week
            </p>
          )}
        </div>
      )}
    </div>
  )
}