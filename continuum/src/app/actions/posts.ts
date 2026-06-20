'use server'

/* Community Post Server Actions – posts, comments, reactions, saves, tag follows, mark-solved. */

import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { revalidatePath } from 'next/cache'

type PostKind = 'discussion' | 'question' | 'share'

/* ───────────── createPost ───────────── */

export async function createPost(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const content = (formData.get('content') as string)?.trim()
  if (!content) return { error: 'Content required' }

  const rawKind = (formData.get('kind') as string) || 'discussion'
  const kind: PostKind =
    rawKind === 'question' || rawKind === 'share' ? rawKind : 'discussion'

  const title    = (formData.get('title') as string | null)?.trim() || null
  const url      = (formData.get('url')   as string | null)?.trim() || null
  const urlTitle = (formData.get('url_title') as string | null)?.trim() || null

  // tags[] – array of slugs already normalised on client (lowercase, kebab-case)
  const tags = (formData.getAll('tags[]') as string[])
    .map(t => t.trim().toLowerCase().replace(/^#/, ''))
    .filter(Boolean)
    .slice(0, 5)

  // 1) Insert post
  const { data: post, error } = await (supabase as any).from('posts')
    .insert({ user_id: user.id, content, url, url_title: urlTitle, kind, title })
    .select('id')
    .single()
  if (error) return { error: error.message }

  // 2) Upsert tag rows + post_tags
  if (tags.length > 0) {
    await (supabase as any).from('tags').upsert(
      tags.map(slug => ({ slug })),
      { onConflict: 'slug', ignoreDuplicates: true },
    )
    await (supabase as any).from('post_tags').insert(
      tags.map(slug => ({ post_id: post.id, tag_slug: slug })),
    )
  }

  revalidatePath('/community')
  return { id: post.id }
}

/* ───────────── deletePost ───────────── */

export async function deletePost(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const id = formData.get('id') as string
  const { error } = await (supabase as any).from('posts')
    .delete().eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/community')
  return { success: true }
}

/* ───────────── togglePostReaction ───────────── */

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
    if (insErr) return { error: insErr.message }

    try {
      const { data: post } = await (supabase as any).from('posts')
        .select('user_id, content').eq('id', postId).single()
      if (post && post.user_id !== user.id) {
        const { data: reactor } = await supabase
          .from('profiles').select('full_name').eq('id', user.id).single()
        const tn = await getTranslations('notifications')
        const name = reactor?.full_name ?? tn('someone')
        await (supabase as any).from('notifications').insert({
          user_id: post.user_id,
          type: 'post_reaction',
          title: tn('titleReaction', { name }),
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

/* ───────────── createPostComment ───────────── */

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
    .select('id').single()
  if (error) return { error: error.message }

  const { data: commenter } = await supabase
    .from('profiles').select('full_name').eq('id', user.id).single()
  const tn = await getTranslations('notifications')
  const name = commenter?.full_name ?? tn('someone')

  if (parentId) {
    const { data: parent } = await (supabase as any).from('comments')
      .select('user_id').eq('id', parentId).single()
    if (parent && parent.user_id !== user.id) {
      await (supabase as any).from('notifications').insert({
        user_id: parent.user_id, type: 'comment_reply',
        title: tn('titleReply', { name }),
        body: content.slice(0, 80),
        meta: { post_id: postId, comment_id: comment.id },
      })
    }
  } else {
    const { data: post } = await (supabase as any).from('posts')
      .select('user_id, content').eq('id', postId).single()
    if (post && post.user_id !== user.id) {
      await (supabase as any).from('notifications').insert({
        user_id: post.user_id, type: 'post_comment',
        title: tn('titleComment', { name }),
        body: (post.content as string).slice(0, 80),
        meta: { post_id: postId, comment_id: comment.id },
      })
    }
  }

  revalidatePath('/community')
  return { success: true }
}

/* ───────────── markQuestionSolved ───────────── */

export async function markQuestionSolved(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const postId  = formData.get('post_id') as string
  const solved  = formData.get('solved') === 'true'

  const { error } = await (supabase as any).from('posts')
    .update({ is_solved: solved })
    .eq('id', postId)
    .eq('user_id', user.id)
    .eq('kind', 'question')
  if (error) return { error: error.message }

  revalidatePath('/community')
  return { success: true }
}

/* ───────────── toggleSavePost ───────────── */

export async function toggleSavePost(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const postId = formData.get('post_id') as string

  const { data: existing } = await (supabase as any).from('saved_posts')
    .select('post_id').eq('user_id', user.id).eq('post_id', postId).maybeSingle()

  if (existing) {
    await (supabase as any).from('saved_posts')
      .delete().eq('user_id', user.id).eq('post_id', postId)
  } else {
    await (supabase as any).from('saved_posts')
      .insert({ user_id: user.id, post_id: postId })
  }

  revalidatePath('/community')
  return { success: true, saved: !existing }
}

/* ───────────── toggleTagFollow ───────────── */

export async function toggleTagFollow(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const tagSlug = (formData.get('tag') as string)?.trim().toLowerCase().replace(/^#/, '')
  if (!tagSlug) return { error: 'Missing tag' }

  await (supabase as any).from('tags').upsert({ slug: tagSlug }, { onConflict: 'slug', ignoreDuplicates: true })

  const { data: existing } = await (supabase as any).from('tag_subscriptions')
    .select('user_id').eq('user_id', user.id).eq('tag_slug', tagSlug).maybeSingle()

  if (existing) {
    await (supabase as any).from('tag_subscriptions')
      .delete().eq('user_id', user.id).eq('tag_slug', tagSlug)
  } else {
    await (supabase as any).from('tag_subscriptions')
      .insert({ user_id: user.id, tag_slug: tagSlug })
  }

  revalidatePath(`/community/tag/${tagSlug}`)
  revalidatePath('/community')
  return { success: true, following: !existing }
}
