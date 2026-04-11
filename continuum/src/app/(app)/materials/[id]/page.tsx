import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CommentsSection } from '@/components/features/comments/comments-section'
import { ReactionsBar } from '@/components/features/reactions/reactions-bar'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('materials').select('title').eq('id', id).single()
  return { title: data?.title ?? 'Material' }
}

interface Props {
  params: Promise<{ id: string }>
}

const typeIcons: Record<string, string> = {
  article:     '📄',
  video:       '🎬',
  link:        '🔗',
  interactive: '⚡',
}

type ReactionType = 'like' | 'helpful' | 'fire'
const REACTION_TYPES: ReactionType[] = ['like', 'helpful', 'fire']

export default async function MaterialDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const t = await getTranslations('materials')
  const tCommon = await getTranslations('common')

  const { data: { user } } = await supabase.auth.getUser()

  const [materialRes, commentsRes, reactionsRes] = await Promise.all([
    supabase
      .from('materials')
      .select('*, topics(title, icon, slug)')
      .eq('id', id)
      .eq('is_published', true)
      .single(),
    supabase
      .from('comments')
      .select('id, content, created_at, user_id, parent_id, profiles(full_name, avatar_url)')
      .eq('material_id', id)
      .order('created_at', { ascending: true }),
    supabase
      .from('reactions')
      .select('type, user_id')
      .eq('material_id', id),
  ])

  if (!materialRes.data) notFound()
  const material = materialRes.data
  const topic = material.topics as { title: string; icon: string | null; slug: string } | null

  const comments = (commentsRes.data ?? []).map((c) => ({
    id: c.id,
    content: c.content,
    created_at: c.created_at,
    user_id: c.user_id,
    parent_id: c.parent_id,
    profiles: c.profiles as { full_name: string | null; avatar_url: string | null } | null,
  }))

  const allReactions = reactionsRes.data ?? []
  const reactionCounts = REACTION_TYPES.map((type) => ({
    type,
    count: allReactions.filter((r) => r.type === type).length,
    reacted: !!user && allReactions.some((r) => r.type === type && r.user_id === user.id),
  }))

  return (
    <div className="max-w-3xl space-y-6">

      {/* Back */}
      <Link
        href={topic ? `/materials?topic=${topic.slug}` : '/materials'}
        className="inline-flex items-center gap-1.5 text-sm transition-colors"
        style={{ color: 'var(--muted-foreground)' }}
      >
        ← {tCommon('back')}
      </Link>

      {/* Header */}
      <div
        className="rounded-2xl border p-6"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          {topic && (
            <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              {topic.icon} {topic.title}
            </span>
          )}
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
            {typeIcons[material.type]} {t(`types.${material.type}`)}
          </span>
        </div>

        <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
          {material.title}
        </h1>
      </div>

      {/* Content */}
      {material.content && (
        <div
          className="rounded-2xl border p-6"
          style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)', lineHeight: '1.7' }}
        >
          {material.content.split('\n').map((paragraph, i) => (
            <p key={i} className="mb-4 last:mb-0 text-sm">
              {paragraph}
            </p>
          ))}
        </div>
      )}

      {/* External link */}
      {material.url && (
        <div
          className="rounded-2xl border p-6"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <p className="text-sm mb-3" style={{ color: 'var(--muted-foreground)' }}>
            {t('types.link')}:
          </p>
          <a
            href={material.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-medium text-sm transition-colors"
            style={{ color: 'var(--primary)' }}
          >
            {material.url} ↗
          </a>
        </div>
      )}

      {/* Reactions */}
      {user && (
        <ReactionsBar reactions={reactionCounts} materialId={id} />
      )}

      {/* Comments */}
      {user && (
        <div
          className="rounded-2xl border p-6"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <CommentsSection
            comments={comments}
            materialId={id}
            currentUserId={user.id}
          />
        </div>
      )}

    </div>
  )
}
