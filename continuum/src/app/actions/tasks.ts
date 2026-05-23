'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const XP_PER_LEVEL = 100

function calcLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1
}

export async function submitTaskAnswer(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const taskId = formData.get('taskId') as string
  const taskType = formData.get('taskType') as string

  // Get task + options
  const { data: task } = await supabase
    .from('tasks')
    .select('id, xp_reward, task_options(id, is_correct)')
    .eq('id', taskId)
    .single()

  if (!task) return { error: 'Task not found' }

  // Check if already answered correctly
  const { data: existing } = await supabase
    .from('student_progress')
    .select('id, is_correct')
    .eq('user_id', user.id)
    .eq('task_id', taskId)
    .eq('is_correct', true)
    .maybeSingle()

  if (existing) return { alreadyCorrect: true }

  // Evaluate answer
  let isCorrect = false
  const options = task.task_options as { id: string; is_correct: boolean }[]

  if (taskType === 'single_choice') {
    const selectedId = formData.get('answer') as string
    const selected = options.find((o) => o.id === selectedId)
    isCorrect = selected?.is_correct ?? false
  } else if (taskType === 'multiple_choice') {
    const selectedIds = formData.getAll('answer') as string[]
    const correctIds = options.filter((o) => o.is_correct).map((o) => o.id)
    isCorrect =
      correctIds.length === selectedIds.length &&
      correctIds.every((id) => selectedIds.includes(id))
  } else if (taskType === 'text' || taskType === 'code') {
    // No auto-grader: any non-empty submission is accepted as correct.
    // The explanation field is shown afterwards so the student can self-assess.
    const answer = (formData.get('answer') as string | null)?.trim() ?? ''
    isCorrect = answer.length > 0
  }

  // Get current attempt count
  const { count } = await supabase
    .from('student_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('task_id', taskId)

  const attemptNum = (count ?? 0) + 1

  // Save progress
  await supabase.from('student_progress').insert({
    user_id: user.id,
    task_id: taskId,
    is_correct: isCorrect,
    score: isCorrect ? task.xp_reward : 0,
    attempt_num: attemptNum,
  })

  // Award XP if correct
  if (isCorrect) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('xp')
      .eq('id', user.id)
      .single()

    if (profile) {
      const newXp = profile.xp + task.xp_reward
      await supabase
        .from('profiles')
        .update({ xp: newXp, level: calcLevel(newXp) })
        .eq('id', user.id)
    }
  }

  revalidatePath(`/tasks/${taskId}`)

  return { isCorrect, xpEarned: isCorrect ? task.xp_reward : 0 }
}
