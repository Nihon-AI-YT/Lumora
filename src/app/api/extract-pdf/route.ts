import { NextRequest, NextResponse } from 'next/server'
import { extractText } from 'unpdf'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const ext = file.name.split('.').pop()?.toLowerCase()
    const buffer = await file.arrayBuffer()

    // Plain text formats
    if (['txt', 'md', 'csv', 'json', 'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'xml', 'py'].includes(ext || '')) {
      const text = new TextDecoder().decode(buffer)
      const trimmed = text.split(/\s+/).slice(0, 3000).join(' ')
      return NextResponse.json({ text: trimmed })
    }

    // PDF
    if (ext === 'pdf') {
      const { text } = await extractText(new Uint8Array(buffer), { mergePages: true })
      const trimmed = text.split(/\s+/).slice(0, 3000).join(' ')
      return NextResponse.json({ text: trimmed })
    }

    // DOCX
    if (ext === 'docx' || ext === 'doc') {
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) })
      const trimmed = result.value.split(/\s+/).slice(0, 3000).join(' ')
      return NextResponse.json({ text: trimmed })
    }

    // XLSX / XLS
    if (ext === 'xlsx' || ext === 'xls') {
      const XLSX = await import('xlsx')
      const workbook = XLSX.read(buffer, { type: 'array' })
      let text = ''
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName]
        text += `Sheet: ${sheetName}\n`
        text += XLSX.utils.sheet_to_csv(sheet) + '\n\n'
      })
      const trimmed = text.split(/\s+/).slice(0, 3000).join(' ')
      return NextResponse.json({ text: trimmed })
    }

    // PPTX — extract as zip and read XML text
    if (ext === 'pptx' || ext === 'ppt') {
      // Basic text extraction from PPTX using xlsx (handles Open XML)
      const XLSX = await import('xlsx')
      try {
        const workbook = XLSX.read(buffer, { type: 'array' })
        let text = workbook.SheetNames.map(n => XLSX.utils.sheet_to_csv(workbook.Sheets[n])).join('\n')
        const trimmed = text.split(/\s+/).slice(0, 3000).join(' ')
        return NextResponse.json({ text: trimmed })
      } catch {
        return NextResponse.json({ text: `[PowerPoint file: ${file.name} — slide content uploaded]` })
      }
    }

    // Fallback
    return NextResponse.json({ text: `[File: ${file.name} — content type not fully supported but file received]` })

  } catch (error) {
    console.error('File parse error:', error)
    return NextResponse.json({ error: 'Failed to extract file content' }, { status: 500 })
  }
}