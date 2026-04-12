import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CommentsSection } from '@/components/features/comments/comments-section'
import { ReactionsBar } from '@/components/features/reactions/reactions-bar'
import { AddToCollectionButton } from '@/components/features/collections/add-to-collection-button'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ slug: string }>
}

const typeIcons: Record<string, string> = {
  article:     '📄',
  video:       '🎬',
  link:        '🔗',
  interactive: '⚡',
}

type ReactionType = 'like' | 'helpful' | 'fire'
const REACTION_TYPES: ReactionType[] = ['like', 'helpful', 'fire']

async function getMaterial(supabase: Awaited<ReturnType<typeof createClient>>, slug: string) {
  // Try slug first, fall back to UUID id (for old links)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)

  if (isUuid) {
    const { data } = await supabase
      .from('materials')
      .select('*, topics(title, icon, slug)')
      .eq('id', slug)
      .eq('is_published', true)
      .single()
    return data
  }

  const { data } = await supabase
    .from('materials')
    .select('*, topics(title, icon, slug)')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()
  return data
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const material = await getMaterial(supabase, slug)
  return { title: material?.title ?? 'Material' }
}

export default async function MaterialDetailPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()
  const t = await getTranslations('materials')
  const tCommon = await getTranslations('common')

  const { data: { user } } = await supabase.auth.getUser()

  const material = await getMaterial(supabase, slug)
  if (!material) notFound()

  const materialId = material.id

  // Fetch user's collections
  const collectionsData = user ? await (async () => {
    const { data: cols } = await supabase
      .from('collections')
      .select('id, title, collection_materials(material_id)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    return (cols ?? []).map(c => ({
      id: c.id,
      title: c.title,
      hasMaterial: (c.collection_materials as { material_id: string }[]).some(cm => cm.material_id === materialId),
    }))
  })() : []

  const [commentsRes, reactionsRes] = await Promise.all([
    supabase
      .from('comments')
      .select('id, content, created_at, user_id, parent_id, profiles(full_name, avatar_url)')
      .eq('material_id', materialId)
      .order('created_at', { ascending: true }),
    supabase
      .from('reactions')
      .select('type, user_id')
      .eq('material_id', materialId),
  ])

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
          {material.content.split('\n').map((paragraph: string, i: number) => (
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

      {/* Actions row: reactions + add to collection */}
      {user && (
        <div className="flex items-center gap-3 flex-wrap">
          <ReactionsBar reactions={reactionCounts} materialId={materialId} />
          <AddToCollectionButton materialId={materialId} collections={collectionsData} />
        </div>
      )}

      {/* Comments */}
      {user && (
        <div
          className="rounded-2xl border p-6"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <CommentsSection
            comments={comments}
            materialId={materialId}
            currentUserId={user.id}
          />
        </div>
      )}

    </div>
  )
}
