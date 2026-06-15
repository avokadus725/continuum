/* Collections page — lists the user's saved collections. */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { CollectionsListClient } from '@/components/features/collections/collections-list-client'

export default async function CollectionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await getTranslations('collections')

  const { data: rawCollections } = await (supabase as any)
    .from('collections')
    .select(`
      id, title, description, emoji, cover, created_at, last_accessed_at,
      collection_materials(material_id),
      collection_tasks(task_id)
    `)
    .eq('user_id', user.id)
    .order('last_accessed_at', { ascending: false, nullsFirst: false })
    .order('created_at',       { ascending: false })

  const ids = (rawCollections ?? []).map((c: { id: string }) => c.id)

  let notesCount: Map<string, number> = new Map()
  if (ids.length > 0) {
    const { data: notesRows } = await (supabase as any)
      .from('notes')
      .select('id, collection_id')
      .eq('user_id', user.id)
      .in('collection_id', ids)
    notesCount = new Map<string, number>()
    for (const row of (notesRows ?? []) as { collection_id: string }[]) {
      notesCount.set(row.collection_id, (notesCount.get(row.collection_id) ?? 0) + 1)
    }
  }

  const collections = (rawCollections ?? []).map((c: {
    id: string; title: string; description: string | null
    emoji: string | null; cover: string | null
    created_at: string; last_accessed_at: string | null
    collection_materials: { material_id: string }[]
    collection_tasks:     { task_id: string }[]
  }) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    emoji: c.emoji ?? '📚',
    cover: c.cover ?? 'default',
    createdAt: c.created_at,
    lastAccessedAt: c.last_accessed_at,
    materialCount: c.collection_materials?.length ?? 0,
    taskCount:     c.collection_tasks?.length     ?? 0,
    noteCount:     notesCount.get(c.id) ?? 0,
  }))

  return <CollectionsListClient collections={collections} />
}
