/* Admin page – dashboard for managing users, tasks and materials (admin role only). */

import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { AdminClient } from '@/components/features/admin/admin-client'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('admin')
  return { title: t('title') }
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const [usersRes, tasksRes, materialsRes, topicsRes, progressRes, commentsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, role, xp, level, created_at, is_active')
      .order('created_at', { ascending: false }),
    supabase
      .from('tasks')
      .select('id, title, difficulty, type, xp_reward, is_published, topic_id, description, explanation, task_options(text, is_correct)')
      .order('created_at', { ascending: false }),
    supabase
      .from('materials')
      .select('id, title, type, is_published, topic_id, content, url')
      .order('created_at', { ascending: false }),
    supabase
      .from('topics')
      .select('id, title, icon')
      .order('title'),
    supabase
      .from('student_progress')
      .select('id', { count: 'exact', head: true }),
    supabase
      .from('comments')
      .select('id, content, created_at, profiles(full_name), materials(title), tasks(title)')
      .order('created_at', { ascending: false })
      .limit(200),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const users = (usersRes.data ?? []).map((u: any) => ({
    id: u.id as string,
    full_name: u.full_name as string | null,
    role: u.role as string,
    xp: u.xp as number,
    level: u.level as number,
    created_at: u.created_at as string,
    is_active: u.is_active !== false,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tasks = (tasksRes.data ?? []).map((t: any) => ({
    id: t.id as string,
    title: t.title as string,
    difficulty: t.difficulty as string,
    type: t.type as string,
    xp_reward: t.xp_reward as number,
    is_published: t.is_published as boolean,
    topic_id: t.topic_id as string | null,
    description: t.description as string,
    explanation: (t.explanation as string | null) ?? null,
    options: (t.task_options as { text: string; is_correct: boolean }[]) ?? [],
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const comments = (commentsRes.data ?? []).map((c: any) => ({
    id: c.id as string,
    content: c.content as string,
    created_at: c.created_at as string,
    user_name: (c.profiles as { full_name: string | null } | null)?.full_name ?? null,
    material_title: (c.materials as { title: string } | null)?.title ?? null,
    task_title: (c.tasks as { title: string } | null)?.title ?? null,
  }))

  return (
    <div className="space-y-6">
      <AdminClient
        currentUserId={user.id}
        users={users}
        tasks={tasks}
        materials={(materialsRes.data ?? []).map(m => ({
          id: m.id,
          title: m.title,
          type: m.type,
          is_published: m.is_published,
          topic_id: m.topic_id,
          content: m.content,
          url: m.url,
        }))}
        topics={topicsRes.data ?? []}
        totalAttempts={progressRes.count ?? 0}
        comments={comments}
      />
    </div>
  )
}
