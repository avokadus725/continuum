'use server'

/* Comment Server Actions — create and delete comments on materials, tasks and posts. */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createComment(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const content = (formData.get('content') as string).trim()
  const materialId = (formData.get('material_id') as string | null) || null
  const taskId = (formData.get('task_id') as string | null) || null
  const parentId = (formData.get('parent_id') as string | null) || null

  if (!content) return { error: 'Content is required' }
  if (!materialId && !taskId) return { error: 'Missing context' }

  const { error } = await supabase.from('comments').insert({
    user_id: user.id,
    content,
    material_id: materialId,
    task_id: taskId,
    parent_id: parentId,
  })

  if (error) return { error: error.message }

  if (materialId) revalidatePath(`/materials/${materialId}`)
  if (taskId) revalidatePath(`/tasks/${taskId}`)

  return { success: true }
}

export async function deleteComment(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const id = formData.get('id') as string
  const materialId = (formData.get('material_id') as string | null) || null
  const taskId = (formData.get('task_id') as string | null) || null

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  if (materialId) revalidatePath(`/materials/${materialId}`)
  if (taskId) revalidatePath(`/tasks/${taskId}`)

  return { success: true }
}
