import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const { email, otp, type } = await req.json()

  if (!email || !otp || !type) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    }
  )

  // Get stored OTP
  const { data, error } = await supabase
    .from('otp_codes')
    .select('otp, expires_at')
    .eq('email', email)
    .eq('type', type)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 })
  }

  // Check expiry
  if (new Date(data.expires_at) < new Date()) {
    await supabase.from('otp_codes').delete().eq('email', email).eq('type', type)
    return NextResponse.json({ error: 'Code has expired. Please request a new one.' }, { status: 400 })
  }

  // Check OTP match
  if (data.otp !== otp) {
    return NextResponse.json({ error: 'Incorrect code. Please try again.' }, { status: 400 })
  }

  // Delete used OTP
  await supabase.from('otp_codes').delete().eq('email', email).eq('type', type)

  return NextResponse.json({ success: true })
}