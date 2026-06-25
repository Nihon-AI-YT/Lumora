'use client'
import { useEffect, useState } from 'react'

interface Badge {
  id: string
  name: string
  icon: string
  description: string
  category: string
  earned: boolean
  earned_at: string | null
}

interface Level {
  level: number
  name: string
  minXP: number
}

interface XPData {
  xp: number
  level: Level
  nextLevel: Level | null
  streak: number
  multiplier: number
  badges: Badge[]
}

const categoryLabels: Record<string, string> = {
  streak: '🔥 Streak',
  level: '⭐ Level',
  mcq: '🎯 MCQ',
  exam: '📝 Exam',
  study: '📚 Study',
}

export default function AchievementsPage() {
  const [data, setData] = useState<XPData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string>('all')

  useEffect(() => {
    fetch('/api/xp')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <p style={{ color: '#9ca3af', fontSize: '14px' }}>Loading achievements...</p>
    </div>
  )

  if (!data) return null

  const xpToNext = data.nextLevel ? data.nextLevel.minXP - data.xp : 0
  const xpInLevel = data.nextLevel ? data.xp - data.level.minXP : 0
  const xpLevelRange = data.nextLevel ? data.nextLevel.minXP - data.level.minXP : 1
  const progress = data.nextLevel ? Math.min(100, Math.round((xpInLevel / xpLevelRange) * 100)) : 100

  const earnedBadges = data.badges.filter(b => b.earned)
  const categories = ['all', ...Object.keys(categoryLabels)]

  const filteredBadges = activeCategory === 'all'
    ? data.badges
    : data.badges.filter(b => b.category === activeCategory)

  return (
    <>
      <style>{`
        .achievement-card {
          background: rgba(255,255,255,0.75);
          backdrop-filter: blur(12px);
          border: 1px solid #e8e0f0;
          border-radius: 20px;
          padding: 28px;
        }
        .badge-card {
          background: rgba(255,255,255,0.75);
          border: 1px solid #e8e0f0;
          border-radius: 16px;
          padding: 20px 16px;
          text-align: center;
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
        }
        .badge-card.earned {
          border-color: rgba(168,85,247,0.3);
          background: rgba(168,85,247,0.04);
        }
        .badge-card.earned:hover {
          border-color: #a855f7;
          box-shadow: 0 4px 20px rgba(168,85,247,0.15);
          transform: translateY(-2px);
        }
        .badge-card.locked {
          opacity: 0.45;
          filter: grayscale(0.6);
        }
        .cat-btn {
          padding: 6px 14px;
          border-radius: 20px;
          border: 1px solid #e8e0f0;
          background: white;
          color: #9ca3af;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .cat-btn.active {
          background: linear-gradient(135deg, #a855f7, #ec4899);
          color: white;
          border-color: transparent;
        }
        .cat-btn:not(.active):hover {
          border-color: #a855f7;
          color: #9333ea;
        }
        .xp-bar-bg {
          width: 100%;
          height: 10px;
          background: #f0ebfa;
          border-radius: 10px;
          overflow: hidden;
          margin: 12px 0 6px;
        }
        .xp-bar-fill {
          height: 100%;
          border-radius: 10px;
          background: linear-gradient(135deg, #a855f7, #ec4899);
          transition: width 1s ease;
        }
        .stat-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(168,85,247,0.06);
          border: 1px solid rgba(168,85,247,0.12);
          border-radius: 12px;
          padding: 12px 16px;
        }
      `}</style>

      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1" style={{ color: '#1a1a2e' }}>Achievements</h1>
          <p className="text-sm" style={{ color: '#9ca3af' }}>Your XP, level progress, and earned badges</p>
        </div>

        {/* Level + XP Card */}
        <div className="achievement-card mb-6">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>

            {/* Level info */}
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '14px',
                  background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '22px', fontWeight: 800, color: 'white', flexShrink: 0,
                }}>
                  {data.level.level}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#1a1a2e' }}>{data.level.name}</p>
                  <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>
                    {data.nextLevel ? `${data.xp.toLocaleString()} / ${data.nextLevel.minXP.toLocaleString()} XP` : `${data.xp.toLocaleString()} XP — Max Level!`}
                  </p>
                </div>
              </div>

              {/* XP Bar */}
              <div className="xp-bar-bg">
                <div className="xp-bar-fill" style={{ width: `${progress}%` }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>{progress}% to next level</p>
                {data.nextLevel && (
                  <p style={{ margin: 0, fontSize: '11px', color: '#a855f7', fontWeight: 600 }}>
                    {xpToNext} XP → {data.nextLevel.name}
                  </p>
                )}
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '160px' }}>
              <div className="stat-pill">
                <span style={{ fontSize: '18px' }}>⚡</span>
                <div>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1a1a2e' }}>{data.xp.toLocaleString()}</p>
                  <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>Total XP</p>
                </div>
              </div>
              <div className="stat-pill">
                <span style={{ fontSize: '18px' }}>🔥</span>
                <div>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1a1a2e' }}>{data.streak} days</p>
                  <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>
                    {data.multiplier > 1 ? `${data.multiplier}x XP multiplier active!` : 'Current streak'}
                  </p>
                </div>
              </div>
              <div className="stat-pill">
                <span style={{ fontSize: '18px' }}>🏅</span>
                <div>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1a1a2e' }}>{earnedBadges.length} / {data.badges.length}</p>
                  <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>Badges earned</p>
                </div>
              </div>
            </div>
          </div>

          {/* Multiplier banner */}
          {data.multiplier > 1 && (
            <div style={{
              marginTop: '16px', padding: '10px 16px', borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(236,72,153,0.1))',
              border: '1px solid rgba(168,85,247,0.2)',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <span style={{ fontSize: '16px' }}>🔥</span>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#7c3aed' }}>
                {data.streak}-day streak! You&apos;re earning {data.multiplier}x XP on everything. Keep it going!
              </p>
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="achievement-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1a1a2e' }}>Badges</h2>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`cat-btn ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat === 'all' ? '✦ All' : categoryLabels[cat]}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
            {filteredBadges.map(badge => (
              <div key={badge.id} className={`badge-card ${badge.earned ? 'earned' : 'locked'}`}>
                {badge.earned && (
                  <div style={{
                    position: 'absolute', top: '8px', right: '8px',
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                  }} />
                )}
                <div style={{ fontSize: '32px', marginBottom: '8px', filter: badge.earned ? 'none' : 'grayscale(1)' }}>
                  {badge.icon}
                </div>
                <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 700, color: badge.earned ? '#1a1a2e' : '#9ca3af' }}>
                  {badge.name}
                </p>
                <p style={{ margin: '0 0 6px', fontSize: '10px', color: '#9ca3af', lineHeight: 1.4 }}>
                  {badge.description}
                </p>
                {badge.earned && badge.earned_at && (
                  <p style={{ margin: 0, fontSize: '9px', color: '#a855f7', fontWeight: 600 }}>
                    {new Date(badge.earned_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                )}
                {!badge.earned && (
                  <p style={{ margin: 0, fontSize: '10px', color: '#c4b5d4' }}>🔒 Locked</p>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  )
}