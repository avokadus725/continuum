import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { HashtagClient } from '@/components/features/community/hashtag-client'
import type { CommunityPost } from '@/components/features/community/_types'

interface PageProps { params: Promise<{ slug: string }> }

export default async function HashtagPage({ params }: PageProps) {
  const { slug: rawSlug } = await params
  const slug = decodeURIComponent(rawSlug).toLowerCase()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verify tag exists
  const { data: tag } = await (supabase as any).from('tags').select('slug, display_name').eq('slug', slug).maybeSingle()
  if (!tag) notFound()

  // Posts under tag
  const { data: postsRaw } = await (supabase as any).from('post_tags')
    .select(`
      tag_slug,
      posts(
        id, kind, title, content, url, url_title, created_at, user_id, is_solved,
        profiles(full_name, avatar_url),
        post_tags(tag_slug),
        comments(id, content, created_at, user_id, parent_id, post_id,
          profiles(full_name, avatar_url)
        )
      )
    `)
    .eq('tag_slug', slug)
    .limit(50)

  const postRows = ((postsRaw ?? []) as Array<{ posts: any }>).map(r => r.posts).filter(Boolean) as any[]
  const postIds = postRows.map(p => p.id)

  // Reactions
  let likeRows: Array<{ post_id: string; user_id: string; type: string }> = []
  if (postIds.length > 0) {
    const { data } = await (supabase as any).from('reactions')
      .select('post_id, user_id, type').in('post_id', postIds)
    likeRows = (data ?? []) as typeof likeRows
  }
  const likesByPost = new Map<string, { count: number; liked: boolean }>()
  for (const r of likeRows) {
    if (r.type !== 'like') continue
    const cur = likesByPost.get(r.post_id) ?? { count: 0, liked: false }
    cur.count += 1
    if (r.user_id === user.id) cur.liked = true
    likesByPost.set(r.post_id, cur)
  }

  // Saves
  let savedSet = new Set<string>()
  if (postIds.length > 0) {
    const { data: saved } = await (supabase as any).from('saved_posts')
      .select('post_id').eq('user_id', user.id).in('post_id', postIds)
    savedSet = new Set(((saved ?? []) as { post_id: string }[]).map(s => s.post_id))
  }

  const posts: CommunityPost[] = postRows.map(p => {
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

  // Tag stats
  const { count: postCount } = await (supabase as any).from('post_tags')
    .select('post_id', { count: 'exact', head: true }).eq('tag_slug', slug)

  const { data: followRow } = await (supabase as any).from('tag_subscriptions')
    .select('tag_slug').eq('user_id', user.id).eq('tag_slug', slug).maybeSingle()

  // Active members under this tag — top 4 by post count.
  let activeRowsResult: { data: unknown } = { data: null }
  try { activeRowsResult = await (supabase as any).rpc('community_active_in_tag', { tag: slug, limit_n: 4 }) } catch {}
  const { data: activeRows } = activeRowsResult

  let activeMembers: Array<{ id: string; name: string; posts: number; avatarUrl: string | null }> = []
  if (activeRows && Array.isArray(activeRows)) {
    activeMembers = activeRows as typeof activeMembers
  }

  const { data: profile } = await supabase
    .from('profiles').select('full_name, avatar_url').eq('id', user.id).single()

  return (
    <HashtagClient
      tag={{ slug, displayName: tag.display_name }}
      stats={{ posts: postCount ?? 0, members: activeMembers.length }}
      following={!!followRow}
      activeMembers={activeMembers}
      relatedTags={[]}
      currentUser={{
        id: user.id,
        name: profile?.full_name ?? user.email?.split('@')[0] ?? null,
        avatarUrl: profile?.avatar_url ?? null,
      }}
      posts={posts}
    />
  )
}
