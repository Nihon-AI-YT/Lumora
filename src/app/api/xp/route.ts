import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// XP values for each action
const XP_VALUES: Record<string, number> = {
  mcq_correct: 10,
  mcq_session_complete: 25,
  mcq_score_80: 50,
  pomodoro_complete: 20,
  tutor_message: 5,
  exam_complete: 50,
  exam_score_80: 100,
  add_notes: 10,
  daily_login: 15,
}

// Level thresholds
const LEVELS = [
  { level: 1, minXP: 0, name: 'Beginner I' },
  { level: 2, minXP: 60, name: 'Beginner II' },
  { level: 3, minXP: 150, name: 'Beginner III' },
  { level: 4, minXP: 300, name: 'Beginner IV' },
  { level: 5, minXP: 500, name: 'Beginner V' },
  { level: 6, minXP: 700, name: 'Learner I' },
  { level: 7, minXP: 950, name: 'Learner II' },
  { level: 8, minXP: 1250, name: 'Learner III' },
  { level: 9, minXP: 1600, name: 'Learner IV' },
  { level: 10, minXP: 2000, name: 'Learner V' },
  { level: 11, minXP: 2500, name: 'Scholar I' },
  { level: 12, minXP: 3000, name: 'Scholar II' },
  { level: 13, minXP: 3600, name: 'Scholar III' },
  { level: 14, minXP: 4300, name: 'Scholar IV' },
  { level: 15, minXP: 5000, name: 'Scholar V' },
  { level: 16, minXP: 6000, name: 'Expert I' },
  { level: 17, minXP: 7200, name: 'Expert II' },
  { level: 18, minXP: 8600, name: 'Expert III' },
  { level: 19, minXP: 10200, name: 'Expert IV' },
  { level: 20, minXP: 12000, name: 'Expert V' },
  { level: 21, minXP: 15000, name: 'Master I' },
  { level: 22, minXP: 18500, name: 'Master II' },
  { level: 23, minXP: 22500, name: 'Master III' },
  { level: 24, minXP: 27000, name: 'Master IV' },
  { level: 25, minXP: 32000, name: 'Master V' },
  // NEW — extended range so the level_30 badge is reachable
  { level: 26, minXP: 38000, name: 'Grandmaster I' },
  { level: 27, minXP: 44500, name: 'Grandmaster II' },
  { level: 28, minXP: 51500, name: 'Grandmaster III' },
  { level: 29, minXP: 59000, name: 'Grandmaster IV' },
  { level: 30, minXP: 67000, name: 'Grandmaster V' },
]

