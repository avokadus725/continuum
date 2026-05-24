import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { TaskForm } from '@/components/features/tasks/task-form'
import { CommentsSection } from '@/components/features/comments/comments-section'
import { QuickNoteButton } from '@/components/features/notes/quick-note-button'
import { AddToCollectionButton } from '@/components/features/collections/add-to-collection-button'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('tasks').select('title').eq('id', id).single()
  return { title: data?.title ?? 'Task' }
}

interface Props {
  params: Promise<{ id: string }>
}

const difficultyColors: Record<string, string> = {
  beginner:     'bg-green-100 text-green-700',
  intermediate: 'bg-amber-100 text-amber-700',
  advanced:     'bg-red-100 text-red-700',
}

export default async function TaskDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const t = await getTranslations('tasks')
  const tCommon = await getTranslations('common')

  const { data: { user } } = await supabase.auth.getUser()

  const [taskRes, commentsRes] = await Promise.all([
    supabase
      .from('tasks')
      .select('*, topics(title, icon, slug), task_options(id, text, order_num)')
      .eq('id', id)
      .eq('is_published', true)
      .single(),
    supabase
      .from('comments')
      .select('id, content, created_at, user_id, parent_id, profiles(full_name, avatar_url)')
      .eq('task_id', id)
      .order('created_at', { ascending: true }),
  ])

  const { data: task } = taskRes

  if (!task) notFound()

  const topic = task.topics as { title: string; icon: string | null; slug: string } | null
  const options = (task.task_options as { id: string; text: string; order_num: number }[]) ?? []

  const comments = (commentsRes.data ?? []).map((c) => ({
    id: c.id,
    content: c.content,
    created_at: c.created_at,
    user_id: c.user_id,
    parent_id: c.parent_id,
    profiles: c.profiles as { full_name: string | null; avatar_url: string | null } | null,
  }))

  // Check if already answered correctly
  let alreadyCorrect = false
  if (user) {
    const { data: existing } = await supabase
      .from('student_progress')
      .select('id')
      .eq('user_id', user.id)
      .eq('task_id', id)
      .eq('is_correct', true)
      .maybeSingle()
    alreadyCorrect = !!existing
  }

  // Attempt count
  let attemptCount = 0
  if (user) {
    const { count } = await supabase
      .from('student_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('task_id', id)
    attemptCount = count ?? 0
  }

  // Collections (to power the "Add to collection" button)
  const collectionsData = user ? await (async () => {
    const { data: cols } = await (supabase as any)
      .from('collections')
      .select('id, title, collection_tasks(task_id)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    return ((cols ?? []) as { id: string; title: string; collection_tasks: { task_id: string }[] }[]).map(c => ({
      id: c.id,
      title: c.title,
      hasItem: c.collection_tasks.some(ct => ct.task_id === id),
    }))
  })() : []

  return (
    <div className="max-w-2xl">

      {/* Back */}
      <Link
        href={topic ? `/tasks?topic=${topic.slug}` : '/tasks'}
        className="inline-flex items-center gap-1.5 text-sm mb-6 transition-colors"
        style={{ color: 'var(--muted-foreground)' }}
      >
        ← {tCommon('back')}
      </Link>

      {/* Header */}
      <div
        className="rounded-2xl border p-6 mb-6"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {topic && (
            <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              {topic.icon} {topic.title}
            </span>
          )}
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColors[task.difficulty]}`}
          >
            {t(`difficulty.${task.difficulty}`)}
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-semibold ml-auto"
            style={{ color: 'var(--primary)' }}
          >
            +{task.xp_reward} XP
          </span>
        </div>

        <h1 className="text-xl font-bold mb-3" style={{ color: 'var(--foreground)' }}>
          {task.title}
        </h1>

        <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--muted-foreground)' }}>
          {task.description}
        </p>

        {attemptCount > 0 && (
          <p className="text-xs mt-3" style={{ color: 'var(--muted-foreground)' }}>
            {t('attempts', { count: attemptCount })}
          </p>
        )}
      </div>

      {/* Task form */}
      <TaskForm
        taskId={id}
        taskType={task.type as 'single_choice' | 'multiple_choice' | 'text' | 'code'}
        options={options}
        alreadyCorrect={alreadyCorrect}
        explanation={(task as { explanation?: string | null }).explanation ?? null}
      />

      {/* Quick note + collection */}
      {user && (
        <div className="flex items-center justify-end gap-2">
          <AddToCollectionButton itemId={id} itemType="task" collections={collectionsData} />
          <QuickNoteButton taskId={id} taskTitle={task.title} />
        </div>
      )}

      {/* Comments */}
      {user && (
        <div
          className="rounded-2xl border p-6 mt-6"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <CommentsSection
            comments={comments}
            taskId={id}
            currentUserId={user.id}
          />
        </div>
      )}

    </div>
  )
}
