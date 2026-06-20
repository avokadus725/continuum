'use server'

/* Note Server Actions – create, update and delete personal notes. */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createNote(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const title        = (formData.get('title') as string).trim()
  const content      = (formData.get('content') as string | null)?.trim() || null
  const materialId   = (formData.get('material_id') as string | null) || null
  const taskId       = (formData.get('task_id') as string | null) || null
  const topicId      = (formData.get('topic_id') as string | null) || null
  const collectionId = (formData.get('collection_id') as string | null) || null

  if (!title) return { error: 'Title is required' }

  // collection_id not in generated types yet – cast to any
  const { data, error } = await (supabase.from('notes') as any)
    .insert({
      user_id: user.id,
      title,
      content,
      material_id: materialId,
      task_id: taskId,
      topic_id: topicId,
      collection_id: collectionId,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/notes')
  if (collectionId) revalidatePath(`/collections/${collectionId}`)
  return { id: data.id }
}

export async function updateNote(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const id           = formData.get('id') as string
  const title        = (formData.get('title') as string).trim()
  const content      = (formData.get('content') as string | null)?.trim() || null
  // 'unset' sentinel means explicitly clear the collection link
  const collectionRaw = formData.get('collection_id') as string | null
  const collectionId  = collectionRaw === '' || collectionRaw === 'unset' ? null : collectionRaw || null

  if (!id || !title) return { error: 'Missing fields' }

  const { error } = await (supabase.from('notes') as any)
    .update({ title, content, collection_id: collectionId, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/notes')
  if (collectionId) revalidatePath(`/collections/${collectionId}`)
  return { success: true }
}

export async function deleteNote(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const id = formData.get('id') as string
  if (!id) return { error: 'Missing id' }

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/notes')
  return { success: true }
}
