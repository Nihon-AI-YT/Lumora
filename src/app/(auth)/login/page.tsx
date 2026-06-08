'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <>
      <style>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }
        .auth-card {
          width: 100%;
          max-width: 420px;
          background: rgba(255,255,255,0.75);
          backdrop-filter: blur(20px);
          border: 1px solid #e8e0f0;
          border-radius: 24px;
          padding: 40px;
          box-shadow: 0 8px 40px rgba(168,85,247,0.08);
        }
        .auth-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 32px;
        }
        .auth-logo-icon {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: linear-gradient(135deg, #a855f7, #ec4899);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 0.875rem;
        }
        .auth-logo-text {
          font-weight: 700;
          font-size: 1.1rem;
          color: #1a1a2e;
        }
        .auth-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1a1a2e;
          margin-bottom: 6px;
        }
        .auth-sub {
          font-size: 0.875rem;
          color: #9ca3af;
          margin-bottom: 28px;
        }
        .auth-input {
          width: 100%;
          background: rgba(255,255,255,0.8);
          border: 1px solid #e8e0f0;
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 0.875rem;
          color: #1a1a2e;
          outline: none;
          transition: border-color 0.15s;
          box-sizing: border-box;
          margin-bottom: 12px;
        }
        .auth-input:focus { border-color: #a855f7; }
        .auth-input::placeholder { color: #9ca3af; }
        .auth-btn {
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
          margin-top: 4px;
        }
        .auth-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .auth-btn:hover:not(:disabled) { opacity: 0.9; }
        .auth-footer {
          text-align: center;
          font-size: 0.8rem;
          color: #9ca3af;
          margin-top: 20px;
        }
        .auth-footer a {
          color: #a855f7;
          text-decoration: none;
          font-weight: 500;
        }
        .auth-footer a:hover { text-decoration: underline; }
        .auth-error {
          font-size: 0.8rem;
          color: #ef4444;
          margin-bottom: 12px;
          padding: 10px 14px;
          background: rgba(239,68,68,0.06);
          border: 1px solid rgba(239,68,68,0.15);
          border-radius: 10px;
        }
      `}</style>

      <main className="auth-page">
        <div className="auth-card">
          <div className="auth-logo">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="url(#lg2)"/>
              <defs>
                <linearGradient id="lg2" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#a855f7"/>
                  <stop offset="1" stopColor="#ec4899"/>
                </linearGradient>
              </defs>
              <text x="9" y="23" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="18" fill="white">L</text>
            </svg>
            <span className="auth-logo-text">Lumora</span>
          </div>

          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-sub">Log in to continue learning</p>

          {error && <p className="auth-error">{error}</p>}

          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="auth-input"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="auth-input"
          />

          <button onClick={handleLogin} disabled={loading} className="auth-btn">
            {loading ? 'Logging in...' : 'Log in'}
          </button>

          <p className="auth-footer">
            Don&apos;t have an account?{' '}
            <Link href="/signup">Sign up free</Link>
          </p>
        </div>
      </main>
    </>
  )
}