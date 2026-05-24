'use client'

/* Hashtag detail — hero with tag header + sticky compose + feed + right rail
   (which shows "About this tag" + active members instead of trending). */

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Bell, BellOff } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { toggleTagFollow } from '@/app/actions/posts'
import { PostComposer }   from './_parts/post-composer'
import { FeedTimeGroups } from './_parts/feed-time-groups'
import { Avatar } from './_parts/avatar'
import type { CommunityPost } from './_types'

interface Props {
  tag: { slug: string; displayName: string | null }
  stats: { posts: number; members: number }
  following: boolean
  activeMembers: Array<{ id: string; name: string; posts: number; avatarUrl: string | null }>
  relatedTags: string[]
  currentUser: { id: string; name: string | null; avatarUrl: string | null }
  posts: CommunityPost[]
}

export function HashtagClient({
  tag, stats, following, activeMembers, relatedTags, currentUser, posts,
}: Props) {
  const t = useTranslations('community')
  const router = useRouter()
  const [isPending, startTr] = useTransition()

  function handleToggleFollow() {
    startTr(async () => {
      const fd = new FormData(); fd.set('tag', tag.slug)
      const r = await toggleTagFollow(fd)
      if (!r?.error) {
        toast.success(r?.following ? `Стежиш за #${tag.slug}` : `Відписався від #${tag.slug}`)
        router.refresh()
      }
    })
  }

  return (
    <div className="grid grid-cols-1 gap-7 lg:grid-cols-[1fr_304px]">
      <div>
        <header className="mb-[18px]">
          <h1 className="m-0 text-[30px] font-semibold tracking-[-0.6px]" style={{ color: 'var(--foreground)' }}>
            <span style={{ color: 'var(--primary)' }}>#</span>{tag.slug}
          </h1>
          {tag.displayName && (
            <p className="mt-1.5 max-w-[540px] text-[13px]" style={{ color: 'var(--muted-foreground)' }}>
              {stats.posts} {t('hashtag.posts')} · {stats.members} {t('hashtag.members')} {t('hashtag.discussing')}{' '}
              <span style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: 'italic', color: 'var(--foreground)' }}>
                {tag.displayName}
              </span>
            </p>
          )}
        </header>

        <PostComposer name={currentUser.name} avatarUrl={currentUser.avatarUrl} />

        <FeedTimeGroups posts={posts} currentUserId={currentUser.id} />
      </div>

      <aside className="flex flex-col gap-3.5">
        {/* About this tag */}
        <section className="rounded-xl border p-4" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <h3 className="m-0 mb-3 text-[13px] font-semibold tracking-[-0.1px]" style={{ color: 'var(--foreground)' }}>
            {t('hashtag.about')}
          </h3>
          <div
            className="rounded-[10px] p-3.5"
            style={{ background: 'color-mix(in srgb, var(--primary) 6%, transparent)' }}
          >
            <div className="text-[22px] font-bold leading-none" style={{ color: 'var(--primary)' }}>
              #{tag.slug}
            </div>
            {tag.displayName && (
              <p className="m-0 mt-1.5 text-[11.5px] leading-[1.55]" style={{ color: 'var(--muted-foreground)' }}>
                {tag.displayName}
              </p>
            )}
          </div>
          <div className="mt-3 flex justify-between text-[11.5px]" style={{ color: 'var(--muted-foreground)' }}>
            <span><strong style={{ color: 'var(--foreground)' }}>{stats.posts}</strong> {t('hashtag.posts')}</span>
            <span><strong style={{ color: 'var(--foreground)' }}>{stats.members}</strong> {t('hashtag.members')}</span>
          </div>
          <button
            onClick={handleToggleFollow}
            disabled={isPending}
            className="mt-3 inline-flex h-[34px] w-full items-center justify-center gap-1.5 rounded-lg border-0 text-[12.5px] font-semibold"
            style={{
              background: following ? 'var(--muted)'  : 'var(--primary)',
              color:      following ? 'var(--foreground)' : '#fff',
            }}
          >
            {following
              ? <><BellOff className="h-3.5 w-3.5" /> {t('hashtag.unfollow')}</>
              : <><Bell    className="h-3.5 w-3.5" /> {t('hashtag.follow')}</>}
          </button>
        </section>

        {/* Active members */}
        {activeMembers.length > 0 && (
          <section className="rounded-xl border p-4" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <h3 className="m-0 mb-3 text-[13px] font-semibold tracking-[-0.1px]" style={{ color: 'var(--foreground)' }}>
              {t('hashtag.activeMembers')}
            </h3>
            {activeMembers.map((p, i) => (
              <div
                key={p.id}
                className="flex items-center gap-2.5 py-[7px]"
                style={{ borderTop: i ? '1px solid color-mix(in srgb, var(--border) 60%, transparent)' : 'none' }}
              >
                <Avatar name={p.name} url={p.avatarUrl} size={26} />
                <div className="flex-1 text-[12.5px] font-medium" style={{ color: 'var(--foreground)' }}>{p.name}</div>
                <div className="text-[11px]" style={{ color: 'color-mix(in srgb, var(--muted-foreground) 80%, transparent)' }}>
                  {p.posts} {p.posts === 1 ? t('hashtag.postSuffix') : t('hashtag.postSuffixPlural')}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Related tags */}
        {relatedTags.length > 0 && (
          <section className="rounded-xl border p-4" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <h3 className="m-0 mb-3 text-[13px] font-semibold tracking-[-0.1px]" style={{ color: 'var(--foreground)' }}>
              {t('hashtag.relatedTags')}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {relatedTags.map(t => (
                <Link
                  key={t} href={`/community/tag/${t}`}
                  className="rounded-full px-2 py-1 text-[11.5px] font-semibold no-underline"
                  style={{ background: 'color-mix(in srgb, var(--primary) 6%, transparent)', color: 'var(--primary)' }}
                >
                  #{t}
                </Link>
              ))}
            </div>
          </section>
        )}
      </aside>
    </div>
  )
}
