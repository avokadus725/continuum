'use client'

/* MobileNav – bottom navigation bar for small screens. */

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'

interface NavItem {
  href: string
  label: string
}

interface MobileNavProps {
  items: NavItem[]
}

export function MobileNav({ items }: MobileNavProps) {
  const t = useTranslations('nav')
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Hamburger */}
      <button
        onClick={() => setOpen(true)}
        aria-label={t('menu')}
        className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg"
        style={{ color: 'var(--muted-foreground)' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          onClick={() => setOpen(false)}
          style={{ background: 'rgba(0,0,0,0.5)' }}
        >
          {/* Drawer */}
          <div
            className="absolute right-0 top-0 h-full w-64 shadow-xl flex flex-col"
            style={{ background: 'var(--card)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <span className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>Continuum</span>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg"
                style={{ color: 'var(--muted-foreground)' }}
              >
                ×
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto py-3">
              {items.map(({ href, label }) => {
                const isActive = pathname === href || pathname.startsWith(href + '/')
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className="flex items-center px-5 py-3 text-sm font-medium transition-colors"
                    style={{
                      color: isActive ? 'var(--primary)' : 'var(--foreground)',
                      background: isActive ? 'color-mix(in srgb, var(--primary) 8%, transparent)' : 'transparent',
                    }}
                  >
                    {label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
