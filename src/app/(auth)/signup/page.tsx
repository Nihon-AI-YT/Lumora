'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function SignupPage() {
  const [step, setStep] = useState<'details' | 'otp' | 'password' | 'check-email'>('details')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleGoogleSignup = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { scopes: 'email', redirectTo: `https://lumora-mauve-nine.vercel.app/auth/callback?next=/onboarding` }
    })
    if (error) setError(error.message)
  }

  const handleMicrosoftSignup = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: { scopes: 'email', redirectTo: `https://lumora-mauve-nine.vercel.app/auth/callback?next=/onboarding` }
    })
    if (error) setError(error.message)
  }

  const handleSendOtp = async () => {
    if (!fullName.trim()) { setError('Please enter your full name'); return }
    if (!email.trim()) { setError('Please enter your email'); return }
    setLoading(true)
    setError('')
    const res = await fetch('/api/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, type: 'signup' })
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Failed to send OTP'); setLoading(false) }
    else { setMessage(`OTP sent to ${email}`); setStep('otp'); setLoading(false) }
  }

  const handleVerifyOtp = async () => {
    setLoading(true)
    setError('')
    const res = await fetch('/api/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, type: 'signup' })
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Invalid code'); setLoading(false) }
    else { setStep('password'); setLoading(false) }
  }

  const handleSetPassword = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    })
    if (error) { setError(error.message); setLoading(false); return }
    setStep('check-email')
    setLoading(false)
  }

  return (
    <>
      <style>{`
        :root {
          --bg-from: #faf5ff;
          --bg-to: #fdf2f8;
          --card-bg: rgba(255,255,255,0.82);
          --card-border: rgba(168,85,247,0.12);
          --text-primary: #0f0a1e;
          --text-muted: #9ca3af;
          --input-bg: rgba(255,255,255,0.9);
          --input-border: #e5dff5;
          --input-focus: #a855f7;
          --divider: #ede9f5;
          --error-bg: rgba(239,68,68,0.05);
          --error-border: rgba(239,68,68,0.2);
          --success-bg: rgba(16,185,129,0.05);
          --success-border: rgba(16,185,129,0.2);
          --accent: #a855f7;
          --accent2: #ec4899;
        }

        * { box-sizing: border-box; }

        .signup-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          background: linear-gradient(135deg, var(--bg-from) 0%, var(--bg-to) 60%, #f0f4ff 100%);
          position: relative;
          overflow: hidden;
        }

        .signup-root::before {
          content: '';
          position: absolute;
          width: 600px; height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%);
          top: -200px; right: -200px;
          pointer-events: none;
        }

        .signup-root::after {
          content: '';
          position: absolute;
          width: 400px; height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(236,72,153,0.06) 0%, transparent 70%);
          bottom: -100px; left: -100px;
          pointer-events: none;
        }

        .signup-card {
          width: 100%;
          max-width: 460px;
          background: var(--card-bg);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid var(--card-border);
          border-radius: 28px;
          padding: 44px 40px;
          box-shadow: 0 8px 48px rgba(168,85,247,0.1), 0 1px 0 rgba(255,255,255,0.8) inset;
          position: relative;
          z-index: 1;
        }

        .signup-brand {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 36px;
        }

        .signup-brand-img {
          width: 40px; height: 40px;
          border-radius: 12px;
          object-fit: contain;
          filter: drop-shadow(0 2px 8px rgba(168,85,247,0.3));
        }

        .signup-brand-name {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }

        .signup-heading {
          font-size: 1.4rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.03em;
          margin: 0 0 6px 0;
          line-height: 1.2;
          text-align: center;
        }

        .signup-sub {
          font-size: 0.9rem;
          color: var(--text-muted);
          margin: 0 0 28px 0;
          line-height: 1.5;
          text-align: center;
        }

        .oauth-btn {
          width: 100%;
          padding: 13px 16px;
          background: white;
          border: 1.5px solid var(--input-border);
          border-radius: 14px;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.2s;
          margin-bottom: 10px;
          letter-spacing: -0.01em;
        }

        .oauth-btn:hover {
          border-color: var(--accent);
          box-shadow: 0 4px 16px rgba(168,85,247,0.12);
          transform: translateY(-1px);
        }

        .divider-row {
          display: flex;
          align-items: center;
          gap: 14px;
          margin: 22px 0;
        }

        .divider-line { flex: 1; height: 1px; background: var(--divider); }

        .divider-text {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 500;
          letter-spacing: 0.04em;
        }

        .input-wrap {
          position: relative;
          margin-bottom: 12px;
        }

        .signup-input {
          width: 100%;
          background: var(--input-bg);
          border: 1.5px solid var(--input-border);
          border-radius: 14px;
          padding: 13px 16px;
          font-size: 0.9rem;
          color: var(--text-primary);
          outline: none;
          transition: all 0.2s;
          font-family: inherit;
        }

        .signup-input:focus {
          border-color: var(--input-focus);
          box-shadow: 0 0 0 3px rgba(168,85,247,0.1);
        }

        .signup-input::placeholder { color: var(--text-muted); }
        .signup-input.has-eye { padding-right: 48px; }

        .eye-btn {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-muted);
          padding: 4px;
          display: flex;
          align-items: center;
          transition: color 0.15s;
        }

        .eye-btn:hover { color: var(--accent); }

        .primary-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          color: white;
          font-weight: 700;
          font-size: 0.95rem;
          border: none;
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.2s;
          letter-spacing: -0.01em;
          box-shadow: 0 4px 16px rgba(168,85,247,0.3);
          margin-top: 4px;
        }

        .primary-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(168,85,247,0.4);
        }

        .primary-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        .auth-footer {
          text-align: center;
          font-size: 0.82rem;
          color: var(--text-muted);
          margin-top: 22px;
        }

        .auth-footer a {
          color: var(--accent);
          text-decoration: none;
          font-weight: 600;
        }

        .auth-footer a:hover { text-decoration: underline; }

        .error-box {
          font-size: 0.82rem;
          color: #dc2626;
          margin-bottom: 14px;
          padding: 11px 14px;
          background: var(--error-bg);
          border: 1px solid var(--error-border);
          border-radius: 12px;
          line-height: 1.5;
        }

        .success-box {
          font-size: 0.82rem;
          color: #059669;
          margin-bottom: 14px;
          padding: 11px 14px;
          background: var(--success-bg);
          border: 1px solid var(--success-border);
          border-radius: 12px;
        }

        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 0.82rem;
          cursor: pointer;
          padding: 0;
          margin-bottom: 22px;
          font-family: inherit;
          transition: color 0.15s;
        }

        .back-btn:hover { color: var(--accent); }

        .step-indicator {
          display: flex;
          gap: 6px;
          margin-bottom: 24px;
        }

        .step-dot {
          height: 4px;
          border-radius: 2px;
          flex: 1;
          background: #e8e0f0;
          transition: background 0.2s;
        }

        .step-dot.active {
          background: linear-gradient(135deg, var(--accent), var(--accent2));
        }

        .otp-input {
          width: 100%;
          background: var(--input-bg);
          border: 2px solid var(--input-border);
          border-radius: 14px;
          padding: 16px;
          font-size: 1.8rem;
          color: var(--text-primary);
          outline: none;
          transition: all 0.2s;
          margin-bottom: 14px;
          text-align: center;
          letter-spacing: 12px;
          font-weight: 700;
          font-family: 'Courier New', monospace;
        }

        .otp-input:focus {
          border-color: var(--input-focus);
          box-shadow: 0 0 0 3px rgba(168,85,247,0.1);
        }

        .check-email-icon {
          width: 72px; height: 72px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(168,85,247,0.1), rgba(236,72,153,0.08));
          border: 2px solid rgba(168,85,247,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          margin: 0 auto 20px;
        }
      `}</style>

      <main className="signup-root">
        <div className="signup-card">
          <div className="signup-brand">
            <Image src="/lumora-nebula.png" alt="Lumora" width={40} height={40} className="signup-brand-img" />
            <span className="signup-brand-name">Lumora</span>
          </div>

          {step === 'details' && (
            <>
              <h1 className="signup-heading">Create your account</h1>
              <p className="signup-sub">Start learning smarter today, it&apos;s free</p>
              {error && <div className="error-box">{error}</div>}

              <button onClick={handleGoogleSignup} className="oauth-btn">
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              <button onClick={handleMicrosoftSignup} className="oauth-btn">
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#f25022" d="M1 1h10v10H1z"/>
                  <path fill="#00a4ef" d="M13 1h10v10H13z"/>
                  <path fill="#7fba00" d="M1 13h10v10H1z"/>
                  <path fill="#ffb900" d="M13 13h10v10H13z"/>
                </svg>
                Continue with Microsoft
              </button>

              <div className="divider-row">
                <div className="divider-line" />
                <span className="divider-text">OR</span>
                <div className="divider-line" />
              </div>

              <div className="input-wrap">
                <input type="text" placeholder="Full name" value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                  className="signup-input" />
              </div>

              <div className="input-wrap">
                <input type="email" placeholder="Email address" value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                  className="signup-input" />
              </div>

              <button onClick={handleSendOtp} disabled={loading} className="primary-btn">
                {loading ? 'Sending OTP...' : 'Continue'}
              </button>

              <p className="auth-footer">
                Already have an account? <Link href="/login">Log in</Link>
              </p>
            </>
          )}

          {step === 'otp' && (
            <>
              <button className="back-btn" onClick={() => { setStep('details'); setError(''); setOtp('') }}>
                ← Back
              </button>
              <div className="step-indicator">
                <div className="step-dot active" />
                <div className="step-dot active" />
                <div className="step-dot" />
              </div>
              <h1 className="signup-heading">Verify your email</h1>
              <p className="signup-sub">Enter the 6-digit code sent to {email}</p>
              {error && <div className="error-box">{error}</div>}
              {message && <div className="success-box">{message}</div>}
              <input type="text" placeholder="000000" value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
                className="otp-input" maxLength={6} />
              <button onClick={handleVerifyOtp} disabled={loading || otp.length < 6} className="primary-btn">
                {loading ? 'Verifying...' : 'Verify'}
              </button>
            </>
          )}

          {step === 'password' && (
            <>
              <div className="step-indicator">
                <div className="step-dot active" />
                <div className="step-dot active" />
                <div className="step-dot active" />
              </div>
              <h1 className="signup-heading">Set a password</h1>
              <p className="signup-sub">Choose a password to secure your account</p>
              {error && <div className="error-box">{error}</div>}
              <div className="input-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password (min 6 characters)"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSetPassword()}
                  className="signup-input has-eye"
                />
                <button className="eye-btn" onClick={() => setShowPassword(!showPassword)} type="button">
                  {showPassword ? (
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
              <button onClick={handleSetPassword} disabled={loading || password.length < 6} className="primary-btn">
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </>
          )}

          {step === 'check-email' && (
            <div style={{ textAlign: 'center' }}>
              <div className="check-email-icon">📧</div>
              <h1 className="signup-heading">Check your email</h1>
              <p className="signup-sub" style={{ marginBottom: '24px' }}>
                We sent a confirmation link to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>.
                Click it to activate your account and get started.
              </p>
              <div style={{
                background: 'rgba(168,85,247,0.06)',
                border: '1px solid rgba(168,85,247,0.15)',
                borderRadius: '12px',
                padding: '14px 16px',
                fontSize: '0.82rem',
                color: '#6b7280',
                lineHeight: '1.5'
              }}>
                💡 Check your spam folder if you don&apos;t see it
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
}