import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { topic, subject, count = 5 } = await req.json()

  const prompt = `Generate ${count} multiple choice questions for a Sri Lankan A/L student studying ${subject} on the topic: "${topic}".

Return ONLY a JSON array, no extra text, no markdown code blocks. Format:
[
  {
    "question": "question text here",
    "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
    "correct": "A) option1",
    "explanation": "brief explanation why this is correct"
  }
]

Make questions exam-level difficulty, similar to Sri Lankan A/L past papers.`

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      })
    })
    const data = await res.json()
    const text = data.choices[0].message.content
    const clean = text.replace(/```json|```/g, '').trim()
    const questions = JSON.parse(clean)
    return NextResponse.json({ questions })
  } catch (error) {
    console.error('Groq error:', error)
    return NextResponse.json({ error: 'Failed to generate questions' }, { status: 500 })
  }
}