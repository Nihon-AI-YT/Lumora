'use client'
import { useState } from 'react'

interface Question {
  question: string
  options: string[]
  correct: string
  explanation: string
}

export default function MCQPage() {
  const [subject, setSubject] = useState('')
  const [topic, setTopic] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [score, setScore] = useState(0)

  const generateQuestions = async () => {
    if (!subject || !topic) return
    setLoading(true)
    setQuestions([])
    setSelected([])
    setSubmitted(false)
    setScore(0)

    try {
      const res = await fetch('/api/mcq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, topic, count: 5 })
      })
      const data = await res.json()
      setQuestions(data.questions)
      setSelected(new Array(data.questions.length).fill(''))
    } catch {
      alert('Failed to generate questions.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = () => {
    let s = 0
    questions.forEach((q, i) => {
      if (selected[i] === q.correct) s++
    })
    setScore(s)
    setSubmitted(true)
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-2">MCQ Practice 📝</h1>
      <p className="text-gray-400 mb-8">AI-generated exam-style questions</p>

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
          placeholder="Enter topic"
          value={topic}
          onChange={e => setTopic(e.target.value)}
          className="flex-1 p-3 rounded-lg bg-gray-900 text-white border border-gray-700 focus:outline-none focus:border-indigo-500"
        />

        <button
          onClick={generateQuestions}
          disabled={loading || !subject || !topic}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate'}
        </button>
      </div>

      {submitted && (
        <div className="mb-8 p-6 bg-gray-900 rounded-2xl border border-gray-800">
          <p className="text-2xl font-bold text-white">
            Score: <span className={score >= 3 ? 'text-green-400' : 'text-red-400'}>{score}/{questions.length}</span>
          </p>
          <p className="text-gray-400 mt-1">{score === questions.length ? '🎉 Perfect score!' : score >= 3 ? '👍 Good job!' : '📚 Keep practicing!'}</p>
        </div>
      )}

      {questions.length > 0 && (
        <div className="flex flex-col gap-6">
          {questions.map((q, i) => (
            <div key={i} className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <p className="text-white font-semibold mb-4">
                <span className="text-indigo-400 mr-2">{i + 1}.</span>{q.question}
              </p>
              <div className="flex flex-col gap-2">
                {q.options.map((opt, j) => {
                  let style = 'border-gray-700 text-gray-300 hover:border-indigo-500'
                  if (submitted) {
                    if (opt === q.correct) style = 'border-green-500 text-green-400 bg-green-500/10'
                    else if (opt === selected[i]) style = 'border-red-500 text-red-400 bg-red-500/10'
                  } else if (selected[i] === opt) {
                    style = 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                  }
                  return (
                    <button
                      key={j}
                      disabled={submitted}
                      onClick={() => {
                        const updated = [...selected]
                        updated[i] = opt
                        setSelected(updated)
                      }}
                      className={`text-left p-3 rounded-lg border transition ${style}`}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
              {submitted && (
                <p className="text-gray-400 text-sm mt-4">💡 {q.explanation}</p>
              )}
            </div>
          ))}

          {!submitted && (
            <button
              onClick={handleSubmit}
              disabled={selected.includes('')}
              className="w-full p-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition disabled:opacity-50"
            >
              Submit Answers
            </button>
          )}
        </div>
      )}
    </div>
  )
}