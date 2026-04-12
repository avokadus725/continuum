'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import {
  Home, BookOpen, CheckSquare, FileText,
  Sparkles, BarChart2, Trophy, Timer, BookMarked, Users2,
  ChevronLeft, ChevronRight, ChevronDown, Menu, X, LogOut,
} from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageSwitcher } from '@/components/language-switcher'
import { NotificationBell } from '@/components/features/notifications/notification-bell'
import { signOut } from '@/app/actions/auth'

// Nav items that belong to the "Learning" group
const LEARNING_HREFS = new Set(['/materials', '/tasks', '/notes', '/collections'])

const NAV_ICONS: Record<string, React.ElementType> = {
  '/dashboard':       Home,
  '/materials':       BookOpen,
  '/tasks':           CheckSquare,
  '/notes':           FileText,
  '/collections':     BookMarked,
  '/community':       Users2,
  '/recommendations': Sparkles,
  '/analytics':       BarChart2,
  '/gamification':    Trophy,
  '/focus':           Timer,
}

// Pages that should fill the full content area (no padding)
const FULL_BLEED = new Set(['/focus'])

interface NavItem { href: string; label: string }

interface SidebarLayoutProps {
  children: React.ReactNode
  navItems: NavItem[]
  user: {
    id: string
    email?: string | null
    user_metadata?: { avatar_url?: string; full_name?: string }
  }
  profileAvatarUrl?: string | null
  profileName?: string | null
  logoutLabel: string
  profileLabel: string
}

