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

  const [usersRes, tasksRes, materialsRes, topicsRes, progressRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, role, xp, level, created_at, is_active')
      .order('created_at', { ascending: false }),
    supabase
      .from('tasks')
      .select('id, title, difficulty, type, xp_reward, is_published, topic_id, description, task_options(text, is_correct)')
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

  const tasks = (tasksRes.data ?? []).map(t => ({
    ...t,
    options: (t.task_options as { text: string; is_correct: boolean }[]) ?? [],
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
      />
    </div>
  )
}
