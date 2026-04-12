import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { PostFeed, CreatePostForm, type Post } from '@/components/features/posts/post-feed'

const REACTION_TYPES = ['like'] as const

export default async function CommunityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const tNav = await getTranslations('nav')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', user.id)
    .single()

  // Fetch posts with profiles + comments + reactions
  const { data: postsRaw } = await (supabase as any).from('posts')
    .select(`
      id, content, url, url_title, created_at, user_id,
      profiles(full_name, avatar_url),
      comments(id, content, created_at, user_id, parent_id, post_id,
        profiles(full_name, avatar_url)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  const postIds = (postsRaw ?? []).map((p: any) => p.id)

  // Fetch reactions for all posts
  let reactionsRaw: any[] = []
  if (postIds.length > 0) {
    const { data } = await (supabase as any).from('reactions')
      .select('type, post_id, user_id')
      .in('post_id', postIds)
    reactionsRaw = data ?? []
  }

  const reactionsByPost = new Map<string, typeof reactionsRaw>()
  for (const r of reactionsRaw) {
    if (!r.post_id) continue
    const arr = reactionsByPost.get(r.post_id) ?? []
    arr.push(r)
    reactionsByPost.set(r.post_id, arr)
  }

  function buildReactions(postId: string) {
    const all = reactionsByPost.get(postId) ?? []
    return REACTION_TYPES.map(type => ({
      type: type as 'like' | 'helpful' | 'fire',
      count: all.filter((r: any) => r.type === type).length,
      reacted: all.some((r: any) => r.type === type && r.user_id === user!.id),
    }))
  }

  const posts: Post[] = (postsRaw ?? []).map((p: any) => ({
    id: p.id,
    content: p.content,
    url: p.url,
    url_title: p.url_title,
    created_at: p.created_at,
    user_id: p.user_id,
    profiles: p.profiles,
    reactions: buildReactions(p.id),
    comments: (p.comments ?? []).filter((c: any) => c.post_id === p.id),
  }))

  const displayName = profile?.full_name ?? user.email?.split('@')[0] ?? null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
        {tNav('community')}
      </h1>

      <CreatePostForm
        currentAvatarUrl={profile?.avatar_url ?? null}
        currentName={displayName}
      />

      <PostFeed posts={posts} currentUserId={user.id} />
    </div>
  )
}
