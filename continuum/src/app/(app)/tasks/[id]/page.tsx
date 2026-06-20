/* Task detail – unified card + comments locked until answered + "what's next"
   + related materials. */

import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Lock } from 'lucide-react'
import { TaskForm } from '@/components/features/tasks/task-form'
import { CommentsSection } from '@/components/features/comments/comments-section'
import { QuickNoteButton } from '@/components/features/notes/quick-note-button'
import { AddToCollectionButton } from '@/components/features/collections/add-to-collection-button'
import { TopicIcon } from '@/lib/topic-icons'
import { topicColor, topicTint } from '@/lib/topic-colors'
import { DIFF_COLOR } from '@/lib/difficulty-colors'
import type { Metadata } from 'next'

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('tasks').select('title').eq('id', id).single()
  return { title: data?.title ?? 'Task' }
}

export default async function TaskDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const t        = await getTranslations('tasks')
  const tCommon  = await getTranslations('common')
  const tTopics  = await getTranslations('topics')

  const { data: { user } } = await supabase.auth.getUser()

  const [taskRes, commentsRes] = await Promise.all([
    supabase.from('tasks')
      .select('*, topics(title, icon, slug), task_options(id, text, order_num)')
      .eq('id', id).eq('is_published', true).single(),
    supabase.from('comments')
      .select('id, content, created_at, user_id, parent_id, profiles(full_name, avatar_url)')
      .eq('task_id', id).order('created_at', { ascending: true }),
  ])

  const { data: task } = taskRes
  if (!task) notFound()

  const rawTopic = task.topics as { title: string; icon: string | null; slug: string } | null
  const topicTitle = rawTopic
    ? (() => { try { return tTopics(rawTopic.slug as Parameters<typeof tTopics>[0]) } catch { return rawTopic.title } })()
    : null
  const topic = rawTopic ? { ...rawTopic, title: topicTitle! } : null
  const accent = topicColor(rawTopic?.slug)
  const diffColor = DIFF_COLOR[task.difficulty as keyof typeof DIFF_COLOR]

  const options = (task.task_options as { id: string; text: string; order_num: number }[]) ?? []
  const comments = (commentsRes.data ?? []).map((c) => ({
    id: c.id, content: c.content, created_at: c.created_at,
    user_id: c.user_id, parent_id: c.parent_id,
    profiles: c.profiles as { full_name: string | null; avatar_url: string | null } | null,
  }))

  let alreadyCorrect = false
  let attemptCount = 0
  let topicTotal = 0
  let topicDone = 0
  let nextTask: { id: string; title: string } | null = null
  let relatedMaterials: { id: string; title: string; type: string }[] = []
  let collectionsData: { id: string; title: string; hasItem: boolean }[] = []

  if (user) {
    const [existingRes, attemptRes, topicTasksRes, completedRes, materialsRes, colsRes] = await Promise.all([
      supabase.from('student_progress').select('id').eq('user_id', user.id).eq('task_id', id).eq('is_correct', true).maybeSingle(),
      supabase.from('student_progress').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('task_id', id),
      rawTopic ? supabase.from('tasks').select('id, title').eq('is_published', true).eq('topic_id', task.topic_id as string) : Promise.resolve({ data: [] }),
      supabase.from('student_progress').select('task_id').eq('user_id', user.id).eq('is_correct', true),
      rawTopic ? supabase.from('materials').select('id, title, type').eq('is_published', true).eq('topic_id', task.topic_id as string).limit(2) : Promise.resolve({ data: [] }),
      (async () => {
        const { data: cols } = await (supabase as any).from('collections')
          .select('id, title, collection_tasks(task_id)').eq('user_id', user.id).order('created_at', { ascending: false })
        return ((cols ?? []) as { id: string; title: string; collection_tasks: { task_id: string }[] }[]).map(c => ({
          id: c.id, title: c.title, hasItem: c.collection_tasks.some(ct => ct.task_id === id),
        }))
      })(),
    ])

    alreadyCorrect = !!existingRes.data
    attemptCount = attemptRes.count ?? 0
    collectionsData = colsRes

    const topicTasks = (topicTasksRes.data ?? []) as { id: string; title: string }[]
    const doneIds = new Set(((completedRes.data ?? []) as { task_id: string }[]).map(r => r.task_id))
    topicTotal = topicTasks.length
    topicDone = topicTasks.filter(x => doneIds.has(x.id)).length
    nextTask = topicTasks.find(x => x.id !== id && !doneIds.has(x.id)) ?? null
    relatedMaterials = (materialsRes.data ?? []) as { id: string; title: string; type: string }[]
  }

  const attempted = attemptCount > 0
  const showComments = attempted || alreadyCorrect

  return (
    <div className="max-w-[1080px]">
      <Link href={rawTopic ? `/tasks?topic=${rawTopic.slug}` : '/tasks'}
        className="inline-flex items-center gap-1.5 text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
        <ArrowLeft size={15} /> {tCommon('back')}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">
        {/* Main */}
        <div className="min-w-0">
          {/* Unified task card */}
          <div className="rounded-2xl border overflow-hidden"
            style={{ background: 'var(--card)', borderColor: 'var(--border)', borderLeft: `3px solid ${diffColor}` }}>
            <div className="px-6 pt-5 pb-4"
              style={{ borderBottom: '1px solid color-mix(in srgb, var(--border) 70%, transparent)' }}>
              <div className="flex flex-wrap items-center gap-2.5 mb-3">
                {topic && (
                  <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold" style={{ color: accent }}>
                    <TopicIcon slug={topic.slug} size={13} /> {topic.title}
                  </span>
                )}
                <span className="text-[11.5px] font-semibold px-2.5 py-0.5 rounded-full"
                  style={{ background: `color-mix(in srgb, ${diffColor} 18%, transparent)`, color: diffColor }}>
                  {t(`difficulty.${task.difficulty}`)}
                </span>
                <span className="ml-auto shrink-0 rounded-full px-2.5 py-0.5 text-[11.5px] font-bold"
                  style={{
                    background: `color-mix(in srgb, ${alreadyCorrect ? 'var(--success)' : 'var(--primary)'} 16%, transparent)`,
                    color: alreadyCorrect ? 'var(--success)' : 'var(--primary)',
                  }}>
                  {alreadyCorrect ? t('xpEarned', { xp: task.xp_reward as number }) : t('xpReward', { xp: task.xp_reward as number })}
                </span>
              </div>
              <h1 className="text-[22px] font-bold tracking-[-0.3px]" style={{ color: 'var(--foreground)' }}>{task.title}</h1>
              <p className="mt-1.5 text-[13.5px] whitespace-pre-wrap" style={{ color: 'var(--muted-foreground)' }}>{task.description}</p>
              {attemptCount > 0 && (
                <p className="mt-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>{t('attempts', { count: attemptCount })}</p>
              )}
            </div>

            <div className="p-6 pt-4">
              <TaskForm
                taskId={id}
                taskType={task.type as 'single_choice' | 'multiple_choice' | 'text' | 'code'}
                options={options}
                alreadyCorrect={alreadyCorrect}
                explanation={(task as { explanation?: string | null }).explanation ?? null}
              />
            </div>
          </div>

          {/* What's next */}
          {alreadyCorrect && nextTask && (
            <Link href={`/tasks/${nextTask.id}`}
              className="mt-3.5 flex items-center gap-3.5 rounded-2xl border p-4 no-underline"
              style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <span className="grid h-10 w-10 flex-none place-items-center rounded-[10px]"
                style={{ background: 'color-mix(in srgb, var(--primary) 12%, transparent)', color: 'var(--primary)' }}>✓</span>
              <div className="flex-1">
                <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>{t('nextTask')}</div>
                <div className="text-[14.5px] font-semibold mt-0.5" style={{ color: 'var(--foreground)' }}>{nextTask.title}</div>
              </div>
              <ArrowRight size={18} style={{ color: 'var(--primary)' }} />
            </Link>
          )}

          {/* Comments – locked until attempted */}
          {user && (
            <div className="mt-3.5 rounded-2xl border p-6" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              {showComments ? (
                <CommentsSection comments={comments} taskId={id} currentUserId={user.id} />
              ) : (
                <div className="flex flex-col items-center gap-2 py-6 text-center rounded-xl" style={{ background: 'var(--muted)' }}>
                  <Lock size={20} style={{ color: 'var(--muted-foreground)' }} />
                  <p className="text-[13px] m-0" style={{ color: 'var(--muted-foreground)' }}>
                    {t('discussionLocked')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        {user && (
          <aside className="space-y-3.5">
            <div className="rounded-xl border p-3.5 space-y-2" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <AddToCollectionButton itemId={id} itemType="task" collections={collectionsData} />
              <QuickNoteButton taskId={id} taskTitle={task.title} collections={collectionsData.map(c => ({ id: c.id, title: c.title }))} />
            </div>

            {relatedMaterials.length > 0 && (
              <div className="rounded-xl border p-3.5" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                <h3 className="m-0 mb-2 text-[12.5px] font-semibold" style={{ color: 'var(--foreground)' }}>{t('prepareWithMaterials')}</h3>
                {relatedMaterials.map((m, i) => (
                  <Link key={m.id} href={`/materials/${m.id}`} className="flex items-start gap-2.5 py-2 no-underline"
                    style={{ borderTop: i ? '1px solid color-mix(in srgb, var(--border) 70%, transparent)' : 'none' }}>
                    <span className="grid h-6 w-6 flex-none place-items-center rounded-md text-[10px]"
                      style={{ background: 'var(--muted)', color: accent }}>▦</span>
                    <div className="min-w-0 flex-1 text-[12.5px] font-semibold leading-tight" style={{ color: 'var(--foreground)' }}>{m.title}</div>
                  </Link>
                ))}
              </div>
            )}

            {topicTotal > 0 && (
              <div className="rounded-xl p-3.5 text-center" style={{ background: topicTint(rawTopic?.slug) }}>
                <div className="text-[13px] font-semibold" style={{ color: accent }}>{t('topicProgress', { done: topicDone, total: topicTotal })}</div>
                <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.round((topicDone / topicTotal) * 100)}%`, background: accent }} />
                </div>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  )
}
