'use client'

/* Time-grouped post stream — groups posts by Сьогодні / Цього тижня / Раніше. */

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { PostCard } from './post-card'
import type { CommunityPost } from '../_types'

interface Props {
  posts: CommunityPost[]
  currentUserId: string
}

interface Group { label: string; items: CommunityPost[] }

function bucketize(posts: CommunityPost[], labels: { today: string; week: string; older: string }): Group[] {
  const now    = Date.now()
  const dayMs  = 24 * 60 * 60 * 1000
  const today  = new Date(now); today.setHours(0, 0, 0, 0)
  const week   = today.getTime() - 6 * dayMs

  const buckets: { today: CommunityPost[]; week: CommunityPost[]; older: CommunityPost[] } = {
    today: [], week: [], older: [],
  }
  for (const p of posts) {
    const ts = new Date(p.created_at).getTime()
    if      (ts >= today.getTime()) buckets.today.push(p)
    else if (ts >= week)             buckets.week.push(p)
    else                              buckets.older.push(p)
  }

  const out: Group[] = []
  if (buckets.today.length) out.push({ label: labels.today, items: buckets.today })
  if (buckets.week.length)  out.push({ label: labels.week,  items: buckets.week })
  if (buckets.older.length) out.push({ label: labels.older, items: buckets.older })
  return out
}

export function FeedTimeGroups({ posts, currentUserId }: Props) {
  const t = useTranslations('community')
  const labels = { today: t('timeGroups.today'), week: t('timeGroups.week'), older: t('timeGroups.older') }
  const groups = useMemo(() => bucketize(posts, labels), [posts, labels.today, labels.week, labels.older])

  if (posts.length === 0) {
    return (
      <div
        className="mt-2 rounded-2xl border py-14 text-center"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <p className="mb-2 text-4xl">💬</p>
        <p className="text-[13px]" style={{ color: 'var(--muted-foreground)' }}>
          {t('empty')}
        </p>
      </div>
    )
  }

  return (
    <>
      {groups.map((g, gi) => (
        <section key={g.label}>
          <header className="mb-2 flex items-center gap-2.5" style={{ paddingTop: gi === 0 ? 0 : 14 }}>
            <span style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: 'italic', color: 'var(--primary)', fontSize: 16 }}>—</span>
            <span
              className="text-[11.5px] font-semibold uppercase"
              style={{ letterSpacing: '1.2px', color: 'var(--muted-foreground)' }}
            >
              {g.label}
            </span>
            <span className="h-px flex-1" style={{ background: 'color-mix(in srgb, var(--border) 70%, transparent)' }} />
          </header>
          {g.items.map(p => (
            <PostCard key={p.id} post={p} currentUserId={currentUserId} />
          ))}
        </section>
      ))}
    </>
  )
}
