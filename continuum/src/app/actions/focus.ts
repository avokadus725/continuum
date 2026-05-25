'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface SaveSessionPayload {
  startedAt: string
  endedAt: string
  focusSeconds: number
  breakSeconds: number
  pomodorosCompleted: number
  mode: 'pomodoro' | 'custom'
  workDurationMin: number
  breakDurationMin: number
  status: 'completed' | 'interrupted'
  intention?: string | null
  mood?: number | null
}

export async function saveFocusSession(payload: SaveSessionPayload) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const client = supabase as unknown as { from: (t: string) => { insert: (v: unknown) => Promise<{ error: { message: string } | null }> } }
  const { error } = await client.from('focus_sessions').insert({
    user_id: user.id,
    started_at: payload.startedAt,
    ended_at: payload.endedAt,
    focus_seconds: payload.focusSeconds,
    break_seconds: payload.breakSeconds,
    pomodoros_completed: payload.pomodorosCompleted,
    mode: payload.mode,
    work_duration_min: payload.workDurationMin,
    break_duration_min: payload.breakDurationMin,
    status: payload.status,
    intention: payload.intention ?? null,
    mood: payload.mood ?? null,
  })

  if (error) return { error: error.message }

  revalidatePath('/analytics')
  revalidatePath('/focus')
  revalidatePath('/dashboard')
  return { success: true }
}
