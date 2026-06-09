import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { topic, subject, count = 8 } = await req.json()

  const prompt = `Generate ${count} flashcards for a student studying ${subject} on the topic: "${topic}".

You MUST return ONLY a valid JSON array. No markdown, no code blocks, no explanation. Start with [ and end with ].

Format:
[
  {
    "front": "question or concept",
    "back": "clear, detailed answer"
  }
]

Requirements:
- Front: a clear question or concept to recall
- Back: a thorough answer — include formulas, definitions, examples where relevant
- Write math in plain text: a^2 + b^2 = c^2, sqrt(x), (a+b)/c
- Cover key definitions, formulas, theorems, and applications
- Mix question types: definitions, calculations, explanations, applications
- Make cards genuinely useful for exam revision`

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
    console.log('Gemini response:', JSON.stringify(data, null, 2))
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) throw new Error('No response from Gemini')
    const clean = text.replace(/```json|```/g, '').trim()
    const match = clean.match(/\[[\s\S]*\]/)
    if (!match) throw new Error('No JSON array found')
    const cards = JSON.parse(match[0])
    return NextResponse.json({ cards })
  } catch (error) {
    console.error('Gemini error:', error)
    return NextResponse.json({ error: 'Failed to generate flashcards' }, { status: 500 })
  }
}