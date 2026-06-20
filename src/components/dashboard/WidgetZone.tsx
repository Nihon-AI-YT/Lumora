'use client'

import { useEffect, useState } from 'react'
import ExamCountdownWidget from './widgets/ExamCountdownWidget'
import WeakTopicWidget from './widgets/WeakTopicWidget'
import DailyGoalWidget from './widgets/DailyGoalWidget'
import PomodoroWidget from './widgets/PomodoroWidget'
import MotivationalQuoteWidget from './widgets/MotivationalQuoteWidget'
import SubjectProgressWidget from './widgets/SubjectProgressWidget'
import WeeklyGoalWidget from './widgets/WeeklyGoalWidget'
import PinnedSubjectWidget from './widgets/PinnedSubjectWidget'
import StreakWidget from './widgets/StreakWidget'

const ALL_WIDGETS = [
  { id: 'streak', label: '🔥 Streak & Motivation', description: 'Your study streak and daily quote' },
  { id: 'exam_countdown', label: '📅 Exam Countdown', description: 'Days left until your next exam' },
  { id: 'weak_topic', label: '🎯 Weak Topic Alert', description: 'Topic that needs the most practice' },
  { id: 'subject_progress', label: '📊 Subject Progress', description: 'Donut charts per subject' },
  { id: 'daily_goal', label: '🎯 Daily Goal', description: 'Track your daily MCQ target' },
  { id: 'weekly_goal', label: '📅 Weekly Goal', description: 'Track your weekly MCQ target' },
  { id: 'pomodoro', label: '⏱️ Pomodoro Timer', description: '25/5 focus and break timer' },
  { id: 'motivational_quote', label: '💬 Daily Quote', description: 'Rotating motivational quotes' },
  { id: 'pinned_subject', label: '📌 Pinned Subject', description: 'Quick access to your favourite subject' },
]

function renderWidget(id: string, streakCount: number, userName: string) {
  switch (id) {
    case 'streak': return <StreakWidget streakCount={streakCount} userName={userName} />
    case 'exam_countdown': return <ExamCountdownWidget />
    case 'weak_topic': return <WeakTopicWidget />
    case 'subject_progress': return <SubjectProgressWidget />
    case 'daily_goal': return <DailyGoalWidget />
    case 'weekly_goal': return <WeeklyGoalWidget />
    case 'pomodoro': return <PomodoroWidget />
    case 'motivational_quote': return <MotivationalQuoteWidget />
    case 'pinned_subject': return <PinnedSubjectWidget />
    default: return null
  }
}

interface WidgetZoneProps {
  streakCount: number
  userName: string
}

export default function WidgetZone({ streakCount, userName }: WidgetZoneProps) {
const [activeWidgets, setActiveWidgets] = useState<string[]>(['streak', 'exam_countdown', 'weak_topic', 'pomodoro'])
  const [showPicker, setShowPicker] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(data => { if (data.widgets) setActiveWidgets(data.widgets) })
  }, [])

  const saveWidgets = async (widgets: string[]) => {
    setSaving(true)
    await fetch('/api/dashboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ widgets })
    })
    setSaving(false)
  }

  const toggleWidget = (id: string) => {
    setActiveWidgets(prev => {
      const updated = prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]
      saveWidgets(updated)
      return updated
    })
  }

  const handleDragStart = (index: number) => setDragIndex(index)
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOver(index)
  }
  const handleDrop = (index: number) => {
    if (dragIndex === null || dragIndex === index) return
    const updated = [...activeWidgets]
    const [moved] = updated.splice(dragIndex, 1)
    updated.splice(index, 0, moved)
    setActiveWidgets(updated)
    saveWidgets(updated)
    setDragIndex(null)
    setDragOver(null)
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <p style={{ margin: 0, fontSize: '14px', color: '#9ca3af' }}>
          {activeWidgets.length} widget{activeWidgets.length !== 1 ? 's' : ''} active · drag to reorder
        </p>
        <button onClick={() => setShowPicker(true)} style={{
          padding: '8px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg, #a855f7, #ec4899)',
          color: 'white', fontSize: '13px', fontWeight: 600
        }}>
          ⚙️ Customize
        </button>
      </div>

      {/* Widget Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: '16px',
      }}>
        {activeWidgets.map((id, index) => (
          <div
            key={id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={e => handleDragOver(e, index)}
            onDrop={() => handleDrop(index)}
            onDragEnd={() => { setDragIndex(null); setDragOver(null) }}
            style={{
              cursor: 'grab',
              opacity: dragIndex === index ? 0.4 : 1,
              outline: dragOver === index ? '2px dashed #a855f7' : 'none',
              borderRadius: '16px',
              transition: 'opacity 0.2s',
            }}
          >
            {renderWidget(id, streakCount, userName)}
          </div>
        ))}
      </div>

      {activeWidgets.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '40px',
          background: 'rgba(255,255,255,0.75)', borderRadius: '16px',
          border: '2px dashed #e8e0f0'
        }}>
          <p style={{ color: '#9ca3af', margin: '0 0 12px' }}>No widgets active. Add some!</p>
          <button onClick={() => setShowPicker(true)} style={{
            padding: '8px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #a855f7, #ec4899)',
            color: 'white', fontSize: '13px', fontWeight: 600
          }}>
            ⚙️ Customize Dashboard
          </button>
        </div>
      )}

      {/* Widget Picker Modal */}
      {showPicker && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'white', borderRadius: '20px', padding: '28px',
            width: '100%', maxWidth: '480px', maxHeight: '80vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#1a1a2e' }}>Customize Dashboard</h3>
              <button onClick={() => setShowPicker(false)} style={{
                background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#9ca3af'
              }}>✕</button>
            </div>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#9ca3af' }}>
              Toggle widgets on/off. Drag them on the dashboard to reorder.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {ALL_WIDGETS.map(w => {
                const active = activeWidgets.includes(w.id)
                return (
                  <div key={w.id} onClick={() => toggleWidget(w.id)} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 16px', borderRadius: '12px', cursor: 'pointer',
                    border: `2px solid ${active ? '#a855f7' : '#e8e0f0'}`,
                    background: active ? '#f9f0ff' : 'white',
                    transition: 'all 0.15s'
                  }}>
                    <div>
                      <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: '14px', color: '#1a1a2e' }}>{w.label}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>{w.description}</p>
                    </div>
                    <div style={{
                      width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                      background: active ? 'linear-gradient(135deg, #a855f7, #ec4899)' : '#e8e0f0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {active && <span style={{ color: 'white', fontSize: '11px', fontWeight: 700 }}>✓</span>}
                    </div>
                  </div>
                )
              })}
            </div>
            <button onClick={() => setShowPicker(false)} style={{
              width: '100%', marginTop: '20px', padding: '12px', borderRadius: '12px',
              border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #a855f7, #ec4899)',
              color: 'white', fontWeight: 700, fontSize: '14px'
            }}>
              {saving ? 'Saving...' : 'Done'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}