// Badge definitions
// difficulty: 'easy' | 'medium' | 'hard' — lets the Achievements page group/filter
const BADGES = [
  // Streak badges
  { id: 'streak_1', name: 'First Step', icon: '🌱', description: 'Study 1 day in a row', category: 'streak', difficulty: 'easy' },
  { id: 'streak_3', name: '3-Day Streak', icon: '🔥', description: 'Study 3 days in a row', category: 'streak', difficulty: 'easy' },
  { id: 'streak_7', name: 'Week Warrior', icon: '⚡', description: 'Study 7 days in a row', category: 'streak', difficulty: 'medium' },
  { id: 'streak_14', name: 'Fortnight Focus', icon: '💫', description: 'Study 14 days in a row', category: 'streak', difficulty: 'medium' },
  { id: 'streak_30', name: 'Unstoppable', icon: '🏆', description: 'Study 30 days in a row', category: 'streak', difficulty: 'hard' },
  { id: 'streak_60', name: 'Legendary', icon: '🔱', description: 'Study 60 days in a row', category: 'streak', difficulty: 'hard' },
  { id: 'streak_100', name: 'Iron Will', icon: '🗿', description: 'Study 100 days in a row', category: 'streak', difficulty: 'hard' },
  // Level badges
  { id: 'level_5', name: 'Rising Star', icon: '⭐', description: 'Reach Level 5', category: 'level', difficulty: 'easy' },
  { id: 'level_10', name: 'Dedicated Learner', icon: '🌟', description: 'Reach Level 10', category: 'level', difficulty: 'easy' },
  { id: 'level_15', name: 'Scholar', icon: '🎓', description: 'Reach Level 15', category: 'level', difficulty: 'medium' },
  { id: 'level_20', name: 'Expert', icon: '💎', description: 'Reach Level 20', category: 'level', difficulty: 'medium' },
  { id: 'level_25', name: 'Lumora Master', icon: '👑', description: 'Reach Level 25', category: 'level', difficulty: 'medium' },
  { id: 'level_30', name: 'Grandmaster', icon: '🌌', description: 'Reach Level 30', category: 'level', difficulty: 'hard' },
  { id: 'level_50', name: 'Half Century', icon: '🔥', description: 'Reach Level 50', category: 'level', difficulty: 'hard' },
  { id: 'level_75', name: 'Elite', icon: '⚔️', description: 'Reach Level 75', category: 'level', difficulty: 'hard' },
  { id: 'level_100', name: 'Challenger', icon: '👽', description: 'Reach Level 100 — the top of the ladder', category: 'level', difficulty: 'hard' },
  // XP milestone badges
  { id: 'xp_first', name: 'First XP', icon: '⚡', description: 'Earn your first XP', category: 'xp', difficulty: 'easy' },
  { id: 'xp_100', name: 'Century', icon: '💫', description: 'Reach 100 total XP', category: 'xp', difficulty: 'easy' },
  { id: 'xp_500', name: 'Rising', icon: '🚀', description: 'Reach 500 total XP', category: 'xp', difficulty: 'easy' },
  { id: 'xp_1000', name: 'Thousand', icon: '🌟', description: 'Reach 1,000 total XP', category: 'xp', difficulty: 'medium' },
  { id: 'xp_5000', name: 'Five K', icon: '💎', description: 'Reach 5,000 total XP', category: 'xp', difficulty: 'medium' },
  { id: 'xp_10000', name: 'Ten K', icon: '👑', description: 'Reach 10,000 total XP', category: 'xp', difficulty: 'hard' },
  { id: 'xp_50000', name: 'Fifty K', icon: '🌠', description: 'Reach 50,000 total XP', category: 'xp', difficulty: 'hard' },
  // MCQ badges
  { id: 'mcq_first', name: 'First Attempt', icon: '🎯', description: 'Complete your first MCQ session', category: 'mcq', difficulty: 'easy' },
  { id: 'mcq_10', name: 'Quiz Enthusiast', icon: '📊', description: 'Complete 10 MCQ sessions', category: 'mcq', difficulty: 'medium' },
  { id: 'mcq_50', name: 'MCQ Master', icon: '🧠', description: 'Complete 50 MCQ sessions', category: 'mcq', difficulty: 'hard' },
  { id: 'mcq_200', name: 'Quiz Machine', icon: '🤖', description: 'Complete 200 MCQ sessions', category: 'mcq', difficulty: 'hard' },
  { id: 'mcq_perfect', name: 'Perfect Score', icon: '💯', description: 'Score 100% on an MCQ session', category: 'mcq', difficulty: 'medium' },
  // Exam badges
  { id: 'exam_first', name: 'Test Taker', icon: '📝', description: 'Complete your first exam', category: 'exam', difficulty: 'easy' },
  { id: 'exam_pass', name: 'High Achiever', icon: '🥇', description: 'Score 80%+ on an exam', category: 'exam', difficulty: 'medium' },
  { id: 'exam_5', name: 'Exam Pro', icon: '🏅', description: 'Complete 5 exams', category: 'exam', difficulty: 'medium' },
  // Study badges
  { id: 'pomodoro_first', name: 'Focus Mode', icon: '🍅', description: 'Complete your first Pomodoro', category: 'study', difficulty: 'easy' },
  { id: 'pomodoro_10', name: 'Deep Worker', icon: '⏰', description: 'Complete 10 Pomodoros', category: 'study', difficulty: 'medium' },
  { id: 'notes_first', name: 'Note Taker', icon: '📓', description: 'Add your first note', category: 'study', difficulty: 'easy' },
  { id: 'tutor_first', name: 'AI Student', icon: '🤖', description: 'Send your first tutor message', category: 'study', difficulty: 'easy' },
  { id: 'tutor_100', name: 'Tutor Regular', icon: '💬', description: 'Send 100 tutor messages', category: 'study', difficulty: 'medium' },
  { id: 'tutor_500', name: 'Tutor Devotee', icon: '📡', description: 'Send 500 tutor messages', category: 'study', difficulty: 'hard' },
  // Flashcard badges
  { id: 'flashcard_first', name: 'Card Maker', icon: '🃏', description: 'Create your first flashcard', category: 'flashcard', difficulty: 'easy' },
  { id: 'flashcard_50', name: 'Card Collector', icon: '🎴', description: 'Review 50 flashcards', category: 'flashcard', difficulty: 'medium' },
  // Subject badges
  { id: 'subject_first', name: 'Explorer', icon: '🗺️', description: 'Add your first subject', category: 'subject', difficulty: 'easy' },
  { id: 'subject_5', name: 'Knowledge Builder', icon: '📚', description: 'Add 5 subjects', category: 'subject', difficulty: 'medium' },
  // Hidden / fun badges
  { id: 'night_owl', name: 'Night Owl', icon: '🦉', description: 'Study between midnight and 5am', category: 'hidden', difficulty: 'easy' },
  { id: 'early_bird', name: 'Early Bird', icon: '🌅', description: 'Study before 7am', category: 'hidden', difficulty: 'easy' },
  { id: 'weekend_warrior', name: 'Weekend Warrior', icon: '⚔️', description: 'Study on Saturday AND Sunday', category: 'hidden', difficulty: 'medium' },
  { id: 'comeback_kid', name: 'Comeback Kid', icon: '💪', description: 'Return after a 7+ day break', category: 'hidden', difficulty: 'medium' },
  { id: 'overachiever', name: 'Overachiever', icon: '🎯', description: 'Earn 3 badges in one day', category: 'hidden', difficulty: 'medium' },
  // Social / Group badges — NOT WIRED YET. Definitions only, for the future
  // leaderboard + friend groups feature. Unlock logic gets added once those
  // tables (study_groups, group_members, weekly leaderboard) actually exist.
  { id: 'group_joined', name: 'Team Player', icon: '🤝', description: 'Join your first study group', category: 'social', difficulty: 'easy' },
  { id: 'group_created', name: 'Squad Leader', icon: '🚩', description: 'Create a study group', category: 'social', difficulty: 'medium' },
  { id: 'leaderboard_top10', name: 'Top 10', icon: '📈', description: 'Finish top 10 in your group\'s weekly leaderboard', category: 'social', difficulty: 'medium' },
  { id: 'leaderboard_first', name: '#1 This Week', icon: '🥇', description: 'Finish #1 in your group\'s weekly leaderboard', category: 'social', difficulty: 'hard' },
  { id: 'group_streak', name: 'Squad Goals', icon: '👥', description: 'Your whole group studies on the same day', category: 'social', difficulty: 'hard' },
]

