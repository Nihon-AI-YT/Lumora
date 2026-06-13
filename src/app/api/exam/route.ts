import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { subject, topic, count = 10, difficulty = 'medium', examType = 'mixed' } = await req.json()

  const prompt = `Generate a ${examType} exam with ${count} questions for a student studying ${subject} on the topic: "${topic}".
Difficulty: ${difficulty} (easy = basic recall, medium = application, hard = analysis/deep understanding)
Exam type: ${examType} (mixed = MCQ + short answer, mcq = multiple choice only, written = short answer only)

Return ONLY a valid JSON object. No markdown, no code blocks. Start with { and end with }.

Format:
{
  "title": "exam title",
  "subject": "${subject}",
  "topic": "${topic}",
  "duration_minutes": 30,
  "questions": [
    {
      "id": 1,
      "type": "mcq",
      "question": "question text",
      "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
      "correct": "A) option1",
      "marks": 2,
      "explanation": "why this is correct"
    },
    {
      "id": 2,
      "type": "short",
      "question": "question text",
      "sample_answer": "model answer",
      "marks": 5,
      "keywords": ["key1", "key2", "key3"]
    }
  ],
  "total_marks": 30
}

Requirements:
- Mix question types naturally (60% MCQ, 40% short answer for mixed)
- Questions must progress from easier to harder
- Each question must test genuine understanding
- Short answer keywords are the key points the answer must include
- Make it feel like a real exam`

  async function tryGemini(): Promise<string> {
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
          generationConfig: { temperature: 0.4 }
        })
      }
    )
    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) throw new Error('Gemini unavailable')
    return text
  }

  async function tryGroq(): Promise<string> {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4
      })
    })
    const data = await res.json()
    const text = data.choices?.[0]?.message?.content
    if (!text) throw new Error('Groq unavailable')
    return text
  }

  try {
    let text: string
    try {
      text = await tryGemini()
    } catch {
      console.log('Gemini busy, falling back to Groq')
      text = await tryGroq()
    }
    const clean = text.replace(/```json|```/g, '').trim()
    const match = clean.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON found')
    const exam = JSON.parse(match[0])
    return NextResponse.json({ exam })
  } catch (error) {
    console.error('Exam generation error:', error)
    return NextResponse.json({ error: 'Failed to generate exam' }, { status: 500 })
  }
}