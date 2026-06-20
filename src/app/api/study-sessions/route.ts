import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Today
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Start of week (Monday)
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)

  const { data: todaySessions } = await supabase
    .from('study_sessions')
    .select('minutes')
    .eq('user_id', user.id)
    .gte('created_at', today.toISOString())

  const { data: weeklySessions } = await supabase
    .from('study_sessions')
    .select('minutes')
    .eq('user_id', user.id)
    .gte('created_at', monday.toISOString())

  const minutesToday = todaySessions?.reduce((sum, s) => sum + s.minutes, 0) || 0
  const minutesWeek = weeklySessions?.reduce((sum, s) => sum + s.minutes, 0) || 0

  return NextResponse.json({ minutesToday, minutesWeek })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { minutes, session_type } = await req.json()
  if (!minutes || minutes <= 0) return NextResponse.json({ error: 'Invalid minutes' }, { status: 400 })

  const { error } = await supabase
    .from('study_sessions')
    .insert({ user_id: user.id, minutes, session_type: session_type || 'pomodoro' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}