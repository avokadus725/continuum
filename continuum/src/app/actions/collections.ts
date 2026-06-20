'use server'

/* Collection Server Actions – create/rename/delete collections, add or remove materials & tasks. */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { CoverKey } from '@/lib/collection-covers'

// ── Create ────────────────────────────────────────────────────

export async function createCollection(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const title = (formData.get('title') as string)?.trim()
  if (!title) return { error: 'Title required' }

  const emoji       = (formData.get('emoji') as string)?.trim()  || undefined
  const cover       = (formData.get('cover') as CoverKey)        || undefined
  const description = (formData.get('description') as string)?.trim() || null

  const payload: Record<string, unknown> = { user_id: user.id, title, description }
  if (emoji) payload.emoji = emoji
  if (cover) payload.cover = cover

  const { data, error } = await (supabase as any)
    .from('collections')
    .insert(payload)
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/collections')
  return { id: data.id }
}

// ── Rename (kept for backward compat) ──────────────────────────

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

// ── Update meta (title + description + emoji + cover) ──────────

export async function updateCollectionMeta(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const id = formData.get('id') as string
  if (!id) return { error: 'Missing id' }

  const update: Record<string, unknown> = {}
  const title = (formData.get('title') as string)?.trim()
  if (title) update.title = title

  if (formData.has('description')) {
    const desc = (formData.get('description') as string)?.trim()
    update.description = desc || null
  }
  if (formData.has('emoji')) {
    const emoji = (formData.get('emoji') as string)?.trim()
    if (emoji) update.emoji = emoji
  }
  if (formData.has('cover')) {
    const cover = (formData.get('cover') as string)?.trim() as CoverKey
    if (cover) update.cover = cover
  }

  if (Object.keys(update).length === 0) return { success: true }

  const { error } = await (supabase as any)
    .from('collections')
    .update(update)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/collections')
  revalidatePath(`/collections/${id}`)
  return { success: true }
}

// ── Touch (bump last_accessed_at) ──────────────────────────────

export async function touchCollection(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  await (supabase as any)
    .from('collections')
    .update({ last_accessed_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
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

  const { data: col } = await supabase
    .from('collections').select('id')
    .eq('id', collectionId).eq('user_id', user.id).single()
  if (!col) return { error: 'Collection not found' }

  if (action === 'add') {
    await supabase.from('collection_materials').upsert({ collection_id: collectionId, material_id: materialId })
  } else {
    await supabase.from('collection_materials').delete()
      .eq('collection_id', collectionId).eq('material_id', materialId)
  }

  revalidatePath(`/collections/${collectionId}`)
  revalidatePath(`/materials/${materialId}`)
  return { success: true }
}

// ── Toggle task in collection ─────────────────────────────────

export async function toggleTaskInCollection(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const collectionId = formData.get('collection_id') as string
  const taskId       = formData.get('task_id') as string
  const action       = formData.get('action') as 'add' | 'remove'

  const { data: col } = await supabase
    .from('collections').select('id')
    .eq('id', collectionId).eq('user_id', user.id).single()
  if (!col) return { error: 'Collection not found' }

  if (action === 'add') {
    await (supabase as any).from('collection_tasks').upsert({ collection_id: collectionId, task_id: taskId })
  } else {
    await (supabase as any).from('collection_tasks').delete()
      .eq('collection_id', collectionId).eq('task_id', taskId)
  }

  revalidatePath(`/collections/${collectionId}`)
  revalidatePath(`/tasks/${taskId}`)
  return { success: true }
}

// ── Quick-create variants ──────────────────────────────────────

export async function createCollectionWithTask(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const title  = (formData.get('title') as string)?.trim()
  const taskId = formData.get('task_id') as string
  if (!title) return { error: 'Title required' }

  const { data: col, error } = await supabase
    .from('collections').insert({ user_id: user.id, title })
    .select('id').single()
  if (error || !col) return { error: error?.message ?? 'Failed' }

  await (supabase as any).from('collection_tasks').insert({ collection_id: col.id, task_id: taskId })

  revalidatePath('/collections')
  revalidatePath(`/tasks/${taskId}`)
  return { id: col.id }
}

export async function createCollectionWithMaterial(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const title      = (formData.get('title') as string)?.trim()
  const materialId = formData.get('material_id') as string
  if (!title) return { error: 'Title required' }

  const { data: col, error } = await supabase
    .from('collections').insert({ user_id: user.id, title })
    .select('id').single()
  if (error || !col) return { error: error?.message ?? 'Failed' }

  await supabase.from('collection_materials').insert({ collection_id: col.id, material_id: materialId })

  revalidatePath('/collections')
  revalidatePath(`/materials/${materialId}`)
  return { id: col.id }
}

// ── Bulk add (used by the AddPicker overlay) ───────────────────

export async function addItemsToCollection(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const collectionId = formData.get('collection_id') as string
  const materialIds  = formData.getAll('material_ids[]') as string[]
  const taskIds      = formData.getAll('task_ids[]') as string[]

  const { data: col } = await supabase
    .from('collections').select('id')
    .eq('id', collectionId).eq('user_id', user.id).single()
  if (!col) return { error: 'Collection not found' }

  if (materialIds.length > 0) {
    await supabase.from('collection_materials').upsert(
      materialIds.map(mid => ({ collection_id: collectionId, material_id: mid })),
    )
  }
  if (taskIds.length > 0) {
    await (supabase as any).from('collection_tasks').upsert(
      taskIds.map(tid => ({ collection_id: collectionId, task_id: tid })),
    )
  }

  revalidatePath(`/collections/${collectionId}`)
  return { success: true, added: materialIds.length + taskIds.length }
}
