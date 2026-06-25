'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function LoginPage() {
  const [step, setStep] = useState<'login' | 'forgot-email' | 'forgot-otp' | 'reset-choice' | 'reset-password'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else router.push('/dashboard')
  }

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `https://lumora-mauve-nine.vercel.app/auth/callback` }
    })
    if (error) setError(error.message)
  }

  const handleMicrosoftLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: { scopes: 'email', redirectTo: `https://lumora-mauve-nine.vercel.app/auth/callback` }
    })
    if (error) setError(error.message)
  }

  const handleForgotSendOtp = async () => {
    setLoading(true)
    setError('')
    const res = await fetch('/api/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, type: 'reset' })
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Failed to send OTP'); setLoading(false) }
    else { setMessage('OTP sent to your email'); setStep('forgot-otp'); setLoading(false) }
  }

  const handleVerifyOtp = async () => {
    setLoading(true)
    setError('')
    const res = await fetch('/api/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, type: 'reset' })
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Invalid code'); setLoading(false); return }
    if (data.token) {
      await supabase.auth.verifyOtp({ token_hash: data.token, type: 'magiclink' })
    }
    setStep('reset-choice')
    setLoading(false)
  }

  const handleResetPassword = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) { setError(error.message); setLoading(false) }
    else router.push('/dashboard')
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
          --text-secondary: #6b7280;
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

        .login-root {
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

        .login-root::before {
          content: '';
          position: absolute;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%);
          top: -200px;
          right: -200px;
          pointer-events: none;
        }

        .login-root::after {
          content: '';
          position: absolute;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(236,72,153,0.06) 0%, transparent 70%);
          bottom: -100px;
          left: -100px;
          pointer-events: none;
        }

        .login-card {
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

        .login-brand {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 36px;
        }

        .login-brand-img {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          object-fit: contain;
          filter: drop-shadow(0 2px 8px rgba(168,85,247,0.3));
        }

        .login-brand-name {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }

        .login-heading {
          font-size: 1.4rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.03em;
          margin: 0 0 6px 0;
          line-height: 1.2;
        }

        .login-sub {
          font-size: 0.9rem;
          color: var(--text-muted);
          margin: 0 0 28px 0;
          line-height: 1.5;
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

        .divider-line {
          flex: 1;
          height: 1px;
          background: var(--divider);
        }

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

        .login-input {
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

        .login-input:focus {
          border-color: var(--input-focus);
          box-shadow: 0 0 0 3px rgba(168,85,247,0.1);
        }

        .login-input::placeholder { color: var(--text-muted); }

        .login-input.has-eye { padding-right: 48px; }

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

        .forgot-row {
          display: flex;
          justify-content: flex-end;
          margin: -4px 0 16px 0;
        }

        .forgot-link {
          font-size: 0.8rem;
          color: var(--accent);
          cursor: pointer;
          font-weight: 500;
          text-decoration: none;
          transition: opacity 0.15s;
        }

        .forgot-link:hover { opacity: 0.75; }

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
        }

        .primary-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(168,85,247,0.4);
        }

        .primary-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        .secondary-btn {
          width: 100%;
          padding: 14px;
          background: rgba(168,85,247,0.07);
          color: var(--accent);
          font-weight: 600;
          font-size: 0.95rem;
          border: 1.5px solid rgba(168,85,247,0.2);
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.2s;
          letter-spacing: -0.01em;
          margin-top: 10px;
        }

        .secondary-btn:hover { background: rgba(168,85,247,0.12); border-color: var(--accent); }

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

        .choice-card {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 8px;
        }

        .verified-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.05));
          border: 2px solid rgba(16,185,129,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.8rem;
          margin: 0 auto 20px;
        }
      `}</style>

      <main className="login-root">
        <div className="login-card">
          <div className="login-brand">
            <Image src="/lumora-nebula.png" alt="Lumora" width={40} height={40} className="login-brand-img" />
            <span className="login-brand-name">Lumora</span>
          </div>

          {step === 'login' && (
            <>
              <h1 className="login-heading" style={{ textAlign: 'center' }}>Welcome back</h1>
              <p className="login-sub" style={{ textAlign: 'center' }}>Log in to continue learning</p>

              {error && <div className="error-box">{error}</div>}

              <button onClick={handleGoogleLogin} className="oauth-btn">
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              <button onClick={handleMicrosoftLogin} className="oauth-btn">
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
                <input type="email" placeholder="Email address" value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  className="login-input" />
              </div>

              <div className="input-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  className="login-input has-eye"
                />
                <button className="eye-btn" onClick={() => setShowPassword(!showPassword)} type="button">
                  {showPassword ? (
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>

              <div className="forgot-row">
                <span className="forgot-link" onClick={() => { setStep('forgot-email'); setError('') }}>
                  Forgot password?
                </span>
              </div>

              <button onClick={handleLogin} disabled={loading} className="primary-btn">
                {loading ? 'Logging in...' : 'Log in'}
              </button>

              <p className="auth-footer">
                Don&apos;t have an account? <Link href="/signup">Sign up free</Link>
              </p>
            </>
          )}

          {step === 'forgot-email' && (
            <>
              <button className="back-btn" onClick={() => { setStep('login'); setError(''); setMessage('') }}>
                ← Back
              </button>
              <h1 className="login-heading">Reset password</h1>
              <p className="login-sub">Enter your email and we&apos;ll send you a code</p>
              {error && <div className="error-box">{error}</div>}
              <div className="input-wrap">
                <input type="email" placeholder="Email address" value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleForgotSendOtp()}
                  className="login-input" />
              </div>
              <button onClick={handleForgotSendOtp} disabled={loading} className="primary-btn" style={{ marginTop: '8px' }}>
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </>
          )}

          {step === 'forgot-otp' && (
            <>
              <button className="back-btn" onClick={() => { setStep('forgot-email'); setError(''); setMessage('') }}>
                ← Back
              </button>
              <h1 className="login-heading">Enter code</h1>
              <p className="login-sub">Check your email for the 6-digit code</p>
              {error && <div className="error-box">{error}</div>}
              {message && <div className="success-box">{message}</div>}
              <input type="text" placeholder="000000" value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
                className="otp-input" maxLength={6} />
              <button onClick={handleVerifyOtp} disabled={loading || otp.length < 6} className="primary-btn">
                {loading ? 'Verifying...' : 'Verify code'}
              </button>
            </>
          )}

          {step === 'reset-choice' && (
            <>
              <div className="verified-icon">✅</div>
              <h1 className="login-heading" style={{ textAlign: 'center' }}>You&apos;re verified!</h1>
              <p className="login-sub" style={{ textAlign: 'center' }}>What would you like to do?</p>
              {error && <div className="error-box">{error}</div>}
              <div className="choice-card">
                <button onClick={() => router.push('/dashboard')} disabled={loading} className="primary-btn">
                  Log in now
                </button>
                <button onClick={() => setStep('reset-password')} className="secondary-btn">
                  Set a new password
                </button>
              </div>
            </>
          )}

          {step === 'reset-password' && (
            <>
              <h1 className="login-heading">New password</h1>
              <p className="login-sub">Set a new password for your account</p>
              {error && <div className="error-box">{error}</div>}
              <div className="input-wrap">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="New password (min 6 characters)"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleResetPassword()}
                  className="login-input has-eye"
                />
                <button className="eye-btn" onClick={() => setShowNewPassword(!showNewPassword)} type="button">
                  {showNewPassword ? (
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
              <button onClick={handleResetPassword} disabled={loading || newPassword.length < 6} className="primary-btn" style={{ marginTop: '8px' }}>
                {loading ? 'Saving...' : 'Set password and continue'}
              </button>
            </>
          )}
        </div>
      </main>
    </>
  )
}