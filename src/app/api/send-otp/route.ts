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
  const html = `<div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px;">
    <h2 style="color:#1a1a2e;margin-bottom:8px;">${type === 'signup' ? 'Verify your email' : 'Reset your password'}</h2>
    <p style="color:#6b7280;margin-bottom:24px;">${type === 'signup' ? 'Enter this code to complete your Lumora signup:' : 'Use this code to reset your Lumora password:'}</p>
    <div style="background:linear-gradient(135deg,rgba(168,85,247,0.08),rgba(236,72,153,0.08));border:1px solid rgba(168,85,247,0.2);border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;">
      <span style="font-size:2.5rem;font-weight:800;letter-spacing:12px;color:#a855f7;">${otp}</span>
    </div>
    <p style="color:#9ca3af;font-size:0.85rem;">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
    <p style="color:#9ca3af;font-size:0.75rem;margin-top:24px;">Lumora · AI-powered learning</p>
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