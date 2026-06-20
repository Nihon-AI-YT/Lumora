'use client'

interface StreakWidgetProps {
  streakCount: number
  userName: string
}

export default function StreakWidget({ streakCount, userName }: StreakWidgetProps) {
  const messages = [
    "Keep the momentum going!",
    "You're on fire! Don't stop now.",
    "Consistency is your superpower.",
    "Every day you study, you get closer.",
    "Champions show up every day.",
  ]
  const quote = messages[new Date().getDay() % messages.length]

  return (
    <div style={{
      background: 'linear-gradient(135deg, #a855f7, #ec4899)',
      borderRadius: '16px',
      padding: '24px',
      color: 'white',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      minHeight: '200px',
    }}>
      <div>
        <p style={{ margin: 0, fontSize: '13px', opacity: 0.85, fontWeight: 500 }}>
          {userName}'s Streak
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
          <span style={{ fontSize: '48px' }}>🔥</span>
          <div>
            <p style={{ margin: 0, fontSize: '42px', fontWeight: 800, lineHeight: 1 }}>
              {streakCount}
            </p>
            <p style={{ margin: 0, fontSize: '13px', opacity: 0.85 }}>days in a row</p>
          </div>
        </div>
      </div>
      <div style={{
        background: 'rgba(255,255,255,0.15)',
        borderRadius: '10px',
        padding: '12px',
        marginTop: '16px',
      }}>
        <p style={{ margin: 0, fontSize: '13px', fontStyle: 'italic', opacity: 0.95 }}>
          "{quote}"
        </p>
      </div>
    </div>
  )
}