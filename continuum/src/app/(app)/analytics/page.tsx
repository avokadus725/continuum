import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ActivityChart } from '@/components/features/analytics/activity-chart'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('analytics')
  return { title: t('title') }
}

interface Props {
  searchParams: Promise<{ period?: string }>
}

const PERIODS = { '7': 7, '30': 30, '90': 90 } as const
type PeriodKey = keyof typeof PERIODS

function startOfDayUTC(daysAgo: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - daysAgo)
  d.setUTCHours(0, 0, 0, 0)
  return d.toISOString()
}

export default async function AnalyticsPage({ searchParams }: Props) {
  const { period: rawPeriod } = await searchParams
  const period: PeriodKey = (rawPeriod as PeriodKey) in PERIODS ? (rawPeriod as PeriodKey) : '30'
  const days = PERIODS[period]

  const supabase = await createClient()
  const t = await getTranslations('analytics')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const since = startOfDayUTC(days)

  // Fetch all progress in the period
  const { data: progress } = await supabase
    .from('student_progress')
    .select('task_id, is_correct, score, completed_at, tasks(topic_id, topics(title, icon))')
    .eq('user_id', user.id)
    .gte('completed_at', since)
    .order('completed_at', { ascending: true })

  const rows = progress ?? []

  // Summary stats
  const total = rows.length
  const correct = rows.filter((r) => r.is_correct).length
  const correctRate = total > 0 ? Math.round((correct / total) * 100) : 0
  const totalXp = rows.reduce((sum, r) => sum + (r.score ?? 0), 0)

  // Streak: consecutive days with at least 1 attempt (from today backwards)
  const daySet = new Set(rows.map((r) => r.completed_at.slice(0, 10)))
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    if (daySet.has(key)) { streak++ } else { break }
  }

  // Activity chart data: group by day
  const countByDay = new Map<string, number>()
  // Fill all days with 0
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    countByDay.set(d.toISOString().slice(0, 10), 0)
  }
  for (const r of rows) {
    const key = r.completed_at.slice(0, 10)
    countByDay.set(key, (countByDay.get(key) ?? 0) + 1)
  }

  const chartData = Array.from(countByDay.entries()).map(([date, count]) => {
    const d = new Date(date)
    const label = d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })
    return { date: label, count }
  })

  // Weak topics: topics with correct rate < 60% (min 3 attempts)
  const topicStats = new Map<string, { title: string; icon: string | null; total: number; correct: number }>()
  for (const r of rows) {
    const task = r.tasks as { topic_id: string | null; topics: { title: string; icon: string | null } | null } | null
    if (!task?.topic_id || !task.topics) continue
    const tid = task.topic_id
    const existing = topicStats.get(tid)
    if (existing) {
      existing.total++
      if (r.is_correct) existing.correct++
    } else {
      topicStats.set(tid, {
        title: task.topics.title,
        icon: task.topics.icon,
        total: 1,
        correct: r.is_correct ? 1 : 0,
      })
    }
  }

  const weakTopics = Array.from(topicStats.values())
    .filter((s) => s.total >= 3 && s.correct / s.total < 0.6)
    .sort((a, b) => (a.correct / a.total) - (b.correct / b.total))

  const stats = [
    { label: t('tasksCompleted'), value: total },
    { label: t('correctRate'),    value: `${correctRate}%` },
    { label: t('totalXp'),        value: `${totalXp} XP` },
    { label: t('streak'),         value: streak },
  ]

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Header + period filter */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
          {t('title')}
        </h1>
        <div className="flex gap-2">
          {(['7', '30', '90'] as PeriodKey[]).map((p) => (
            <Link
              key={p}
              href={`/analytics?period=${p}`}
              className="px-3 py-1.5 rounded-full text-sm font-medium border transition-colors"
              style={{
                background: period === p ? 'var(--primary)' : 'var(--card)',
                color: period === p ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                borderColor: period === p ? 'var(--primary)' : 'var(--border)',
              }}
            >
              {t(`last${p}days` as 'last7days' | 'last30days' | 'last90days')}
            </Link>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map(({ label, value }) => (
          <div
            key={label}
            className="rounded-2xl border p-4 text-center"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <p className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>{value}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Activity chart */}
      <div
        className="rounded-2xl border p-6"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
          {t('tasksCompleted')}
        </h2>
        {total > 0 ? (
          <ActivityChart data={chartData} />
        ) : (
          <p className="text-sm text-center py-8" style={{ color: 'var(--muted-foreground)' }}>
            {t('noData')}
          </p>
        )}
      </div>

      {/* Weak topics */}
      {weakTopics.length > 0 && (
        <div
          className="rounded-2xl border p-6 space-y-4"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            {t('weakTopics')}
          </h2>
          <div className="space-y-3">
            {weakTopics.map((topic) => {
              const rate = Math.round((topic.correct / topic.total) * 100)
              return (
                <div key={topic.title} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: 'var(--foreground)' }}>
                      {topic.icon} {topic.title}
                    </span>
                    <span style={{ color: 'var(--muted-foreground)' }}>
                      {rate}% ({topic.correct}/{topic.total})
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--muted)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${rate}%`,
                        background: rate < 40 ? 'var(--destructive)' : 'var(--warning)',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
