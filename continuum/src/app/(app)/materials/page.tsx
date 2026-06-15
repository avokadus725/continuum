/* Materials page — searchable list of learning materials by topic. */

import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { MaterialCard } from '@/components/features/materials/material-card'
import Link from 'next/link'
import type { Metadata } from 'next'
import { LiveSearch } from '@/components/ui/live-search'
import { TopicIcon } from '@/lib/topic-icons'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('materials')
  return { title: t('title') }
}

interface Props {
  searchParams: Promise<{ topic?: string; q?: string }>
}

export default async function MaterialsPage({ searchParams }: Props) {
  const { topic: topicSlug, q: rawQ } = await searchParams
  const q = rawQ?.trim() ?? ''
  const supabase = await createClient()
  const t        = await getTranslations('materials')
  const tTopics  = await getTranslations('topics')
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch user's collections + which material IDs each one contains
  const collectionsRaw = user ? await (async () => {
    const { data } = await supabase
      .from('collections')
      .select('id, title, collection_materials(material_id)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    return data ?? []
  })() : []

  // Fetch topics for filter pills
  const { data: topics } = await supabase
    .from('topics')
    .select('id, title, icon, slug')
    .order('title')

  // Fetch materials, optionally filtered by topic
  let query = supabase
    .from('materials')
    .select('id, title, content, url, type, topic_id, topics(title, icon, slug)')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (topicSlug && topicSlug !== 'all') {
    const topic = topics?.find((t) => t.slug === topicSlug)
    if (topic) query = query.eq('topic_id', topic.id)
  }

  if (q) {
    query = query.or(`title.ilike.%${q}%,content.ilike.%${q}%`)
  }

  const { data: materials } = await query

  function tTopic(slug: string | undefined, fallback: string): string {
    if (!slug) return fallback
    try { return tTopics(slug as Parameters<typeof tTopics>[0]) }
    catch { return fallback }
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <h1 className="text-2xl font-bold tracking-[-0.3px]" style={{ color: 'var(--foreground)' }}>
        {t('title')}
      </h1>

      {/* Search */}
      <LiveSearch
        q={q}
        extraParams={topicSlug && topicSlug !== 'all' ? { topic: topicSlug } : {}}
        placeholder={t('searchPlaceholder')}
      />

      {/* Topic filter pills */}
      <div className="flex flex-wrap gap-1.5">
        <Link
          href={q ? `/materials?q=${encodeURIComponent(q)}` : '/materials'}
          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors border"
          style={{
            background:  !topicSlug || topicSlug === 'all' ? 'var(--primary)' : 'var(--card)',
            color:       !topicSlug || topicSlug === 'all' ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
            borderColor: !topicSlug || topicSlug === 'all' ? 'var(--primary)' : 'var(--border)',
          }}
        >
          {t('allTopics')}
        </Link>
        {topics?.map((topic) => {
          const isActive = topicSlug === topic.slug
          const topicHref = q
            ? `/materials?topic=${topic.slug}&q=${encodeURIComponent(q)}`
            : `/materials?topic=${topic.slug}`
          return (
            <Link
              key={topic.id}
              href={topicHref}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors border"
              style={{
                background:  isActive ? 'var(--primary)' : 'var(--card)',
                color:       isActive ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                borderColor: isActive ? 'var(--primary)' : 'var(--border)',
              }}
            >
              <TopicIcon slug={topic.slug} size={11} />
              {tTopic(topic.slug, topic.title)}
            </Link>
          )
        })}
      </div>

      {/* Materials grid */}
      {materials && materials.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {materials.map((material) => {
            const colsForMaterial = collectionsRaw.map(c => ({
              id: c.id,
              title: c.title,
              hasItem: (c.collection_materials as { material_id: string }[]).some(cm => cm.material_id === material.id),
            }))
            const rawTopic = material.topics as { title: string; icon: string | null; slug?: string } | null
            const translatedTopic = rawTopic
              ? { title: tTopic(rawTopic.slug, rawTopic.title), icon: rawTopic.icon, slug: rawTopic.slug }
              : null
            return (
              <MaterialCard
                key={material.id}
                id={material.id}
                title={material.title}
                content={material.content}
                url={material.url}
                type={material.type as 'article' | 'video' | 'link' | 'interactive'}
                topic={translatedTopic}
                collections={user ? colsForMaterial : undefined}
              />
            )
          })}
        </div>
      ) : (
        <div
          className="rounded-2xl border p-12 text-center"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <p style={{ color: 'var(--muted-foreground)' }}>{t('noMaterials')}</p>
        </div>
      )}

    </div>
  )
}
