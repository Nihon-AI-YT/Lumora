import { NextRequest, NextResponse } from 'next/server'

const prompt = (subject: string | null, topic: string, count: number, difficulty: string) =>
  `Generate ${count} multiple choice questions for a student studying the topic: "${topic}".
${subject ? `Subject: ${subject}` : 'First, identify the academic subject this topic belongs to (e.g. Physics, Mathematics, Biology, History, Japanese, Computer Science, Economics, etc.) — be specific.'}
Difficulty level: ${difficulty} (easy = basic recall, medium = application, hard = analysis/evaluation)

You MUST return ONLY a valid JSON object. No markdown, no code blocks, no explanation. Start with { and end with }.

Format:
{
  "subject": "${subject || 'detected subject name, 1-3 words'}",
  "questions": [
    {
      "question": "question text",
      "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
      "correct": "A) option1",
      "explanation": "clear explanation of why this answer is correct and why others are wrong"
    }
  ]
}

Requirements:
- Questions must test genuine understanding, not just memorization
- All 4 options must be plausible (no obviously wrong answers)
- Explanations must be educational and help the student learn
- Match difficulty level strictly
- The "subject" field must be a short, proper academic subject name (e.g. "Physics", "Combined Mathematics", "Japanese Language"), never "General" or vague`

async function tryGemini(subject: string | null, topic: string, count: number, difficulty: string) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY!,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt(subject, topic, count, difficulty) }] }],
        generationConfig: { temperature: 0.4, responseMimeType: 'application/json' }
      })
    }
  )
  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('No response from Gemini')
  const clean = text.replace(/```json|```/g, '').trim()
  const match = clean.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON object found')
  return JSON.parse(match[0])
}

async function tryGroq(subject: string | null, topic: string, count: number, difficulty: string) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.4,
      messages: [{ role: 'user', content: prompt(subject, topic, count, difficulty) }]
    })
  })
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content
  if (!text) throw new Error('No response from Groq')
  const clean = text.replace(/```json|```/g, '').trim()
  const match = clean.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON object found in Groq response')
  return JSON.parse(match[0])
}

export async function POST(req: NextRequest) {
  const { topic, subject = null, count = 5, difficulty = 'medium' } = await req.json()

  try {
    let result
    try {
      result = await tryGroq(subject, topic, count, difficulty)
    } catch (groqError) {
      console.warn('Groq failed, falling back to Gemini:', groqError)
      result = await tryGemini(subject, topic, count, difficulty)
    }
    return NextResponse.json({ questions: result.questions, subject: result.subject || subject || 'General' })
  } catch (error) {
    console.error('Both Gemini and Groq failed:', error)
    return NextResponse.json({ error: 'Failed to generate questions' }, { status: 500 })
  }
}