import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const { email, type } = await req.json()
  // type: 'signup' | 'reset'

  if (!email || !type) {
    return NextResponse.json({ error: 'Missing email or type' }, { status: 400 })
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 mins

  // Store OTP in Supabase (we'll use a simple table or use Supabase's built-in)
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    }
  )

  // Store OTP in a temp table or use Supabase auth OTP
  // We'll use Supabase's signInWithOtp but intercept the email via Resend
  // Actually: store OTP in profiles or a dedicated otp_codes table
  // For now store in a simple way using upsert on a temp store
  const { error: storeError } = await supabase
    .from('otp_codes')
    .upsert({ email, otp, type, expires_at: expiresAt }, { onConflict: 'email,type' })

  if (storeError) {
    // Table might not exist, try creating flow differently
    console.error('OTP store error:', storeError)
    return NextResponse.json({ error: 'Failed to generate OTP' }, { status: 500 })
  }

  // Send via Resend API directly
  const subject = type === 'signup' ? 'Your Lumora verification code' : 'Reset your Lumora password'
  const html = type === 'signup'
    ? `<div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px;">
        <h2 style="color:#1a1a2e;margin-bottom:8px;">Verify your email</h2>
        <p style="color:#6b7280;margin-bottom:24px;">Enter this code to complete your Lumora signup:</p>
        <div style="background:linear-gradient(135deg,rgba(168,85,247,0.08),rgba(236,72,153,0.08));border:1px solid rgba(168,85,247,0.2);border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;">
          <span style="font-size:2.5rem;font-weight:800;letter-spacing:12px;color:#a855f7;">${otp}</span>
        </div>
        <p style="color:#9ca3af;font-size:0.85rem;">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
        <p style="color:#9ca3af;font-size:0.75rem;margin-top:24px;">Lumora · AI-powered learning for Sri Lankan students</p>
      </div>`
    : `<div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px;">
        <h2 style="color:#1a1a2e;margin-bottom:8px;">Reset your password</h2>
        <p style="color:#6b7280;margin-bottom:24px;">Use this code to reset your Lumora password:</p>
        <div style="background:linear-gradient(135deg,rgba(168,85,247,0.08),rgba(236,72,153,0.08));border:1px solid rgba(168,85,247,0.2);border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;">
          <span style="font-size:2.5rem;font-weight:800;letter-spacing:12px;color:#a855f7;">${otp}</span>
        </div>
        <p style="color:#9ca3af;font-size:0.85rem;">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
        <p style="color:#9ca3af;font-size:0.75rem;margin-top:24px;">Lumora · AI-powered learning for Sri Lankan students</p>
      </div>`

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
    },
    body: JSON.stringify({
      from: 'Lumora <onboarding@resend.dev>',
      to: [email],
      subject,
      html
    })
  })

  const resendData = await resendRes.json()

  if (!resendRes.ok) {
    console.error('Resend error:', resendData)
    return NextResponse.json({ error: resendData.message || 'Failed to send email' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}