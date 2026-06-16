import { NextRequest, NextResponse } from 'next/server'
import { fetchTranscript } from 'youtube-transcript-plus'

export async function POST(req: NextRequest) {
  const { url } = await req.json()
  if (!url) return NextResponse.json({ error: 'No URL provided' }, { status: 400 })

  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
  if (!match) return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 })

  const videoId = match[1]

  try {
    const transcript = await fetchTranscript(videoId, {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    })
    if (!transcript || transcript.length === 0) {
      return NextResponse.json({ error: 'No transcript available for this video' }, { status: 422 })
    }
    const text = transcript.map(t => t.text).join(' ')

    let title = videoId
    try {
      const oEmbed = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`)
      const oData = await oEmbed.json()
      if (oData.title) title = oData.title
    } catch { /* fallback to videoId */ }

    return NextResponse.json({ text, videoId, title })
  } catch (error) {
    console.error('Transcript fetch error:', error)
    return NextResponse.json({ error: 'Could not fetch transcript. Video may have captions disabled or YouTube is rate-limiting requests.' }, { status: 422 })
  }
}