'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createNote(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const title = (formData.get('title') as string).trim()
  const content = (formData.get('content') as string | null)?.trim() || null
  const materialId = (formData.get('material_id') as string | null) || null
  const taskId = (formData.get('task_id') as string | null) || null
  const topicId = (formData.get('topic_id') as string | null) || null

  if (!title) return { error: 'Title is required' }

  const { data, error } = await supabase
    .from('notes')
    .insert({
      user_id: user.id,
      title,
      content,
      material_id: materialId,
      task_id: taskId,
      topic_id: topicId,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/notes')
  return { id: data.id }
}

export async function updateNote(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const id = formData.get('id') as string
  const title = (formData.get('title') as string).trim()
  const content = (formData.get('content') as string | null)?.trim() || null

  if (!id || !title) return { error: 'Missing fields' }

  const { error } = await supabase
    .from('notes')
    .update({ title, content, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/notes')
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
