'use server'

/* Todo Server Actions – create, toggle and delete personal to-dos. */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createTodo(title: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  await (supabase as any)
    .from('personal_tasks')
    .insert({ user_id: user.id, title })

  revalidatePath('/dashboard')
}

export async function toggleTodo(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data } = await (supabase as any)
    .from('personal_tasks')
    .select('done')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!data) return { error: 'Not found' }

  await (supabase as any)
    .from('personal_tasks')
    .update({ done: !data.done })
    .eq('id', id)
    .eq('user_id', user.id)

  revalidatePath('/dashboard')
}

export async function deleteTodo(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  await (supabase as any)
    .from('personal_tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  revalidatePath('/dashboard')
}
