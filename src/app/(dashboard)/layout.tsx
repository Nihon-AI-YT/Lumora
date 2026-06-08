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
    <>
      <style>{`
        .sidebar {
          background: rgba(255,255,255,0.65);
          backdrop-filter: blur(20px);
          border-right: 1px solid #e8e0f0;
        }
        .nav-link {
          display: flex;
          align-items: center;
          padding: 10px 12px;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 500;
          color: #6b7280;
          text-decoration: none;
          transition: background 0.15s, color 0.15s;
        }
        .nav-link:hover {
          background: rgba(168,85,247,0.09);
          color: #9333ea;
        }
      `}</style>

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="sidebar w-56 flex flex-col py-6 px-3 fixed h-full z-10">

          {/* Logo */}
          <div className="flex items-center gap-2 px-3 mb-8">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)' }}>
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <span className="font-bold text-lg" style={{ color: '#1a1a2e' }}>Lumora</span>
          </div>

          {/* Nav */}
          <nav className="flex flex-col gap-1 flex-1">
            {[
              { href: '/dashboard', label: 'Dashboard' },
              { href: '/tutor', label: 'AI Tutor' },
              { href: '/flashcards', label: 'Flashcards' },
              { href: '/mcq', label: 'MCQ Practice' },
              { href: '/review', label: 'Review' },
            ].map(item => (
              <Link key={item.href} href={item.href} className="nav-link">
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User */}
          <div className="pt-4 px-1" style={{ borderTop: '1px solid #e8e0f0' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)' }}>
                <span className="text-white text-sm font-semibold">{name[0].toUpperCase()}</span>
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: '#1a1a2e' }}>{name}</p>
                <p className="text-xs" style={{ color: '#9ca3af' }}>Free plan</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 ml-56 p-8 min-h-screen">
          {children}
        </main>
      </div>
    </>
  )
}