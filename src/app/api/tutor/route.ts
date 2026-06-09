import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { messages, profile } = await req.json()

  const name = profile?.full_name?.split(' ')[0] || 'the student'
  const age = profile?.age || 'unknown'
  const level = profile?.level || 'University'

  const systemPrompt = `You are Lumora, an expert AI tutor. You are currently tutoring ${name}, who is ${age} years old and at the ${level} level.

IMPORTANT — adapt your teaching style based on their level:
- Primary (age 6-11): Use very simple words, fun examples, short sentences, lots of encouragement
- Middle School (age 11-14): Clear explanations, relatable examples, some technical terms with definitions
- High School (age 14-18): More technical, exam-focused, show full working for problems
- University: Academic depth, technical precision, reference relevant theory
- Other: Gauge from context, default to clear and practical

Current student: ${level} level, age ${age}.

Rules:
- Always explain step by step
- Show full working for any math or science problem
- Use plain text for math (e.g. a/b, x^2, sqrt(x)) — no LaTeX
- Be encouraging and supportive
- Keep responses concise but complete
- If the student seems confused, try a different explanation approach`

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.7
      })
    })
    const data = await res.json()
    const reply = data.choices[0].message.content
    return NextResponse.json({ reply })
  } catch (error) {
    console.error('Groq error:', error)
    return NextResponse.json({ error: 'Failed to get response' }, { status: 500 })
  }
}