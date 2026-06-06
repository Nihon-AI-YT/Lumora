import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarded, full_name')
    .eq('id', user.id)
    .single()

  if (!profile?.onboarded) redirect('/onboarding')

  const name = profile?.full_name?.split(' ')[0] || 'there'

  return (
    <div className="flex min-h-screen bg-[#0a0a0f]">
      {/* Sidebar */}
      <aside className="w-60 bg-[#0f0f17] border-r border-white/5 flex flex-col py-6 px-4 fixed h-full">
        {/* Logo */}
        <div className="flex items-center gap-2 px-2 mb-8">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">L</span>
          </div>
          <span className="text-white font-bold text-lg">Lumora</span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 flex-1">
          {[
            { href: '/dashboard', icon: '⊞', label: 'Dashboard' },
            { href: '/tutor', icon: '✦', label: 'AI Tutor' },
            { href: '/flashcards', icon: '⬡', label: 'Flashcards' },
            { href: '/mcq', icon: '◈', label: 'MCQ Practice' },
            { href: '/review', icon: '↻', label: 'Review' },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition text-sm"
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-white/5 pt-4 px-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600/30 rounded-full flex items-center justify-center">
              <span className="text-indigo-400 text-sm font-semibold">{name[0].toUpperCase()}</span>
            </div>
            <div>
              <p className="text-white text-sm font-medium">{name}</p>
              <p className="text-gray-500 text-xs">Free plan</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-60 p-8 min-h-screen">
        {children}
      </main>
    </div>
  )
}