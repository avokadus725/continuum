import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Bookmark, ArrowLeft } from 'lucide-react'
import { PostCard } from '@/components/features/community/_parts/post-card'
import type { CommunityPost } from '@/components/features/community/_types'

export default async function SavedPostsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const t = await getTranslations('community.rail')

  /* ── Load saved posts ──────────────────────────────────── */
  const { data: savedRows } = await (supabase as any)
    .from('saved_posts')
    .select(`
      post_id, saved_at,
      posts(
        id, kind, title, content, url, url_title, created_at, user_id, is_solved,
        profiles(full_name, avatar_url),
        post_tags(tag_slug),
        comments(id, content, created_at, user_id, parent_id, post_id,
          profiles(full_name, avatar_url)
        )
      )
    `)
    .eq('user_id', user.id)
    .order('saved_at', { ascending: false })

  const postIds = ((savedRows ?? []) as any[]).map(r => r.post_id).filter(Boolean)

  /* ── Reactions ─────────────────────────────────────────── */
  let likesByPost = new Map<string, { count: number; liked: boolean }>()
  if (postIds.length > 0) {
    const { data } = await (supabase as any).from('reactions')
      .select('type, post_id, user_id').in('post_id', postIds)
    for (const r of (data ?? []) as { type: string; post_id: string; user_id: string }[]) {
      if (r.type !== 'like' || !r.post_id) continue
      const cur = likesByPost.get(r.post_id) ?? { count: 0, liked: false }
      cur.count += 1
      if (r.user_id === user.id) cur.liked = true
      likesByPost.set(r.post_id, cur)
    }
  }

  /* ── Shape posts ───────────────────────────────────────── */
  const posts: CommunityPost[] = ((savedRows ?? []) as any[])
    .filter(r => r.posts)
    .map(r => {
      const p = r.posts
      const stats = likesByPost.get(p.id) ?? { count: 0, liked: false }
      return {
        id: p.id,
        kind: p.kind ?? 'discussion',
        title: p.title ?? null,
        content: p.content,
        url: p.url,
        url_title: p.url_title,
        created_at: p.created_at,
        user_id: p.user_id,
        is_solved: !!p.is_solved,
        profiles: p.profiles,
        tags: (p.post_tags ?? []).map((pt: { tag_slug: string }) => pt.tag_slug),
        comments: (p.comments ?? []).filter((c: any) => c.post_id === p.id),
        likes: stats.count,
        liked: stats.liked,
        saved: true,
      }
    })

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/community"
          className="flex h-8 w-8 items-center justify-center rounded-lg border no-underline transition-colors"
          style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)', background: 'var(--card)' }}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="m-0 flex items-center gap-2 text-2xl font-bold tracking-[-0.3px]"
            style={{ color: 'var(--foreground)' }}>
            <Bookmark className="h-5 w-5" style={{ color: 'var(--primary)' }} />
            {t('saved')}
          </h1>
          {posts.length > 0 && (
            <p className="m-0 mt-0.5 text-[13px]" style={{ color: 'var(--muted-foreground)' }}>
              {posts.length} {posts.length === 1 ? 'збережений пост' : posts.length < 5 ? 'збережені пости' : 'збережених постів'}
            </p>
          )}
        </div>
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <div
          className="flex flex-col items-center gap-3 rounded-2xl border p-16 text-center"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <Bookmark className="h-10 w-10 opacity-20" style={{ color: 'var(--foreground)' }} />
          <p className="m-0 text-[14px]" style={{ color: 'var(--muted-foreground)' }}>
            Збережених постів поки немає.<br />
            Натисни <strong>Зберегти</strong> під будь-яким постом у спільноті.
          </p>
          <Link
            href="/community"
            className="mt-1 text-[13px] font-medium no-underline"
            style={{ color: 'var(--primary)' }}
          >
            ← До спільноти
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map(post => (
            <PostCard key={post.id} post={post} currentUserId={user.id} />
          ))}
        </div>
      )}

    </div>
  )
}
