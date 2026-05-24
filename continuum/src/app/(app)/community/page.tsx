import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CommunityClient } from '@/components/features/community/community-client'
import type { CommunityPost, FeedKindFilter, FeedSort } from '@/components/features/community/_types'

interface SearchParamsP { kind?: string; sort?: string }
interface PageProps { searchParams: Promise<SearchParamsP> }

export default async function CommunityPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const sp = await searchParams
  const kindFilter: FeedKindFilter =
    sp.kind === 'discussion' || sp.kind === 'question' || sp.kind === 'share' ? sp.kind : 'all'
  const sort: FeedSort =
    sp.sort === 'top' || sp.sort === 'unsolved' ? sp.sort : 'recent'

  /* ── Posts ────────────────────────────────────────── */
  let postsQuery = (supabase as any).from('posts')
    .select(`
      id, kind, title, content, url, url_title, created_at, user_id, is_solved,
      profiles(full_name, avatar_url),
      post_tags(tag_slug),
      comments(id, content, created_at, user_id, parent_id, post_id,
        profiles(full_name, avatar_url)
      )
    `)
    .limit(50)

  if (kindFilter !== 'all')           postsQuery = postsQuery.eq('kind', kindFilter)
  if (sort === 'unsolved')            postsQuery = postsQuery.eq('kind', 'question').eq('is_solved', false)

  postsQuery = postsQuery.order('created_at', { ascending: false })

  const { data: postsRaw } = await postsQuery
  const postIds: string[] = (postsRaw ?? []).map((p: { id: string }) => p.id)

  /* ── Reactions ────────────────────────────────────── */
  let reactionsRaw: Array<{ type: string; post_id: string; user_id: string }> = []
  if (postIds.length > 0) {
    const { data } = await (supabase as any).from('reactions')
      .select('type, post_id, user_id').in('post_id', postIds)
    reactionsRaw = (data ?? []) as typeof reactionsRaw
  }
  const likesByPost = new Map<string, { count: number; liked: boolean }>()
  for (const r of reactionsRaw) {
    if (r.type !== 'like' || !r.post_id) continue
    const cur = likesByPost.get(r.post_id) ?? { count: 0, liked: false }
    cur.count += 1
    if (r.user_id === user.id) cur.liked = true
    likesByPost.set(r.post_id, cur)
  }

  /* ── Saves ────────────────────────────────────────── */
  let savedSet = new Set<string>()
  if (postIds.length > 0) {
    const { data: saved } = await (supabase as any).from('saved_posts')
      .select('post_id').eq('user_id', user.id).in('post_id', postIds)
    savedSet = new Set(((saved ?? []) as { post_id: string }[]).map(s => s.post_id))
  }

  /* ── Shape ────────────────────────────────────────── */
  const posts: CommunityPost[] = (postsRaw ?? []).map((p: any) => {
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
      comments: (p.comments ?? []).filter((c: { post_id: string }) => c.post_id === p.id),
      likes: stats.count,
      liked: stats.liked,
      saved: savedSet.has(p.id),
    }
  })

  /* ── Profile (for composer avatar) ───────────────── */
  const { data: profile } = await supabase
    .from('profiles').select('full_name, avatar_url').eq('id', user.id).single()

  /* ── Right-rail data ─────────────────────────────── */
  const railData = await loadRightRailData(supabase, user.id)

  return (
    <CommunityClient
      currentUser={{
        id: user.id,
        name: profile?.full_name ?? user.email?.split('@')[0] ?? null,
        avatarUrl: profile?.avatar_url ?? null,
      }}
      posts={posts}
      filter={{ kind: kindFilter, sort }}
      counts={await loadKindCounts(supabase)}
      rail={railData}
    />
  )
}

/* ── Helpers ── */

async function loadKindCounts(supabase: Awaited<ReturnType<typeof createClient>>) {
  const head = (kind: 'discussion' | 'question' | 'share' | null) => {
    const q = (supabase as any).from('posts').select('id', { count: 'exact', head: true })
    return kind ? q.eq('kind', kind) : q
  }
  const [all, d, q, s] = await Promise.all([head(null), head('discussion'), head('question'), head('share')])
  return {
    all:        all.count        ?? 0,
    discussion: d.count          ?? 0,
    question:   q.count          ?? 0,
    share:      s.count          ?? 0,
  }
}

async function loadRightRailData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  currentUserId: string,
) {
  let tagCountsResult: { data: unknown } = { data: null }
  try { tagCountsResult = await (supabase as any).rpc('community_trending_tags', { limit_n: 6 }) } catch {}
  const { data: tagCounts } = tagCountsResult

  let trending: Array<{ slug: string; posts: number; trend: number }> = []
  if (tagCounts && Array.isArray(tagCounts)) {
    trending = tagCounts as Array<{ slug: string; posts: number; trend: number }>
  } else {
    const { data: rows } = await (supabase as any).from('post_tags').select('tag_slug').limit(500)
    const counts = new Map<string, number>()
    for (const r of (rows ?? []) as { tag_slug: string }[]) {
      counts.set(r.tag_slug, (counts.get(r.tag_slug) ?? 0) + 1)
    }
    trending = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([slug, posts]) => ({ slug, posts, trend: 0 }))
  }

  const sinceISO = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
  const { data: newMembers } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, created_at')
    .gt('created_at', sinceISO)
    .neq('id', currentUserId)
    .order('created_at', { ascending: false })
    .limit(4)

  const { data: savedRows } = await (supabase as any).from('saved_posts')
    .select('post_id, saved_at, posts(id, title, content, kind, profiles(full_name))')
    .eq('user_id', currentUserId)
    .order('saved_at', { ascending: false })
    .limit(3)

  const saved = ((savedRows ?? []) as Array<{
    post_id: string; saved_at: string;
    posts: { id: string; title: string | null; content: string; kind: string; profiles: { full_name: string | null } | null } | null
  }>).map(r => ({
    id: r.post_id,
    label: r.posts?.title || r.posts?.content?.slice(0, 90) || '—',
    author: r.posts?.profiles?.full_name ?? '—',
    when: r.saved_at,
  }))

  return {
    trending,
    newMembers: (newMembers ?? []).map(m => ({
      id: m.id,
      name: m.full_name ?? '—',
      avatarUrl: m.avatar_url,
      createdAt: m.created_at,
    })),
    saved,
  }
}
