import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SidebarLayout } from '@/components/sidebar-layout'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch profile (avatar, name, role) so sidebar stays in sync
  const { data: profile } = await supabase
    .from('profiles')
    .select('avatar_url, full_name, role')
    .eq('id', user.id)
    .single()

  return (
    <SidebarLayout
      user={user}
      profileAvatarUrl={profile?.avatar_url ?? null}
      profileName={profile?.full_name ?? null}
      isAdmin={profile?.role === 'admin'}
    >
      {children}
    </SidebarLayout>
  )
}
