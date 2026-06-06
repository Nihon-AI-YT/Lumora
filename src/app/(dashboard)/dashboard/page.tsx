import { createClient } from '@/lib/supabase/server'

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

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <p className="text-indigo-400 text-sm font-medium mb-1">{greeting}</p>
        <h1 className="text-4xl font-bold text-white mb-2">{name} 👋</h1>
        <p className="text-gray-400">What do you want to master today?</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Daily Streak</p>
          <p className="text-3xl font-bold text-orange-400">🔥 {profile?.streak_count || 0}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Cards to Review</p>
          <p className="text-3xl font-bold text-indigo-400">0</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">MCQs Done Today</p>
          <p className="text-3xl font-bold text-green-400">0</p>
        </div>
      </div>

      {/* Quick Actions */}
      <h2 className="text-white font-semibold text-lg mb-4">Start Learning</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a href="/tutor" className="group bg-gray-900 border border-gray-800 hover:border-indigo-500 rounded-2xl p-6 transition cursor-pointer">
          <div className="text-3xl mb-3">🤖</div>
          <h3 className="text-white font-bold mb-1">AI Tutor</h3>
          <p className="text-gray-500 text-sm">Ask anything, get clear explanations instantly</p>
        </a>
        <a href="/flashcards" className="group bg-gray-900 border border-gray-800 hover:border-indigo-500 rounded-2xl p-6 transition cursor-pointer">
          <div className="text-3xl mb-3">🃏</div>
          <h3 className="text-white font-bold mb-1">Flashcards</h3>
          <p className="text-gray-500 text-sm">Generate smart cards for any topic</p>
        </a>
        <a href="/mcq" className="group bg-gray-900 border border-gray-800 hover:border-indigo-500 rounded-2xl p-6 transition cursor-pointer">
          <div className="text-3xl mb-3">📝</div>
          <h3 className="text-white font-bold mb-1">MCQ Practice</h3>
          <p className="text-gray-500 text-sm">Exam-style questions with instant feedback</p>
        </a>
      </div>
    </div>
  )
}