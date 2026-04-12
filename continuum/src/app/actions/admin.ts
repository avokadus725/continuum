'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')       // strip diacritics
    .replace(/[^a-z0-9\s-]/g, '')          // keep only alphanumeric + space/dash
    .trim()
    .replace(/\s+/g, '-')                  // spaces → dashes
    .replace(/-+/g, '-')                   // collapse multiple dashes
    .slice(0, 80)
}

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (data?.role !== 'admin') return null
  return supabase
}

// ─── Users ───────────────────────────────────────────────────

export async function toggleUserStatus(formData: FormData) {
  const supabase = await assertAdmin()
  if (!supabase) return { error: 'Forbidden' }

  const userId = formData.get('user_id') as string
  const current = formData.get('is_active') === 'true'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('profiles') as any)
    .update({ is_active: !current })
    .eq('id', userId)

  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { success: true }
}

// ─── Tasks ────────────────────────────────────────────────────

export async function createTask(formData: FormData) {
  const supabase = await assertAdmin()
  if (!supabase) return { error: 'Forbidden' }

  const { data: { user } } = await supabase.auth.getUser()

  const title       = (formData.get('title') as string).trim()
  const description = (formData.get('description') as string).trim()
  const difficulty  = formData.get('difficulty') as 'beginner' | 'intermediate' | 'advanced'
  const type        = formData.get('type') as 'single_choice' | 'multiple_choice' | 'text' | 'code'
  const xpReward    = parseInt(formData.get('xp_reward') as string) || 10
  const topicId     = (formData.get('topic_id') as string | null) || null
  const isPublished = formData.get('is_published') === 'true'

  if (!title || !description) return { error: 'Title and description required' }

  const { data: task, error } = await supabase
    .from('tasks')
    .insert([{ title, description, difficulty, type, xp_reward: xpReward, topic_id: topicId, is_published: isPublished, created_by: user!.id }])
    .select('id')
    .single()

  if (error || !task) return { error: error?.message ?? 'Failed' }

  // Insert options if choice type
  const optionsJson = formData.get('options') as string | null
  if (optionsJson && (type === 'single_choice' || type === 'multiple_choice')) {
    const options: { text: string; is_correct: boolean }[] = JSON.parse(optionsJson)
    if (options.length > 0) {
      await supabase.from('task_options').insert(
        options.map((o, i) => ({ task_id: task.id, text: o.text, is_correct: o.is_correct, order_num: i + 1 }))
      )
    }
  }

  revalidatePath('/admin')
  revalidatePath('/tasks')
  return { id: task.id }
}

export async function updateTask(formData: FormData) {
  const supabase = await assertAdmin()
  if (!supabase) return { error: 'Forbidden' }

  const id          = formData.get('id') as string
  const title       = (formData.get('title') as string).trim()
  const description = (formData.get('description') as string).trim()
  const difficulty  = formData.get('difficulty') as 'beginner' | 'intermediate' | 'advanced'
  const type        = formData.get('type') as 'single_choice' | 'multiple_choice' | 'text' | 'code'
  const xpReward    = parseInt(formData.get('xp_reward') as string) || 10
  const topicId     = (formData.get('topic_id') as string | null) || null
  const isPublished = formData.get('is_published') === 'true'

  const { error } = await supabase
    .from('tasks')
    .update({ title, description, difficulty, type, xp_reward: xpReward, topic_id: topicId, is_published: isPublished, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }

  // Replace options
  const optionsJson = formData.get('options') as string | null
  if (optionsJson && (type === 'single_choice' || type === 'multiple_choice')) {
    await supabase.from('task_options').delete().eq('task_id', id)
    const options: { text: string; is_correct: boolean }[] = JSON.parse(optionsJson)
    if (options.length > 0) {
      await supabase.from('task_options').insert(
        options.map((o, i) => ({ task_id: id, text: o.text, is_correct: o.is_correct, order_num: i + 1 }))
      )
    }
  }

  revalidatePath('/admin')
  revalidatePath('/tasks')
  revalidatePath(`/tasks/${id}`)
  return { success: true }
}

export async function deleteTask(formData: FormData) {
  const supabase = await assertAdmin()
  if (!supabase) return { error: 'Forbidden' }

  const id = formData.get('id') as string
  await supabase.from('task_options').delete().eq('task_id', id)
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin')
  revalidatePath('/tasks')
  return { success: true }
}

// ─── Materials ────────────────────────────────────────────────

export async function createMaterial(formData: FormData) {
  const supabase = await assertAdmin()
  if (!supabase) return { error: 'Forbidden' }

  const { data: { user } } = await supabase.auth.getUser()

  const title       = (formData.get('title') as string).trim()
  const content     = (formData.get('content') as string | null)?.trim() || null
  const url         = (formData.get('url') as string | null)?.trim() || null
  const type        = formData.get('type') as 'article' | 'video' | 'link' | 'interactive'
  const topicId     = (formData.get('topic_id') as string | null) || null
  const isPublished = formData.get('is_published') === 'true'

  if (!title) return { error: 'Title required' }

  // Generate unique slug
  const baseSlug = slugify(title)
  let slug = baseSlug
  let attempt = 0
  while (true) {
    const { data: existing } = await supabase
      .from('materials').select('id').eq('slug', slug).maybeSingle()
    if (!existing) break
    attempt++
    slug = `${baseSlug}-${attempt}`
  }

  const { data, error } = await supabase
    .from('materials')
    .insert([{ title, slug, content, url, type, topic_id: topicId, is_published: isPublished, created_by: user!.id }])
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/admin')
  revalidatePath('/materials')
  return { id: data.id }
}

export async function updateMaterial(formData: FormData) {
  const supabase = await assertAdmin()
  if (!supabase) return { error: 'Forbidden' }

  const id          = formData.get('id') as string
  const title       = (formData.get('title') as string).trim()
  const content     = (formData.get('content') as string | null)?.trim() || null
  const url         = (formData.get('url') as string | null)?.trim() || null
  const type        = formData.get('type') as 'article' | 'video' | 'link' | 'interactive'
  const topicId     = (formData.get('topic_id') as string | null) || null
  const isPublished = formData.get('is_published') === 'true'

  // If title changed, regenerate slug (slug not in types until migration applied)
  const { data: existing } = await (supabase.from('materials') as any).select('title, slug').eq('id', id).single()

  let slug: string | undefined
  if (existing && existing.title !== title) {
    const baseSlug = slugify(title)
    slug = baseSlug
    let attempt = 0
    while (true) {
      const { data: conflict } = await supabase
        .from('materials').select('id').eq('slug', slug).neq('id', id).maybeSingle()
      if (!conflict) break
      attempt++
      slug = `${baseSlug}-${attempt}`
    }
  }

  const { error } = await supabase
    .from('materials')
    .update({
      title, content, url, type, topic_id: topicId, is_published: isPublished,
      ...(slug ? { slug } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  revalidatePath('/materials')
  revalidatePath(`/materials/${id}`)
  return { success: true }
}

export async function deleteMaterial(formData: FormData) {
  const supabase = await assertAdmin()
  if (!supabase) return { error: 'Forbidden' }

  const id = formData.get('id') as string
  const { error } = await supabase.from('materials').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin')
  revalidatePath('/materials')
  return { success: true }
}
