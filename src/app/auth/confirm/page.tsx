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
    <main style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #faf5ff 0%, #fdf2f8 50%, #f0f9ff 100%)',
      fontFamily: 'Inter, system-ui, sans-serif', padding: '24px'
    }}>
      <div style={{
        width: '100%', maxWidth: '420px', background: 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(20px)', border: '1px solid #e8e0f0', borderRadius: '24px',
        padding: '48px 40px', boxShadow: '0 8px 40px rgba(168,85,247,0.08)', textAlign: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '32px' }}>
          <Image src="/lumora-nebula.png" alt="Lumora" width={32} height={32} style={{ objectFit: 'contain' }} />
          <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1a1a2e' }}>Lumora</span>
        </div>

        {status === 'loading' && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⏳</div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1a1a2e', marginBottom: '8px' }}>Confirming your email...</h1>
            <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Just a moment</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.06))',
              border: '2px solid rgba(16,185,129,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem', margin: '0 auto 24px'
            }}>✅</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1a1a2e', marginBottom: '8px' }}>Email confirmed!</h1>
            <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '24px' }}>Your account is now fully verified. Redirecting to dashboard...</p>
            <div style={{ height: '4px', background: '#e8e0f0', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                borderRadius: '2px', animation: 'progress 3s linear forwards'
              }} />
            </div>
            <style>{`@keyframes progress { from { width: 0% } to { width: 100% } }`}</style>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: 'rgba(239,68,68,0.08)', border: '2px solid rgba(239,68,68,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem', margin: '0 auto 24px'
            }}>❌</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1a1a2e', marginBottom: '8px' }}>Link expired</h1>
            <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '24px' }}>This confirmation link has expired or already been used.</p>
            <button onClick={() => router.push('/dashboard')} style={{
              width: '100%', padding: '13px',
              background: 'linear-gradient(135deg, #a855f7, #ec4899)',
              color: 'white', fontWeight: 600, fontSize: '0.9rem', border: 'none',
              borderRadius: '12px', cursor: 'pointer'
            }}>Go to Dashboard</button>
          </>
        )}
      </div>
    </main>
  )
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #faf5ff 0%, #fdf2f8 50%, #f0f9ff 100%)' }}>
        <p style={{ color: '#9ca3af' }}>Loading...</p>
      </main>
    }>
      <ConfirmContent />
    </Suspense>
  )
}