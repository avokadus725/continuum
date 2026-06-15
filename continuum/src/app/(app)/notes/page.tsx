/* Notes page — the user's personal notes. */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NotesClient } from '@/components/features/notes/notes-client'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('notes')
  return { title: t('title') }
}

export default async function NotesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [notesRes, collectionsRes] = await Promise.all([
    (supabase.from('notes') as any)
      .select(`
        id, title, content, created_at, updated_at, collection_id,
        materials(title),
        tasks(title),
        topics(title, icon, slug),
        collections(id, title)
      `)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false }),

    supabase
      .from('collections')
      .select('id, title')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const notes = ((notesRes.data ?? []) as any[]).map((n) => ({
    id: n.id as string,
    title: n.title as string,
    content: n.content as string | null,
    created_at: n.created_at as string,
    updated_at: n.updated_at as string,
    collectionId: (n.collection_id as string | null) ?? null,
    collectionTitle: (n.collections as { title: string } | null)?.title ?? null,
    material: n.materials as { title: string } | null,
    task: n.tasks as { title: string } | null,
    topic: n.topics as { title: string; icon: string | null; slug?: string | null } | null,
    topicSlug: (n.topics as { slug?: string | null } | null)?.slug ?? null,
  }))

  const collections = (collectionsRes.data ?? []) as { id: string; title: string }[]

  return (
    <div className="space-y-6">
      <NotesClient notes={notes} collections={collections} />
    </div>
  )
}
