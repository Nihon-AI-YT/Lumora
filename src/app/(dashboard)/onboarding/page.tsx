'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const levels = [
  { label: 'Primary', sublabel: 'Age 6–11', value: 'Primary' },
  { label: 'Middle School', sublabel: 'Age 11–14', value: 'Middle School' },
  { label: 'High School', sublabel: 'Age 14–18', value: 'High School' },
  { label: 'University', sublabel: 'Undergraduate & above', value: 'University' },
  { label: 'Other', sublabel: 'Self-learner / Professional', value: 'Other' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [level, setLevel] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleFinish() {
    if (!level) return
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error: err } = await supabase
      .from('profiles')
      .update({
        full_name: name.trim(),
        age: parseInt(age) || null,
        level,
        onboarded: true,
      })
      .eq('id', user.id)

    if (err) {
      setError('Something went wrong. Try again.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-10">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                step >= s ? 'bg-indigo-500 w-8' : 'bg-gray-700 w-2'
              }`}
            />
          ))}
        </div>

        {/* Step 1 — Name */}
        {step === 1 && (
          <div className="text-center">
            <div className="text-5xl mb-6">👋</div>
            <h1 className="text-3xl font-bold text-white mb-2">Hey! I'm Lumora</h1>
            <p className="text-gray-400 mb-8">Your personal AI tutor. What's your name?</p>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white text-center text-lg focus:outline-none focus:border-indigo-500 mb-6"
              onKeyDown={e => e.key === 'Enter' && name.trim() && setStep(2)}
              autoFocus
            />
            <button
              onClick={() => setStep(2)}
              disabled={!name.trim()}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition"
            >
              Continue →
            </button>
          </div>
        )}

        {/* Step 2 — Age */}
        {step === 2 && (
          <div className="text-center">
            <div className="text-5xl mb-6">🎂</div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Nice to meet you, {name}!
            </h1>
            <p className="text-gray-400 mb-8">How old are you?</p>
            <input
              type="number"
              value={age}
              onChange={e => setAge(e.target.value)}
              placeholder="Your age"
              min={5}
              max={99}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white text-center text-lg focus:outline-none focus:border-indigo-500 mb-6"
              onKeyDown={e => e.key === 'Enter' && age && setStep(3)}
              autoFocus
            />
            <button
              onClick={() => setStep(3)}
              disabled={!age}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition"
            >
              Continue →
            </button>
            <button onClick={() => setStep(1)} className="mt-3 text-gray-500 hover:text-gray-300 text-sm transition">
              ← Back
            </button>
          </div>
        )}

        {/* Step 3 — Level */}
        {step === 3 && (
          <div>
            <div className="text-center mb-8">
              <div className="text-5xl mb-6">🎓</div>
              <h1 className="text-3xl font-bold text-white mb-2">What level are you at?</h1>
              <p className="text-gray-400">Lumora will explain things at the right depth for you.</p>
            </div>
            <div className="flex flex-col gap-3 mb-6">
              {levels.map(l => (
                <button
                  key={l.value}
                  onClick={() => setLevel(l.value)}
                  className={`w-full flex items-center justify-between px-5 py-4 rounded-xl border transition text-left ${
                    level === l.value
                      ? 'border-indigo-500 bg-indigo-500/10 text-white'
                      : 'border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <span className="font-semibold">{l.label}</span>
                  <span className="text-sm text-gray-500">{l.sublabel}</span>
                </button>
              ))}
            </div>
            {error && <p className="text-red-400 text-sm text-center mb-3">{error}</p>}
            <button
              onClick={handleFinish}
              disabled={!level || loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition"
            >
              {loading ? 'Setting up your space...' : "Let's go 🚀"}
            </button>
            <button onClick={() => setStep(2)} className="mt-3 w-full text-center text-gray-500 hover:text-gray-300 text-sm transition">
              ← Back
            </button>
          </div>
        )}

      </div>
    </main>
  )
}