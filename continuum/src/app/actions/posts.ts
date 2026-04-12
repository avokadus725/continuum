'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createPost(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const content  = (formData.get('content') as string).trim()
  const url      = (formData.get('url') as string | null)?.trim() || null
  const urlTitle = (formData.get('url_title') as string | null)?.trim() || null

  if (!content) return { error: 'Content required' }

  // cast: posts not in generated types yet
  const { data, error } = await (supabase as any).from('posts')
    .insert({ user_id: user.id, content, url, url_title: urlTitle })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/community')
  return { id: data.id }
}

export async function deletePost(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const id = formData.get('id') as string

  const { error } = await (supabase as any).from('posts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/community')
  return { success: true }
}

export async function togglePostReaction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const postId = formData.get('post_id') as string
  const type   = formData.get('type') as string

  const { data: existing } = await (supabase as any).from('reactions')
    .select('id')
    .eq('user_id', user.id)
    .eq('post_id', postId)
    .eq('type', type)
    .maybeSingle()

  if (existing) {
    const { error: delErr } = await (supabase as any).from('reactions')
      .delete().eq('id', existing.id)
    if (delErr) return { error: delErr.message }
  } else {
    const { error: insErr } = await (supabase as any).from('reactions')
      .insert({ user_id: user.id, post_id: postId, type })

    // ← якщо insert впав — повертаємо помилку, НЕ надсилаємо сповіщення
    if (insErr) {
      console.error('[togglePostReaction]', insErr.message, insErr.details)
      return { error: insErr.message }
    }

    // Notify post author (skip self-reaction)
    try {
      const { data: post } = await (supabase as any).from('posts')
        .select('user_id, content').eq('id', postId).single()
      if (post && post.user_id !== user.id) {
        const { data: reactor } = await supabase
          .from('profiles').select('full_name').eq('id', user.id).single()
        const name = reactor?.full_name ?? 'Хтось'
        await (supabase as any).from('notifications').insert({
          user_id: post.user_id,
          type: 'post_reaction',
          title: `${name} лайкнув ваш пост`,
          body: (post.content as string).slice(0, 80),
          meta: { post_id: postId },
        })
      }
    } catch (e) {
      console.error('[togglePostReaction] notification:', e)
    }
  }

  revalidatePath('/community')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function createPostComment(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const content  = (formData.get('content') as string).trim()
  const postId   = formData.get('post_id') as string
  const parentId = (formData.get('parent_id') as string | null) || null

  if (!content) return { error: 'Content required' }

  const { data: comment, error } = await (supabase as any).from('comments')
    .insert({ user_id: user.id, content, post_id: postId, parent_id: parentId })
    .select('id')
    .single()

  if (error) return { error: error.message }

  // Notify: if reply → notify parent comment author; else notify post author
  const { data: commenter } = await supabase
    .from('profiles').select('full_name').eq('id', user.id).single()
  const name = commenter?.full_name ?? 'Хтось'

  if (parentId) {
    const { data: parent } = await (supabase as any).from('comments')
      .select('user_id').eq('id', parentId).single()
    if (parent && parent.user_id !== user.id) {
      await (supabase as any).from('notifications').insert({
        user_id: parent.user_id,
        type: 'comment_reply',
        title: `${name} відповів на ваш коментар`,
        body: content.slice(0, 80),
        meta: { post_id: postId, comment_id: comment.id },
      })
    }
  } else {
    const { data: post } = await (supabase as any).from('posts')
      .select('user_id, content').eq('id', postId).single()
    if (post && post.user_id !== user.id) {
      await (supabase as any).from('notifications').insert({
        user_id: post.user_id,
        type: 'post_comment',
        title: `${name} прокоментував ваш пост`,
        body: (post.content as string).slice(0, 80),
        meta: { post_id: postId, comment_id: comment.id },
      })
    }
  }

  revalidatePath('/community')
  return { success: true }
}
