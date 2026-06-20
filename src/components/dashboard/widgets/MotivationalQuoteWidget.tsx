'use client'

import { useState, useEffect } from 'react'

const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Hard work beats talent when talent doesn't work hard.", author: "Tim Notke" },
  { text: "Education is the most powerful weapon you can use to change the world.", author: "Nelson Mandela" },
  { text: "The more that you read, the more things you will know.", author: "Dr. Seuss" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { text: "Great things never come from comfort zones.", author: "Unknown" },
  { text: "Dream it. Wish it. Do it.", author: "Unknown" },
  { text: "Study now, flex later.", author: "Lumora" },
  { text: "Your future self is watching. Make them proud.", author: "Lumora" },
]

export default function MotivationalQuoteWidget() {
  const [quote, setQuote] = useState(QUOTES[0])
  const [fade, setFade] = useState(true)

  useEffect(() => {
    // Pick quote based on day so it's consistent per day
    const dayIndex = new Date().getDate() % QUOTES.length
    setQuote(QUOTES[dayIndex])
  }, [])

  const shuffle = () => {
    setFade(false)
    setTimeout(() => {
      const random = QUOTES[Math.floor(Math.random() * QUOTES.length)]
      setQuote(random)
      setFade(true)
    }, 200)
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.75)',
      backdropFilter: 'blur(12px)',
      borderRadius: '16px',
      padding: '20px',
      height: '100%',
      minHeight: '200px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      border: '1px solid #e8e0f0',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span style={{ fontSize: '18px' }}>💬</span>
        <p style={{ margin: 0, fontWeight: 700, fontSize: '14px', color: '#1a1a2e' }}>Daily Quote</p>
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        opacity: fade ? 1 : 0,
        transition: 'opacity 0.2s ease',
      }}>
        <p style={{
          margin: '0 0 10px',
          fontSize: '14px',
          fontStyle: 'italic',
          color: '#1a1a2e',
          lineHeight: 1.5,
          fontWeight: 500,
        }}>
          "{quote.text}"
        </p>
        <p style={{ margin: 0, fontSize: '12px', color: '#a855f7', fontWeight: 600 }}>
          — {quote.author}
        </p>
      </div>

      <button onClick={shuffle} style={{
        marginTop: '14px',
        padding: '7px 14px',
        borderRadius: '10px',
        border: '1px solid #e8e0f0',
        background: 'white',
        cursor: 'pointer',
        fontSize: '12px',
        color: '#a855f7',
        fontWeight: 600,
        alignSelf: 'flex-start',
      }}>
        🔀 New quote
      </button>
    </div>
  )
}