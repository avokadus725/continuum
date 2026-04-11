import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { TaskCard } from '@/components/features/tasks/task-card'
import { MaterialCard } from '@/components/features/materials/material-card'

export default async function RecommendationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const t = await getTranslations('dashboard')
  const tCommon = await getTranslations('common')

  // 1. Find which tasks the user has NOT completed correctly yet
  const { data: completed } = await supabase
    .from('student_progress')
    .select('task_id')
    .eq('user_id', user.id)
    .eq('is_correct', true)

  const completedIds = new Set(completed?.map((r) => r.task_id) ?? [])

  // 2. Find weak topics: topics where user has incorrect attempts
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

  // 3. Recommend tasks: incomplete, prioritize weak topics
  let taskQuery = supabase
    .from('tasks')
    .select('id, title, description, difficulty, type, xp_reward, topic_id, topics(title, icon)')
    .eq('is_published', true)
    .limit(6)

  const { data: allTasks } = await taskQuery

  const uncompletedTasks = (allTasks ?? []).filter((t) => !completedIds.has(t.id))

  // Prioritize tasks from weak topics
  const prioritized = [
    ...uncompletedTasks.filter((t) => weakTopicIds.has(t.topic_id ?? '')),
    ...uncompletedTasks.filter((t) => !weakTopicIds.has(t.topic_id ?? '')),
  ].slice(0, 6)

  // 4. Recommend materials from weak topics
  type MatRow = { id: string; title: string; content: string | null; url: string | null; type: string; topic_id: string | null; topics: unknown }
  let materials: MatRow[] = []
  if (weakTopicIds.size > 0) {
    const { data: mats } = await supabase
      .from('materials')
      .select('id, title, content, url, type, topic_id, topics(title, icon)')
      .eq('is_published', true)
      .in('topic_id', Array.from(weakTopicIds))
      .limit(3)
    materials = mats ?? []
  }

  // If no weak topics, recommend any materials
  if (materials.length === 0) {
    const { data: mats } = await supabase
      .from('materials')
      .select('id, title, content, url, type, topic_id, topics(title, icon)')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(3)
    materials = mats ?? []
  }

  return (
    <div className="space-y-8 max-w-3xl">

      <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
        {t('recommended')}
      </h1>

      {/* Recommended tasks */}
      {prioritized.length > 0 ? (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted-foreground)' }}>
            {t('recentTasks')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {prioritized.map((task) => (
              <TaskCard
                key={task.id}
                id={task.id}
                title={task.title}
                description={task.description}
                difficulty={task.difficulty as 'beginner' | 'intermediate' | 'advanced'}
                type={task.type as 'single_choice' | 'multiple_choice' | 'text' | 'code'}
                xpReward={task.xp_reward}
                topic={task.topics as { title: string; icon: string | null } | null}
                isCompleted={false}
              />
            ))}
          </div>
        </section>
      ) : (
        <div
          className="rounded-2xl border p-10 text-center"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <p style={{ color: 'var(--muted-foreground)' }}>{t('allTasksDone')}</p>
        </div>
      )}

      {/* Recommended materials */}
      {materials.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted-foreground)' }}>
            {t('recommendedMaterials')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {materials.map((m) => (
              <MaterialCard
                key={m.id}
                id={m.id}
                title={m.title}
                content={m.content}
                url={m.url}
                type={m.type as 'article' | 'video' | 'link' | 'interactive'}
                topic={m.topics as { title: string; icon: string | null } | null}
              />
            ))}
          </div>
        </section>
      )}

    </div>
  )
}
