import { createClient } from '@/lib/supabase/server'
import { getTranslations, getLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { buildTopicStats, scoreMaterial, type ProgressRow } from '@/lib/recommendations'

import { Hero } from './_components/hero'
import { FocusBand } from './_components/focus-band'
import { TodayPanel, type TodayItem } from './_components/today-panel'
import { NeedsYouPanel, type NeedsItem } from './_components/needs-you-panel'
import { FreshPanel, type FreshItem } from './_components/fresh-panel'
import { LeaderboardCard } from './_components/right-rail/leaderboard'
import { WeeklyChartCard } from './_components/right-rail/weekly-chart'
import { RecommendationsCard, type RecItem } from './_components/right-rail/recommendations'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [t, tMaterials, locale] = await Promise.all([
    getTranslations('dashboard'),
    getTranslations('materials'),
    getLocale(),
  ])

  /* ── Profile ─────────────────────────────────────── */
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, xp, level')
    .eq('id', user.id)
    .single()

  const fullName = profile?.full_name ?? user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? ''
  const firstName = fullName.split(' ')[0] || t('nameFallback')

  /* ── Today items ─────────────────────────────────── */
  const { data: personalTodosRaw } = await (supabase as any)
    .from('personal_tasks')
    .select('id, title, done')
    .order('created_at', { ascending: false })
    .limit(30)

  const personalTodos = (personalTodosRaw ?? []) as Array<{ id: string; title: string; done: boolean }>

  const todayItems: TodayItem[] = personalTodos.map(todo => ({
    id: todo.id,
    kind: 'todo' as const,
    title: todo.title,
    meta: '',
    done: todo.done,
  }))

  /* ── Needs-you items ──────────────────────────────── */
  const { data: myPostsRaw } = await (supabase as any)
    .from('posts')
    .select('id, content')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const myPosts = (myPostsRaw ?? []) as Array<{ id: string; content: string }>
  const myPostIds = myPosts.map(p => p.id)
  const postById = new Map(myPosts.map(p => [p.id, p.content]))

  let needsItems: NeedsItem[] = []
  if (myPostIds.length > 0) {
    const { data: incomingComments } = await (supabase as any)
      .from('comments')
      .select(`
        id, content, created_at, post_id, user_id,
        profiles(full_name, avatar_url)
      `)
      .in('post_id', myPostIds)
      .neq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    needsItems = (incomingComments ?? []).map((c: {
      id: string
      content: string
      created_at: string
      post_id: string
      profiles: { full_name?: string | null; avatar_url?: string | null } | null
    }): NeedsItem => {
      const subject = (postById.get(c.post_id) ?? '').split('\n')[0].slice(0, 80) || t('needsYourPost')
      return {
        id: c.id,
        who: {
          name: c.profiles?.full_name ?? t('needsSomeone'),
          avatarUrl: c.profiles?.avatar_url,
          role: null,
        },
        when: relativeTime(c.created_at, locale),
        action: t('needsCommented'),
        subject,
        preview: c.content.length > 140 ? c.content.slice(0, 140) + '…' : c.content,
        href: `/community#${c.post_id}`,
        cta: t('needsReply'),
      }
    })
  }

  /* ── Fresh items (delta from streams) ─────────────── */
  const sinceISO = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data: freshMaterials } = await supabase
    .from('materials')
    .select('id, title, type, content')
    .eq('is_published', true)
    .gt('created_at', sinceISO)
    .order('created_at', { ascending: false })
    .limit(3)

  const { data: freshPostsRaw } = await (supabase as any)
    .from('posts')
    .select('id, content, created_at, user_id, profiles(full_name)')
    .neq('user_id', user.id)
    .gt('created_at', sinceISO)
    .order('created_at', { ascending: false })
    .limit(3)

  const freshPosts = (freshPostsRaw ?? []) as Array<{
    id: string
    content: string
    created_at: string
    profiles: { full_name?: string | null } | { full_name?: string | null }[] | null
  }>

  const freshItems: FreshItem[] = [
    ...(freshMaterials ?? []).map((m): FreshItem => ({
      id: `m-${m.id}`,
      kind: 'material',
      title: t('freshNewMaterial'),
      desc: m.title,
      when: t('freshJustNow'),
      href: `/materials#${m.id}`,
    })),
    ...freshPosts.map((p): FreshItem => {
      const author = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles
      return {
        id: `p-${p.id}`,
        kind: 'post',
        title: `${author?.full_name ?? t('needsSomeone')} ${t('freshPostedInFeed')}`,
        desc: p.content.split('\n')[0].slice(0, 100),
        when: relativeTime(p.created_at, locale),
        href: `/community#${p.id}`,
      }
    }),
  ]

  /* ── Leaderboard ──────────────────────────────────── */
  const { data: leaderRows } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, xp')
    .order('xp', { ascending: false })
    .limit(50)

  const ranked = (leaderRows ?? []).map((r, i) => ({ ...r, rank: i + 1 }))
  const yourRow = ranked.find(r => r.id === user.id)
  const topThree = ranked.slice(0, 3).map(r => ({
    rank: r.rank,
    name: r.full_name ?? '—',
    xp: r.xp ?? 0,
    avatarUrl: r.avatar_url,
  }))
  const youRank = yourRow?.rank ?? ranked.length + 1
  const nextRank = youRank > 1 ? youRank - 1 : null
  const nextRow = ranked.find(r => r.rank === nextRank)
  const xpGap = nextRow ? nextRow.xp - (yourRow?.xp ?? 0) : null

  /* ── Weekly chart ─────────────────────────────────── */
  const nowForChart = new Date()
  const mondayThisWeek = new Date(nowForChart)
  mondayThisWeek.setDate(nowForChart.getDate() - ((nowForChart.getDay() + 6) % 7))
  mondayThisWeek.setHours(0, 0, 0, 0)

  const { data: weekFocusRaw } = await (supabase as any)
    .from('focus_sessions')
    .select('started_at, focus_seconds')
    .eq('user_id', user.id)
    .gte('started_at', mondayThisWeek.toISOString())

  const perDay = [0, 0, 0, 0, 0, 0, 0]
  for (const s of (weekFocusRaw ?? []) as Array<{ started_at: string; focus_seconds: number }>) {
    const idx = (new Date(s.started_at).getDay() + 6) % 7  // Mon=0…Sun=6
    perDay[idx] += Math.round((s.focus_seconds ?? 0) / 60)
  }
  const todayIndex = (new Date().getDay() + 6) % 7  // Mon=0…Sun=6

  /* ── Recommendations + streak + focus today ──────────── */
  const startOfTodayUTC = new Date()
  startOfTodayUTC.setUTCHours(0, 0, 0, 0)

  const [{ data: progressRaw }, { data: allMaterials }, focusTodayRes] = await Promise.all([
    // All-time progress — used for recommendations AND streak
    supabase
      .from('student_progress')
      .select('task_id, is_correct, completed_at, tasks(topic_id)')
      .eq('user_id', user.id),
    supabase
      .from('materials')
      .select('id, title, type, topic_id')
      .eq('is_published', true)
      .limit(30),
    // Today's focus sessions for the "Focus" stat in the hero
    (supabase as any)
      .from('focus_sessions')
      .select('focus_seconds')
      .eq('user_id', user.id)
      .gte('started_at', startOfTodayUTC.toISOString()),
  ])

  const progressRows = (progressRaw ?? []) as ProgressRow[]
  const topicStats   = buildTopicStats(progressRows)

  /* ── Streak ─────────────────────────────────────────── */
  const daySet = new Set(progressRows.map(r => r.completed_at.slice(0, 10)))
  let streakDays = 0
  for (let i = 0; i < 365; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    if (daySet.has(d.toISOString().slice(0, 10))) streakDays++
    else break
  }

  /* ── Focus minutes today ─────────────────────────────── */
  const focusMinutesToday = Math.round(
    ((focusTodayRes?.data ?? []) as { focus_seconds: number }[])
      .reduce((s, r) => s + (r.focus_seconds ?? 0), 0) / 60
  )

  const materialTypeKeys = ['video', 'article', 'link', 'interactive'] as const
  type MaterialType = typeof materialTypeKeys[number]

  const recs: RecItem[] = (allMaterials ?? [])
    .map(m => ({ ...m, _score: scoreMaterial(m, topicStats) }))
    .sort((a, b) => b._score - a._score)
    .slice(0, 3)
    .map(m => ({
      id: m.id,
      tag: materialTypeKeys.includes(m.type as MaterialType)
        ? tMaterials(`types.${m.type as MaterialType}`)
        : tMaterials('types.article'),
      title: m.title,
      meta: m.type === 'video' ? t('recActionWatch') : t('recActionRead'),
      href: `/materials#${m.id}`,
    }))

  /* ── Encouragement ────────────────────────────────── */
  const unfinished = todayItems.filter(i => !i.done).length
  const encouragement = todayItems.length > 0
    ? t('encouragementStreak', { count: unfinished })
    : t('encouragementStart')

  /* ── Render ────────────────────────────────────────── */
  return (
    <div className="grid grid-cols-1 gap-7 lg:grid-cols-[1fr_304px]">
      <div>
        <Hero
          firstName={firstName}
          dateLabel={dateLabel(new Date(), locale)}
          encouragement={encouragement}
          streakDays={streakDays}
          todayDone={todayItems.filter(i => i.done).length}
          todayTotal={todayItems.length}
          focusMinutesToday={focusMinutesToday}
        />
        <FocusBand />
        <TodayPanel items={todayItems} />
        <NeedsYouPanel items={needsItems} />
        <FreshPanel items={freshItems} />
      </div>

      <aside className="flex flex-col gap-3.5">
        {profile && (
          <LeaderboardCard
            level={profile.level ?? 1}
            xp={profile.xp ?? 0}
            xpForNextLevel={xpForLevel((profile.level ?? 1) + 1)}
            yourRank={youRank}
            nextRank={nextRank}
            xpGapToNextRank={xpGap}
            topThree={topThree}
            you={{
              rank: youRank,
              name: profile.full_name ?? firstName,
              xp: profile.xp ?? 0,
              avatarUrl: profile.avatar_url,
            }}
          />
        )}
        <WeeklyChartCard perDay={perDay} todayIndex={todayIndex} />
        <RecommendationsCard items={recs} />
      </aside>
    </div>
  )
}

/* ─────────── Helpers ─────────── */

function xpForLevel(level: number): number {
  return level * 100
}

function dateLabel(d: Date, locale: string): string {
  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(d)
  const rest    = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' }).format(d)
  const cap = weekday.charAt(0).toUpperCase() + weekday.slice(1)
  return `${cap} · ${rest}`
}

function relativeTime(iso: string, locale: string): string {
  const ms   = Date.now() - new Date(iso).getTime()
  const secs = Math.floor(ms / 1000)
  const rtf  = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  if (secs < 60)  return rtf.format(0, 'seconds')
  const mins = Math.floor(secs / 60)
  if (mins < 60)  return rtf.format(-mins, 'minutes')
  const hrs  = Math.floor(mins / 60)
  if (hrs < 24)   return rtf.format(-hrs, 'hours')
  const days = Math.floor(hrs / 24)
  if (days < 7)   return rtf.format(-days, 'days')
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(new Date(iso))
}
