import { NextRequest, NextResponse } from 'next/server'
import { extractText } from 'unpdf'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const buffer = await file.arrayBuffer()
    const { text } = await extractText(new Uint8Array(buffer), { mergePages: true })

    // Trim to ~3000 words to stay within Gemini context
    const words = text.split(/\s+/).slice(0, 3000)
    const trimmed = words.join(' ')

    return NextResponse.json({ text: trimmed })
  } catch (error) {
    console.error('PDF parse error:', error)
    return NextResponse.json({ error: 'Failed to extract PDF' }, { status: 500 })
  }
}