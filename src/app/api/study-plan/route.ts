import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const setup = searchParams.get('setup')

  if (setup) {
    const { data: attempts } = await supabase
      .from('mcq_attempts')
      .select('subject, topic, score, total')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)

    const topicMap: Record<string, { score: number; total: number; subject: string }> = {}
    for (const a of attempts || []) {
      if (!topicMap[a.topic]) topicMap[a.topic] = { score: 0, total: 0, subject: a.subject }
      topicMap[a.topic].score += a.score
      topicMap[a.topic].total += a.total
    }
    const weakTopics = Object.entries(topicMap)
      .map(([topic, val]) => ({
        topic,
        subject: val.subject,
        pct: val.total > 0 ? Math.round((val.score / val.total) * 100) : 0
      }))
      .filter(t => t.pct < 60)
      .sort((a, b) => a.pct - b.pct)
      .slice(0, 10)

    return NextResponse.json({ weakTopics })
  }

  const { data } = await supabase
    .from('study_plans')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return NextResponse.json({ plan: data || null })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { selectedExamIds, selectedTopics } = await req.json()

  const { data: allExams } = await supabase
    .from('exams')
    .select('name, exam_date, priority')
    .eq('user_id', user.id)
    .in('id', selectedExamIds || [])
    .order('exam_date', { ascending: true })

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const today = new Date().toISOString().split('T')[0]

  const prompt = `You are an expert study planner for a student. Generate a personalized 4-week study plan.

Student: ${profile?.full_name || 'Student'}
Today: ${today}

Upcoming Exams to focus on:
${allExams && allExams.length > 0 ? allExams.map(e => `- ${e.name} on ${e.exam_date} (${e.priority} priority)`).join('\n') : '- No exams selected'}

Weak Topics to improve (selected by student):
${selectedTopics && selectedTopics.length > 0 ? selectedTopics.map((t: string) => `- ${t}`).join('\n') : '- No weak topics selected, suggest general study habits'}

Generate a 4-week study plan with 3-5 tasks per week. Each task should be specific and actionable.

Respond ONLY with a valid JSON array, no markdown, no explanation:
[
  {
    "week": 1,
    "title": "Week 1: Foundation",
    "tasks": [
      {
        "id": "w1t1",
        "title": "Study Newton's Laws",
        "subject": "Physics",
        "topic": "Newton's Laws",
        "type": "tutor",
        "description": "Use AI Tutor to understand all 3 laws with examples",
        "completed": false
      }
    ]
  }
]

Task types: "tutor", "mcq", "flashcards", "exam", "review"
Make tasks specific to the student's selected weak topics and exams.`

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.4,
        messages: [{ role: 'user', content: prompt }]
      })
    })
    const groqData = await groqRes.json()
    let content = groqData.choices?.[0]?.message?.content || ''
    content = content.replace(/```json|```/g, '').trim()
    const planData = JSON.parse(content)

    await supabase.from('study_plans').delete().eq('user_id', user.id)
    const { data: saved } = await supabase
      .from('study_plans')
      .insert({ user_id: user.id, plan: planData })
      .select()
      .single()

    return NextResponse.json({ plan: saved })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to generate plan' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { plan_id, plan } = await req.json()
  if (!plan_id || !plan) return NextResponse.json({ error: 'Missing data' }, { status: 400 })

  const { error } = await supabase
    .from('study_plans')
    .update({ plan })
    .eq('id', plan_id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}