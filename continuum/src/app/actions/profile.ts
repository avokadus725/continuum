'use server'

/* Profile Server Actions – update profile fields and upload the user avatar. */

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

export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const file = formData.get('avatar') as File | null
  if (!file || file.size === 0) return { error: 'No file provided' }

  // Validate: image only, max 2 MB
  if (!file.type.startsWith('image/')) return { error: 'File must be an image' }
  if (file.size > 2 * 1024 * 1024) return { error: 'File must be under 2 MB' }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `${user.id}/avatar.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) return { error: uploadError.message }

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(path)

  // Append cache-busting param so browser reloads the image
  const avatarUrl = `${publicUrl}?t=${Date.now()}`

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (profileError) return { error: profileError.message }

  revalidatePath('/profile')
  revalidatePath('/dashboard')
  return { avatarUrl }
}
