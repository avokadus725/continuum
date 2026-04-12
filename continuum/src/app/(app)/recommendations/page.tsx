import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

type Difficulty = 'beginner' | 'intermediate' | 'advanced'
type TaskType  = 'single_choice' | 'multiple_choice' | 'text' | 'code'

const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  beginner:     'var(--success)',
  intermediate: 'var(--warning)',
  advanced:     'var(--destructive)',
}

const TYPE_ICON: Record<TaskType, string> = {
  single_choice:   '🔘',
  multiple_choice: '☑️',
  text:            '✍️',
  code:            '💻',
}

const MAT_ICON: Record<string, string> = {
  article:     '📄',
  video:       '🎬',
  link:        '🔗',
  interactive: '🖥',
}

export default async function RecommendationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const t = await getTranslations('dashboard')

  // ── Completed tasks ─────────────────────────────────────────
  const { data: completed } = await supabase
    .from('student_progress')
    .select('task_id')
    .eq('user_id', user.id)
    .eq('is_correct', true)

  const completedIds = new Set(completed?.map(r => r.task_id) ?? [])

  // ── Weak topics (where user got answers wrong) ───────────────
  const { data: wrongAttempts } = await supabase
    .from('student_progress')
    .select('task_id, tasks(topic_id)')
    .eq('user_id', user.id)
    .eq('is_correct', false)

  const weakTopicIds = new Set<string>()
  for (const r of wrongAttempts ?? []) {
    const topic = (r.tasks as { topic_id: string | null } | null)?.topic_id
    if (topic) weakTopicIds.add(topic)
  }

  // ── Recommended tasks ─────────────────────────────────────────
  const { data: allTasks } = await supabase
    .from('tasks')
    .select('id, title, description, difficulty, type, xp_reward, topic_id, topics(title, icon)')
    .eq('is_published', true)
    .limit(12)

  const uncompleted = (allTasks ?? []).filter(t => !completedIds.has(t.id))
  const prioritized = [
    ...uncompleted.filter(t => weakTopicIds.has(t.topic_id ?? '')),
    ...uncompleted.filter(t => !weakTopicIds.has(t.topic_id ?? '')),
  ].slice(0, 9)

  // ── Recommended materials ─────────────────────────────────────
  type MatRow = {
    id: string; title: string; content: string | null; url: string | null
    type: string; topic_id: string | null; topics: unknown
  }

  let materials: MatRow[] = []
  if (weakTopicIds.size > 0) {
    const { data } = await supabase
      .from('materials')
      .select('id, title, content, url, type, topic_id, topics(title, icon)')
      .eq('is_published', true)
      .in('topic_id', Array.from(weakTopicIds))
      .limit(6)
    materials = data ?? []
  }
  if (materials.length === 0) {
    const { data } = await supabase
      .from('materials')
      .select('id, title, content, url, type, topic_id, topics(title, icon)')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(6)
    materials = data ?? []
  }

  const hasWeakTopics = weakTopicIds.size > 0

  return (
    <div className="max-w-4xl space-y-8">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--foreground)' }}>
          {t('recommended')}
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {hasWeakTopics
            ? 'Підібрано на основі тем, де ти допускав помилки'
            : 'Актуальні завдання та матеріали для вивчення'}
        </p>
      </div>

      {/* Recommended tasks */}
      {prioritized.length > 0 ? (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: 'var(--muted-foreground)' }}>
            {t('recentTasks')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {prioritized.map(task => {
              const difficulty = task.difficulty as Difficulty
              const type = task.type as TaskType
              const topic = task.topics as { title: string; icon: string | null } | null
              const isWeak = weakTopicIds.has(task.topic_id ?? '')
              return (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className="group block rounded-2xl border p-4 transition-all hover:shadow-md hover:-translate-y-0.5"
                  style={{ background: 'var(--card)', borderColor: isWeak ? 'var(--warning)' : 'var(--border)' }}
                >
                  {/* Top */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background: `color-mix(in srgb, ${DIFFICULTY_COLOR[difficulty]} 15%, transparent)`,
                        color: DIFFICULTY_COLOR[difficulty],
                      }}
                    >
                      {difficulty === 'beginner' ? 'Початковий' : difficulty === 'intermediate' ? 'Середній' : 'Просунутий'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {isWeak && (
                        <span className="text-xs" title="Слабка тема">🎯</span>
                      )}
                      <span className="text-xs font-bold" style={{ color: 'var(--primary)' }}>
                        +{task.xp_reward} XP
                      </span>
                    </div>
                  </div>
                  {/* Title */}
                  <p className="font-semibold text-sm leading-snug mb-2 line-clamp-2"
                    style={{ color: 'var(--foreground)' }}>
                    {task.title}
                  </p>
                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      {TYPE_ICON[type]} {type === 'single_choice' ? 'Одна відповідь'
                        : type === 'multiple_choice' ? 'Декілька відповідей'
                        : type === 'text' ? 'Текст' : 'Код'}
                    </span>
                    {topic && (
                      <span className="text-xs truncate max-w-[8rem]" style={{ color: 'var(--muted-foreground)' }}>
                        {topic.icon} {topic.title}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      ) : (
        <div
          className="rounded-2xl border p-10 text-center"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <p className="text-3xl mb-2">🏆</p>
          <p className="font-medium" style={{ color: 'var(--foreground)' }}>
            {t('allTasksDone')}
          </p>
        </div>
      )}

      {/* Recommended materials */}
      {materials.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: 'var(--muted-foreground)' }}>
            {t('recommendedMaterials')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {materials.map(m => {
              const topic = m.topics as { title: string; icon: string | null } | null
              const excerpt = m.content ? m.content.slice(0, 100) + (m.content.length > 100 ? '…' : '') : null
              return (
                <Link
                  key={m.id}
                  href={`/materials/${m.id}`}
                  className="group block rounded-2xl border p-4 transition-all hover:shadow-md hover:-translate-y-0.5"
                  style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">{MAT_ICON[m.type] ?? '📄'}</span>
                    {topic && (
                      <span className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
                        {topic.icon} {topic.title}
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-sm leading-snug mb-2 line-clamp-2"
                    style={{ color: 'var(--foreground)' }}>
                    {m.title}
                  </p>
                  {excerpt ? (
                    <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--muted-foreground)' }}>
                      {excerpt}
                    </p>
                  ) : m.url ? (
                    <p className="text-xs" style={{ color: 'var(--primary)' }}>
                      {m.url.replace(/^https?:\/\//, '').split('/')[0]} ↗
                    </p>
                  ) : null}
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Future algorithm placeholder */}
      <div
        className="rounded-2xl border border-dashed p-6 text-center"
        style={{ borderColor: 'var(--border)' }}
      >
        <p className="text-2xl mb-2">🤖</p>
        <p className="text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
          Персоналізований алгоритм рекомендацій
        </p>
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          Буде враховувати успішність, темп навчання, слабкі теми та адаптивну складність
        </p>
      </div>

    </div>
  )
}