function getLevel(xp: number) {
  // Walk the explicit table first (levels 1-30)
  let current = LEVELS[0]
  for (const l of LEVELS) {
    if (xp >= l.minXP) current = l
    else break
  }

  const lastDefined = LEVELS[LEVELS.length - 1].level // 30
  if (current.level < lastDefined) {
    const nextIdx = LEVELS.findIndex(l => l.level === current.level) + 1
    return { current, next: LEVELS[nextIdx] }
  }

  // Level 30+ — no XP cap. Levels beyond 30 are generated algorithmically
  // so leveling never stops; only RANK caps out (at Grandmaster).
  let level = current.level
  let levelXP = current.minXP
  while (true) {
    const nextLevel = level + 1
    const nextXP = levelXP + getIncrement(nextLevel)
    if (xp < nextXP) {
      return {
        current: { level, minXP: levelXP, name: getLevelName(level) },
        next: { level: nextLevel, minXP: nextXP, name: getLevelName(nextLevel) },
      }
    }
    level = nextLevel
    levelXP = nextXP
  }
}

function getMultiplier(streak: number): number {
  if (streak >= 30) return 2.0
  if (streak >= 7) return 1.5
  if (streak >= 3) return 1.25
  return 1.0
}

// Local-time-of-day check for hidden badges. Since Lumora may have users
// outside Sri Lanka, this no longer assumes a fixed UTC+5:30 offset —
// instead it uses the client's own local hour/day if the frontend sends
// them in metadata (metadata.localHour, metadata.localDay), and falls
// back to server (UTC) time if not provided.
function getLocalTime(metadata: Record<string, any>) {
  if (typeof metadata.localHour === 'number' && typeof metadata.localDay === 'number') {
    return { hour: metadata.localHour, day: metadata.localDay }
  }
  const now = new Date()
  return { hour: now.getUTCHours(), day: now.getUTCDay() }
}

