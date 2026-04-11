'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const fullName = (formData.get('full_name') as string).trim()
  const bio = (formData.get('bio') as string | null)?.trim() || null

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: fullName || null, bio, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/profile')
  revalidatePath('/dashboard')
  return { success: true }
}
