import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { TaskCard } from '@/components/features/tasks/task-card'
import { LiveSearch } from '@/components/ui/live-search'
import Link from 'next/link'
import type { Metadata } from 'next'
import { TopicIcon } from '@/lib/topic-icons'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('tasks')
  return { title: t('title') }
}

interface Props {
  searchParams: Promise<{ topic?: string; difficulty?: string; q?: string }>
}

import { DIFF_COLOR as DIFF_ACTIVE } from '@/lib/difficulty-colors'

export default async function TasksPage({ searchParams }: Props) {
  const { topic: topicSlug, difficulty, q: rawQ } = await searchParams
  const q = rawQ?.trim() ?? ''
  const supabase   = await createClient()
  const t          = await getTranslations('tasks')
  const tMaterials = await getTranslations('materials')
  const tTopics    = await getTranslations('topics')

  const { data: { user } } = await supabase.auth.getUser()

  const { data: topics } = await supabase
    .from('topics')
    .select('id, title, icon, slug')
    .order('title')

  let query = supabase
    .from('tasks')
    .select('id, title, description, difficulty, type, xp_reward, topic_id, topics(title, icon, slug)')
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

  if (q) {
    query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`)
  }

  const { data: tasks } = await query

  let completedTaskIds = new Set<string>()
  if (user) {
    const { data: completed } = await supabase
      .from('student_progress')
      .select('task_id')
      .eq('user_id', user.id)
      .eq('is_correct', true)
    completedTaskIds = new Set(completed?.map((r) => r.task_id) ?? [])
  }

  function tTopic(slug: string | undefined, fallback: string): string {
    if (!slug) return fallback
    try { return tTopics(slug as Parameters<typeof tTopics>[0]) }
    catch { return fallback }
  }

  const filterLink = (params: Record<string, string | undefined>) => {
    const p = new URLSearchParams()
    if (params.topic && params.topic !== 'all') p.set('topic', params.topic)
    if (params.difficulty) p.set('difficulty', params.difficulty)
    if (q) p.set('q', q)
    const s = p.toString()
    return `/tasks${s ? `?${s}` : ''}`
  }

  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────── */}
      <h1
        className="text-2xl font-bold tracking-[-0.3px]"
        style={{ color: 'var(--foreground)' }}
      >
        {t('title')}
      </h1>

      {/* ── Search ─────────────────────────────────── */}
      <LiveSearch
        q={q}
        extraParams={{
          ...(topicSlug && topicSlug !== 'all' ? { topic: topicSlug } : {}),
          ...(difficulty ? { difficulty } : {}),
        }}
        placeholder={t('searchPlaceholder')}
      />

      {/* ── Filters ────────────────────────────────── */}
      <div className="space-y-2">

        {/* Topic pills */}
        <div className="flex flex-wrap gap-1.5">
          <PillLink
            href={filterLink({ topic: 'all', difficulty })}
            active={!topicSlug || topicSlug === 'all'}
          >
            {tMaterials('allTopics')}
          </PillLink>
          {topics?.map((topic) => (
            <PillLink
              key={topic.id}
              href={filterLink({ topic: topic.slug, difficulty })}
              active={topicSlug === topic.slug}
            >
              <TopicIcon slug={topic.slug} size={11} className="shrink-0" /> {tTopic(topic.slug, topic.title)}
            </PillLink>
          ))}
        </div>

        {/* Difficulty pills */}
        <div className="flex flex-wrap gap-1.5">
          {(['beginner', 'intermediate', 'advanced'] as const).map((d) => {
            const isActive   = difficulty === d
            const activeColor = DIFF_ACTIVE[d]
            return (
              <Link
                key={d}
                href={filterLink({ topic: topicSlug, difficulty: isActive ? undefined : d })}
                className="px-3 py-1 rounded-full text-xs font-medium transition-colors border"
                style={{
                  background:   isActive
                    ? `color-mix(in srgb, ${activeColor} 15%, var(--card))`
                    : 'var(--card)',
                  color:        isActive ? activeColor : 'var(--muted-foreground)',
                  borderColor:  isActive
                    ? `color-mix(in srgb, ${activeColor} 40%, var(--border))`
                    : 'var(--border)',
                }}
              >
                {t(`difficulty.${d}`)}
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── Task count + progress ─────────────────── */}
      {tasks && tasks.length > 0 && (
        <div className="flex items-center gap-3">
          <p className="text-[12.5px] shrink-0" style={{ color: 'var(--muted-foreground)' }}>
            {tasks.length} {t('tasksUnit')}
            {completedTaskIds.size > 0 && (
              <span style={{ color: 'var(--success)' }}>
                {' '}· {completedTaskIds.size} {t('completedUnit')}
              </span>
            )}
          </p>
          {completedTaskIds.size > 0 && (
            <div
              className="flex-1 max-w-[180px] h-1.5 rounded-full overflow-hidden"
              style={{ background: 'var(--muted)' }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.round((completedTaskIds.size / tasks.length) * 100)}%`,
                  background: 'var(--success)',
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Grid ───────────────────────────────────── */}
      {tasks && tasks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tasks.map((task) => {
            const rawTopic = task.topics as { title: string; icon: string | null; slug?: string } | null
            const translatedTopic = rawTopic
              ? { title: tTopic(rawTopic.slug, rawTopic.title), icon: rawTopic.icon as string | null, slug: rawTopic.slug }
              : null
            return (
              <TaskCard
                key={task.id}
                id={task.id}
                title={task.title}
                description={task.description}
                difficulty={task.difficulty as 'beginner' | 'intermediate' | 'advanced'}
                type={task.type as 'single_choice' | 'multiple_choice' | 'text' | 'code'}
                xpReward={task.xp_reward}
                topic={translatedTopic}
                isCompleted={completedTaskIds.has(task.id)}
              />
            )
          })}
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

/* ── Shared pill link ─────────────────────────────────── */
function PillLink({
  href, active, children,
}: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors border"
      style={{
        background:  active ? 'var(--primary)' : 'var(--card)',
        color:       active ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
        borderColor: active ? 'var(--primary)' : 'var(--border)',
      }}
    >
      {children}
    </Link>
  )
}
