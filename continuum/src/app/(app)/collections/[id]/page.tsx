import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { CollectionDetailClient } from '@/components/features/collections/collection-detail-client'
import type { CoverKey } from '@/lib/collection-covers'
import { getTranslations } from 'next-intl/server'

interface Props { params: Promise<{ id: string }> }

export default async function CollectionDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const tTopics = await getTranslations('topics')
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  function tTopic(slug: string | null | undefined, fallback: string): string {
    if (!slug) return fallback
    try { return tTopics(slug as Parameters<typeof tTopics>[0]) }
    catch { return fallback }
  }

  const { data: col } = await (supabase as any)
    .from('collections')
    .select(`
      id, title, description, emoji, cover, created_at, last_accessed_at,
      collection_materials(
        material_id,
        materials(id, title, type, content, url, topics(title, icon))
      ),
      collection_tasks(
        task_id,
        tasks(id, title, description, difficulty, type, xp_reward, topics(title, icon))
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  if (!col) notFound()

  const materials = (col.collection_materials as Array<{
    material_id: string
    materials: { id: string; title: string; type: string; content: string | null; url: string | null; topics: { title: string; icon: string | null } | null } | null
  }>).map(cm => cm.materials).filter(Boolean) as {
    id: string; title: string; type: string; content: string | null; url: string | null
    topics: { title: string; icon: string | null } | null
  }[]

  const tasks = (col.collection_tasks as Array<{
    task_id: string
    tasks: { id: string; title: string; description: string; difficulty: string; type: string; xp_reward: number; topics: { title: string; icon: string | null } | null } | null
  }>).map(ct => ct.tasks).filter(Boolean) as {
    id: string; title: string; description: string; difficulty: string; type: string; xp_reward: number
    topics: { title: string; icon: string | null } | null
  }[]

  const { data: notesRaw } = await (supabase as any)
    .from('notes')
    .select('id, title, content, updated_at')
    .eq('user_id', user.id)
    .eq('collection_id', id)
    .order('updated_at', { ascending: false })
  const notes = (notesRaw ?? []) as { id: string; title: string; content: string | null; updated_at: string }[]

  const existingMatIds  = new Set(materials.map(m => m.id))
  const existingTaskIds = new Set(tasks.map(t => t.id))

  const { data: allMats } = await supabase
    .from('materials')
    .select('id, title, type, topics(title, icon, slug)')
    .eq('is_published', true)
    .limit(200)
  const { data: allTasks } = await supabase
    .from('tasks')
    .select('id, title, difficulty, topics(title, icon, slug)')
    .eq('is_published', true)
    .limit(200)

  const pickerMaterials = (allMats ?? [])
    .filter(m => !existingMatIds.has(m.id))
    .map(m => {
      const topic = Array.isArray(m.topics) ? m.topics[0] : m.topics as { title: string; icon: string | null; slug?: string | null } | null
      return {
        id: m.id,
        title: m.title,
        topic: topic ? tTopic(topic.slug, topic.title) : null,
        kind: (m.type as 'article' | 'video' | 'link' | 'interactive'),
      }
    })

  const pickerTasks = (allTasks ?? [])
    .filter(t => !existingTaskIds.has(t.id))
    .map(t => {
      const topic = Array.isArray(t.topics) ? t.topics[0] : t.topics as { title: string; icon: string | null; slug?: string | null } | null
      return {
        id: t.id,
        title: t.title,
        topic: topic ? tTopic(topic.slug, topic.title) : null,
        difficulty: t.difficulty,
      }
    })

  return (
    <CollectionDetailClient
      collection={{
        id: col.id,
        title: col.title,
        description: col.description ?? '',
        emoji: col.emoji ?? '📚',
        cover: (col.cover ?? 'default') as CoverKey,
        createdAt: col.created_at,
        lastAccessedAt: col.last_accessed_at,
      }}
      materials={materials}
      notes={notes}
      tasks={tasks}
      pickerMaterials={pickerMaterials}
      pickerTasks={pickerTasks}
    />
  )
}
