'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ── Create ────────────────────────────────────────────────────

export async function createCollection(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const title = (formData.get('title') as string)?.trim()
  if (!title) return { error: 'Title required' }

  const { data, error } = await supabase
    .from('collections')
    .insert({ user_id: user.id, title })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/collections')
  return { id: data.id }
}

// ── Rename ────────────────────────────────────────────────────

export async function renameCollection(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const id = formData.get('id') as string
  const title = (formData.get('title') as string)?.trim()
  if (!title) return { error: 'Title required' }

  await supabase
    .from('collections')
    .update({ title })
    .eq('id', id)
    .eq('user_id', user.id)

  revalidatePath('/collections')
  revalidatePath(`/collections/${id}`)
  return { success: true }
}

// ── Delete ────────────────────────────────────────────────────

export async function deleteCollection(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const id = formData.get('id') as string
  await supabase.from('collections').delete().eq('id', id).eq('user_id', user.id)

  revalidatePath('/collections')
  return { success: true }
}

// ── Toggle material in collection ─────────────────────────────

export async function toggleMaterialInCollection(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const collectionId = formData.get('collection_id') as string
  const materialId   = formData.get('material_id') as string
  const action       = formData.get('action') as 'add' | 'remove'

  // Verify ownership
  const { data: col } = await supabase
    .from('collections')
    .select('id')
    .eq('id', collectionId)
    .eq('user_id', user.id)
    .single()
  if (!col) return { error: 'Collection not found' }

  if (action === 'add') {
    await supabase.from('collection_materials').upsert({
      collection_id: collectionId,
      material_id: materialId,
    })
  } else {
    await supabase
      .from('collection_materials')
      .delete()
      .eq('collection_id', collectionId)
      .eq('material_id', materialId)
  }

  revalidatePath(`/collections/${collectionId}`)
  revalidatePath(`/materials/${materialId}`)
  return { success: true }
}

// ── Create collection and immediately add material ─────────────

export async function createCollectionWithMaterial(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const title      = (formData.get('title') as string)?.trim()
  const materialId = formData.get('material_id') as string
  if (!title) return { error: 'Title required' }

  const { data: col, error } = await supabase
    .from('collections')
    .insert({ user_id: user.id, title })
    .select('id')
    .single()

  if (error || !col) return { error: error?.message ?? 'Failed' }

  await supabase.from('collection_materials').insert({
    collection_id: col.id,
    material_id: materialId,
  })

  revalidatePath('/collections')
  revalidatePath(`/materials/${materialId}`)
  return { id: col.id }
}
