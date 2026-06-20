/* Recommendations page ("For you") – personalised tasks and materials by weak topics. */

import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  buildTopicStats,
  buildCompletedSet,
  scoreTask,
  topicUrgency,
  type ProgressRow,
} from '@/lib/recommendations'
import { AlgoInfoButton, type AlgoStrings } from './_components/algo-modal'
import { TopicIcon } from '@/lib/topic-icons'

/* ─── Types ────────────────────────────────────────── */
import { DIFF_COLOR, type Difficulty } from '@/lib/difficulty-colors'

type CompactTask = {
  id: string; title: string
  difficulty: Difficulty; type: string; xp_reward: number
}
type CompactMaterial = {
  id: string; title: string; type: string
  content: string | null; url: string | null
}
type WeakSection = {
  topicId: string; title: string; icon: string | null; slug: string | null
  correct: number; total: number; urgency: number
  tasks: CompactTask[]
  materials: CompactMaterial[]
}
type ExploreSection = {
  topicId: string; title: string; icon: string | null; slug: string | null
  tasks: CompactTask[]
}

/* ─── Page ─────────────────────────────────────────── */
export default async function RecommendationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [t, tTasks, tMaterials, tTopics] = await Promise.all([
    getTranslations('dashboard'),
    getTranslations('tasks'),
    getTranslations('materials'),
    getTranslations('topics'),
  ])

  /* profile */
  const { data: profile } = await supabase
    .from('profiles').select('level, xp').eq('id', user.id).single()
  const userLevel = profile?.level ?? 1

  /* fetch all data in parallel */
  const [{ data: progressRaw }, { data: allTasks }, { data: allMats }, { data: allTopics }] =
    await Promise.all([
      supabase
        .from('student_progress')
        .select('task_id, is_correct, completed_at, tasks(topic_id)')
        .eq('user_id', user.id),
      supabase
        .from('tasks')
        .select('id, title, difficulty, type, xp_reward, topic_id')
        .eq('is_published', true),
      supabase
        .from('materials')
        .select('id, title, content, url, type, topic_id')
        .eq('is_published', true),
      supabase
        .from('topics')
        .select('id, title, icon, slug'),
    ])

  /* progress analysis */
  const progressRows = (progressRaw ?? []) as ProgressRow[]
  const completedIds = buildCompletedSet(progressRows)
  const topicStats   = buildTopicStats(progressRows)

  /* topic lookup */
  const topicById = new Map(
    (allTopics ?? []).map(tp => [tp.id as string, { title: tp.title as string, icon: tp.icon as string | null, slug: tp.slug as string | null }])
  )

  /** Translate a topic slug → display title, falling back to DB title */
  function tTopic(slug: string | null | undefined, fallback: string): string {
    if (!slug) return fallback
    try { return tTopics(slug as Parameters<typeof tTopics>[0]) }
    catch { return fallback }
  }

  /* tasks grouped by topic (uncompleted only) */
  const tasksByTopic = new Map<string, CompactTask[]>()
  for (const tk of allTasks ?? []) {
    if (!tk.topic_id || completedIds.has(tk.id)) continue
    const list = tasksByTopic.get(tk.topic_id) ?? []
    list.push({
      id: tk.id, title: tk.title,
      difficulty: ((tk.difficulty ?? 'beginner') as Difficulty),
      type: tk.type ?? 'single_choice',
      xp_reward: tk.xp_reward,
    })
    tasksByTopic.set(tk.topic_id, list)
  }

  /* materials grouped by topic */
  const matsByTopic = new Map<string, CompactMaterial[]>()
  for (const m of allMats ?? []) {
    if (!m.topic_id) continue
    const list = matsByTopic.get(m.topic_id) ?? []
    list.push({ id: m.id, title: m.title, content: m.content, url: m.url, type: m.type })
    matsByTopic.set(m.topic_id, list)
  }

  /* ── Weak topic sections ──────────────────────────── */
  const weakSections: WeakSection[] = [...topicStats.entries()]
    .filter(([, s]) => s.wrongCount > 0)
    .map(([topicId, stat]) => {
      const info  = topicById.get(topicId)
      const tasks = (tasksByTopic.get(topicId) ?? [])
        .sort((a, b) => scoreTask({ ...b, topic_id: topicId }, topicStats, userLevel) - scoreTask({ ...a, topic_id: topicId }, topicStats, userLevel))
        .slice(0, 3)
      const materials = (matsByTopic.get(topicId) ?? []).slice(0, 2)
      return {
        topicId,
        title:   tTopic(info?.slug, info?.title ?? topicId),
        icon:    info?.icon  ?? null,
        slug:    info?.slug  ?? null,
        correct: stat.totalCount - stat.wrongCount,
        total:   stat.totalCount,
        urgency: topicUrgency(stat),
        tasks, materials,
      }
    })
    .sort((a, b) => b.urgency - a.urgency)

  /* ── Explore: topics with 0 attempts ─────────────── */
  const exploreSections: ExploreSection[] = [...tasksByTopic.entries()]
    .filter(([tid]) => !topicStats.has(tid))
    .map(([topicId, tasks]) => {
      const info = topicById.get(topicId)
      return {
        topicId,
        title: tTopic(info?.slug, info?.title ?? topicId),
        icon:  info?.icon  ?? null,
        slug:  info?.slug  ?? null,
        tasks: tasks.slice(0, 2),
      }
    })
    .filter(s => s.tasks.length > 0)
    .slice(0, 4)

  /* ── Algo modal strings ───────────────────────────── */
  const algoStrings: AlgoStrings = {
    ariaLabel: t('algoInfoLabel'),
    title:     t('algoTitle'),
    desc:      t('algoDesc'),
    footnote:  t('algoFootnote', { badge: `«${t('recsWeakBadge')}»` }),
    signals: [
      { label: t('algoSignalWeakLabel'),    maxPts: 60, ptsLabel: t('algoMaxPts', { pts: 60 }), tone: 'var(--warning)',     desc: t('algoSignalWeakDesc') },
      { label: t('algoSignalRecencyLabel'), maxPts: 20, ptsLabel: t('algoMaxPts', { pts: 20 }), tone: 'var(--primary)',     desc: t('algoSignalRecencyDesc') },
      { label: t('algoSignalDiffLabel'),    maxPts: 25, ptsLabel: t('algoMaxPts', { pts: 25 }), tone: 'var(--success)',     desc: t('algoSignalDiffDesc') },
      { label: t('algoSignalNoveltyLabel'), maxPts: 10, ptsLabel: t('algoMaxPts', { pts: 10 }), tone: 'color-mix(in srgb, var(--muted-foreground) 60%, transparent)', desc: t('algoSignalNoveltyDesc') },
    ],
  }

  const diffLabel    = (d: string) => tTasks(`difficulty.${d as Difficulty}`)
  const typeLabel    = (tp: string) => tTasks(`types.${tp as 'single_choice' | 'multiple_choice' | 'text' | 'code'}`)
  const matTypeLabel = (mt: string) => tMaterials(`types.${mt as 'article' | 'video' | 'link' | 'interactive'}`)
  const tierLabel    = userLevel <= 2 ? diffLabel('beginner') : userLevel <= 6 ? diffLabel('intermediate') : diffLabel('advanced')

  /* ─── Render ─────────────────────────────────────── */
  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.3px]" style={{ color: 'var(--foreground)' }}>
            {t('recommended')}
          </h1>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--muted-foreground)' }}>
            {weakSections.length > 0
              ? t('recsPersonalizedCount', { count: weakSections.length })
              : t('recsGeneric', { tier: tierLabel })}
          </p>
        </div>
        <div className="mt-1 shrink-0">
          <AlgoInfoButton strings={algoStrings} />
        </div>
      </div>

      {/* ── Weak topic sections ───────────────────────── */}
      {weakSections.length > 0 ? (
        <section className="space-y-4">
          <SectionLabel label={t('recsWeakTopicsHeader')} count={weakSections.length} accent />

          {weakSections.map(sec => {
            const correctRate = Math.round((sec.correct / sec.total) * 100)
            const borderColor = correctRate < 40 ? 'var(--destructive)' : 'var(--warning)'
            const barColor    = correctRate < 40 ? 'var(--destructive)' : correctRate < 70 ? 'var(--warning)' : 'var(--success)'

            return (
              <div
                key={sec.topicId}
                className="overflow-hidden rounded-2xl border"
                style={{
                  background: 'var(--card)',
                  borderColor: `color-mix(in srgb, ${borderColor} 30%, var(--border))`,
                  borderLeftColor: borderColor,
                  borderLeftWidth: 3,
                }}
              >
                {/* ── Topic header ── */}
                <div className="px-5 pt-5 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <TopicIcon slug={sec.slug} size={16} className="shrink-0" />
                      <h2
                        className="truncate text-[15px] font-bold tracking-[-0.2px]"
                        style={{ color: 'var(--foreground)' }}
                      >
                        {sec.title}
                      </h2>
                    </div>
                    <div className="shrink-0 text-right">
                      <span
                        className="rounded-lg px-2 py-0.5 text-[12px] font-bold"
                        style={{
                          background: `color-mix(in srgb, ${barColor} 12%, transparent)`,
                          color: barColor,
                        }}
                      >
                        {correctRate}%
                      </span>
                      <p className="mt-0.5 text-[11px] tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
                        {sec.correct}/{sec.total}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div
                    className="mt-3 h-[5px] overflow-hidden rounded-full"
                    style={{ background: 'var(--muted)' }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${correctRate}%`, background: barColor }}
                    />
                  </div>

                  {/* Insight */}
                  <p
                    className="mt-2.5 text-[12.5px] leading-relaxed"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    {t('recsWeakInsight', { wrong: sec.total - sec.correct, total: sec.total })}
                  </p>
                </div>

                {/* ── Practice tasks ── */}
                <div
                  className="border-t px-5 py-4"
                  style={{ borderColor: 'color-mix(in srgb, var(--border) 50%, transparent)' }}
                >
                  <p
                    className="mb-3 text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    {t('recsPractice')}
                  </p>
                  {sec.tasks.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {sec.tasks.map(task => {
                        const dc = DIFF_COLOR[task.difficulty]
                        return (
                          <Link
                            key={task.id}
                            href={`/tasks/${task.id}`}
                            className="flex flex-col justify-between rounded-xl border p-3 no-underline transition-all hover:-translate-y-0.5 hover:shadow-sm"
                            style={{ background: 'var(--background)', borderColor: 'var(--border)' }}
                          >
                            <p
                              className="text-[13px] font-semibold leading-snug line-clamp-2"
                              style={{ color: 'var(--foreground)' }}
                            >
                              {task.title}
                            </p>
                            <div className="mt-2.5 flex items-center gap-2">
                              <span
                                className="rounded px-1.5 py-px text-[10px] font-semibold"
                                style={{
                                  background: `color-mix(in srgb, ${dc} 12%, transparent)`,
                                  color: dc,
                                }}
                              >
                                {diffLabel(task.difficulty)}
                              </span>
                              <span
                                className="flex-1 text-[10.5px]"
                                style={{ color: 'var(--muted-foreground)' }}
                              >
                                {typeLabel(task.type)}
                              </span>
                              <span
                                className="text-[11px] font-bold tabular-nums"
                                style={{ color: 'var(--primary)' }}
                              >
                                +{task.xp_reward} XP
                              </span>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-[12.5px]" style={{ color: 'var(--muted-foreground)' }}>
                      {t('recsNoTasksHere')}
                    </p>
                  )}
                </div>

                {/* ── Study materials ── */}
                {sec.materials.length > 0 && (
                  <div
                    className="border-t px-5 py-4"
                    style={{ borderColor: 'color-mix(in srgb, var(--border) 50%, transparent)' }}
                  >
                    <p
                      className="mb-3 text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      {t('recsStudy')}
                    </p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {sec.materials.map(mat => {
                        const excerpt = mat.content
                          ? mat.content.slice(0, 80) + (mat.content.length > 80 ? '…' : '')
                          : mat.url?.replace(/^https?:\/\//, '').split('/')[0]
                        return (
                          <Link
                            key={mat.id}
                            href={`/materials/${mat.id}`}
                            className="flex flex-col rounded-xl border p-3 no-underline transition-all hover:-translate-y-0.5 hover:shadow-sm"
                            style={{ background: 'var(--background)', borderColor: 'var(--border)' }}
                          >
                            <span
                              className="mb-1.5 w-fit rounded px-1.5 py-px text-[10px] font-semibold"
                              style={{
                                background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
                                color: 'var(--primary)',
                              }}
                            >
                              {matTypeLabel(mat.type)}
                            </span>
                            <p
                              className="text-[13px] font-semibold leading-snug line-clamp-2"
                              style={{ color: 'var(--foreground)' }}
                            >
                              {mat.title}
                            </p>
                            {excerpt && (
                              <p
                                className="mt-1.5 text-[11.5px] leading-relaxed line-clamp-2"
                                style={{ color: 'var(--muted-foreground)' }}
                              >
                                {excerpt}
                              </p>
                            )}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </section>
      ) : (
        /* No weak topics */
        <div
          className="flex flex-col items-center rounded-2xl border py-10 text-center"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <p className="text-3xl">✅</p>
          <p className="mt-2 text-[15px] font-bold" style={{ color: 'var(--foreground)' }}>
            {t('recsOnTrack')}
          </p>
          <p className="mt-1 text-[12.5px]" style={{ color: 'var(--muted-foreground)' }}>
            {t('recsOnTrackSub')}
          </p>
        </div>
      )}

      {/* ── Explore new topics ────────────────────────── */}
      {exploreSections.length > 0 && (
        <section className="space-y-4">
          <SectionLabel
            label={t('recsExploreHeader')}
            subtitle={t('recsExploreSubtitle')}
          />
          <div className="space-y-3">
            {exploreSections.map(sec => (
              <div
                key={sec.topicId}
                className="rounded-2xl border p-4"
                style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
              >
                <div className="mb-3 flex items-center gap-2">
                  <TopicIcon slug={sec.slug} size={14} className="shrink-0" />
                  <span className="text-[13px] font-semibold" style={{ color: 'var(--foreground)' }}>
                    {sec.title}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {sec.tasks.map(task => {
                    const dc = DIFF_COLOR[task.difficulty]
                    return (
                      <Link
                        key={task.id}
                        href={`/tasks/${task.id}`}
                        className="flex items-center gap-3 rounded-xl border p-3 no-underline transition-all hover:-translate-y-0.5 hover:shadow-sm"
                        style={{ background: 'var(--background)', borderColor: 'var(--border)' }}
                      >
                        <p
                          className="flex-1 text-[13px] font-medium leading-snug line-clamp-2"
                          style={{ color: 'var(--foreground)' }}
                        >
                          {task.title}
                        </p>
                        <div className="shrink-0 text-right">
                          <span
                            className="block rounded px-1.5 py-px text-[10px] font-semibold"
                            style={{
                              background: `color-mix(in srgb, ${dc} 12%, transparent)`,
                              color: dc,
                            }}
                          >
                            {diffLabel(task.difficulty)}
                          </span>
                          <span className="mt-1 block text-[11px] font-bold tabular-nums" style={{ color: 'var(--primary)' }}>
                            +{task.xp_reward} XP
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  )
}

/* ─── Section label with optional count ─────────────── */
function SectionLabel({
  label, count, subtitle, accent,
}: {
  label: string; count?: number; subtitle?: string; accent?: boolean
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="text-[11px] font-semibold uppercase tracking-[0.07em]"
        style={{ color: accent ? 'var(--warning)' : 'var(--muted-foreground)' }}
      >
        {label}
      </span>
      {count !== undefined && (
        <span
          className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10.5px] font-bold tabular-nums"
          style={{
            background: accent
              ? 'color-mix(in srgb, var(--warning) 12%, transparent)'
              : 'var(--muted)',
            color: accent ? 'var(--warning)' : 'var(--muted-foreground)',
          }}
        >
          {count}
        </span>
      )}
      {subtitle && (
        <span className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
          · {subtitle}
        </span>
      )}
      <div
        className="flex-1 border-t"
        style={{ borderColor: 'color-mix(in srgb, var(--border) 60%, transparent)' }}
      />
    </div>
  )
}
