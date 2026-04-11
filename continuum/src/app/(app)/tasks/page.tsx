import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { TaskCard } from '@/components/features/tasks/task-card'
import Link from 'next/link'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('tasks')
  return { title: t('title') }
}

interface Props {
  searchParams: Promise<{ topic?: string; difficulty?: string }>
}

export default async function TasksPage({ searchParams }: Props) {
  const { topic: topicSlug, difficulty } = await searchParams
  const supabase = await createClient()
  const t = await getTranslations('tasks')
  const tMaterials = await getTranslations('materials')

  const { data: { user } } = await supabase.auth.getUser()

  // Fetch topics for filter
  const { data: topics } = await supabase
    .from('topics')
    .select('id, title, icon, slug')
    .order('title')

  // Build tasks query
  let query = supabase
    .from('tasks')
    .select('id, title, description, difficulty, type, xp_reward, topic_id, topics(title, icon)')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (topicSlug && topicSlug !== 'all') {
    const topic = topics?.find((t) => t.slug === topicSlug)
    if (topic) query = query.eq('topic_id', topic.id)
  }

  const difficulties = ['beginner', 'intermediate', 'advanced'] as const
  type Diff = typeof difficulties[number]
  if (difficulty && (difficulties as readonly string[]).includes(difficulty)) {
    query = query.eq('difficulty', difficulty as Diff)
  }

  const { data: tasks } = await query

  // Fetch completed task IDs for this user
  let completedTaskIds = new Set<string>()
  if (user) {
    const { data: completed } = await supabase
      .from('student_progress')
      .select('task_id')
      .eq('user_id', user.id)
      .eq('is_correct', true)
    completedTaskIds = new Set(completed?.map((r) => r.task_id) ?? [])
  }

  const filterLink = (params: Record<string, string | undefined>) => {
    const p = new URLSearchParams()
    if (params.topic && params.topic !== 'all') p.set('topic', params.topic)
    if (params.difficulty) p.set('difficulty', params.difficulty)
    const s = p.toString()
    return `/tasks${s ? `?${s}` : ''}`
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
          {t('title')}
        </h1>
      </div>

      {/* Topic filter */}
      <div className="flex flex-wrap gap-2">
        <Link
          href={filterLink({ topic: 'all', difficulty })}
          className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors border"
          style={{
            background: !topicSlug || topicSlug === 'all' ? 'var(--primary)' : 'var(--card)',
            color: !topicSlug || topicSlug === 'all' ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
            borderColor: !topicSlug || topicSlug === 'all' ? 'var(--primary)' : 'var(--border)',
          }}
        >
          {tMaterials('allTopics')}
        </Link>
        {topics?.map((topic) => {
          const isActive = topicSlug === topic.slug
          return (
            <Link
              key={topic.id}
              href={filterLink({ topic: topic.slug, difficulty })}
              className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors border"
              style={{
                background: isActive ? 'var(--primary)' : 'var(--card)',
                color: isActive ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                borderColor: isActive ? 'var(--primary)' : 'var(--border)',
              }}
            >
              {topic.icon} {topic.title}
            </Link>
          )
        })}
      </div>

      {/* Difficulty filter */}
      <div className="flex flex-wrap gap-2">
        {(['beginner', 'intermediate', 'advanced'] as const).map((d) => {
          const isActive = difficulty === d
          return (
            <Link
              key={d}
              href={filterLink({ topic: topicSlug, difficulty: isActive ? undefined : d })}
              className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors border"
              style={{
                background: isActive ? 'var(--foreground)' : 'var(--card)',
                color: isActive ? 'var(--background)' : 'var(--muted-foreground)',
                borderColor: isActive ? 'var(--foreground)' : 'var(--border)',
              }}
            >
              {t(`difficulty.${d}`)}
            </Link>
          )
        })}
      </div>

      {/* Tasks grid */}
      {tasks && tasks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              id={task.id}
              title={task.title}
              description={task.description}
              difficulty={task.difficulty as 'beginner' | 'intermediate' | 'advanced'}
              type={task.type as 'single_choice' | 'multiple_choice' | 'text' | 'code'}
              xpReward={task.xp_reward}
              topic={task.topics as { title: string; icon: string | null } | null}
              isCompleted={completedTaskIds.has(task.id)}
            />
          ))}
        </div>
      ) : (
        <div
          className="rounded-2xl border p-12 text-center"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <p style={{ color: 'var(--muted-foreground)' }}>{t('noTasks')}</p>
        </div>
      )}

    </div>
  )
}
