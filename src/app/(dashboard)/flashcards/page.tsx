'use client'
import { useState } from 'react'

interface Card {
  front: string
  back: string
}

export default function FlashcardsPage() {
  const [subject, setSubject] = useState('')
  const [topic, setTopic] = useState('')
  const [cards, setCards] = useState<Card[]>([])
  const [flipped, setFlipped] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const generateCards = async () => {
    if (!subject || !topic) return
    setLoading(true)
    setError('')
    setCards([])
    setFlipped(null)

    try {
      const res = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, topic, count: 8 })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setCards(data.cards)
    } catch (e) {
      setError('Failed to generate cards. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-2">AI Flashcards 🃏</h1>
      <p className="text-gray-400 mb-8">Generate smart flashcards for any topic instantly</p>

      <div className="flex gap-4 mb-8">
        <select
          value={subject}
          onChange={e => setSubject(e.target.value)}
          className="p-3 rounded-lg bg-gray-900 text-white border border-gray-700 focus:outline-none focus:border-indigo-500"
        >
          <option value="">Select Subject</option>
          <option value="Combined Maths">Combined Maths</option>
          <option value="Physics">Physics</option>
          <option value="Chemistry">Chemistry</option>
        </select>

        <input
          type="text"
          placeholder="Enter topic (e.g. Integration, Newton's Laws)"
          value={topic}
          onChange={e => setTopic(e.target.value)}
          className="flex-1 p-3 rounded-lg bg-gray-900 text-white border border-gray-700 focus:outline-none focus:border-indigo-500"
        />

        <button
          onClick={generateCards}
          disabled={loading || !subject || !topic}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate'}
        </button>
      </div>

      {error && <p className="text-red-400 mb-4">{error}</p>}

      {loading && (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg animate-pulse">Generating flashcards with AI...</p>
        </div>
      )}

      {cards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card, i) => (
            <div
              key={i}
              onClick={() => setFlipped(flipped === i ? null : i)}
              className="cursor-pointer bg-gray-900 border border-gray-800 rounded-2xl p-6 min-h-[160px] flex flex-col justify-between hover:border-indigo-500 transition"
            >
              <div>
                <p className="text-xs text-indigo-400 mb-3 uppercase tracking-wider">
                  {flipped === i ? 'Answer' : 'Question'}
                </p>
                <p className="text-white text-lg leading-relaxed">
                  {flipped === i ? card.back : card.front}
                </p>
              </div>
              <p className="text-gray-600 text-xs mt-4">
                {flipped === i ? '👆 Click to see question' : '👆 Click to reveal answer'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}