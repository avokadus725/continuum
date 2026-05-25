'use client'

/* theme + notifications + language + profile menu. */

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Menu, LogOut, User } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageSwitcher } from '@/components/language-switcher'
import { NotificationBell } from '@/components/features/notifications/notification-bell'
import { signOut } from '@/app/actions/auth'
import { UserAvatar } from '@/components/ui/user-avatar'

interface TopbarProps {
  user: { id: string; email?: string | null }
  avatarUrl?: string | null
  displayName: string
  level?: number
  onMobileMenu: () => void
}

export function Topbar({ user, avatarUrl, displayName, level, onMobileMenu }: TopbarProps) {
  const t = useTranslations('nav')
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header
      className="sticky top-0 z-30 flex h-[60px] items-center gap-4 border-b px-4 md:px-8"
      style={{ background: 'var(--background)', borderColor: 'var(--border)' }}
    >
      {/* Mobile hamburger */}
      <button
        onClick={onMobileMenu}
        className="rounded-lg p-2 md:hidden"
        style={{ color: 'var(--muted-foreground)' }}
        aria-label="Меню"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Right cluster */}
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <NotificationBell userId={user.id} />
        <span className="mx-1 hidden h-[22px] w-px md:block" style={{ background: 'var(--border)' }} />
        <LanguageSwitcher />

        {/* Profile menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(v => !v)}
            className="ml-1 flex items-center gap-2.5"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <UserAvatar name={displayName} url={avatarUrl} size={32} />
            <span className="hidden text-[13px] font-semibold leading-tight md:inline" style={{ color: 'var(--foreground)' }}>
              {displayName.split(' ')[0]}
            </span>
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div
                className="absolute right-0 top-full z-50 mt-2 w-[200px] overflow-hidden rounded-xl border"
                style={{ background: 'var(--card)', borderColor: 'var(--border)', boxShadow: '0 12px 30px -10px rgba(0,0,0,0.18)' }}
                role="menu"
              >
                <div className="px-3 pb-2 pt-3">
                  <div className="truncate text-[13px] font-semibold" style={{ color: 'var(--foreground)' }}>{displayName}</div>
                  {level != null && (
                    <div className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>{t('level' as never, { level } as never)}</div>
                  )}
                </div>
                <div className="h-px" style={{ background: 'var(--border)' }} />
                <Link
                  href="/profile"
                  className="flex items-center gap-2.5 px-3 py-2 text-[13px] no-underline transition-colors hover:bg-[color-mix(in_srgb,var(--primary)_8%,var(--card))]"
                  style={{ color: 'var(--foreground)' }}
                  onClick={() => setMenuOpen(false)}
                  role="menuitem"
                >
                  <User className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
                  {t('profile')}
                </Link>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-[13px] transition-colors hover:bg-[color-mix(in_srgb,var(--destructive)_8%,var(--card))]"
                    style={{ color: 'var(--foreground)' }}
                    role="menuitem"
                  >
                    <LogOut className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
                    {t('logout')}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
