'use client'
import { useEffect, useRef, useState } from 'react'

interface Badge {
  id: string
  name: string
  icon: string
  description: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  earned: boolean
  earned_at: string | null
}

interface Level {
  level: number
  name: string
  minXP: number
}

interface Rank {
  rank: string
  minLevel: number
  color: string
}

interface XPData {
  xp: number
  level: Level
  nextLevel: Level | null
  rank: Rank
  streak: number
  multiplier: number
  badges: Badge[]
}

const categoryLabels: Record<string, string> = {
  streak: '🔥 Streak',
  level: '⭐ Level',
  xp: '⚡ XP',
  mcq: '🎯 MCQ',
  exam: '📝 Exam',
  study: '📚 Study',
  flashcard: '🃏 Flashcards',
  subject: '🗺️ Subjects',
  hidden: '🕵️ Hidden',
  social: '🤝 Social',
}

const difficultyLabels: Record<string, { label: string; color: string }> = {
  easy: { label: 'Easy', color: '#10b981' },
  medium: { label: 'Medium', color: '#eab308' },
  hard: { label: 'Hard', color: '#ec4899' },
}

// Mirrors RANK_TIERS from api/xp/route.ts — kept lightweight here (name +
// minLevel only) just to compute "levels to next rank" client-side without
// an extra API round trip.
const RANK_LADDER = [
  { rank: 'Bronze IV', minLevel: 1 }, { rank: 'Bronze III', minLevel: 3 },
  { rank: 'Bronze II', minLevel: 5 }, { rank: 'Bronze I', minLevel: 7 },
  { rank: 'Silver IV', minLevel: 9 }, { rank: 'Silver III', minLevel: 11 },
  { rank: 'Silver II', minLevel: 13 }, { rank: 'Silver I', minLevel: 15 },
  { rank: 'Gold IV', minLevel: 17 }, { rank: 'Gold III', minLevel: 19 },
  { rank: 'Gold II', minLevel: 21 }, { rank: 'Gold I', minLevel: 23 },
  { rank: 'Platinum IV', minLevel: 25 }, { rank: 'Platinum III', minLevel: 27 },
  { rank: 'Platinum II', minLevel: 29 }, { rank: 'Platinum I', minLevel: 31 },
  { rank: 'Emerald IV', minLevel: 34 }, { rank: 'Emerald III', minLevel: 37 },
  { rank: 'Emerald II', minLevel: 40 }, { rank: 'Emerald I', minLevel: 43 },
  { rank: 'Diamond IV', minLevel: 47 }, { rank: 'Diamond III', minLevel: 51 },
  { rank: 'Diamond II', minLevel: 55 }, { rank: 'Diamond I', minLevel: 59 },
  { rank: 'Master I', minLevel: 64 }, { rank: 'Master II', minLevel: 70 },
  { rank: 'Master III', minLevel: 76 }, { rank: 'Grandmaster', minLevel: 85 },
  { rank: 'Challenger', minLevel: 100 },
]

// Lightens (positive percent) or darkens (negative) a hex color — used to
// build the crest's bevel gradient dynamically per rank color.
function shadeColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  let r = (num >> 16) + percent
  let g = ((num >> 8) & 0x00ff) + percent
  let b = (num & 0x0000ff) + percent
  r = Math.max(Math.min(255, r), 0)
  g = Math.max(Math.min(255, g), 0)
  b = Math.max(Math.min(255, b), 0)
  return '#' + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)
}

