'use client'

/* Sidebar layout — v3 + full-bleed routes hide all chrome.
   Replaces src/components/sidebar-layout.tsx.

   What changed vs the dashboard-v3 version:
   - On FULL_BLEED routes (/focus), we render *only* the children.
     No sidebar, no topbar, no mobile drawer. The room owns the viewport. */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import {
  Home, BookOpen, CheckSquare, FileText,
  Sparkles, BarChart2, Trophy, Timer, BookMarked, Users2,
  X, ShieldCheck,
} from 'lucide-react'
import { Topbar } from '@/components/topbar'

interface NavItem { href: string; labelKey: string; group: 'top' | 'learning' | 'community' | 'progress' }

const NAV: { item: NavItem; Icon: React.ElementType }[] = [
  { item: { href: '/dashboard',       labelKey: 'dashboard',       group: 'top'       }, Icon: Home },
  { item: { href: '/materials',       labelKey: 'materials',       group: 'learning'  }, Icon: BookOpen },
  { item: { href: '/tasks',           labelKey: 'tasks',           group: 'learning'  }, Icon: CheckSquare },
  { item: { href: '/notes',           labelKey: 'notes',           group: 'learning'  }, Icon: FileText },
  { item: { href: '/collections',     labelKey: 'collections',     group: 'learning'  }, Icon: BookMarked },
  { item: { href: '/community',       labelKey: 'community',       group: 'community' }, Icon: Users2 },
  { item: { href: '/recommendations', labelKey: 'recommendations', group: 'community' }, Icon: Sparkles },
  { item: { href: '/gamification',    labelKey: 'gamification',    group: 'community' }, Icon: Trophy },
  { item: { href: '/analytics',       labelKey: 'analytics',       group: 'progress'  }, Icon: BarChart2 },
  { item: { href: '/focus',           labelKey: 'focus',           group: 'progress'  }, Icon: Timer },
]

const GROUP_LABEL: Record<NavItem['group'], string | null> = {
  top: null,
  learning: 'learningGroup',
  community: 'communityGroup',
  progress: 'progressGroup',
}

/** Routes that fully own the viewport — no sidebar, no topbar. */
const FULL_BLEED = new Set(['/focus'])

interface SidebarLayoutProps {
  children: React.ReactNode
  user: { id: string; email?: string | null; user_metadata?: { avatar_url?: string; full_name?: string } }
  profileAvatarUrl?: string | null
  profileName?: string | null
  profileLevel?: number | null
  isAdmin?: boolean
}

export function SidebarLayout({
  children, user, profileAvatarUrl, profileName, profileLevel, isAdmin = false,
}: SidebarLayoutProps) {
  const pathname = usePathname()
  const t = useTranslations('nav')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const avatarUrl = profileAvatarUrl ?? user.user_metadata?.avatar_url ?? null
  const displayName = profileName ?? user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? '?'
  const isFullBleed = FULL_BLEED.has(pathname)

  // ── Full-bleed: render only children (focus room owns the viewport). ──
  if (isFullBleed) {
    return (
      <main className="flex h-screen flex-col overflow-hidden" style={{ background: '#000000' }}>
        {children}
      </main>
    )
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--background)' }}>
      {/* ── Desktop sidebar ──────────────────── */}
      <aside
        className="sticky top-0 hidden h-screen w-[224px] shrink-0 flex-col border-r px-3.5 pb-4 pt-5 md:flex"
        style={{ background: 'var(--background)', borderColor: 'var(--border)' }}
      >
        <Logo />
        <Nav pathname={pathname} t={t} onItemClick={() => {}} />
        {isAdmin && <AdminLink t={t} pathname={pathname} />}
      </aside>

      {/* ── Mobile drawer ────────────────────── */}
      {mounted && mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setMobileOpen(false)}>
          <aside
            className="absolute left-0 top-0 flex h-full w-64 flex-col px-3.5 pb-4 pt-5"
            style={{ background: 'var(--card)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <Logo />
              <button onClick={() => setMobileOpen(false)} className="p-1" style={{ color: 'var(--muted-foreground)' }}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <Nav pathname={pathname} t={t} onItemClick={() => setMobileOpen(false)} />
            {isAdmin && <AdminLink t={t} pathname={pathname} />}
          </aside>
        </div>
      )}

      {/* ── Content column ───────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          user={user}
          avatarUrl={avatarUrl}
          displayName={displayName}
          level={profileLevel ?? undefined}
          onMobileMenu={() => setMobileOpen(true)}
        />
        <main className="mx-auto w-full max-w-[1240px] flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  )
}

/* ─────────── pieces ─────────── */

function Logo() {
  return (
    <Link href="/dashboard" className="mb-6 flex items-center gap-2.5 px-2 no-underline">
      <svg width="24" height="24" viewBox="0 0 44 44" aria-hidden>
        <path d="M30 11 A12 12 0 1 0 30 33" stroke="var(--foreground)" strokeWidth="3" strokeLinecap="round" fill="none" />
        <circle cx="32" cy="22" r="2.4" fill="var(--primary)" />
      </svg>
      <span className="text-[14.5px] font-bold tracking-[-0.2px]" style={{ color: 'var(--foreground)' }}>
        Continuum
      </span>
    </Link>
  )
}

function Nav({ pathname, t, onItemClick }: { pathname: string; t: ReturnType<typeof useTranslations>; onItemClick: () => void }) {
  const groups: NavItem['group'][] = ['top', 'learning', 'community', 'progress']
  return (
    <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
      {groups.map(g => {
        const items = NAV.filter(n => n.item.group === g)
        if (items.length === 0) return null
        const labelKey = GROUP_LABEL[g]
        return (
          <div key={g} className={labelKey ? 'mt-[18px]' : ''}>
            {labelKey && (
              <div
                className="px-2.5 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-[1.2px]"
                style={{ color: 'color-mix(in srgb, var(--muted-foreground) 70%, transparent)' }}
              >
                {t(labelKey)}
              </div>
            )}
            {items.map(({ item, Icon }) => {
              const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onItemClick}
                  className="flex items-center gap-[11px] rounded-lg px-2.5 py-1.5 text-[13.5px] no-underline transition-colors"
                  style={{
                    background: active ? 'color-mix(in srgb, var(--primary) 14%, transparent)' : 'transparent',
                    color: active ? 'var(--primary)' : 'var(--foreground)',
                    fontWeight: active ? 600 : 500,
                  }}
                >
                  <Icon className="h-4 w-4 shrink-0" style={{
                    color: active ? 'var(--primary)' : 'var(--muted-foreground)',
                    opacity: active ? 1 : 0.85,
                  }} />
                  {t(item.labelKey)}
                </Link>
              )
            })}
          </div>
        )
      })}
    </nav>
  )
}

function AdminLink({ t, pathname }: { t: ReturnType<typeof useTranslations>; pathname: string }) {
  const active = pathname === '/admin' || pathname.startsWith('/admin/')
  return (
    <Link
      href="/admin"
      className="mt-2.5 flex items-center gap-[11px] rounded-lg border-t px-2.5 py-2 pt-3.5 text-[13px] no-underline"
      style={{
        borderColor: 'var(--border)',
        color: active ? 'var(--primary)' : 'var(--muted-foreground)',
        fontWeight: 500,
      }}
    >
      <ShieldCheck className="h-4 w-4" />
      {t('admin')}
    </Link>
  )
}
