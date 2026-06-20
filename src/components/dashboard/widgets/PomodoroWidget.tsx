'use client'

import { useEffect, useState, useRef } from 'react'

const PRESETS = [
  {
    label: '25 / 5',
    work: 25,
    break: 5,
    tag: '⭐ Most Popular',
    tagColor: '#a855f7',
    reason: 'Low barrier to entry. Short clock forces urgency and beats procrastination.',
  },
  {
    label: '50 / 10',
    work: 50,
    break: 10,
    tag: '🔥 Flow State',
    tagColor: '#f59e0b',
    reason: 'Protects deep focus. Better for professionals who need to get "in the zone."',
  },
]

export default function PomodoroWidget() {
  const [workMins, setWorkMins] = useState(25)
  const [breakMins, setBreakMins] = useState(5)
  const [mode, setMode] = useState<'work' | 'break'>('work')
  const [secondsLeft, setSecondsLeft] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [sessions, setSessions] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [customWork, setCustomWork] = useState('')
  const [customBreak, setCustomBreak] = useState('')
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!running) setSecondsLeft(workMins * 60)
  }, [workMins])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!)
            setRunning(false)
            if (mode === 'work') {
              fetch('/api/study-sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ minutes: workMins, session_type: 'pomodoro' })
              })
              setSessions(s => s + 1)
              setMode('break')
              setSecondsLeft(breakMins * 60)
            } else {
              setMode('work')
              setSecondsLeft(workMins * 60)
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, mode, workMins, breakMins])

  const applyPreset = (w: number, b: number) => {
    setRunning(false)
    setMode('work')
    setWorkMins(w)
    setBreakMins(b)
    setSecondsLeft(w * 60)
    setShowSettings(false)
  }

  const applyCustom = () => {
    const w = Math.max(1, parseInt(customWork) || 25)
    const b = Math.max(1, parseInt(customBreak) || 5)
    applyPreset(w, b)
  }

  const reset = () => {
    setRunning(false)
    setMode('work')
    setSecondsLeft(workMins * 60)
  }

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const secs = String(secondsLeft % 60).padStart(2, '0')
  const total = mode === 'work' ? workMins * 60 : breakMins * 60
  const pct = total > 0 ? ((total - secondsLeft) / total) * 100 : 0
  const r = 36
  const circ = 2 * Math.PI * r
  const fill = (pct / 100) * circ

  return (
    <>
      <div style={{
        background: 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(12px)',
        borderRadius: '16px',
        padding: '20px',
        height: '100%',
        minHeight: '200px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        border: '1px solid #e8e0f0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', marginBottom: '8px' }}>
          <span style={{ fontSize: '18px' }}>⏱️</span>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '14px', color: '#1a1a2e' }}>Pomodoro</p>
          <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#9ca3af' }}>🍅 x{sessions}</span>
          <button onClick={() => setShowSettings(true)} style={{
            background: 'white', border: '1px solid #e8e0f0', cursor: 'pointer',
            fontSize: '13px', padding: '4px 8px', borderRadius: '8px',
            color: '#9ca3af', lineHeight: 1, transition: 'border-color 0.15s'
          }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#a855f7')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#e8e0f0')}
          >✏️</button>
        </div>

        <div style={{ position: 'relative', width: '90px', height: '90px' }}>
          <svg width="90" height="90" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="45" cy="45" r={r} fill="none" stroke="#e8e0f0" strokeWidth="6" />
            <circle cx="45" cy="45" r={r} fill="none"
              stroke={mode === 'work' ? '#a855f7' : '#10b981'}
              strokeWidth="6"
              strokeDasharray={`${fill} ${circ}`}
              strokeLinecap="round" />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center'
          }}>
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#1a1a2e', lineHeight: 1 }}>
              {mins}:{secs}
            </span>
            <span style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>
              {mode === 'work' ? 'FOCUS' : 'BREAK'}
            </span>
          </div>
        </div>

        <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#9ca3af' }}>
          {workMins}min focus · {breakMins}min break
        </p>

        <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
          <button onClick={() => setRunning(r => !r)} style={{
            flex: 1, padding: '8px', borderRadius: '10px', border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #a855f7, #ec4899)',
            color: 'white', fontWeight: 700, fontSize: '13px'
          }}>
            {running ? '⏸ Pause' : '▶ Start'}
          </button>
          <button onClick={reset} style={{
            padding: '8px 12px', borderRadius: '10px', border: '1px solid #e8e0f0',
            background: 'white', cursor: 'pointer', fontSize: '13px', color: '#9ca3af'
          }}>↺</button>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            background: 'white', borderRadius: '20px', padding: '28px',
            width: '100%', maxWidth: '420px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#1a1a2e' }}>⏱️ Timer Settings</h3>
              <button onClick={() => setShowSettings(false)} style={{
                background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#9ca3af'
              }}>✕</button>
            </div>

            {/* Presets */}
            <p style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Recommended Presets
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {PRESETS.map(p => (
                <div key={p.label} onClick={() => applyPreset(p.work, p.break)} style={{
                  padding: '14px 16px', borderRadius: '12px', cursor: 'pointer',
                  border: `2px solid ${workMins === p.work && breakMins === p.break ? '#a855f7' : '#e8e0f0'}`,
                  background: workMins === p.work && breakMins === p.break ? '#f9f0ff' : 'white',
                  transition: 'all 0.15s'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 800, fontSize: '16px', color: '#1a1a2e' }}>{p.label}</span>
                    <span style={{
                      fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px',
                      background: p.tagColor + '20', color: p.tagColor
                    }}>{p.tag}</span>
                    <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#9ca3af' }}>
                      {p.work}min / {p.break}min
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af', lineHeight: 1.4 }}>{p.reason}</p>
                </div>
              ))}
            </div>

            {/* Custom */}
            <p style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Custom Timer
            </p>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Focus (mins)</label>
                <input
                  type="number"
                  placeholder="e.g. 45"
                  value={customWork}
                  onChange={e => setCustomWork(e.target.value)}
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: '10px',
                    border: '1px solid #e8e0f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Break (mins)</label>
                <input
                  type="number"
                  placeholder="e.g. 10"
                  value={customBreak}
                  onChange={e => setCustomBreak(e.target.value)}
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: '10px',
                    border: '1px solid #e8e0f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
            <button onClick={applyCustom} style={{
              width: '100%', padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #a855f7, #ec4899)',
              color: 'white', fontWeight: 700, fontSize: '14px'
            }}>
              Apply Custom Timer
            </button>
          </div>
        </div>
      )}
    </>
  )
}