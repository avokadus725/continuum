'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavLinkProps {
  href: string
  label: string
}

export function NavLink({ href, label }: NavLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

  return (
    <Link
      href={href}
      className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hidden md:block"
      style={{
        color: isActive ? 'var(--primary)' : 'var(--muted-foreground)',
        background: isActive ? 'color-mix(in srgb, var(--primary) 10%, transparent)' : 'transparent',
      }}
    >
      {label}
    </Link>
  )
}
