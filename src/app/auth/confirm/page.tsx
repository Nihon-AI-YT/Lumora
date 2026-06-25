'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

function ConfirmContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const confirm = async () => {
      const token_hash = searchParams.get('token_hash')
      const type = searchParams.get('type')
      const code = searchParams.get('code')

      if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as any })
        if (error) { setStatus('error'); return }
        setStatus('success')
        setTimeout(() => router.push('/dashboard'), 3000)
      } else if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) { setStatus('error'); return }
        setStatus('success')
        setTimeout(() => router.push('/dashboard'), 3000)
      } else {
        setStatus('error')
      }
    }
    confirm()
  }, [])

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
          --accent: #a855f7;
          --accent2: #ec4899;
        }

        * { box-sizing: border-box; }

        .confirm-root {
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

        .confirm-root::before {
          content: '';
          position: absolute;
          width: 600px; height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%);
          top: -200px; right: -200px;
          pointer-events: none;
        }

        .confirm-root::after {
          content: '';
          position: absolute;
          width: 400px; height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(236,72,153,0.06) 0%, transparent 70%);
          bottom: -100px; left: -100px;
          pointer-events: none;
        }

        .confirm-card {
          width: 100%;
          max-width: 460px;
          background: var(--card-bg);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid var(--card-border);
          border-radius: 28px;
          padding: 48px 40px;
          box-shadow: 0 8px 48px rgba(168,85,247,0.1), 0 1px 0 rgba(255,255,255,0.8) inset;
          position: relative;
          z-index: 1;
          text-align: center;
        }

        .confirm-brand {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 36px;
        }

        .confirm-brand-img {
          width: 40px; height: 40px;
          border-radius: 12px;
          object-fit: contain;
          filter: drop-shadow(0 2px 8px rgba(168,85,247,0.3));
        }

        .confirm-brand-name {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }

        .status-icon {
          width: 80px; height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.2rem;
          margin: 0 auto 24px;
        }

        .status-icon.loading {
          background: linear-gradient(135deg, rgba(168,85,247,0.1), rgba(236,72,153,0.08));
          border: 2px solid rgba(168,85,247,0.2);
          animation: pulse 1.5s ease-in-out infinite;
        }

        .status-icon.success {
          background: linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.06));
          border: 2px solid rgba(16,185,129,0.3);
        }

        .status-icon.error {
          background: rgba(239,68,68,0.08);
          border: 2px solid rgba(239,68,68,0.2);
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }

        .confirm-heading {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.03em;
          margin: 0 0 10px 0;
        }

        .confirm-sub {
          font-size: 0.9rem;
          color: var(--text-muted);
          margin: 0 0 28px 0;
          line-height: 1.6;
        }

        .progress-bar-wrap {
          height: 4px;
          background: #e8e0f0;
          border-radius: 2px;
          overflow: hidden;
          margin-top: 8px;
        }

        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          border-radius: 2px;
          animation: progress 3s linear forwards;
        }

        @keyframes progress { from { width: 0% } to { width: 100% } }

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
          box-shadow: 0 4px 16px rgba(168,85,247,0.3);
        }

        .primary-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(168,85,247,0.4);
        }
      `}</style>

      <main className="confirm-root">
        <div className="confirm-card">
          <div className="confirm-brand">
            <Image src="/lumora-nebula.png" alt="Lumora" width={40} height={40} className="confirm-brand-img" />
            <span className="confirm-brand-name">Lumora</span>
          </div>

          {status === 'loading' && (
            <>
              <div className="status-icon loading">⏳</div>
              <h1 className="confirm-heading">Confirming your email...</h1>
              <p className="confirm-sub">Hang tight, just a moment</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="status-icon success">✅</div>
              <h1 className="confirm-heading">Email confirmed!</h1>
              <p className="confirm-sub">Your account is now fully verified. Redirecting you to your dashboard...</p>
              <div className="progress-bar-wrap">
                <div className="progress-bar-fill" />
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="status-icon error">❌</div>
              <h1 className="confirm-heading">Link expired</h1>
              <p className="confirm-sub">This confirmation link has expired or has already been used. Head to your dashboard and you can request a new one.</p>
              <button onClick={() => router.push('/dashboard')} className="primary-btn">
                Go to Dashboard
              </button>
            </>
          )}
        </div>
      </main>
    </>
  )
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={
      <main style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #faf5ff 0%, #fdf2f8 60%, #f0f4ff 100%)',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Loading...</p>
      </main>
    }>
      <ConfirmContent />
    </Suspense>
  )
}