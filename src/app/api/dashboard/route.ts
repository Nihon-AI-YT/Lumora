import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('profiles')
    .select('dashboard_widgets')
    .eq('id', user.id)
    .single()

  return NextResponse.json({
    widgets: data?.dashboard_widgets || ['exam_countdown', 'weak_topic', 'daily_goal', 'pomodoro']
  })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { widgets } = await req.json()

  await supabase
    .from('profiles')
    .update({ dashboard_widgets: widgets })
    .eq('id', user.id)

  return NextResponse.json({ success: true })
}