import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CommentsSection } from '@/components/features/comments/comments-section'
import { ReactionsBar } from '@/components/features/reactions/reactions-bar'
import { AddToCollectionButton } from '@/components/features/collections/add-to-collection-button'
import { QuickNoteButton } from '@/components/features/notes/quick-note-button'
import { MaterialTypeIcon } from '@/components/ui/material-type-icon'
import { TopicIcon } from '@/lib/topic-icons'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ slug: string }>
}


const TYPE_ACCENT: Record<string, string> = {
  article:     'var(--primary)',
  video:       'var(--destructive)',
  link:        'var(--warning)',
  interactive: 'var(--success)',
}

type ReactionType = 'like' | 'helpful' | 'fire'
const REACTION_TYPES: ReactionType[] = ['like', 'helpful', 'fire']

async function getMaterial(supabase: Awaited<ReturnType<typeof createClient>>, slug: string) {
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
  const t        = await getTranslations('materials')
  const tCommon  = await getTranslations('common')
  const tTopics  = await getTranslations('topics')

  const { data: { user } } = await supabase.auth.getUser()

  const material = await getMaterial(supabase, slug)
  if (!material) notFound()

  const materialId = material.id

  const collectionsData = user ? await (async () => {
    const { data: cols } = await supabase
      .from('collections')
      .select('id, title, collection_materials(material_id)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    return (cols ?? []).map(c => ({
      id: c.id,
      title: c.title,
      hasItem: (c.collection_materials as { material_id: string }[]).some(cm => cm.material_id === materialId),
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

  const rawTopic = material.topics as { title: string; icon: string | null; slug: string } | null
  const topicTitle = rawTopic
    ? (() => { try { return tTopics(rawTopic.slug as Parameters<typeof tTopics>[0]) } catch { return rawTopic.title } })()
    : null
  const topic = rawTopic ? { ...rawTopic, title: topicTitle! } : null

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

  const accent = TYPE_ACCENT[material.type] ?? 'var(--primary)'

  return (
    <div className="max-w-5xl space-y-5">

      {/* Back */}
      <Link
        href={rawTopic ? `/materials?topic=${rawTopic.slug}` : '/materials'}
        className="inline-flex items-center gap-1.5 text-sm transition-colors"
        style={{ color: 'var(--muted-foreground)' }}
      >
        ← {tCommon('back')}
      </Link>

      {/* Two-column layout on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5 items-start">

        {/* ── Main column ────────────────────────── */}
        <div className="space-y-5">

          {/* Header */}
          <div
            className="rounded-2xl p-6"
            style={{
              background:  'var(--card)',
              border:      '1px solid var(--border)',
              borderLeft:  `3px solid ${accent}`,
            }}
          >
            <h1 className="text-2xl font-bold leading-snug" style={{ color: 'var(--foreground)' }}>
              {material.title}
            </h1>
          </div>

          {/* Article content */}
          {material.content && (
            <div
              className="rounded-2xl border p-6"
              style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
            >
              <div className="space-y-4">
                {material.content.split('\n').filter(Boolean).map((paragraph: string, i: number) => (
                  <p key={i} className="text-[14px] leading-[1.75]" style={{ color: 'var(--foreground)' }}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* External link */}
          {material.url && (
            <div
              className="rounded-2xl border p-5 flex items-center gap-3"
              style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
            >
              <span className="text-xl">🔗</span>
              <div className="min-w-0">
                <p className="text-[11.5px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--muted-foreground)' }}>
                  {t('types.link')}
                </p>
                <a
                  href={material.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[14px] font-medium transition-colors truncate block"
                  style={{ color: 'var(--primary)' }}
                >
                  {material.url} ↗
                </a>
              </div>
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

        {/* ── Sidebar ────────────────────────────── */}
        <aside className="space-y-4 lg:sticky lg:top-[76px]">

          {/* Meta: topic + type */}
          <div
            className="rounded-2xl border p-4 space-y-3"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          >
            {topic && (
              <div className="flex items-center gap-2" style={{ color: 'var(--muted-foreground)' }}>
                <TopicIcon slug={topic.slug} size={18} className="shrink-0" />
                <span className="text-[13px] font-medium">{topic.title}</span>
              </div>
            )}
            <span
              className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold px-2.5 py-1 rounded-full"
              style={{
                background: `color-mix(in srgb, ${accent} 12%, var(--muted))`,
                color: accent,
              }}
            >
              <MaterialTypeIcon type={material.type} size={12} />
              {t(`types.${material.type}`)}
            </span>
          </div>

          {/* Actions: reactions + save + note */}
          {user && (
            <div
              className="rounded-2xl border p-4 space-y-4"
              style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
            >
              <ReactionsBar reactions={reactionCounts} materialId={materialId} />
              <div
                className="border-t pt-3 space-y-2"
                style={{ borderColor: 'color-mix(in srgb, var(--border) 60%, transparent)' }}
              >
                <AddToCollectionButton itemId={materialId} itemType="material" collections={collectionsData} />
                <QuickNoteButton materialId={materialId} materialTitle={material.title} collections={collectionsData.map(c => ({ id: c.id, title: c.title }))} />
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
