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
      .update({ full_name: name.trim(), age: parseInt(age) || null, education_level: level, onboarded: true })
      .eq('id', user.id)
    if (err) {
      setError('Something went wrong. Try again.')
      setLoading(false)
      return
    }
    router.push('/dashboard')
  }

  return (
    <>
      <style>{`
        .ob-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }
        .ob-card {
          width: 100%;
          max-width: 440px;
          background: rgba(255,255,255,0.75);
          backdrop-filter: blur(20px);
          border: 1px solid #e8e0f0;
          border-radius: 24px;
          padding: 40px;
          box-shadow: 0 8px 40px rgba(168,85,247,0.08);
        }
        .ob-steps {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-bottom: 36px;
        }
        .ob-step {
          height: 4px;
          border-radius: 4px;
          transition: all 0.3s;
          background: #e8e0f0;
          width: 24px;
        }
        .ob-step.active {
          background: linear-gradient(135deg, #a855f7, #ec4899);
          width: 40px;
        }
        .ob-emoji {
          font-size: 2.5rem;
          text-align: center;
          margin-bottom: 16px;
        }
        .ob-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1a1a2e;
          text-align: center;
          margin-bottom: 6px;
        }
        .ob-sub {
          font-size: 0.875rem;
          color: #9ca3af;
          text-align: center;
          margin-bottom: 28px;
        }
        .ob-input {
          width: 100%;
          background: rgba(255,255,255,0.8);
          border: 1px solid #e8e0f0;
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 0.95rem;
          color: #1a1a2e;
          outline: none;
          transition: border-color 0.15s;
          box-sizing: border-box;
          text-align: center;
          margin-bottom: 16px;
        }
        .ob-input:focus { border-color: #a855f7; }
        .ob-input::placeholder { color: #9ca3af; }
        .ob-btn {
          width: 100%;
          padding: 13px;
          background: linear-gradient(135deg, #a855f7, #ec4899);
          color: white;
          font-weight: 600;
          font-size: 0.9rem;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .ob-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .ob-btn:hover:not(:disabled) { opacity: 0.9; }
        .ob-back {
          width: 100%;
          text-align: center;
          font-size: 0.8rem;
          color: #9ca3af;
          background: none;
          border: none;
          cursor: pointer;
          margin-top: 12px;
          transition: color 0.15s;
        }
        .ob-back:hover { color: #6b7280; }
        .level-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          border-radius: 12px;
          border: 1px solid #e8e0f0;
          background: rgba(255,255,255,0.6);
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
          margin-bottom: 10px;
          text-align: left;
        }
        .level-btn:hover {
          border-color: #a855f7;
          background: rgba(168,85,247,0.04);
        }
        .level-btn.selected {
          border-color: #a855f7;
          background: rgba(168,85,247,0.08);
        }
        .level-label {
          font-size: 0.9rem;
          font-weight: 600;
          color: #1a1a2e;
        }
        .level-sublabel {
          font-size: 0.78rem;
          color: #9ca3af;
        }
        .ob-error {
          font-size: 0.8rem;
          color: #ef4444;
          text-align: center;
          margin-bottom: 12px;
          padding: 10px 14px;
          background: rgba(239,68,68,0.06);
          border: 1px solid rgba(239,68,68,0.15);
          border-radius: 10px;
        }
      `}</style>

      <main className="ob-page">
        <div className="ob-card">

          {/* Step indicators */}
          <div className="ob-steps">
            {[1, 2, 3].map(s => (
              <div key={s} className={`ob-step ${step >= s ? 'active' : ''}`} />
            ))}
          </div>

          {/* Step 1 — Name */}
          {step === 1 && (
            <div>
              <div className="ob-emoji">👋</div>
              <h1 className="ob-title">Hey! I&apos;m Lumora</h1>
              <p className="ob-sub">Your personal AI tutor. What&apos;s your name?</p>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && name.trim() && setStep(2)}
                placeholder="Enter your name"
                className="ob-input"
                autoFocus
              />
              <button onClick={() => setStep(2)} disabled={!name.trim()} className="ob-btn">
                Continue →
              </button>
            </div>
          )}

          {/* Step 2 — Age */}
          {step === 2 && (
            <div>
              <div className="ob-emoji">🎂</div>
              <h1 className="ob-title">Nice to meet you, {name}!</h1>
              <p className="ob-sub">How old are you?</p>
              <input
                type="number"
                value={age}
                onChange={e => setAge(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && age && setStep(3)}
                placeholder="Your age"
                min={5}
                max={99}
                className="ob-input"
                autoFocus
              />
              <button onClick={() => setStep(3)} disabled={!age} className="ob-btn">
                Continue →
              </button>
              <button onClick={() => setStep(1)} className="ob-back">← Back</button>
            </div>
          )}

          {/* Step 3 — Level */}
          {step === 3 && (
            <div>
              <div className="ob-emoji">🎓</div>
              <h1 className="ob-title">What level are you at?</h1>
              <p className="ob-sub">Lumora will tailor explanations to the right depth for you.</p>
              <div style={{ marginBottom: '8px' }}>
                {levels.map(l => (
                  <button
                    key={l.value}
                    onClick={() => setLevel(l.value)}
                    className={`level-btn ${level === l.value ? 'selected' : ''}`}
                  >
                    <span className="level-label">{l.label}</span>
                    <span className="level-sublabel">{l.sublabel}</span>
                  </button>
                ))}
              </div>
              {error && <p className="ob-error">{error}</p>}
              <button onClick={handleFinish} disabled={!level || loading} className="ob-btn">
                {loading ? 'Setting up your space...' : "Let's go 🚀"}
              </button>
              <button onClick={() => setStep(2)} className="ob-back">← Back</button>
            </div>
          )}

        </div>
      </main>
    </>
  )
}