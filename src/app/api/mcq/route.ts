import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { topic, subject, count = 5, difficulty = 'medium' } = await req.json()

  const prompt = `Generate ${count} multiple choice questions for a student studying ${subject} on the topic: "${topic}".
Difficulty level: ${difficulty} (easy = basic recall, medium = application, hard = analysis/evaluation)

You MUST return ONLY a valid JSON array. No markdown, no code blocks, no explanation. Start with [ and end with ].

Format:
[
  {
    "question": "question text",
    "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
    "correct": "A) option1",
    "explanation": "clear explanation of why this answer is correct and why others are wrong"
  }
]

Requirements:
- Questions must test genuine understanding, not just memorization
- All 4 options must be plausible (no obviously wrong answers)
- Explanations must be educational and help the student learn
- Match difficulty level strictly`

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY!,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            responseMimeType: 'application/json',
          }
        })
      }
    )
    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) throw new Error('No response from Gemini')
    const clean = text.replace(/```json|```/g, '').trim()
    const match = clean.match(/\[[\s\S]*\]/)
    if (!match) throw new Error('No JSON array found')
    const questions = JSON.parse(match[0])
    return NextResponse.json({ questions })
  } catch (error) {
    console.error('Gemini error:', error)
    return NextResponse.json({ error: 'Failed to generate questions' }, { status: 500 })
  }
}