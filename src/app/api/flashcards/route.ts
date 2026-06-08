import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { topic, subject, count = 8 } = await req.json()

  const prompt = `Generate ${count} flashcards for a student studying ${subject} on the topic: "${topic}".

Rules:
- Return ONLY a valid JSON array. No markdown, no code blocks, no extra text.
- Format: [{"front": "question", "back": "answer"}]
- Write math expressions in plain readable text, for example: "a^2 + b^2 = c^2" or "f(x) = x/2"
- Do NOT use LaTeX backslash commands like \\frac or \\sqrt — write fractions as a/b and roots as sqrt(x)
- Make questions test deep understanding with key formulas and definitions.

Start your response with [ and end with ]`

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
        temperature: 0.5
      })
    })
    const data = await res.json()
    const text = data.choices[0].message.content
    const clean = text.replace(/```json|```/g, '').trim()
    const match = clean.match(/\[[\s\S]*\]/)
    if (!match) throw new Error('No JSON array found')
    const cards = JSON.parse(match[0])
    return NextResponse.json({ cards })
  } catch (error) {
    console.error('Groq error:', error)
    return NextResponse.json({ error: 'Failed to generate flashcards' }, { status: 500 })
  }
}