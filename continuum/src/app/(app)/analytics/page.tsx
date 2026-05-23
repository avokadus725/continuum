import { createClient } from '@/lib/supabase/server'
import { getTranslations, getLocale } from 'next-intl/server'
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

type Difficulty = 'beginner' | 'intermediate' | 'advanced'

const DIFF_COLOR: Record<Difficulty, string> = {
  beginner:     'var(--success)',
  intermediate: 'var(--warning)',
  advanced:     'var(--destructive)',
}

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
  const [t, tTasks, locale] = await Promise.all([
    getTranslations('analytics'),
    getTranslations('tasks'),
    getLocale(),
  ])

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const since = startOfDayUTC(days)

  /* ── Fetch ──────────────────────────────────── */
  const [{ data: progress }, focusRes] = await Promise.all([
    supabase
      .from('student_progress')
      .select('task_id, is_correct, score, completed_at, tasks(topic_id, difficulty, topics(title, icon))')
      .eq('user_id', user.id)
      .gte('completed_at', since)
      .order('completed_at', { ascending: true }),
    (supabase as any)
      .from('focus_sessions')
      .select('started_at, focus_seconds')
      .gte('started_at', since)
      .order('started_at', { ascending: true }),
  ])

  const rows = progress ?? []
  const focusSessions = (focusRes.data ?? []) as Array<{ started_at: string; focus_seconds: number }>

  /* ── Stats ──────────────────────────────────── */
  const total      = rows.length
  const correct    = rows.filter(r => r.is_correct).length
  const correctPct = total > 0 ? Math.round((correct / total) * 100) : 0
  const totalXp    = rows.reduce((s, r) => s + (r.score ?? 0), 0)

  const totalFocusSec = focusSessions.reduce((s, r) => s + (r.focus_seconds ?? 0), 0)
  const focusHrs  = Math.floor(totalFocusSec / 3600)
  const focusMins = Math.floor((totalFocusSec % 3600) / 60)
  const focusLabel = totalFocusSec === 0 ? '0m'
    : focusHrs > 0 ? `${focusHrs}h ${focusMins}m` : `${focusMins}m`

  /* ── Streak ─────────────────────────────────── */
  const daySet = new Set(rows.map(r => r.completed_at.slice(0, 10)))
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    if (daySet.has(d.toISOString().slice(0, 10))) streak++
    else break
  }

  /* ── Day map helper ─────────────────────────── */
  function makeDayMap() {
    const m = new Map<string, number>()
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      m.set(d.toISOString().slice(0, 10), 0)
    }
    return m
  }
  function dayLabel(iso: string) {
    return new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short' })
  }

  /* Tasks by day */
  const countByDay = makeDayMap()
  for (const r of rows) {
    const k = r.completed_at.slice(0, 10)
    countByDay.set(k, (countByDay.get(k) ?? 0) + 1)
  }
  const taskChart = Array.from(countByDay.entries()).map(([d, count]) => ({ date: dayLabel(d), count }))

  /* Focus minutes by day */
  const focusByDay = makeDayMap()
  for (const s of focusSessions) {
    const k = new Date(s.started_at).toISOString().slice(0, 10)
    focusByDay.set(k, (focusByDay.get(k) ?? 0) + Math.round(s.focus_seconds / 60))
  }
  const focusChart = Array.from(focusByDay.entries()).map(([d, count]) => ({ date: dayLabel(d), count }))

  /* ── Topic stats ─────────────────────────────── */
  const topicMap = new Map<string, { title: string; icon: string | null; total: number; correct: number }>()
  for (const r of rows) {
    const task = r.tasks as { topic_id: string | null; difficulty: string | null; topics: { title: string; icon: string | null } | null } | null
    if (!task?.topic_id || !task.topics) continue
    const ex = topicMap.get(task.topic_id)
    if (ex) { ex.total++; if (r.is_correct) ex.correct++ }
    else topicMap.set(task.topic_id, { title: task.topics.title, icon: task.topics.icon, total: 1, correct: r.is_correct ? 1 : 0 })
  }
  const topicStats = Array.from(topicMap.values())
    .sort((a, b) => (a.correct / a.total) - (b.correct / b.total))

  /* ── Difficulty breakdown ────────────────────── */
  const diffCount: Record<Difficulty, number> = { beginner: 0, intermediate: 0, advanced: 0 }
  for (const r of rows) {
    const d = ((r.tasks as { difficulty?: string | null } | null)?.difficulty ?? 'beginner') as Difficulty
    if (d in diffCount) diffCount[d]++
  }
  const hasDiff = total > 0

  /* ── Render ─────────────────────────────────── */
  const periodLinks: PeriodKey[] = ['7', '30', '90']

  return (
    <div className="space-y-6">

      {/* ── Header + tabs ───────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-[-0.3px]" style={{ color: 'var(--foreground)' }}>
          {t('title')}
        </h1>
        <div
          className="flex gap-1 rounded-xl border p-1"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          {periodLinks.map(p => (
            <Link
              key={p}
              href={`/analytics?period=${p}`}
              className="rounded-lg px-3 py-1 text-[12.5px] font-medium transition-colors no-underline"
              style={{
                background: period === p ? 'var(--primary)' : 'transparent',
                color: period === p ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
              }}
            >
              {t(`last${p}days` as 'last7days' | 'last30days' | 'last90days')}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Stats row ───────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: t('tasksCompleted'), value: total },
          { label: t('correctRate'),    value: total > 0 ? `${correctPct}%` : '—' },
          { label: t('totalXp'),        value: total > 0 ? `+${totalXp} XP` : '—' },
          { label: t('streak'),         value: streak > 0 ? `${streak}d` : '—' },
          { label: t('focusTime'),      value: focusLabel },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-2xl border p-4 text-center"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <p className="text-[22px] font-bold leading-none" style={{ color: 'var(--primary)' }}>{value}</p>
            <p className="mt-1.5 text-[11.5px]" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* ── Charts row ──────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div
          className="rounded-2xl border p-5"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <ChartHeader label={t('tasksChart')} />
          <div className="mt-3">
            <ActivityChart data={taskChart} color="var(--primary)" tooltipLabel={t('tasksCompleted')} />
          </div>
        </div>
        <div
          className="rounded-2xl border p-5"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <ChartHeader label={t('focusChart')} />
          <div className="mt-3">
            <ActivityChart data={focusChart} color="var(--warning)" tooltipLabel={t('focusMinutes')} />
          </div>
        </div>
      </div>

      {/* ── Topic performance ───────────────────── */}
      <div
        className="rounded-2xl border p-5"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <ChartHeader label={t('topicPerformance')} />

        {topicStats.length > 0 ? (
          <div className="mt-4 space-y-3">
            {topicStats.map(topic => {
              const rate = Math.round((topic.correct / topic.total) * 100)
              const barColor = rate >= 70 ? 'var(--success)' : rate >= 40 ? 'var(--warning)' : 'var(--destructive)'
              return (
                <div key={topic.title}>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-[13px]" style={{ color: 'var(--foreground)' }}>
                      {topic.icon && <span>{topic.icon}</span>}
                      {topic.title}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11.5px] tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
                        {topic.correct}/{topic.total}
                      </span>
                      <span
                        className="rounded-md px-1.5 py-px text-[11px] font-bold tabular-nums"
                        style={{
                          background: `color-mix(in srgb, ${barColor} 12%, transparent)`,
                          color: barColor,
                        }}
                      >
                        {rate}%
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--muted)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${rate}%`, background: barColor }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="mt-4 text-[13px]" style={{ color: 'var(--muted-foreground)' }}>
            {t('noTopics')}
          </p>
        )}
      </div>

      {/* ── Difficulty breakdown ─────────────────── */}
      {hasDiff && (
        <div
          className="rounded-2xl border p-5"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <ChartHeader label={t('difficultyBreakdown')} />
          <div className="mt-4 flex flex-col gap-2.5">
            {(['beginner', 'intermediate', 'advanced'] as Difficulty[]).map(d => {
              const n = diffCount[d]
              const pct = total > 0 ? Math.round((n / total) * 100) : 0
              const color = DIFF_COLOR[d]
              return (
                <div key={d} className="flex items-center gap-3">
                  <span className="w-[88px] shrink-0 text-[12px]" style={{ color: 'var(--muted-foreground)' }}>
                    {tTasks(`difficulty.${d}` as 'difficulty.beginner' | 'difficulty.intermediate' | 'difficulty.advanced')}
                  </span>
                  <div className="flex-1 h-2 overflow-hidden rounded-full" style={{ background: 'var(--muted)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                  <span
                    className="w-7 shrink-0 text-right text-[12px] font-semibold tabular-nums"
                    style={{ color: n > 0 ? color : 'var(--muted-foreground)' }}
                  >
                    {n}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}

/* ─── Section header ─────────────────────────────── */
function ChartHeader({ label }: { label: string }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--muted-foreground)' }}>
      {label}
    </p>
  )
}
