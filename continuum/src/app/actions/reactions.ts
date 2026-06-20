'use server'

/* Reaction Server Actions – toggle like / helpful / fire reactions on materials & comments. */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type ReactionType = 'like' | 'helpful' | 'fire'

export async function toggleReaction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const type = formData.get('type') as ReactionType
  const materialId = (formData.get('material_id') as string | null) || null
  const commentId = (formData.get('comment_id') as string | null) || null

  if (!materialId && !commentId) return { error: 'Missing context' }

  // Check if reaction exists
  let existingQuery = supabase
    .from('reactions')
    .select('id')
    .eq('user_id', user.id)
    .eq('type', type)

  if (materialId) existingQuery = existingQuery.eq('material_id', materialId)
  if (commentId) existingQuery = existingQuery.eq('comment_id', commentId)

  const { data: existing } = await existingQuery.maybeSingle()

  if (existing) {
    // Remove reaction
    await supabase.from('reactions').delete().eq('id', existing.id)
  } else {
    // Add reaction
    await supabase.from('reactions').insert({
      user_id: user.id,
      type,
      material_id: materialId,
      comment_id: commentId,
    })
  }

  if (materialId) revalidatePath(`/materials/${materialId}`)

  return { success: true }
}