// Counts XP up from 0 on mount instead of just appearing — small but makes
// the number feel earned rather than static.
function useCountUp(target: number, durationMs = 1100) {
  const [value, setValue] = useState(0)
  const startRef = useRef<number | null>(null)
  useEffect(() => {
    let raf: number
    const step = (t: number) => {
      if (startRef.current === null) startRef.current = t
      const progress = Math.min(1, (t - startRef.current) / durationMs)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, durationMs])
  return value
}

export default function AchievementsPage() {
  const [data, setData] = useState<XPData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [activeDifficulty, setActiveDifficulty] = useState<string>('all')

  useEffect(() => {
    fetch('/api/xp')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [])

  const xp = useCountUp(data?.xp || 0)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div className="loader-ring" />
      <p style={{ color: '#9ca3af', fontSize: '14px', marginLeft: '12px' }}>Loading achievements...</p>
    </div>
  )

  if (!data) return null

  const xpToNext = data.nextLevel ? data.nextLevel.minXP - data.xp : 0
  const xpInLevel = data.nextLevel ? data.xp - data.level.minXP : 0
  const xpLevelRange = data.nextLevel ? data.nextLevel.minXP - data.level.minXP : 1
  const progress = data.nextLevel ? Math.min(100, Math.round((xpInLevel / xpLevelRange) * 100)) : 100

  const earnedBadges = data.badges.filter(b => b.earned)
  const categories = ['all', ...Object.keys(categoryLabels).filter(c => data.badges.some(b => b.category === c))]

  const filteredBadges = data.badges.filter(b =>
    (activeCategory === 'all' || b.category === activeCategory) &&
    (activeDifficulty === 'all' || b.difficulty === activeDifficulty)
  )

  const rankIdx = RANK_LADDER.findIndex(r => r.rank === data.rank.rank)
  const nextRank = RANK_LADDER[rankIdx + 1]
  const levelsToNextRank = nextRank ? nextRank.minLevel - data.level.level : 0

  return (
    <>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(168,85,247,0.35); }
          50% { box-shadow: 0 0 0 8px rgba(168,85,247,0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes crestShine {
          0% { transform: translateX(-120%) rotate(20deg); }
          100% { transform: translateX(120%) rotate(20deg); }
        }
        .loader-ring {
          width: 18px; height: 18px; border-radius: 50%;
          border: 2px solid #e8e0f0; border-top-color: #a855f7;
          animation: spin 0.7s linear infinite;
        }
        .achievement-card {
          background: rgba(255,255,255,0.75);
          backdrop-filter: blur(12px);
          border: 1px solid #e8e0f0;
          border-radius: 20px;
          padding: 28px;
          animation: fadeSlideUp 0.5s ease both;
        }
        .rank-crest-wrap {
          position: relative;
          width: 84px; height: 92px;
          flex-shrink: 0;
        }
        .rank-crest-glow {
          position: absolute;
          inset: -8px;
          clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
          filter: blur(16px);
          opacity: 0.5;
          animation: pulseGlow 2.4s ease-in-out infinite;
        }
        .rank-crest-ring {
          position: relative;
          width: 100%; height: 100%;
          clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
          display: flex; align-items: center; justify-content: center;
          padding: 4px;
          box-shadow: inset 0 2px 3px rgba(255,255,255,0.5), inset 0 -3px 7px rgba(0,0,0,0.3);
        }
        .rank-crest-face {
          position: relative;
          width: 100%; height: 100%;
          clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
          box-shadow: inset 0 3px 6px rgba(255,255,255,0.4), inset 0 -6px 12px rgba(0,0,0,0.32);
        }
        .rank-crest-face::after {
          content: '';
          position: absolute;
          top: -20%; left: -60%;
          width: 40%; height: 140%;
          background: rgba(255,255,255,0.5);
          animation: crestShine 3.2s ease-in-out infinite;
          animation-delay: 0.6s;
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
          background: linear-gradient(90deg, #a855f7, #ec4899, #a855f7);
          background-size: 200% 100%;
          animation: shimmer 2.4s linear infinite;
          transition: width 1.1s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .stat-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(168,85,247,0.06);
          border: 1px solid rgba(168,85,247,0.12);
          border-radius: 12px;
          padding: 12px 16px;
          transition: transform 0.15s, border-color 0.15s;
        }
        .stat-pill:hover {
          transform: translateY(-2px);
          border-color: rgba(168,85,247,0.3);
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
        .diff-dot {
          width: 6px; height: 6px; border-radius: 50%; display: inline-block; margin-right: 5px;
        }
        .badge-card {
          background: rgba(255,255,255,0.75);
          border: 1px solid #e8e0f0;
          border-radius: 16px;
          padding: 20px 16px;
          text-align: center;
          transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
          position: relative;
          overflow: hidden;
          animation: fadeSlideUp 0.45s ease both;
        }
        .badge-card.earned {
          border-color: rgba(168,85,247,0.3);
          background: rgba(168,85,247,0.04);
        }
        .badge-card.earned:hover {
          border-color: #a855f7;
          box-shadow: 0 8px 26px rgba(168,85,247,0.18);
          transform: translateY(-4px) scale(1.02);
        }
        .badge-card.locked {
          opacity: 0.5;
          filter: grayscale(0.7);
        }
        .badge-card.locked:hover {
          opacity: 0.75;
          filter: grayscale(0.4);
        }
        .badge-icon {
          font-size: 32px;
          margin-bottom: 8px;
          display: inline-block;
          transition: transform 0.2s;
          font-family: "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif;
        }
        .badge-card.earned:hover .badge-icon {
          transform: scale(1.15) rotate(-4deg);
        }
      `}</style>

      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8" style={{ animation: 'fadeSlideUp 0.4s ease both' }}>
          <h1 className="text-3xl font-bold mb-1" style={{ color: '#1a1a2e' }}>Achievements</h1>
          <p className="text-sm" style={{ color: '#9ca3af' }}>Your rank, XP, level progress, and earned badges</p>
        </div>

        {/* Rank + Level + XP Card */}
        <div className="achievement-card mb-6">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>

            {/* Rank crest */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: '220px' }}>
              <div className="rank-crest-wrap">
                <div className="rank-crest-glow" style={{ background: data.rank.color }} />
                <div className="rank-crest-ring" style={{ background: `linear-gradient(160deg, ${shadeColor(data.rank.color, 60)}, ${shadeColor(data.rank.color, -50)})` }}>
                  <div className="rank-crest-face" style={{ background: `linear-gradient(155deg, ${shadeColor(data.rank.color, 40)} 0%, ${data.rank.color} 55%, ${shadeColor(data.rank.color, -35)} 100%)` }}>
                    <span style={{ fontSize: '22px', fontWeight: 800, color: 'white', textShadow: '0 1px 4px rgba(0,0,0,0.3)', zIndex: 1 }}>
                      {data.level.level}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: data.rank.color }}>Rank</p>
                <p style={{ margin: '2px 0 4px', fontSize: '19px', fontWeight: 800, color: '#1a1a2e' }}>{data.rank.rank}</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
                  {nextRank ? `${levelsToNextRank} level${levelsToNextRank === 1 ? '' : 's'} to ${nextRank.rank}` : 'Top rank reached 🏆'}
                </p>
              </div>
            </div>

            {/* Level info */}
            <div style={{ flex: 1, minWidth: '220px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
                <p style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#1a1a2e' }}>{data.level.name}</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>Level {data.level.level}</p>
              </div>
              <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#9ca3af' }}>
                {data.nextLevel ? `${xp.toLocaleString()} / ${data.nextLevel.minXP.toLocaleString()} XP` : `${xp.toLocaleString()} XP`}
              </p>
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
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1a1a2e' }}>{xp.toLocaleString()}</p>
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1a1a2e' }}>Badges</h2>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {(['all', 'easy', 'medium', 'hard'] as const).map(diff => (
                <button
                  key={diff}
                  className={`cat-btn ${activeDifficulty === diff ? 'active' : ''}`}
                  onClick={() => setActiveDifficulty(diff)}
                >
                  {diff === 'all' ? 'All Difficulties' : (
                    <>
                      <span className="diff-dot" style={{ background: activeDifficulty === diff ? 'white' : difficultyLabels[diff].color }} />
                      {difficultyLabels[diff].label}
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
            {filteredBadges.map((badge, i) => (
              <div
                key={badge.id}
                className={`badge-card ${badge.earned ? 'earned' : 'locked'}`}
                style={{ animationDelay: `${Math.min(i, 24) * 25}ms` }}
              >
                <div style={{
                  position: 'absolute', top: '8px', left: '8px',
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: difficultyLabels[badge.difficulty]?.color || '#9ca3af',
                }} title={difficultyLabels[badge.difficulty]?.label} />
                {badge.earned && (
                  <div style={{
                    position: 'absolute', top: '8px', right: '8px',
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                  }} />
                )}
                <div className="badge-icon" style={{ filter: badge.earned ? 'none' : 'grayscale(1)' }}>
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

          {filteredBadges.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <p style={{ fontSize: '13px', color: '#9ca3af' }}>No badges match these filters yet.</p>
            </div>
          )}
        </div>

      </div>
    </>
  )
}