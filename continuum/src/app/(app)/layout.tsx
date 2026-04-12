import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { SidebarLayout } from '@/components/sidebar-layout'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const t = await getTranslations('nav')

  // Fetch avatar from profiles table (keeps in sync after avatar upload)
  const { data: profile } = await supabase
    .from('profiles')
    .select('avatar_url, full_name')
    .eq('id', user.id)
    .single()

  const navItems = [
    { href: '/dashboard',       label: t('dashboard') },
    { href: '/materials',       label: t('materials') },
    { href: '/tasks',           label: t('tasks') },
    { href: '/notes',           label: t('notes') },
    { href: '/collections',     label: t('collections') },
    { href: '/community',       label: t('community') },
    { href: '/recommendations', label: t('recommendations') },
    { href: '/analytics',       label: t('analytics') },
    { href: '/gamification',    label: t('gamification') },
    { href: '/focus',           label: t('focus') },
  ]

  return (
    <SidebarLayout
      navItems={navItems}
      user={user}
      profileAvatarUrl={profile?.avatar_url ?? null}
      profileName={profile?.full_name ?? null}
      logoutLabel={t('logout')}
      profileLabel={t('profile')}
    >
      {children}
    </SidebarLayout>
  )
}