// Rank tiers — a coarser progression layer on top of Level. Levels are
// uncapped (you can keep leveling forever), but Rank caps out at
// Grandmaster: once you hit the level requirement, your displayed rank
// freezes there no matter how much higher your level climbs. This is what
// the future leaderboard will be built on top of (Level = raw progress,
// Rank = tier for matchmaking/bragging rights).
const RANK_TIERS = [
  { rank: 'Bronze IV', minLevel: 1, color: '#a97142' },
  { rank: 'Bronze III', minLevel: 3, color: '#a97142' },
  { rank: 'Bronze II', minLevel: 5, color: '#a97142' },
  { rank: 'Bronze I', minLevel: 7, color: '#a97142' },
  { rank: 'Silver IV', minLevel: 9, color: '#9ca3af' },
  { rank: 'Silver III', minLevel: 11, color: '#9ca3af' },
  { rank: 'Silver II', minLevel: 13, color: '#9ca3af' },
  { rank: 'Silver I', minLevel: 15, color: '#9ca3af' },
  { rank: 'Gold IV', minLevel: 17, color: '#eab308' },
  { rank: 'Gold III', minLevel: 19, color: '#eab308' },
  { rank: 'Gold II', minLevel: 21, color: '#eab308' },
  { rank: 'Gold I', minLevel: 23, color: '#eab308' },
  { rank: 'Platinum IV', minLevel: 25, color: '#22d3ee' },
  { rank: 'Platinum III', minLevel: 27, color: '#22d3ee' },
  { rank: 'Platinum II', minLevel: 29, color: '#22d3ee' },
  { rank: 'Platinum I', minLevel: 31, color: '#22d3ee' },
  { rank: 'Emerald IV', minLevel: 34, color: '#10b981' },
  { rank: 'Emerald III', minLevel: 37, color: '#10b981' },
  { rank: 'Emerald II', minLevel: 40, color: '#10b981' },
  { rank: 'Emerald I', minLevel: 43, color: '#10b981' },
  { rank: 'Diamond IV', minLevel: 47, color: '#818cf8' },
  { rank: 'Diamond III', minLevel: 51, color: '#818cf8' },
  { rank: 'Diamond II', minLevel: 55, color: '#818cf8' },
  { rank: 'Diamond I', minLevel: 59, color: '#818cf8' },
  { rank: 'Master I', minLevel: 64, color: '#a855f7' },
  { rank: 'Master II', minLevel: 70, color: '#a855f7' },
  { rank: 'Master III', minLevel: 76, color: '#a855f7' },
  { rank: 'Grandmaster', minLevel: 85, color: '#ec4899' },
  { rank: 'Challenger', minLevel: 100, color: '#f97316' }, // true top rank — caps here forever
]

function getRank(level: number) {
  let current = RANK_TIERS[0]
  for (const r of RANK_TIERS) {
    if (level >= r.minLevel) current = r
    else break
  }
  return current
}

// XP required to enter level n, for n beyond the explicit LEVELS table (30+).
// Increments grow over time so leveling never gets trivially fast, but it
// never stops either — there's no ceiling on Level, only on Rank.
function getIncrement(n: number) {
  return 8000 + 500 * (n - 31)
}

