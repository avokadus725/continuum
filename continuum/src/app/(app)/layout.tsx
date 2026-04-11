import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { signOut } from '@/app/actions/auth'
import { LanguageSwitcher } from '@/components/language-switcher'
import { ThemeToggle } from '@/components/theme-toggle'
import { MobileNav } from '@/components/mobile-nav'
import { NavLink } from '@/components/nav-link'
import Link from 'next/link'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const t = await getTranslations('nav')

  const navItems = [
    { href: '/dashboard',       label: t('dashboard') },
    { href: '/materials',       label: t('materials') },
    { href: '/tasks',           label: t('tasks') },
    { href: '/notes',           label: t('notes') },
    { href: '/recommendations', label: t('recommendations') },
    { href: '/analytics',       label: t('analytics') },
    { href: '/gamification',    label: t('gamification') },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>

      {/* Top navigation bar */}
      <header
        className="sticky top-0 z-40 border-b"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-2">

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              C
            </div>
            <span className="font-bold text-sm hidden sm:block" style={{ color: 'var(--foreground)' }}>
              Continuum
            </span>
          </Link>

          {/* Desktop nav links */}
          <nav className="flex items-center gap-0.5 flex-1 overflow-x-auto px-2">
            {navItems.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} />
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-1 shrink-0">
            <ThemeToggle />
            <LanguageSwitcher />

            {/* Avatar → Profile */}
            <Link href="/profile">
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt={user.user_metadata?.full_name ?? ''}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                >
                  {(user.email?.[0] ?? '?').toUpperCase()}
                </div>
              )}
            </Link>

            {/* Logout (desktop) */}
            <form action={signOut} className="hidden md:block">
              <button
                type="submit"
                className="text-xs px-2.5 py-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--muted-foreground)' }}
              >
                {t('logout')}
              </button>
            </form>

            {/* Mobile hamburger */}
            <MobileNav items={[
              ...navItems,
              { href: '/profile', label: t('profile') },
            ]} />
          </div>

        </div>
      </header>

      {/* Page content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>

    </div>
  )
}
