import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import WidgetZone from '@/components/dashboard/WidgetZone'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, streak_count, level')
    .eq('id', user!.id)
    .single()

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const name = profile?.full_name?.split(' ')[0] || 'there'

  // Update streak on dashboard visit
  const supabaseClient = await createClient()
  const streakRes = await supabaseClient
    .from('profiles')
    .select('streak_count, last_active')
    .eq('id', user!.id)
    .single()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const lastActive = streakRes.data?.last_active ? new Date(streakRes.data.last_active) : null
  if (lastActive) lastActive.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().split('T')[0]
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  let newStreak = 1
  if (lastActive && lastActive.getTime() === today.getTime()) {
    newStreak = streakRes.data?.streak_count || 1
  } else if (lastActive && lastActive.getTime() === yesterday.getTime()) {
    newStreak = (streakRes.data?.streak_count || 0) + 1
  }

  if (!lastActive || lastActive.getTime() !== today.getTime()) {
    await supabaseClient
      .from('profiles')
      .update({ streak_count: newStreak, last_active: todayStr })
      .eq('id', user!.id)
  }

  const streakCount = newStreak

  return (
    <>
      <style>{`
        .action-card {
          background: rgba(255,255,255,0.7);
          backdrop-filter: blur(12px);
          border: 1px solid #e8e0f0;
          border-radius: 16px;
          padding: 24px;
          text-decoration: none;
          display: block;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .action-card:hover {
          border-color: #a855f7;
          box-shadow: 0 4px 24px rgba(168,85,247,0.10);
        }
        .icon-wrap {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 14px;
          font-size: 18px;
        }
        .section-card {
          background: rgba(255,255,255,0.7);
          backdrop-filter: blur(12px);
          border: 1px solid #e8e0f0;
          border-radius: 16px;
          padding: 20px 24px;
          text-decoration: none;
          display: block;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .section-card:hover {
          border-color: #a855f7;
          box-shadow: 0 4px 24px rgba(168,85,247,0.10);
        }
      `}</style>

      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-medium mb-1" style={{ color: '#a855f7' }}>{greeting}</p>
          <h1 className="text-3xl font-bold mb-1" style={{ color: '#1a1a2e' }}>
            What do you want to <span style={{ fontStyle: 'italic' }}>learn</span>, {name}?
          </h1>
          <p className="text-sm" style={{ color: '#9ca3af' }}>Your personal study dashboard.</p>
        </div>

        {/* Email confirmation banner */}
        {!user?.email_confirmed_at && (
          <div style={{
            background: 'rgba(168,85,247,0.08)',
            border: '1px solid rgba(168,85,247,0.25)',
            borderRadius: '12px',
            padding: '12px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '18px' }}>✉️</span>
              <p style={{ margin: 0, fontSize: '14px', color: '#7c3aed', fontWeight: 500 }}>
                Please confirm your email address to secure your account.
              </p>
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af', whiteSpace: 'nowrap' }}>
              Check your inbox for {user?.email}
            </p>
          </div>
        )}

        {/* Widget Zone */}
        <div className="mb-10">
          <WidgetZone streakCount={streakCount} userName={name} />
        </div>

        {/* My Sections */}
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: '#9ca3af' }}>
          My Sections
        </h2>
        <div className="grid grid-cols-5 gap-4 mb-10">
          <Link href="/subjects" className="section-card">
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>📚</div>
            <h3 className="font-semibold mb-1" style={{ color: '#1a1a2e' }}>My Subjects</h3>
            <p className="text-sm" style={{ color: '#9ca3af' }}>Topics, notes and progress</p>
          </Link>
          <Link href="/exams" className="section-card">
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>📝</div>
            <h3 className="font-semibold mb-1" style={{ color: '#1a1a2e' }}>My Exams</h3>
            <p className="text-sm" style={{ color: '#9ca3af' }}>Countdowns and priorities</p>
          </Link>
          <Link href="/review" className="section-card">
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>🎯</div>
            <h3 className="font-semibold mb-1" style={{ color: '#1a1a2e' }}>My Review</h3>
            <p className="text-sm" style={{ color: '#9ca3af' }}>Weak topics and drill mode</p>
          </Link>
          <Link href="/study-plan" className="section-card">
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>📅</div>
            <h3 className="font-semibold mb-1" style={{ color: '#1a1a2e' }}>Study Plan</h3>
            <p className="text-sm" style={{ color: '#9ca3af' }}>AI-generated 4-week plan</p>
          </Link>
          <Link href="/achievements" className="section-card">
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>🏆</div>
            <h3 className="font-semibold mb-1" style={{ color: '#1a1a2e' }}>Achievements</h3>
            <p className="text-sm" style={{ color: '#9ca3af' }}>XP, levels & badges</p>
          </Link>
        </div>

        

      </div>
    </>
  )
}