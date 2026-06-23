'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function LoginPage() {
  const [step, setStep] = useState<'login' | 'forgot-email' | 'forgot-otp' | 'reset-password'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
      options: { scopes: 'email', redirectTo: `${window.location.origin}/dashboard` }
    })
    if (error) setError(error.message)
  }

  const handleForgotSendOtp = async () => {
  setLoading(true)
  setError('')
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false }
  })
  if (error) { setError(error.message); setLoading(false) }
  else { setMessage('OTP sent to your email'); setStep('forgot-otp'); setLoading(false) }
}
  const handleVerifyOtp = async () => {
  setLoading(true)
  setError('')
  const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' })
  if (error) { setError(error.message); setLoading(false) }
  else { setStep('reset-password'); setLoading(false) }
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
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: linear-gradient(135deg, #faf5ff 0%, #fdf2f8 50%, #f0f9ff 100%);
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
        .auth-logo { display: flex; align-items: center; gap: 8px; margin-bottom: 32px; }
        .auth-logo-text { font-weight: 700; font-size: 1.1rem; color: #1a1a2e; }
        .auth-title { font-size: 1.5rem; font-weight: 700; color: #1a1a2e; margin-bottom: 6px; }
        .auth-sub { font-size: 0.875rem; color: #9ca3af; margin-bottom: 28px; }
        .auth-input {
          width: 100%; background: rgba(255,255,255,0.8); border: 1px solid #e8e0f0;
          border-radius: 12px; padding: 12px 16px; font-size: 0.875rem; color: #1a1a2e;
          outline: none; transition: border-color 0.15s; box-sizing: border-box; margin-bottom: 12px;
        }
        .auth-input:focus { border-color: #a855f7; }
        .auth-input::placeholder { color: #9ca3af; }
        .auth-btn {
          width: 100%; padding: 13px;
          background: linear-gradient(135deg, #a855f7, #ec4899);
          color: white; font-weight: 600; font-size: 0.9rem; border: none;
          border-radius: 12px; cursor: pointer; transition: opacity 0.15s; margin-top: 4px;
        }
        .auth-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .auth-btn:hover:not(:disabled) { opacity: 0.9; }
        .oauth-btn {
          width: 100%; padding: 12px; background: white; border: 1px solid #e8e0f0;
          border-radius: 12px; cursor: pointer; font-size: 0.875rem; font-weight: 500;
          color: #1a1a2e; display: flex; align-items: center; justify-content: center;
          gap: 10px; transition: border-color 0.15s, box-shadow 0.15s; margin-bottom: 10px;
          box-sizing: border-box;
        }
        .oauth-btn:hover { border-color: #a855f7; box-shadow: 0 2px 8px rgba(168,85,247,0.1); }
        .divider {
          display: flex; align-items: center; gap: 12px; margin: 18px 0;
          color: #9ca3af; font-size: 0.8rem;
        }
        .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: #e8e0f0; }
        .auth-footer { text-align: center; font-size: 0.8rem; color: #9ca3af; margin-top: 20px; }
        .auth-footer a { color: #a855f7; text-decoration: none; font-weight: 500; }
        .auth-footer a:hover { text-decoration: underline; }
        .auth-error {
          font-size: 0.8rem; color: #ef4444; margin-bottom: 12px;
          padding: 10px 14px; background: rgba(239,68,68,0.06);
          border: 1px solid rgba(239,68,68,0.15); border-radius: 10px;
        }
        .auth-message {
          font-size: 0.8rem; color: #10b981; margin-bottom: 12px;
          padding: 10px 14px; background: rgba(16,185,129,0.06);
          border: 1px solid rgba(16,185,129,0.15); border-radius: 10px;
        }
        .forgot-link {
          text-align: right; font-size: 0.78rem; color: #a855f7;
          cursor: pointer; margin-top: -4px; margin-bottom: 14px;
          text-decoration: none; display: block;
        }
        .forgot-link:hover { text-decoration: underline; }
        .back-btn {
          background: none; border: none; color: #9ca3af; font-size: 0.8rem;
          cursor: pointer; padding: 0; margin-bottom: 20px; display: flex; align-items: center; gap: 4px;
        }
        .back-btn:hover { color: #a855f7; }
        .otp-input {
          width: 100%; background: rgba(255,255,255,0.8); border: 2px solid #e8e0f0;
          border-radius: 12px; padding: 14px 16px; font-size: 1.2rem; color: #1a1a2e;
          outline: none; transition: border-color 0.15s; box-sizing: border-box;
          margin-bottom: 12px; text-align: center; letter-spacing: 6px; font-weight: 600;
        }
        .otp-input:focus { border-color: #a855f7; }
      `}</style>

      <main className="auth-page">
        <div className="auth-card">
          <div className="auth-logo">
            <Image src="/lumora-nebula.png" alt="Lumora" width={32} height={32} className="object-contain" />
            <span className="auth-logo-text">Lumora</span>
          </div>

          {step === 'login' && (
            <>
              <h1 className="auth-title">Welcome back</h1>
              <p className="auth-sub">Log in to continue learning</p>
              {error && <p className="auth-error">{error}</p>}

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

              <div className="divider">or</div>

              <input type="email" placeholder="Email address" value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="auth-input" />
              <input type="password" placeholder="Password" value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="auth-input" />

              <span className="forgot-link" onClick={() => { setStep('forgot-email'); setError('') }}>
                Forgot password?
              </span>

              <button onClick={handleLogin} disabled={loading} className="auth-btn">
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
              <h1 className="auth-title">Reset password</h1>
              <p className="auth-sub">Enter your email and we&apos;ll send you a code</p>
              {error && <p className="auth-error">{error}</p>}
              <input type="email" placeholder="Email address" value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleForgotSendOtp()}
                className="auth-input" />
              <button onClick={handleForgotSendOtp} disabled={loading} className="auth-btn">
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </>
          )}

          {step === 'forgot-otp' && (
            <>
              <button className="back-btn" onClick={() => { setStep('forgot-email'); setError(''); setMessage('') }}>
                ← Back
              </button>
              <h1 className="auth-title">Enter OTP</h1>
              <p className="auth-sub">Check your email for the 6-digit code</p>
              {error && <p className="auth-error">{error}</p>}
              {message && <p className="auth-message">{message}</p>}
              <input type="text" placeholder="000000" value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
                className="otp-input" maxLength={6} />
              <button onClick={handleVerifyOtp} disabled={loading || otp.length < 6} className="auth-btn">
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </>
          )}

          {step === 'reset-password' && (
            <>
              <h1 className="auth-title">New password</h1>
              <p className="auth-sub">Set a new password for your account</p>
              {error && <p className="auth-error">{error}</p>}
              <input type="password" placeholder="New password (min 6 characters)" value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleResetPassword()}
                className="auth-input" />
              <button onClick={handleResetPassword} disabled={loading || newPassword.length < 6} className="auth-btn">
                {loading ? 'Saving...' : 'Set password & continue'}
              </button>
            </>
          )}
        </div>
      </main>
    </>
  )
}