export function SidebarLayout({
  children, navItems, user, profileAvatarUrl, profileName, logoutLabel, profileLabel,
}: SidebarLayoutProps) {
  const pathname = usePathname()
  const t = useTranslations('nav')
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [learningOpen, setLearningOpen] = useState(true)

  const isLearningActive = [...LEARNING_HREFS].some(
    href => pathname === href || pathname.startsWith(href + '/')
  )

  useEffect(() => {
    setMounted(true)
    try {
      const v = localStorage.getItem('sidebar-collapsed')
      if (v !== null) setCollapsed(v === 'true')
      // Auto-open learning group if on a learning page; else restore preference
      const lo = localStorage.getItem('learning-group-open')
      setLearningOpen(isLearningActive ? true : (lo !== null ? lo === 'true' : true))
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-expand learning group when navigating to a learning page
  useEffect(() => {
    if (isLearningActive) setLearningOpen(true)
  }, [isLearningActive])

  function toggleCollapse() {
    const next = !collapsed
    setCollapsed(next)
    try { localStorage.setItem('sidebar-collapsed', String(next)) } catch { /* ignore */ }
  }

  function toggleLearningOpen() {
    const next = !learningOpen
    setLearningOpen(next)
    try { localStorage.setItem('learning-group-open', String(next)) } catch { /* ignore */ }
  }

  // profiles table takes priority over auth metadata (keeps in sync after avatar upload)
  const avatarUrl = profileAvatarUrl ?? user.user_metadata?.avatar_url ?? null
  const displayName = profileName ?? user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? '?'
  const slim = mounted && collapsed   // desktop collapsed state
  const isFullBleed = FULL_BLEED.has(pathname)

  // ── Reusable sidebar internals ────────────────────────────────

  function renderNavItem({ href, label }: NavItem, show: boolean, mobile: boolean) {
    const Icon = NAV_ICONS[href] ?? Home
    const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
    return (
      <Link
        key={href}
        href={href}
        onClick={() => mobile && setMobileOpen(false)}
        title={!show ? label : undefined}
        className={[
          'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
          !show ? 'justify-center' : '',
        ].join(' ')}
        style={{
          background: active ? 'color-mix(in srgb, var(--primary) 12%, transparent)' : 'transparent',
          color: active ? 'var(--primary)' : 'var(--muted-foreground)',
        }}
      >
        <Icon className="w-4 h-4 shrink-0" />
        {show && <span>{label}</span>}
      </Link>
    )
  }

  function renderNav(mobile = false) {
    const show = mobile || !slim

    const topItems    = navItems.filter(i => i.href === '/dashboard')
    const learningItems = navItems.filter(i => LEARNING_HREFS.has(i.href))
    const otherItems  = navItems.filter(i => i.href !== '/dashboard' && !LEARNING_HREFS.has(i.href))

    return (
      <nav className="flex-1 px-2 py-2 overflow-y-auto">
        {/* Top items (Home) */}
        <div className="space-y-0.5 mb-1">
          {topItems.map(item => renderNavItem(item, show, mobile))}
        </div>

        {/* Learning group */}
        {show && learningItems.length > 0 && (
          <button
            onClick={toggleLearningOpen}
            className="flex items-center w-full gap-2 px-3 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {t('learningGroup')}
            <ChevronDown
              className="w-3.5 h-3.5 ml-auto transition-transform duration-200"
              style={{ transform: learningOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
            />
          </button>
        )}
        {!show && <div className="my-2 mx-3 border-t" style={{ borderColor: 'var(--border)' }} />}
        {/* Items visible when: slim mode (icons only), or group is open */}
        {(!show || learningOpen) && (
          <div className="space-y-0.5">
            {learningItems.map(item => renderNavItem(item, show, mobile))}
          </div>
        )}

        {/* Other items */}
        <div className="space-y-0.5 mt-1">
          {otherItems.map(item => renderNavItem(item, show, mobile))}
        </div>
      </nav>
    )
  }

  function renderFooter(mobile = false) {
    const show = mobile || !slim
    return (
      <div className="px-2 py-3 border-t space-y-1" style={{ borderColor: 'var(--border)' }}>
        <div className={`flex items-center gap-1 mb-1 ${!show ? 'flex-col' : 'px-1'}`}>
          <ThemeToggle />
          <LanguageSwitcher />
          <NotificationBell userId={user.id} slim={!show} />
        </div>

        <Link
          href="/profile"
          onClick={() => mobile && setMobileOpen(false)}
          title={!show ? profileLabel : undefined}
          className={[
            'flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors',
            'hover:bg-black/5 dark:hover:bg-white/5',
            !show ? 'justify-center' : '',
          ].join(' ')}
          style={{ color: 'var(--muted-foreground)' }}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
          ) : (
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              {(displayName[0] ?? '?').toUpperCase()}
            </div>
          )}
          {show && <span className="truncate">{displayName}</span>}
        </Link>

        <form action={signOut}>
          <button
            type="submit"
            title={!show ? logoutLabel : undefined}
            className={[
              'flex items-center gap-3 px-3 py-2 rounded-xl text-sm w-full transition-colors',
              'hover:bg-black/5 dark:hover:bg-white/5',
              !show ? 'justify-center' : '',
            ].join(' ')}
            style={{ color: 'var(--muted-foreground)' }}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {show && <span>{logoutLabel}</span>}
          </button>
        </form>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--background)' }}>

      {/* ── Desktop sidebar ──────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col border-r sticky top-0 h-screen shrink-0 relative transition-[width] duration-200"
        style={{
          background: 'var(--card)',
          borderColor: 'var(--border)',
          width: slim ? '4rem' : '14rem',
        }}
      >
        {/* Logo */}
        <div className={`flex items-center gap-2 px-4 py-4 ${slim ? 'justify-center' : ''}`}>
          <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              C
            </div>
            {!slim && (
              <span className="font-bold text-sm whitespace-nowrap" style={{ color: 'var(--foreground)' }}>
                Continuum
              </span>
            )}
          </Link>
        </div>

        {renderNav()}
        {renderFooter()}

        {/* Collapse toggle */}
        <button
          onClick={toggleCollapse}
          className="absolute -right-3 top-16 w-6 h-6 rounded-full border flex items-center justify-center z-10"
          style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
        >
          {slim ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* ── Mobile drawer ─────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className="absolute left-0 top-0 h-full w-64 flex flex-col"
            style={{ background: 'var(--card)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 px-4 py-4">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
              >
                C
              </div>
              <span className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>Continuum</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="ml-auto p-1 rounded-lg"
                style={{ color: 'var(--muted-foreground)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {renderNav(true)}
            {renderFooter(true)}
          </aside>
        </div>
      )}

      {/* ── Content column ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile top bar */}
        <header
          className="md:hidden sticky top-0 z-40 border-b flex items-center gap-3 px-4 h-14 shrink-0"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              C
            </div>
            <span className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>Continuum</span>
          </Link>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </header>

        {isFullBleed ? (
          <main className="flex-1 flex flex-col min-h-0">
            {children}
          </main>
        ) : (
          <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
            {children}
          </main>
        )}
      </div>
    </div>
  )
}
