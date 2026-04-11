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

  const { data: notes } = await supabase
    .from('notes')
    .select(`
      id, title, content, created_at, updated_at,
      materials(title),
      tasks(title),
      topics(title, icon)
    `)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  const shaped = (notes ?? []).map((n) => ({
    id: n.id,
    title: n.title,
    content: n.content,
    created_at: n.created_at,
    updated_at: n.updated_at,
    material: n.materials as { title: string } | null,
    task: n.tasks as { title: string } | null,
    topic: n.topics as { title: string; icon: string | null } | null,
  }))

  return (
    <div className="space-y-6">
      <NotesClient notes={shaped} />
    </div>
  )
}
