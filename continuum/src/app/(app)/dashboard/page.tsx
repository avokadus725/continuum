import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LearningFeed, type FeedItem } from '@/components/features/dashboard/learning-feed'
import { CreatePostForm, PostFeed, type Post } from '@/components/features/posts/post-feed'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const t = await getTranslations('dashboard')
  const tPosts = await getTranslations('posts')

  // Profile for welcome header
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, xp, level')
    .eq('id', user.id)
    .single()

  const displayName =
    profile?.full_name ??
    user.user_metadata?.full_name ??
    user.email?.split('@')[0] ?? null

  // ── Recent community posts ────────────────────────────────────
  const { data: postsRaw } = await (supabase as any).from('posts')
    .select(`
      id, content, url, url_title, created_at, user_id,
      profiles(full_name, avatar_url),
      comments(id, content, created_at, user_id, parent_id, post_id,
        profiles(full_name, avatar_url)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(5)

  const postIds = (postsRaw ?? []).map((p: any) => p.id)
  let postReactionsRaw: any[] = []
  if (postIds.length > 0) {
    const { data } = await (supabase as any).from('reactions')
      .select('type, post_id, user_id')
      .in('post_id', postIds)
    postReactionsRaw = data ?? []
  }

  const reactionsByPost = new Map<string, any[]>()
  for (const r of postReactionsRaw) {
    if (!r.post_id) continue
    const arr = reactionsByPost.get(r.post_id) ?? []
    arr.push(r)
    reactionsByPost.set(r.post_id, arr)
  }

  const recentPosts: Post[] = (postsRaw ?? []).map((p: any) => {
    const postReacts = reactionsByPost.get(p.id) ?? []
    return {
      id: p.id,
      content: p.content,
      url: p.url,
      url_title: p.url_title,
      created_at: p.created_at,
      user_id: p.user_id,
      profiles: p.profiles,
      reactions: [
        {
          type: 'like',
          count: postReacts.filter((r: any) => r.type === 'like').length,
          reacted: postReacts.some((r: any) => r.type === 'like' && r.user_id === user!.id),
        },
      ],
      comments: (p.comments ?? []).filter((c: any) => c.post_id === p.id),
    }
  })

  // ── Completed task IDs ────────────────────────────────────────
  const { data: completedRows } = await supabase
    .from('student_progress')
    .select('task_id')
    .eq('user_id', user.id)
    .eq('is_correct', true)

  const completedIds = completedRows?.map(r => r.task_id) ?? []

  // ── Incomplete tasks with options ─────────────────────────────
  let tasksQuery = supabase
    .from('tasks')
    .select('id, title, description, type, difficulty, xp_reward, task_options(id, text, is_correct)')
    .eq('is_published', true)
    .limit(8)

  if (completedIds.length > 0) {
    tasksQuery = tasksQuery.not('id', 'in', `(${completedIds.join(',')})`)
  }

  const { data: tasksRaw } = await tasksQuery

  // ── Materials with comments ───────────────────────────────────
  const { data: materialsRaw } = await supabase
    .from('materials')
    .select(`
      id, title, type, url, content,
      comments(
        id, content, created_at, user_id, parent_id,
        profiles(full_name, avatar_url)
      )
    `)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(8)

  // ── Reactions for materials ───────────────────────────────────
  const materialIds = (materialsRaw ?? []).map(m => m.id)
  let reactionsRaw: { type: string; material_id: string; user_id: string }[] = []
  if (materialIds.length > 0) {
    const { data } = await supabase
      .from('reactions')
      .select('type, material_id, user_id')
      .in('material_id', materialIds)
    reactionsRaw = (data ?? []) as typeof reactionsRaw
  }

  const reactionsByMaterial = new Map<string, typeof reactionsRaw>()
  for (const r of reactionsRaw) {
    const arr = reactionsByMaterial.get(r.material_id) ?? []
    arr.push(r)
    reactionsByMaterial.set(r.material_id, arr)
  }

  const REACTION_TYPES = ['like', 'helpful', 'fire'] as const
  function buildReactions(materialId: string) {
    const all = reactionsByMaterial.get(materialId) ?? []
    return REACTION_TYPES.map(type => ({
      type: type as 'like' | 'helpful' | 'fire',
      count: all.filter(r => r.type === type).length,
      reacted: all.some(r => r.type === type && r.user_id === user!.id),
    }))
  }

  // ── Build learning feed items ─────────────────────────────────
  const taskItems: FeedItem[] = (tasksRaw ?? []).map(task => ({
    kind: 'task' as const,
    data: {
      id: task.id,
      title: task.title,
      content: task.description,
      type: task.type as 'single_choice' | 'multiple_choice' | 'text' | 'code',
      difficulty: task.difficulty as 'beginner' | 'intermediate' | 'advanced',
      xp_reward: task.xp_reward,
      task_options: (task.task_options as { id: string; text: string; is_correct: boolean }[]).map(o => ({
        id: o.id,
        text: o.text,
      })),
    },
  }))

  const materialItems: FeedItem[] = (materialsRaw ?? []).map(material => ({
    kind: 'material' as const,
    data: {
      id: material.id,
      title: material.title,
      type: material.type as 'article' | 'video' | 'link' | 'interactive',
      url: material.url,
      content: material.content,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      comments: (material.comments as any[]) ?? [],
      reactions: buildReactions(material.id),
    },
  }))

  const allItems = [...taskItems, ...materialItems]
  const avatarUrl = profile?.avatar_url ?? user.user_metadata?.avatar_url ?? null

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Welcome header */}
      <div className="flex items-center gap-3">
        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName ?? ''} className="w-10 h-10 rounded-full object-cover shrink-0" />
        ) : (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold shrink-0"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            {(displayName?.[0] ?? user.email?.[0] ?? '?').toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
            {displayName ? t('welcome', { name: displayName }) : t('welcomeGeneric')}
          </h1>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {t('subtitle')}
          </p>
        </div>
        {profile && (
          <div className="ml-auto text-right shrink-0">
            <p className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
              {t('level', { level: profile.level })}
            </p>
            <p className="text-sm font-bold" style={{ color: 'var(--primary)' }}>
              {t('xp', { xp: profile.xp })}
            </p>
          </div>
        )}
      </div>

      {/* Create post */}
      <CreatePostForm
        currentAvatarUrl={avatarUrl}
        currentName={displayName}
      />

      {/* Recent posts from community */}
      {recentPosts.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--muted-foreground)' }}>
              {tPosts('recentPosts')}
            </h2>
            <Link
              href="/community"
              className="text-xs font-medium hover:underline"
              style={{ color: 'var(--primary)' }}
            >
              {tPosts('viewAllInCommunity')}
            </Link>
          </div>
          <PostFeed posts={recentPosts} currentUserId={user.id} />
        </section>
      )}

      {/* Learning feed */}
      <LearningFeed initialItems={allItems} currentUserId={user.id} />
    </div>
  )
}
