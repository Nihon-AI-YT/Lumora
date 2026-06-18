import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ExamCountdown from '@/components/ExamCountdown'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, streak_count, level')
    .eq('id', user!.id)
    .single()

  const { data: exams } = await supabase
    .from('exams')
    .select('*')
    .eq('user_id', user!.id)
    .order('exam_date', { ascending: true })

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const name = profile?.full_name?.split(' ')[0] || 'there'

  return (
    <>
      <style>{`
        .stat-card {
          background: rgba(255,255,255,0.7);
          backdrop-filter: blur(12px);
          border: 1px solid #e8e0f0;
          border-radius: 16px;
          padding: 20px 24px;
        }
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
      `}</style>

      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <p className="text-sm font-medium mb-1" style={{ color: '#a855f7' }}>{greeting}</p>
          <h1 className="text-3xl font-bold mb-1" style={{ color: '#1a1a2e' }}>
            What do you want to <span style={{ fontStyle: 'italic' }}>learn</span>, {name}?
          </h1>
          <p className="text-sm" style={{ color: '#9ca3af' }}>Pick up where you left off.</p>
        </div>

        {/* Exam Countdown */}
        <ExamCountdown exams={exams || []} />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="stat-card">
            <p className="text-xs uppercase tracking-wider mb-3" style={{ color: '#9ca3af' }}>Daily Streak</p>
            <p className="text-2xl font-bold" style={{ color: '#f59e0b' }}>
              {profile?.streak_count || 0}
              <span className="text-base ml-1">🔥</span>
            </p>
          </div>
          <div className="stat-card">
            <p className="text-xs uppercase tracking-wider mb-3" style={{ color: '#9ca3af' }}>Cards to Review</p>
            <p className="text-2xl font-bold" style={{ color: '#a855f7' }}>0</p>
          </div>
          <div className="stat-card">
            <p className="text-xs uppercase tracking-wider mb-3" style={{ color: '#9ca3af' }}>MCQs Done Today</p>
            <p className="text-2xl font-bold" style={{ color: '#10b981' }}>0</p>
          </div>
        </div>

        {/* Quick Actions */}
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: '#9ca3af' }}>Start Learning</h2>
        <div className="grid grid-cols-3 gap-4">
          <Link href="/tutor" className="action-card">
            <div className="icon-wrap" style={{ background: 'rgba(168,85,247,0.10)' }}>✦</div>
            <h3 className="font-semibold mb-1" style={{ color: '#1a1a2e' }}>AI Tutor</h3>
            <p className="text-sm" style={{ color: '#9ca3af' }}>Ask anything, get clear explanations instantly</p>
          </Link>
          <Link href="/flashcards" className="action-card">
            <div className="icon-wrap" style={{ background: 'rgba(99,102,241,0.10)' }}>▦</div>
            <h3 className="font-semibold mb-1" style={{ color: '#1a1a2e' }}>Flashcards</h3>
            <p className="text-sm" style={{ color: '#9ca3af' }}>Generate smart cards for any topic</p>
          </Link>
          <Link href="/mcq" className="action-card">
            <div className="icon-wrap" style={{ background: 'rgba(16,185,129,0.10)' }}>◈</div>
            <h3 className="font-semibold mb-1" style={{ color: '#1a1a2e' }}>MCQ Practice</h3>
            <p className="text-sm" style={{ color: '#9ca3af' }}>Exam-style questions with instant feedback</p>
          </Link>
        </div>

      </div>
    </>
  )
}