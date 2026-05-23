/* Shared "dashboard panel" container.
   Used by Today / NeedsYou / Fresh panels. */
import { ReactNode } from 'react'

interface PanelProps {
  title: string
  sub?: string
  counter?: number | string | null
  counterTone?: 'muted' | 'primary'
  action?: { label: string; href: string }
  children: ReactNode
}

export function Panel({ title, sub, counter, counterTone = 'muted', action, children }: PanelProps) {
  const counterStyles = counterTone === 'primary'
    ? { color: 'var(--primary)', background: 'color-mix(in srgb, var(--primary) 14%, transparent)' }
    : { color: 'var(--muted-foreground)', background: 'var(--muted)' }

  return (
    <section
      className="mt-7 rounded-2xl border p-5"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      <header className="mb-2 flex items-center gap-3">
        <h2
          className="m-0 text-[14px] font-semibold tracking-[-0.1px]"
          style={{ color: 'var(--foreground)' }}
        >
          {title}
        </h2>
        {counter != null && (
          <span
            className="inline-flex h-5 min-w-[22px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold tabular-nums"
            style={counterStyles}
          >
            {counter}
          </span>
        )}
        <span className="flex-1" />
        {action && (
          <a
            href={action.href}
            className="text-xs font-medium no-underline hover:underline"
            style={{ color: 'var(--primary)' }}
          >
            {action.label} →
          </a>
        )}
      </header>
      {sub && (
        <p className="mb-2 text-xs" style={{ color: 'color-mix(in srgb, var(--muted-foreground) 80%, transparent)' }}>
          {sub}
        </p>
      )}
      <div className="mt-1">{children}</div>
    </section>
  )
}
