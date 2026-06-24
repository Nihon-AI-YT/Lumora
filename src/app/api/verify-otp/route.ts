import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { email, otp, type } = await req.json()

  if (!email || !otp || !type) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Get stored OTP
  const { data, error } = await supabaseAdmin
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
    await supabaseAdmin.from('otp_codes').delete().eq('email', email).eq('type', type)
    return NextResponse.json({ error: 'Code has expired. Please request a new one.' }, { status: 400 })
  }

  // Check OTP match
  if (data.otp !== otp) {
    return NextResponse.json({ error: 'Incorrect code. Please try again.' }, { status: 400 })
  }

  // Delete used OTP
  await supabaseAdmin.from('otp_codes').delete().eq('email', email).eq('type', type)

  // For reset type — generate a magic link to create a real session
  if (type === 'reset') {
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    })
    if (linkError || !linkData) {
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
    }
    // Return the token so client can verify it
    const token = linkData.properties?.hashed_token
    return NextResponse.json({ success: true, token, email })
  }

  return NextResponse.json({ success: true })
}