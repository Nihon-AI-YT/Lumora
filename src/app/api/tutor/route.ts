import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { messages } = await req.json()

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
          {
            role: 'system',
            content: `You are Lumora, an expert AI tutor for Sri Lankan A/L students studying Combined Maths, Physics, and Chemistry. 
You explain concepts clearly, step by step. You use simple language but maintain academic accuracy.
When solving problems, always show full working. Use Sri Lankan A/L syllabus as your reference.
Be encouraging and supportive.`
          },
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