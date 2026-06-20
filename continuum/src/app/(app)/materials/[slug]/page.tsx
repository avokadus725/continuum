/* Material detail – reading view + sidebar with single "helpful" reaction,
   your note, related tasks. */

import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Clock } from 'lucide-react'
import { CommentsSection } from '@/components/features/comments/comments-section'
import { HelpfulButton } from '@/components/features/reactions/helpful-button'
import { AddToCollectionButton } from '@/components/features/collections/add-to-collection-button'
import { QuickNoteButton } from '@/components/features/notes/quick-note-button'
import { MaterialTypeIcon } from '@/components/ui/material-type-icon'
import { TopicIcon } from '@/lib/topic-icons'
import { topicColor, topicTint } from '@/lib/topic-colors'
import type { Metadata } from 'next'

interface Props { params: Promise<{ slug: string }> }

async function getMaterial(supabase: Awaited<ReturnType<typeof createClient>>, slug: string) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)
  const col = isUuid ? 'id' : 'slug'
  const { data } = await supabase
    .from('materials').select('*, topics(title, icon, slug)')
    .eq(col, slug).eq('is_published', true).single()
  return data
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const material = await getMaterial(supabase, slug)
  return { title: material?.title ?? 'Material' }
}

/** ~200 wpm reading estimate */
function readMinutes(content: string | null): number | null {
  if (!content) return null
  const words = content.trim().split(/\s+/).length
  return Math.max(1, Math.round(words / 200))
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

  const rawTopic = material.topics as { title: string; icon: string | null; slug: string } | null
  const topicTitle = rawTopic
    ? (() => { try { return tTopics(rawTopic.slug as Parameters<typeof tTopics>[0]) } catch { return rawTopic.title } })()
    : null
  const topic = rawTopic ? { ...rawTopic, title: topicTitle! } : null
  const accent = topicColor(rawTopic?.slug)

  const [collectionsData, commentsRes, reactionsRes, yourNoteRes, relatedTasksRes] = await Promise.all([
    user ? (async () => {
      const { data: cols } = await supabase
        .from('collections').select('id, title, collection_materials(material_id)')
        .eq('user_id', user.id).order('created_at', { ascending: false })
      return (cols ?? []).map(c => ({
        id: c.id, title: c.title,
        hasItem: (c.collection_materials as { material_id: string }[]).some(cm => cm.material_id === materialId),
      }))
    })() : Promise.resolve([]),
    supabase.from('comments')
      .select('id, content, created_at, user_id, parent_id, profiles(full_name, avatar_url)')
      .eq('material_id', materialId).order('created_at', { ascending: true }),
    supabase.from('reactions').select('type, user_id').eq('material_id', materialId),
    user
      ? (supabase.from('notes') as any).select('id, content').eq('user_id', user.id).eq('material_id', materialId).maybeSingle()
      : Promise.resolve({ data: null }),
    rawTopic
      ? supabase.from('tasks').select('id, title, difficulty, xp_reward')
          .eq('is_published', true).eq('topic_id', material.topic_id as string).neq('id', materialId).limit(3)
      : Promise.resolve({ data: [] }),
  ])

  const comments = (commentsRes.data ?? []).map((c) => ({
    id: c.id, content: c.content, created_at: c.created_at,
    user_id: c.user_id, parent_id: c.parent_id,
    profiles: c.profiles as { full_name: string | null; avatar_url: string | null } | null,
  }))

  const allReactions = reactionsRes.data ?? []
  const helpfulCount = allReactions.filter(r => r.type === 'helpful').length
  const helpfulReacted = !!user && allReactions.some(r => r.type === 'helpful' && r.user_id === user.id)

  const yourNote = (yourNoteRes as { data: { id: string; content: string | null } | null }).data
  const relatedTasks = (relatedTasksRes.data ?? []) as { id: string; title: string; difficulty: string; xp_reward: number }[]

  const rm = readMinutes(material.content)

  return (
    <div className="max-w-[1080px]">
      <Link href={rawTopic ? `/materials?topic=${rawTopic.slug}` : '/materials'}
        className="inline-flex items-center gap-1.5 text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
        <ArrowLeft size={15} /> {tCommon('back')}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">
        {/* Main */}
        <div className="min-w-0">
          {/* Hero */}
          <div className="mb-5">
            <div className="flex flex-wrap items-center gap-2.5 mb-3">
              <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1 rounded-full"
                style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                <MaterialTypeIcon type={material.type} size={12} /> {t(`types.${material.type}`)}
              </span>
              {topic && (
                <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold" style={{ color: accent }}>
                  <TopicIcon slug={topic.slug} size={13} /> {topic.title}
                </span>
              )}
              {rm && (
                <span className="inline-flex items-center gap-1.5 text-[12.5px]" style={{ color: 'var(--muted-foreground)' }}>
                  <Clock size={13} /> {t('readMinutes', { min: rm })}
                </span>
              )}
            </div>
            <h1 className="text-[34px] font-bold leading-[1.15] tracking-[-0.8px] max-w-[640px]" style={{ color: 'var(--foreground)' }}>
              {material.title}
            </h1>
          </div>

          {/* Article reading view */}
          {material.content && (
            <article className="rounded-2xl border p-7 max-w-[680px]" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              {material.content.split('\n').filter(Boolean).map((para: string, i: number) => (
                <p key={i} className="text-[15px] leading-[1.8] mb-4 last:mb-0" style={{ color: 'var(--foreground)' }}>
                  {para}
                </p>
              ))}
            </article>
          )}

          {/* Comments */}
          {user && (
            <div className="mt-5 rounded-2xl border p-6" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <CommentsSection comments={comments} materialId={materialId} currentUserId={user.id} />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-3.5 lg:sticky lg:top-[76px]">
          {user && (
            <div className="rounded-xl border p-3.5 space-y-2" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              {material.url && (
                <a href={material.url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[10px] text-[13.5px] font-semibold text-white no-underline"
                  style={{ background: 'var(--primary)' }}>
                  <ExternalLink size={15} /> {t('readOriginal')}
                </a>
              )}
              <AddToCollectionButton itemId={materialId} itemType="material" collections={collectionsData} />
              <QuickNoteButton materialId={materialId} materialTitle={material.title} collections={collectionsData.map(c => ({ id: c.id, title: c.title }))} />
              <HelpfulButton materialId={materialId} count={helpfulCount} reacted={helpfulReacted} />
            </div>
          )}

          {/* Your note */}
          {yourNote && yourNote.content && (
            <div className="rounded-xl border p-3.5" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <h3 className="m-0 mb-2 text-[12.5px] font-semibold" style={{ color: 'var(--foreground)' }}>{t('yourNote')}</h3>
              <div className="rounded-[10px] p-3 text-[12.5px] leading-[1.55]" style={{ background: topicTint(rawTopic?.slug), color: 'var(--foreground)' }}>
                {yourNote.content.slice(0, 160)}{yourNote.content.length > 160 ? '…' : ''}
              </div>
            </div>
          )}

          {/* Related tasks */}
          {relatedTasks.length > 0 && (
            <div className="rounded-xl border p-3.5" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <h3 className="m-0 mb-2 text-[12.5px] font-semibold" style={{ color: 'var(--foreground)' }}>{t('relatedTasks')}</h3>
              {relatedTasks.map((task, i) => (
                <Link key={task.id} href={`/tasks/${task.id}`}
                  className="flex items-start gap-2.5 py-2 no-underline"
                  style={{ borderTop: i ? '1px solid color-mix(in srgb, var(--border) 70%, transparent)' : 'none' }}>
                  <span className="grid h-6 w-6 flex-none place-items-center rounded-md text-[10px]"
                    style={{ background: 'var(--muted)', color: accent }}>✓</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] font-semibold leading-tight" style={{ color: 'var(--foreground)' }}>{task.title}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>+{task.xp_reward} XP</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
