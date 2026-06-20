/* Fresh panel – delta feed of items created since the user's last visit.
   Server component. */

import Link from 'next/link'
import { FileText, Users, CheckSquare } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Panel } from './panel'

export type FreshKind = 'material' | 'post' | 'task'

export interface FreshItem {
  id: string
  kind: FreshKind
  title: string
  desc: string
  when: string
  href: string
}

interface Props {
  items: FreshItem[]
}

const ICONS: Record<FreshKind, React.ElementType> = {
  material: FileText,
  post: Users,
  task: CheckSquare,
}
const TONES: Record<FreshKind, string> = {
  material: 'var(--success)',
  post: 'var(--primary)',
  task: '#C2956C',
}

export async function FreshPanel({ items }: Props) {
  const t = await getTranslations('dashboard')

  if (items.length === 0) {
    return (
      <Panel
        title={t('freshTitle')}
        sub={t('freshSub')}
        action={{ label: t('freshAll'), href: '/notifications' }}
      >
        <div
          className="rounded-xl border border-dashed py-8 text-center text-[13px]"
          style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
        >
          {t('freshEmpty')}
        </div>
      </Panel>
    )
  }

  return (
    <Panel
      title={t('freshTitle')}
      sub={t('freshSub')}
      counter={items.length}
      action={{ label: t('freshAll'), href: '/notifications' }}
    >
      <ol className="relative pl-3">
        <span
          className="absolute left-[5px] top-4 bottom-4 w-px"
          style={{ background: 'color-mix(in srgb, var(--border) 70%, transparent)' }}
          aria-hidden
        />
        {items.map((it, i) => (
          <Row key={it.id} it={it} first={i === 0} last={i === items.length - 1} />
        ))}
      </ol>
    </Panel>
  )
}

function Row({ it, first, last }: { it: FreshItem; first: boolean; last: boolean }) {
  const Icon = ICONS[it.kind]
  const tone = TONES[it.kind]
  return (
    <li className="relative">
      <span
        className="absolute left-[-7px] h-[11px] w-[11px] rounded-full border-2"
        style={{
          top: first ? 6 : 14,
          background: 'var(--card)',
          borderColor: tone,
        }}
        aria-hidden
      />
      <Link
        href={it.href}
        className="flex items-start gap-3.5 py-3 pl-3.5 no-underline"
        style={{ paddingTop: first ? 4 : 12, paddingBottom: last ? 4 : 12 }}
      >
        <span
          className="inline-flex h-7 w-7 flex-none items-center justify-center rounded-lg border"
          style={{ background: 'var(--muted)', borderColor: 'var(--border)', color: tone }}
        >
          <Icon size={14} />
        </span>
        <div className="flex-1">
          <div className="text-[13.5px] font-semibold tracking-[-0.1px]" style={{ color: 'var(--foreground)' }}>
            {it.title}
          </div>
          <div className="mt-0.5 text-[12.5px] leading-[1.5]" style={{ color: 'var(--muted-foreground)' }}>
            {it.desc}
          </div>
        </div>
        <span
          className="flex-none whitespace-nowrap text-[11.5px]"
          style={{ color: 'color-mix(in srgb, var(--muted-foreground) 70%, transparent)' }}
        >
          {it.when}
        </span>
      </Link>
    </li>
  )
}
