import { NextRequest, NextResponse } from 'next/server'

interface WrongQuestion {
  question: string
  selected: string
  correct: string
}

const prompt = (subject: string, topic: string, wrongQuestions: WrongQuestion[], count: number) => {
  const mistakesList = wrongQuestions.map((q, i) =>
    `${i + 1}. Question: "${q.question}"\n   Student picked: ${q.selected}\n   Correct answer: ${q.correct}`
  ).join('\n\n')

  return `A student studying ${subject} — ${topic} has gotten these questions wrong in the past:

${mistakesList}

For each wrong answer, first figure out the underlying concept or misconception causing the mistake. Then generate ${count} BRAND NEW multiple choice questions that test those same underlying concepts — different scenarios, different wording, different numbers where relevant. Do NOT reuse or lightly reword the original questions above — they must be genuinely new questions testing the same gap in understanding.

You MUST return ONLY a valid JSON object. No markdown, no code blocks, no explanation. Start with { and end with }.
Format:
{
  "questions": [
    {
      "question": "question text",
      "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
      "correct": "A) option1",
      "explanation": "clear explanation of why this answer is correct, and why this is the same type of mistake as before"
    }
  ]
}
Requirements:
- Questions must test genuine understanding of the concept the student struggled with
- All 4 options must be plausible (no obviously wrong answers)
- Explanations must directly address the kind of mistake the student keeps making
- Do not copy the original question wording or numbers`
}

async function tryGemini(subject: string, topic: string, wrongQuestions: WrongQuestion[], count: number) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY!,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt(subject, topic, wrongQuestions, count) }] }],
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

async function tryGroq(subject: string, topic: string, wrongQuestions: WrongQuestion[], count: number) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.4,
      messages: [{ role: 'user', content: prompt(subject, topic, wrongQuestions, count) }]
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
  const { subject, topic, wrongQuestions, count = 5 } = await req.json()

  if (!wrongQuestions || wrongQuestions.length === 0) {
    return NextResponse.json({ error: 'No wrong questions provided' }, { status: 400 })
  }

  const capped = wrongQuestions.slice(0, 15)

  try {
    let result
    try {
      result = await tryGroq(subject, topic, capped, count)
    } catch (groqError) {
      console.warn('Groq failed, falling back to Gemini:', groqError)
      result = await tryGemini(subject, topic, capped, count)
    }
    return NextResponse.json({ questions: result.questions })
  } catch (error) {
    console.error('Both Gemini and Groq failed:', error)
    return NextResponse.json({ error: 'Failed to generate drill questions' }, { status: 500 })
  }
}