import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { TaskForm } from '@/components/features/tasks/task-form'
import { CommentsSection } from '@/components/features/comments/comments-section'
import { QuickNoteButton } from '@/components/features/notes/quick-note-button'
import { AddToCollectionButton } from '@/components/features/collections/add-to-collection-button'
import { TopicIcon } from '@/lib/topic-icons'
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

import { DIFF_COLOR as DIFF_VARS } from '@/lib/difficulty-colors'

export default async function TaskDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const t        = await getTranslations('tasks')
  const tCommon  = await getTranslations('common')
  const tTopics  = await getTranslations('topics')

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

  const rawTopic = task.topics as { title: string; icon: string | null; slug: string } | null
  const topicTitle = rawTopic
    ? (() => { try { return tTopics(rawTopic.slug as Parameters<typeof tTopics>[0]) } catch { return rawTopic.title } })()
    : null
  const topic = rawTopic ? { ...rawTopic, title: topicTitle! } : null

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

  // Collections
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
    <div className="max-w-3xl space-y-5">

      {/* Back */}
      <Link
        href={rawTopic ? `/tasks?topic=${rawTopic.slug}` : '/tasks'}
        className="inline-flex items-center gap-1.5 text-sm transition-colors"
        style={{ color: 'var(--muted-foreground)' }}
      >
        ← {tCommon('back')}
      </Link>

      {/* Header */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderLeft: `3px solid ${DIFF_VARS[task.difficulty]}`,
        }}
      >
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {topic && (
            <span className="inline-flex items-center gap-1.5 text-[12.5px]" style={{ color: 'var(--muted-foreground)' }}>
              <TopicIcon slug={topic.slug} size={12} className="shrink-0" />{topic.title}
            </span>
          )}
          <span
            className="text-[11.5px] px-2.5 py-0.5 rounded-full font-semibold"
            style={{
              background: `color-mix(in srgb, ${DIFF_VARS[task.difficulty]} 15%, transparent)`,
              color: DIFF_VARS[task.difficulty],
            }}
          >
            {t(`difficulty.${task.difficulty}`)}
          </span>
          <span
            className="text-[12px] px-2.5 py-0.5 rounded-full font-semibold ml-auto"
            style={{
              background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
              color: 'var(--primary)',
            }}
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
          <QuickNoteButton taskId={id} taskTitle={task.title} collections={collectionsData.map(c => ({ id: c.id, title: c.title }))} />
        </div>
      )}

      {/* Comments */}
      {user && (
        <div
          className="rounded-2xl border p-6"
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
