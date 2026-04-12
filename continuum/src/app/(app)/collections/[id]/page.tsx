import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { CollectionDetailClient } from '@/components/features/collections/collection-detail-client'

interface Props {
  params: Promise<{ id: string }>
}

export default async function CollectionDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const t = await getTranslations('collections')
  const tCommon = await getTranslations('common')

  // Fetch collection + its materials
  const { data: col } = await supabase
    .from('collections')
    .select(`
      id, title,
      collection_materials(
        material_id,
        materials(id, title, type, content, url, topics(title, icon))
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!col) notFound()

  const materials = (col.collection_materials as {
    material_id: string
    materials: {
      id: string; title: string; type: string
      content: string | null; url: string | null
      topics: { title: string; icon: string | null } | null
    } | null
  }[])
    .map(cm => cm.materials)
    .filter(Boolean) as {
      id: string; title: string; type: string
      content: string | null; url: string | null
      topics: { title: string; icon: string | null } | null
    }[]

  // Fetch notes linked to this collection
  const { data: notesRaw } = await (supabase.from('notes') as any)
    .select('id, title, content, updated_at')
    .eq('user_id', user.id)
    .eq('collection_id', id)
    .order('updated_at', { ascending: false })

  const notes = (notesRaw ?? []) as { id: string; title: string; content: string | null; updated_at: string }[]

  return (
    <div className="max-w-4xl space-y-8">
      <Link
        href="/collections"
        className="inline-flex items-center gap-1.5 text-sm transition-colors"
        style={{ color: 'var(--muted-foreground)' }}
      >
        ← {tCommon('back')}
      </Link>

      <CollectionDetailClient
        collection={{ id: col.id, title: col.title }}
        materials={materials}
        notes={notes}
      />
    </div>
  )
}