function getLevelName(n: number): string {
  const known = LEVELS.find(l => l.level === n)
  return known ? known.name : `Level ${n}`
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { action, metadata = {} } = await req.json()

  const baseXP = XP_VALUES[action]
  if (!baseXP) return NextResponse.json({ error: 'Unknown action' }, { status: 400 })

  // Get current profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('xp, level, streak_count, last_active')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const multiplier = getMultiplier(profile.streak_count || 0)
  const earnedXP = Math.round(baseXP * multiplier)
  const oldXP = profile.xp || 0
  const newXP = oldXP + earnedXP

  const { current: oldLevel } = getLevel(oldXP)
  const { current: newLevel, next: nextLevel } = getLevel(newXP)
  const leveledUp = newLevel.level > oldLevel.level

  // Update XP and level
  await supabase
    .from('profiles')
    .update({ xp: newXP, level: newLevel.level })
    .eq('id', user.id)

  const notifications = []
  const newBadges: typeof BADGES = []

  const { data: existingBadges } = await supabase
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', user.id)
  const earned = new Set(existingBadges?.map(b => b.badge_id) || [])

  const checkAndAwardBadge = async (badgeId: string) => {
    if (earned.has(badgeId)) return
    const badge = BADGES.find(b => b.id === badgeId)
    if (!badge) return
    const { error } = await supabase.from('user_badges').insert({ user_id: user.id, badge_id: badgeId })
    if (!error) {
      newBadges.push(badge)
      earned.add(badgeId)
      await supabase.from('notifications').insert({
        user_id: user.id,
        type: 'badge',
        title: `Badge Unlocked: ${badge.name}`,
        message: badge.description,
        icon: badge.icon,
        link: '/achievements',
      })
    }
  }

  // Level up notification
  if (leveledUp) {
    await supabase.from('notifications').insert({
      user_id: user.id,
      type: 'level_up',
      title: `Level Up! You're now ${newLevel.name}`,
      message: `You reached Level ${newLevel.level}! Keep going${nextLevel ? ` — ${nextLevel.minXP - newXP} XP to ${nextLevel.name}` : '!'}`,
      icon: '🎉',
      link: '/achievements',
    })
    notifications.push('level_up')

    // Check level badges — uses a range check (oldLevel < milestone <= newLevel)
    // instead of an exact match, so a big XP jump that skips over a milestone
    // level in one call still awards it.
    const levelBadgeMap: Record<number, string> = { 5: 'level_5', 10: 'level_10', 15: 'level_15', 20: 'level_20', 25: 'level_25', 30: 'level_30', 50: 'level_50', 75: 'level_75', 100: 'level_100' }
    for (const [milestone, badgeId] of Object.entries(levelBadgeMap)) {
      const m = Number(milestone)
      if (oldLevel.level < m && newLevel.level >= m) await checkAndAwardBadge(badgeId)
    }
  }

  // Rank up notification — Rank is coarser than Level and caps at
  // Grandmaster. Only fires when the rank tier actually changes.
  const oldRank = getRank(oldLevel.level)
  const newRank = getRank(newLevel.level)
  if (newRank.rank !== oldRank.rank) {
    await supabase.from('notifications').insert({
      user_id: user.id,
      type: 'rank_up',
      title: `Rank Up! You're now ${newRank.rank}`,
      message: newRank.rank === 'Grandmaster'
        ? `You reached the top rank — Grandmaster! Keep leveling, it'll count toward the leaderboard.`
        : `You've been promoted to ${newRank.rank}. Keep climbing!`,
      icon: '🏅',
      link: '/achievements',
    })
  }

  // MCQ badges
  if (action === 'mcq_session_complete') {
    const { count } = await supabase.from('mcq_attempts').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
    if ((count || 0) >= 1) await checkAndAwardBadge('mcq_first')
    if ((count || 0) >= 10) await checkAndAwardBadge('mcq_10')
    if ((count || 0) >= 50) await checkAndAwardBadge('mcq_50')
    if ((count || 0) >= 200) await checkAndAwardBadge('mcq_200')
  }
  if (action === 'mcq_score_80' && metadata.perfect) await checkAndAwardBadge('mcq_perfect')

  // Exam badges
  if (action === 'exam_complete') {
    await checkAndAwardBadge('exam_first')
    const { count } = await supabase.from('mcq_attempts').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('source', 'exam')
    if ((count || 0) >= 5) await checkAndAwardBadge('exam_5')
  }
  if (action === 'exam_score_80') await checkAndAwardBadge('exam_pass')

  // Pomodoro badges
  if (action === 'pomodoro_complete') {
    const { count } = await supabase.from('study_sessions').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('session_type', 'pomodoro')
    if ((count || 0) >= 1) await checkAndAwardBadge('pomodoro_first')
    if ((count || 0) >= 10) await checkAndAwardBadge('pomodoro_10')
  }

  // Notes badge
  if (action === 'add_notes') await checkAndAwardBadge('notes_first')

  // Tutor badges
  if (action === 'tutor_message') {
    const { count } = await supabase.from('tutor_messages').select('*', { count: 'exact', head: true }).eq('chat_id', metadata.chatId)
    await checkAndAwardBadge('tutor_first')
    if ((count || 0) >= 100) await checkAndAwardBadge('tutor_100')
    if ((count || 0) >= 500) await checkAndAwardBadge('tutor_500')
  }

  // Streak badges
  const streak = profile.streak_count || 0
  if (streak >= 1) await checkAndAwardBadge('streak_1')
  if (streak >= 3) await checkAndAwardBadge('streak_3')
  if (streak >= 7) await checkAndAwardBadge('streak_7')
  if (streak >= 14) await checkAndAwardBadge('streak_14')
  if (streak >= 30) await checkAndAwardBadge('streak_30')
  if (streak >= 60) await checkAndAwardBadge('streak_60')
  if (streak >= 100) await checkAndAwardBadge('streak_100')

  // XP milestone badges — checked on every award, based on total XP
  if (oldXP === 0 && newXP > 0) await checkAndAwardBadge('xp_first')
  if (newXP >= 100) await checkAndAwardBadge('xp_100')
  if (newXP >= 500) await checkAndAwardBadge('xp_500')
  if (newXP >= 1000) await checkAndAwardBadge('xp_1000')
  if (newXP >= 5000) await checkAndAwardBadge('xp_5000')
  if (newXP >= 10000) await checkAndAwardBadge('xp_10000')
  if (newXP >= 50000) await checkAndAwardBadge('xp_50000')

  // Flashcard badges — opportunistic count check, runs on every XP-earning
  // action regardless of what triggered it. NOTE: flashcard creation/review
  // isn't wired into the XP system yet, so these unlock silently once that's
  // wired in a later step — this just puts the badge logic in place now.
  const { count: flashcardCount } = await supabase.from('flashcards').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
  if ((flashcardCount || 0) >= 1) await checkAndAwardBadge('flashcard_first')
  const { count: reviewedCount } = await supabase.from('srs_cards').select('*', { count: 'exact', head: true }).eq('user_id', user.id).not('last_reviewed', 'is', null)
  if ((reviewedCount || 0) >= 50) await checkAndAwardBadge('flashcard_50')

  // Subject badges — same opportunistic pattern
  const { count: subjectCount } = await supabase.from('subjects').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
  if ((subjectCount || 0) >= 1) await checkAndAwardBadge('subject_first')
  if ((subjectCount || 0) >= 5) await checkAndAwardBadge('subject_5')

  // Hidden / fun badges
  const { hour: localHour, day: localDay } = getLocalTime(metadata)

  if (localHour >= 0 && localHour < 5) await checkAndAwardBadge('night_owl')
  if (localHour >= 5 && localHour < 7) await checkAndAwardBadge('early_bird')

  // Weekend Warrior — proxy check using Pomodoro session timestamps within
  // the current week, since that's the one action table reliably timestamped
  // per user. Broaden to other tables later if needed.
  if (localDay === 0 || localDay === 6) {
    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    const { data: weekendSessions } = await supabase
      .from('study_sessions')
      .select('created_at')
      .eq('user_id', user.id)
      .eq('session_type', 'pomodoro')
      .gte('created_at', startOfWeek.toISOString())
    const daysStudied = new Set((weekendSessions || []).map(s => new Date(s.created_at).getDay()))
    if (daysStudied.has(0) && daysStudied.has(6)) await checkAndAwardBadge('weekend_warrior')
  }

  // Comeback Kid — checked specifically on daily_login, comparing against
  // the last_active value from BEFORE this session's login updates it.
  if (action === 'daily_login' && profile.last_active) {
    const lastActive = new Date(profile.last_active)
    const gapDays = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
    if (gapDays >= 7) await checkAndAwardBadge('comeback_kid')
  }

  // Overachiever — checked last, after all other badges this call may have granted
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const { count: todaysBadgeCount } = await supabase
    .from('user_badges')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('earned_at', startOfToday.toISOString())
  if ((todaysBadgeCount || 0) >= 3) await checkAndAwardBadge('overachiever')

  // "So close" nudge
  let nudge = null
  if (nextLevel && (nextLevel.minXP - newXP) <= 50) {
    nudge = `You're only ${nextLevel.minXP - newXP} XP away from ${nextLevel.name}!`
  }

  return NextResponse.json({
    xp: newXP,
    earnedXP,
    multiplier,
    level: newLevel,
    leveledUp,
    newBadges,
    nudge,
  })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('xp, level, streak_count')
    .eq('id', user.id)
    .single()

  const xp = profile?.xp || 0
  const { current, next } = getLevel(xp)

  const { data: badges } = await supabase
    .from('user_badges')
    .select('badge_id, earned_at')
    .eq('user_id', user.id)

  const earnedIds = new Set(badges?.map(b => b.badge_id) || [])
  const allBadges = BADGES.map(b => ({
    ...b,
    earned: earnedIds.has(b.id),
    earned_at: badges?.find(ub => ub.badge_id === b.id)?.earned_at || null,
  }))

  return NextResponse.json({
    xp,
    level: current,
    nextLevel: next,
    rank: getRank(current.level),
    streak: profile?.streak_count || 0,
    multiplier: getMultiplier(profile?.streak_count || 0),
    badges: allBadges,
  })
}