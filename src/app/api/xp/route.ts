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
  { level: 2, minXP: 100, name: 'Beginner II' },
  { level: 3, minXP: 250, name: 'Beginner III' },
  { level: 4, minXP: 400, name: 'Beginner IV' },
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
]

// Badge definitions
const BADGES = [
  // Streak badges
  { id: 'streak_3', name: '3-Day Streak', icon: '🔥', description: 'Study 3 days in a row', category: 'streak' },
  { id: 'streak_7', name: 'Week Warrior', icon: '⚡', description: 'Study 7 days in a row', category: 'streak' },
  { id: 'streak_14', name: 'Fortnight Focus', icon: '💫', description: 'Study 14 days in a row', category: 'streak' },
  { id: 'streak_30', name: 'Unstoppable', icon: '🏆', description: 'Study 30 days in a row', category: 'streak' },
  // XP / Level badges
  { id: 'level_5', name: 'Rising Star', icon: '⭐', description: 'Reach Level 5', category: 'level' },
  { id: 'level_10', name: 'Dedicated Learner', icon: '🌟', description: 'Reach Level 10', category: 'level' },
  { id: 'level_15', name: 'Scholar', icon: '🎓', description: 'Reach Level 15', category: 'level' },
  { id: 'level_20', name: 'Expert', icon: '💎', description: 'Reach Level 20', category: 'level' },
  { id: 'level_25', name: 'Lumora Master', icon: '👑', description: 'Reach Level 25', category: 'level' },
  // MCQ badges
  { id: 'mcq_first', name: 'First Attempt', icon: '🎯', description: 'Complete your first MCQ session', category: 'mcq' },
  { id: 'mcq_10', name: 'Quiz Enthusiast', icon: '📊', description: 'Complete 10 MCQ sessions', category: 'mcq' },
  { id: 'mcq_50', name: 'MCQ Master', icon: '🧠', description: 'Complete 50 MCQ sessions', category: 'mcq' },
  { id: 'mcq_perfect', name: 'Perfect Score', icon: '💯', description: 'Score 100% on an MCQ session', category: 'mcq' },
  // Exam badges
  { id: 'exam_first', name: 'Test Taker', icon: '📝', description: 'Complete your first exam', category: 'exam' },
  { id: 'exam_pass', name: 'High Achiever', icon: '🥇', description: 'Score 80%+ on an exam', category: 'exam' },
  { id: 'exam_5', name: 'Exam Pro', icon: '🏅', description: 'Complete 5 exams', category: 'exam' },
  // Study badges
  { id: 'pomodoro_first', name: 'Focus Mode', icon: '🍅', description: 'Complete your first Pomodoro', category: 'study' },
  { id: 'pomodoro_10', name: 'Deep Worker', icon: '⏰', description: 'Complete 10 Pomodoros', category: 'study' },
  { id: 'notes_first', name: 'Note Taker', icon: '📓', description: 'Add your first note', category: 'study' },
  { id: 'tutor_first', name: 'AI Student', icon: '🤖', description: 'Send your first tutor message', category: 'study' },
  { id: 'tutor_100', name: 'Tutor Regular', icon: '💬', description: 'Send 100 tutor messages', category: 'study' },
]

function getLevel(xp: number) {
  let current = LEVELS[0]
  for (const l of LEVELS) {
    if (xp >= l.minXP) current = l
    else break
  }
  const nextIdx = LEVELS.findIndex(l => l.level === current.level) + 1
  const next = LEVELS[nextIdx] || null
  return { current, next }
}

function getMultiplier(streak: number): number {
  if (streak >= 30) return 2.0
  if (streak >= 7) return 1.5
  if (streak >= 3) return 1.25
  return 1.0
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
    .select('xp, level, streak_count')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const multiplier = getMultiplier(profile.streak_count || 0)
  const earnedXP = Math.round(baseXP * multiplier)
  const newXP = (profile.xp || 0) + earnedXP

  const { current: oldLevel } = getLevel(profile.xp || 0)
  const { current: newLevel, next: nextLevel } = getLevel(newXP)
  const leveledUp = newLevel.level > oldLevel.level

  // Update XP and level
  await supabase
    .from('profiles')
    .update({ xp: newXP, level: newLevel.level })
    .eq('id', user.id)

  const notifications = []
  const newBadges = []

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

    // Check level badges
    const levelBadgeMap: Record<number, string> = { 5: 'level_5', 10: 'level_10', 15: 'level_15', 20: 'level_20', 25: 'level_25' }
    if (levelBadgeMap[newLevel.level]) {
      const badge = BADGES.find(b => b.id === levelBadgeMap[newLevel.level])!
      const { error } = await supabase.from('user_badges').insert({ user_id: user.id, badge_id: badge.id }).select().single()
      if (!error) {
        newBadges.push(badge)
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
  }

  // Check action-specific badges
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

  // MCQ badges
  if (action === 'mcq_session_complete') {
    const { count } = await supabase.from('mcq_attempts').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
    if ((count || 0) >= 1) await checkAndAwardBadge('mcq_first')
    if ((count || 0) >= 10) await checkAndAwardBadge('mcq_10')
    if ((count || 0) >= 50) await checkAndAwardBadge('mcq_50')
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
  }

  // Streak badges
  const streak = profile.streak_count || 0
  if (streak >= 3) await checkAndAwardBadge('streak_3')
  if (streak >= 7) await checkAndAwardBadge('streak_7')
  if (streak >= 14) await checkAndAwardBadge('streak_14')
  if (streak >= 30) await checkAndAwardBadge('streak_30')

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
    streak: profile?.streak_count || 0,
    multiplier: getMultiplier(profile?.streak_count || 0),
    badges: allBadges,
  })
}