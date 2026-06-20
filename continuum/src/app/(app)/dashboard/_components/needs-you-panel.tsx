/* "Needs you" panel – comments/reactions/replies on the current user's content.
   Server component. */

import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Panel } from './panel'
import { UserAvatar } from '@/components/ui/user-avatar'

export interface NeedsItem {
  id: string
  who: { name: string; avatarUrl?: string | null; role?: string | null }
  when: string
  action: string
  subject: string
  preview?: string | null
  href: string
  cta: string
}

interface Props {
  items: NeedsItem[]
}

export async function NeedsYouPanel({ items }: Props) {
  const t = await getTranslations('dashboard')

  if (items.length === 0) {
    return (
      <Panel title={t('needsTitle')} sub={t('needsSub')} counter={0}>
        <div
          className="rounded-xl border border-dashed py-8 text-center text-[13px]"
          style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
        >
          {t('needsEmpty')}
        </div>
      </Panel>
    )
  }

  return (
    <Panel
      title={t('needsTitle')}
      sub={t('needsSub')}
      counter={items.length}
      counterTone="primary"
    >
      <ul className="flex flex-col">
        {items.map((it, i) => (
          <Row key={it.id} it={it} last={i === items.length - 1} />
        ))}
      </ul>
    </Panel>
  )
}

function Row({ it, last }: { it: NeedsItem; last: boolean }) {
  return (
    <li
      className="flex items-start gap-3 py-3.5"
      style={{ borderBottom: last ? 'none' : '1px solid color-mix(in srgb, var(--border) 70%, transparent)' }}
    >
      <UserAvatar name={it.who.name} url={it.who.avatarUrl} size={32} />

      <div className="min-w-0 flex-1">
        <div className="text-[13px]" style={{ color: 'var(--foreground)' }}>
          <span className="font-semibold">{it.who.name}</span>
          {it.who.role && (
            <span className="ml-1.5 text-[11px]" style={{ color: 'var(--muted-foreground)' }}>· {it.who.role}</span>
          )}
          <span style={{ color: 'var(--muted-foreground)' }}> {it.action} </span>
          <span style={{ color: 'color-mix(in srgb, var(--muted-foreground) 70%, transparent)' }}>· {it.when}</span>
        </div>

        <div className="mt-1 text-[12.5px] font-medium" style={{ color: 'var(--primary)' }}>
          {it.subject}
        </div>

        {it.preview && (
          <blockquote
            className="mt-1.5 rounded-lg border px-3 py-2 text-[12.5px] italic leading-[1.5]"
            style={{
              background: 'var(--muted)',
              borderColor: 'color-mix(in srgb, var(--border) 70%, transparent)',
              borderLeftWidth: 2,
              borderLeftColor: 'color-mix(in srgb, var(--muted-foreground) 35%, transparent)',
              color: 'var(--muted-foreground)',
            }}
          >
            {it.preview}
          </blockquote>
        )}
      </div>

      <Link
        href={it.href}
        className="flex-none rounded-lg border px-3 py-1.5 text-xs font-semibold no-underline transition-colors hover:bg-[color-mix(in_srgb,var(--primary)_8%,var(--card))]"
        style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
      >
        {it.cta}
      </Link>
    </li>
  )
}
