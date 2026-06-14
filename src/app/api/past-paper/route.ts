import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { pdfText, pdfBase64, subject } = await req.json()

  if (!pdfText && !pdfBase64) {
    return NextResponse.json({ error: 'No PDF provided' }, { status: 400 })
  }

  const isScanned = !pdfText || pdfText.trim().length < 500

  const jsonFormat = `{
  "title": "paper title if visible, otherwise '${subject} Past Paper'",
  "subject": "${subject}",
  "duration_minutes": 60,
  "questions": [
    {
      "id": 1,
      "type": "mcq",
      "question": "exact question text",
      "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
      "correct": "A) option1",
      "marks": 2,
      "explanation": "why this is correct"
    },
    {
      "id": 2,
      "type": "short",
      "question": "exact question text",
      "sample_answer": "model answer",
      "marks": 5,
      "keywords": ["key1", "key2"]
    }
  ],
  "total_marks": 50
}`

  const instructions = `You are an expert at reading exam papers. Extract every question from this past paper exactly as written.

Rules:
- Extract REAL questions only — do not invent or paraphrase
- Identify type: "mcq" if it has options, "short" if it requires a written answer
- For MCQ, extract options exactly as they appear, normalize to "A) ...", "B) ...", etc.
- Provide correct answer and explanation for each MCQ
- Provide sample_answer and keywords for each short question
- Marks: use visible marks, otherwise 2 for MCQ and 5 for short
- If you cannot find clear questions, return { "error": "No clear questions found in this document" }

Return ONLY valid JSON. No markdown, no code blocks. Start with { and end with }.

Format:
${jsonFormat}`

  async function tryGeminiVision(): Promise<string> {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY!,
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inline_data: {
                  mime_type: 'application/pdf',
                  data: pdfBase64
                }
              },
              { text: instructions }
            ]
          }],
          generationConfig: { temperature: 0.1 }
        })
      }
    )
    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) throw new Error('Gemini vision unavailable')
    return text
  }

  async function tryGeminiText(): Promise<string> {
    const prompt = `${instructions}\n\nPDF TEXT:\n${pdfText!.slice(0, 12000)}`
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
          generationConfig: { temperature: 0.1 }
        })
      }
    )
    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) throw new Error('Gemini unavailable')
    return text
  }

  async function tryGroq(): Promise<string> {
    const prompt = `${instructions}\n\nPDF TEXT:\n${pdfText!.slice(0, 12000)}`
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1
      })
    })
    const data = await res.json()
    const text = data.choices?.[0]?.message?.content
    if (!text) throw new Error('Groq unavailable')
    return text
  }

  try {
    let text: string

    if (isScanned && pdfBase64) {
      // Scanned PDF — use Gemini vision
      console.log('Scanned PDF detected, using Gemini vision')
      text = await tryGeminiVision()
    } else {
      // Text-based PDF — try Gemini text, fall back to Groq
      console.log('Text PDF detected, using Gemini text')
      try {
        text = await tryGeminiText()
      } catch {
        console.log('Gemini text failed, falling back to Groq')
        text = await tryGroq()
      }
    }

    const clean = text.replace(/```json|```/g, '').trim()
    const match = clean.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON found')
    const parsed = JSON.parse(match[0])
    if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 422 })
    return NextResponse.json({ exam: parsed })
  } catch (error) {
    console.error('Past paper extraction error:', error)
    return NextResponse.json({ error: 'Failed to extract questions from paper' }, { status: 500 })
  }
}