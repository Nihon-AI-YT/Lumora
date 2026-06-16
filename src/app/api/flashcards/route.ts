import { NextRequest, NextResponse } from 'next/server'

const prompt = (subject: string | null, topic: string, count: number) =>
  `Generate ${count} flashcards for a student studying the topic: "${topic}".
${subject ? `Subject: ${subject}` : 'First, identify the academic subject this topic belongs to (e.g. Physics, Mathematics, Biology, History, Japanese, Computer Science, Economics, etc.) — be specific.'}

You MUST return ONLY a valid JSON object. No markdown, no code blocks, no explanation. Start with { and end with }.

Format:
{
  "subject": "${subject || 'detected subject name, 1-3 words'}",
  "cards": [
    {
      "front": "question or concept",
      "back": "clear, detailed answer"
    }
  ]
}

Requirements:
- Front: a clear question or concept to recall
- Back: a thorough answer — include formulas, definitions, examples where relevant
- Write math in plain text: a^2 + b^2 = c^2, sqrt(x), (a+b)/c
- Cover key definitions, formulas, theorems, and applications
- Mix question types: definitions, calculations, explanations, applications
- Make cards genuinely useful for exam revision
- The "subject" field must be a short, proper academic subject name (e.g. "Physics", "Combined Mathematics", "Japanese Language"), never "General" or vague`

async function tryGemini(subject: string | null, topic: string, count: number) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY!,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt(subject, topic, count) }] }],
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

async function tryGroq(subject: string | null, topic: string, count: number) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.4,
      messages: [{ role: 'user', content: prompt(subject, topic, count) }]
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
  const { topic, subject = null, count = 8 } = await req.json()

  try {
    let result
    try {
      result = await tryGemini(subject, topic, count)
    } catch (geminiError) {
      console.warn('Gemini failed, falling back to Groq:', geminiError)
      result = await tryGroq(subject, topic, count)
    }
    return NextResponse.json({ cards: result.cards, subject: result.subject || subject || 'General' })
  } catch (error) {
    console.error('Both Gemini and Groq failed:', error)
    return NextResponse.json({ error: 'Failed to generate flashcards' }, { status: 500 })
  }
}