'use client'

/* Right rail — trending tags + new members + saved posts. */

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { MessageCircle } from 'lucide-react'
import { Avatar } from './avatar'

export interface RailTag { slug: string; posts: number; trend: number }
export interface RailMember { id: string; name: string; avatarUrl: string | null; createdAt: string }
export interface RailSaved { id: string; label: string; author: string; when: string }

interface Props {
  trending: RailTag[]
  newMembers: RailMember[]
  saved: RailSaved[]
}

export function CommunityRightRail({ trending, newMembers, saved }: Props) {
  return (
    <div className="flex flex-col gap-3.5">
      <TrendingTags items={trending} />
      <NewMembers   items={newMembers} />
      {saved.length > 0 && <Saved items={saved} />}
    </div>
  )
}

/* ─── Trending tags ─── */

function TrendingTags({ items }: { items: RailTag[] }) {
  const t = useTranslations('community.rail')
  if (items.length === 0) return null
  return (
    <RailCard title={t('trending')} actionHref="#" actionLabel={t('all')}>
      <ul className="m-0 list-none p-0">
        {items.map((t, i) => (
          <li
            key={t.slug}
            className="flex items-center gap-2.5 py-[7px]"
            style={{ borderTop: i ? '1px solid color-mix(in srgb, var(--border) 60%, transparent)' : 'none' }}
          >
            <Link
              href={`/community/tag/${t.slug}`}
              className="flex-1 text-[12.5px] font-semibold no-underline"
              style={{ color: 'var(--primary)' }}
            >
              #{t.slug}
            </Link>
            <span className="text-[11px]" style={{ color: 'color-mix(in srgb, var(--muted-foreground) 80%, transparent)' }}>
              {t.posts}
            </span>
            {t.trend > 0 && (
              <span className="w-[26px] text-right text-[11px] font-semibold" style={{ color: 'var(--success)' }}>
                +{t.trend}
              </span>
            )}
          </li>
        ))}
      </ul>
    </RailCard>
  )
}

/* ─── New members ─── */

function NewMembers({ items }: { items: RailMember[] }) {
  const t = useTranslations('community.rail')
  const locale = useLocale()
  if (items.length === 0) return null
  return (
    <RailCard title={t('newMembers')} actionHref="#" actionLabel={t('all')}>
      <p
        className="m-0 mb-3 text-[11.5px] italic leading-[1.55]"
        style={{ color: 'var(--muted-foreground)' }}
      >
        {t('newMembersHint')}{' '}
        <span style={{ fontFamily: '"Instrument Serif", Georgia, serif', color: 'var(--foreground)' }}>
          {t('newMembersItalic')}
        </span>{' '}{t('newMembersPost')}
      </p>
      <ul className="m-0 list-none p-0">
        {items.map((m, i) => (
          <li
            key={m.id}
            className="flex items-center gap-2.5 py-2"
            style={{ borderTop: i ? '1px solid color-mix(in srgb, var(--border) 60%, transparent)' : 'none' }}
          >
            <Avatar name={m.name} url={m.avatarUrl} size={28} />
            <div className="min-w-0 flex-1">
              <div className="text-[12.5px] font-semibold" style={{ color: 'var(--foreground)' }}>{m.name}</div>
              <div className="text-[10.5px]" style={{ color: 'color-mix(in srgb, var(--muted-foreground) 80%, transparent)' }}>
                {new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(
                  -Math.max(1, Math.floor((Date.now() - new Date(m.createdAt).getTime()) / (24 * 60 * 60 * 1000))),
                  'days',
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div
        className="mt-3 flex items-center gap-2 rounded-lg px-3 py-2.5"
        style={{ background: 'color-mix(in srgb, var(--primary) 6%, transparent)' }}
      >
        <MessageCircle className="h-4 w-4" style={{ color: 'var(--primary)' }} />
        <span className="text-[11.5px] leading-[1.5]" style={{ color: 'var(--muted-foreground)' }}>
          {t('dmSoon')} <strong style={{ color: 'var(--primary)', fontWeight: 600 }}>{t('dmSoonBold')}</strong>
        </span>
      </div>
    </RailCard>
  )
}

/* ─── Saved posts ─── */

function Saved({ items }: { items: RailSaved[] }) {
  const t = useTranslations('community.rail')
  return (
    <RailCard title={t('saved')} actionHref="#" actionLabel={t('all')}>
      <div className="flex flex-col gap-2.5">
        {items.map((s, i) => (
          <Link
            key={s.id} href={`#post-${s.id}`}
            className="block no-underline"
            style={{
              paddingTop: i ? 10 : 0,
              borderTop: i ? '1px solid color-mix(in srgb, var(--border) 60%, transparent)' : 'none',
            }}
          >
            <div className="line-clamp-2 text-[12.5px] font-medium leading-[1.4]" style={{ color: 'var(--foreground)' }}>
              {s.label}
            </div>
            <div className="mt-0.5 text-[11px]" style={{ color: 'color-mix(in srgb, var(--muted-foreground) 80%, transparent)' }}>
              {s.author}
            </div>
          </Link>
        ))}
      </div>
    </RailCard>
  )
}

/* ─── shared shell ─── */

function RailCard({
  title, actionHref, actionLabel, children,
}: { title: string; actionHref?: string; actionLabel?: string; children: React.ReactNode }) {
  return (
    <section
      className="rounded-xl border p-4"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      <header className="mb-3 flex items-center">
        <h3 className="m-0 text-[13px] font-semibold tracking-[-0.1px]" style={{ color: 'var(--foreground)' }}>
          {title}
        </h3>
        <span className="flex-1" />
        {actionHref && actionLabel && (
          <Link href={actionHref} className="text-[11.5px] no-underline" style={{ color: 'var(--primary)' }}>
            {actionLabel} →
          </Link>
        )}
      </header>
      {children}
    </section>
  )
}
