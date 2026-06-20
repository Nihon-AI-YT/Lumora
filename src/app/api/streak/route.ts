import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('streak_count, last_active')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const lastActive = profile.last_active ? new Date(profile.last_active) : null
  if (lastActive) lastActive.setHours(0, 0, 0, 0)

  const todayStr = today.toISOString().split('T')[0]

  // Already updated today — do nothing
  if (lastActive && lastActive.getTime() === today.getTime()) {
    return NextResponse.json({ streak: profile.streak_count, updated: false })
  }

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  let newStreak: number

  if (lastActive && lastActive.getTime() === yesterday.getTime()) {
    // Studied yesterday — keep streak going
    newStreak = (profile.streak_count || 0) + 1
  } else {
    // Missed a day or first time — reset to 1
    newStreak = 1
  }

  await supabase
    .from('profiles')
    .update({ streak_count: newStreak, last_active: todayStr })
    .eq('id', user.id)

  return NextResponse.json({ streak: newStreak, updated: true })
}