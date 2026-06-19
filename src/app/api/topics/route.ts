import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const subjectId = req.nextUrl.searchParams.get('subject_id')
  if (!subjectId) return NextResponse.json({ error: 'subject_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('subject_id', subjectId)
    .eq('user_id', user.id)
    .order('order_index', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // For each topic, get intelligence level from mcq_attempts
  const topicsWithIntelligence = await Promise.all((data || []).map(async (topic) => {
    const { data: attempts } = await supabase
      .from('mcq_attempts')
      .select('score, total')
      .eq('user_id', user.id)
      .ilike('topic', `%${topic.name}%`)

    if (!attempts || attempts.length === 0) return { ...topic, intelligence: null }

    const totalScore = attempts.reduce((a, b) => a + b.score, 0)
    const totalQuestions = attempts.reduce((a, b) => a + b.total, 0)
    const intelligence = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : null

    return { ...topic, intelligence }
  }))

  return NextResponse.json({ topics: topicsWithIntelligence })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { subject_id, name, order_index } = await req.json()
  if (!subject_id || !name) return NextResponse.json({ error: 'subject_id and name required' }, { status: 400 })

  const { data, error } = await supabase
    .from('topics')
    .insert({ subject_id, user_id: user.id, name, order_index: order_index || 0 })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ topic: { ...data, intelligence: null } })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  const { error } = await supabase
    .from('topics')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}