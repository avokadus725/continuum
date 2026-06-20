'use client'

/* Community client – orchestrates the feed, composer, filters and right rail. */

import { useTranslations } from 'next-intl'
import { PostComposer }    from './_parts/post-composer'
import { FeedFilterBar }   from './_parts/feed-filter-bar'
import { FeedTimeGroups }  from './_parts/feed-time-groups'
import { CommunityRightRail, type RailTag, type RailMember, type RailSaved } from './_parts/right-rail'
import type { CommunityPost, FeedKindFilter, FeedSort } from './_types'

interface Props {
  currentUser: { id: string; name: string | null; avatarUrl: string | null }
  posts: CommunityPost[]
  filter: { kind: FeedKindFilter; sort: FeedSort }
  counts: { all: number; discussion: number; question: number; share: number }
  rail: { trending: RailTag[]; newMembers: RailMember[]; saved: RailSaved[] }
}

export function CommunityClient({ currentUser, posts, filter, counts, rail }: Props) {
  const t = useTranslations('community')
  const online = 0
  const todayCount = posts.filter(p => {
    const d = new Date(p.created_at); const today = new Date(); today.setHours(0,0,0,0)
    return d.getTime() >= today.getTime()
  }).length

  return (
    <div className="grid grid-cols-1 gap-7 lg:grid-cols-[1fr_304px]">
      <div>
        <header className="mb-[18px]">
          <h1
            className="m-0 text-[30px] font-semibold tracking-[-0.6px]"
            style={{ color: 'var(--foreground)' }}
          >
            {t('title')}
          </h1>
          <p className="mt-1.5 max-w-[540px] text-[13px]" style={{ color: 'var(--muted-foreground)' }}>
            {t('subtitle')}{' '}
            <span style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: 'italic', color: 'var(--foreground)' }}>
              {t('subtitleItalic')}
            </span>.
          </p>
          <div className="mt-3 flex gap-4 text-[12px]" style={{ color: 'color-mix(in srgb, var(--muted-foreground) 80%, transparent)' }}>
            <span><strong style={{ color: 'var(--foreground)', fontWeight: 600 }}>{counts.all}</strong> {t('posts')}</span>
            {online > 0 && <><span>·</span><span><strong style={{ color: 'var(--success)', fontWeight: 600 }}>{online}</strong> {t('online')}</span></>}
            {todayCount > 0 && <><span>·</span><span><strong style={{ color: 'var(--foreground)', fontWeight: 600 }}>{todayCount}</strong> {t('today')}</span></>}
          </div>
        </header>

        <PostComposer name={currentUser.name} avatarUrl={currentUser.avatarUrl} />

        <FeedFilterBar
          kind={filter.kind}
          sort={filter.sort}
          counts={counts}
          basePath="/community"
        />

        <FeedTimeGroups posts={posts} currentUserId={currentUser.id} />
      </div>

      <aside>
        <CommunityRightRail
          trending={rail.trending}
          newMembers={rail.newMembers}
          saved={rail.saved}
        />
      </aside>
    </div>
  )
}
