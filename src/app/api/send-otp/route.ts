import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export async function POST(req: NextRequest) {
  const { email, type } = await req.json()

  if (!email || !type) {
    return NextResponse.json({ error: 'Missing email or type' }, { status: 400 })
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  const { error: storeError } = await supabaseAdmin
    .from('otp_codes')
    .upsert({ email, otp, type, expires_at: expiresAt }, { onConflict: 'email,type' })

  if (storeError) {
    console.error('OTP store error:', storeError)
    return NextResponse.json({ error: 'Failed to generate OTP' }, { status: 500 })
  }

  const subject = type === 'signup' ? 'Your Lumora verification code' : 'Reset your Lumora password'
  const html = `<div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:40px 24px;background:#fafafa;">
  <div style="background:white;border-radius:20px;padding:40px;border:1px solid #e8e0f0;box-shadow:0 4px 24px rgba(168,85,247,0.06);">
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,rgba(168,85,247,0.08),rgba(236,72,153,0.08));border:1px solid rgba(168,85,247,0.15);border-radius:12px;padding:8px 16px;">
        <span style="font-size:1.1rem;font-weight:800;background:linear-gradient(135deg,#a855f7,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">Lumora</span>
      </div>
    </div>
    <div style="text-align:center;margin-bottom:28px;">
      <div style="width:64px;height:64px;background:linear-gradient(135deg,rgba(168,85,247,0.1),rgba(236,72,153,0.1));border:2px solid rgba(168,85,247,0.2);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:1.8rem;margin-bottom:16px;">${type === 'signup' ? '✉️' : '🔐'}</div>
      <h1 style="font-size:1.5rem;font-weight:700;color:#1a1a2e;margin:0 0 8px 0;">${type === 'signup' ? 'Verify your email' : 'Reset your password'}</h1>
      <p style="color:#9ca3af;font-size:0.9rem;margin:0;">${type === 'signup' ? 'Enter this code to complete your Lumora signup' : 'Use this code to reset your Lumora password'}</p>
    </div>
    <div style="background:linear-gradient(135deg,rgba(168,85,247,0.06),rgba(236,72,153,0.06));border:1px solid rgba(168,85,247,0.15);border-radius:16px;padding:28px;text-align:center;margin-bottom:28px;">
      <span style="font-size:2.8rem;font-weight:800;letter-spacing:14px;color:#a855f7;">${otp}</span>
    </div>
    <p style="color:#9ca3af;font-size:0.78rem;text-align:center;margin:0 0 4px 0;">This code expires in 10 minutes.</p>
    <p style="color:#9ca3af;font-size:0.78rem;text-align:center;margin:0;">If you didn't request this, ignore this email.</p>
    <div style="border-top:1px solid #f3f0f8;margin-top:28px;padding-top:20px;text-align:center;">
      <p style="color:#c4b5d4;font-size:0.72rem;margin:0;">Lumora · AI-powered learning for Sri Lankan students</p>
    </div>
  </div>
</div>`

  try {
    await transporter.sendMail({
      from: `"Lumora" <${process.env.GMAIL_USER}>`,
      to: email,
      subject,
      html,
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Gmail send error:', err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}