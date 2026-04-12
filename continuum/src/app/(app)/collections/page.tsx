import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CollectionsClient } from '@/components/features/collections/collections-client'

export default async function CollectionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: collectionsRaw } = await supabase
    .from('collections')
    .select('id, title, created_at, collection_materials(material_id)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const collections = (collectionsRaw ?? []).map(c => ({
    id: c.id,
    title: c.title,
    created_at: c.created_at,
    materialCount: (c.collection_materials as unknown[]).length,
  }))

  return (
    <div className="max-w-4xl">
      <CollectionsClient collections={collections} />
    </div>
  )
}
