import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from './Sidebar'
import NotificationProvider from '@/components/NotificationProvider'

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
    <NotificationProvider>
      <div className="flex min-h-screen">
        <Sidebar name={name} userId={user.id} />
        <main className="flex-1 ml-56 p-8 min-h-screen">
          {children}
        </main>
      </div>
    </NotificationProvider>
  )
}