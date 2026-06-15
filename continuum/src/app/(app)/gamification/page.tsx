/* Leaderboard page — XP ranking, levels and achievements. */

import { createClient } from '@/lib/supabase/server'
import { getTranslations, getLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { UserAvatar } from '@/components/ui/user-avatar'

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [t, locale] = await Promise.all([
    getTranslations('gamification'),
    getLocale(),
  ])

  /* ── Date helpers ─────────────────────────────── */
  const now = new Date()
  const todayIndex = (now.getDay() + 6) % 7           // Mon=0 … Sun=6
  const monday = new Date(now)
  monday.setDate(now.getDate() - todayIndex)
  monday.setHours(0, 0, 0, 0)
  const weekStart = monday.toISOString()

  /* ── Queries ──────────────────────────────────── */
  const [{ data: leaders }, focusRes, { data: weekProgress }, { data: allProgress }, weekAllRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, avatar_url, xp, level')
      .order('xp', { ascending: false })
      .limit(50),
    (supabase as any)
      .from('focus_sessions')
      .select('started_at, focus_seconds')
      .gte('started_at', weekStart),
    supabase
      .from('student_progress')
      .select('is_correct, completed_at')
      .eq('user_id', user.id)
      .gte('completed_at', weekStart),
    // All-time progress dates — for streak (must not be period-filtered)
    supabase
      .from('student_progress')
      .select('completed_at')
      .eq('user_id', user.id),
    // All users' weekly scores — for "hot this week" mini-leaderboard
    (supabase as any)
      .from('student_progress')
      .select('user_id, score')
      .gte('completed_at', weekStart),
  ])
  const focusSessions = (focusRes.data ?? []) as Array<{ started_at: string; focus_seconds: number }>

  /* ── Rankings ─────────────────────────────────── */
  const ranked = (leaders ?? []).map((p, i) => ({ ...p, rank: i + 1 }))
  const yourRow  = ranked.find(r => r.id === user.id)
  const youRank  = yourRow?.rank ?? ranked.length + 1
  const nextRow  = ranked.find(r => r.rank === youRank - 1)
  const xpGap    = nextRow ? (nextRow.xp ?? 0) - (yourRow?.xp ?? 0) : null

  /* ── Streak ───────────────────────────────────── */
  const allDaySet = new Set((allProgress ?? []).map(r => r.completed_at.slice(0, 10)))
  let streak = 0
  for (let i = 0; i < 365; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    if (allDaySet.has(d.toISOString().slice(0, 10))) streak++
    else break
  }

  /* ── Close rivals ─────────────────────────────── */
  const rivalAbove = youRank > 1 ? ranked.find(r => r.rank === youRank - 1) ?? null : null
  const rivalBelow = ranked.find(r => r.rank === youRank + 1) ?? null
  const xpToOvertake = rivalAbove ? (rivalAbove.xp ?? 0) - (yourRow?.xp ?? 0) : null
  const xpLeadBelow  = rivalBelow ? (yourRow?.xp ?? 0) - (rivalBelow.xp ?? 0) : null

  /* ── Hot this week ────────────────────────────── */
  const weekScoreMap = new Map<string, number>()
  for (const row of ((weekAllRes?.data ?? []) as Array<{ user_id: string; score: number | null }>)) {
    if (row.user_id) {
      weekScoreMap.set(row.user_id, (weekScoreMap.get(row.user_id) ?? 0) + (row.score ?? 0))
    }
  }
  const hotThisWeek = (leaders ?? [])
    .map(p => ({ ...p, weekXp: weekScoreMap.get(p.id) ?? 0 }))
    .filter(p => p.weekXp > 0)
    .sort((a, b) => b.weekXp - a.weekXp)
    .slice(0, 5)

  /* ── XP progress ──────────────────────────────── */
  const XP_PER_LEVEL = 100
  const yourXp    = yourRow?.xp    ?? 0
  const yourLevel = yourRow?.level ?? 1
  const xpInLevel = yourXp % XP_PER_LEVEL
  const xpPct     = Math.round((xpInLevel / XP_PER_LEVEL) * 100)

  /* ── Weekly focus per day ─────────────────────── */
  const perDay: number[] = [0, 0, 0, 0, 0, 0, 0]
  for (const s of focusSessions) {
    const idx = (new Date(s.started_at).getDay() + 6) % 7
    perDay[idx] += Math.round(s.focus_seconds / 60)
  }
  const totalMin  = perDay.reduce((a, b) => a + b, 0)
  const maxMin    = Math.max(...perDay, 1)
  const focusHrs  = Math.floor(totalMin / 60)
  const focusMins = totalMin % 60

  /* ── Weekly task stats ────────────────────────── */
  const wTasks = weekProgress ?? []
  const wCount   = wTasks.length
  const wCorrect = wTasks.filter(r => r.is_correct).length
  const wRate    = wCount > 0 ? Math.round((wCorrect / wCount) * 100) : null

  /* ── Weekday labels ───────────────────────────── */
  const DAYS = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(2024, 0, 1 + i) // Jan 1 2024 = Monday
    return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(d)
  })

  /* ── Podium split ─────────────────────────────── */
  const top3 = ranked.slice(0, 3)
  const rest  = ranked.slice(3)

  const youLabel = t('you')

  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────── */}
      <h1
        className="text-2xl font-bold tracking-[-0.3px]"
        style={{ color: 'var(--foreground)' }}
      >
        {t('leaderboard')}
      </h1>

      {/* ── Two-column ──────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_264px]">

        {/* LEFT — podium + list */}
        <div className="space-y-4">

          {/* Podium */}
          {top3.length > 0 && (
            <div
              className="rounded-2xl border p-5"
              style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
            >
              <p
                className="mb-5 text-[11px] font-semibold uppercase tracking-[0.07em]"
                style={{ color: 'var(--muted-foreground)' }}
              >
                {t('topPlayers')}
              </p>

              <div className="flex items-end justify-center gap-3">
                {/* 2nd */}
                {top3[1] && (
                  <PodiumCol
                    row={top3[1]}
                    isMe={top3[1].id === user.id}
                    youLabel={youLabel}
                    baseH={52}
                    medal="🥈"
                  />
                )}
                {/* 1st */}
                <PodiumCol
                  row={top3[0]}
                  isMe={top3[0].id === user.id}
                  youLabel={youLabel}
                  baseH={72}
                  medal="🥇"
                  first
                />
                {/* 3rd */}
                {top3[2] && (
                  <PodiumCol
                    row={top3[2]}
                    isMe={top3[2].id === user.id}
                    youLabel={youLabel}
                    baseH={36}
                    medal="🥉"
                  />
                )}
              </div>
            </div>
          )}

          {/* Rest of list */}
          {rest.length > 0 && (
            <div
              className="rounded-2xl border overflow-hidden"
              style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
            >
              {rest.map(p => {
                const isMe = p.id === user.id
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 border-b px-4 py-3 last:border-b-0"
                    style={{
                      borderColor: 'var(--border)',
                      background: isMe ? 'color-mix(in srgb, var(--primary) 6%, transparent)' : 'transparent',
                    }}
                  >
                    <span
                      className="w-7 shrink-0 text-center text-[12px] font-bold tabular-nums"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      {p.rank}
                    </span>
                    <UserAvatar url={p.avatar_url} name={p.full_name} size={32} highlight={isMe} />
                    <span
                      className="flex-1 truncate text-[13px] font-medium"
                      style={{ color: isMe ? 'var(--primary)' : 'var(--foreground)' }}
                    >
                      {p.full_name ?? '—'}
                      {isMe && (
                        <span className="ml-2 text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                          {youLabel}
                        </span>
                      )}
                    </span>
                    <div className="shrink-0 text-right">
                      <p
                        className="text-[13px] font-bold tabular-nums"
                        style={{ color: isMe ? 'var(--primary)' : 'var(--foreground)' }}
                      >
                        {p.xp}
                        <span className="ml-0.5 text-[10px] font-normal" style={{ color: 'var(--muted-foreground)' }}>
                          XP
                        </span>
                      </p>
                      <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                        {t('level')} {p.level}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {ranked.length === 0 && (
            <p className="py-12 text-center text-[13px]" style={{ color: 'var(--muted-foreground)' }}>
              —
            </p>
          )}

          {/* Hot this week */}
          {hotThisWeek.length > 0 && (
            <div
              className="rounded-2xl border p-5"
              style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
            >
              <p
                className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.07em]"
                style={{ color: 'var(--muted-foreground)' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/fire.png" alt="" width={14} height={14} className="dark:invert" style={{ display: 'inline-block' }} />
                {t('hotThisWeek')}
              </p>
              <div className="space-y-3">
                {hotThisWeek.map((p, i) => {
                  const isMe = p.id === user.id
                  return (
                    <div key={p.id} className="flex items-center gap-3">
                      <span
                        className="w-5 shrink-0 text-center text-[11px] font-bold tabular-nums"
                        style={{ color: 'var(--muted-foreground)' }}
                      >
                        {i + 1}
                      </span>
                      <UserAvatar url={p.avatar_url} name={p.full_name} size={30} highlight={isMe} />
                      <span
                        className="flex-1 truncate text-[13px] font-medium"
                        style={{ color: isMe ? 'var(--primary)' : 'var(--foreground)' }}
                      >
                        {p.full_name ?? '—'}
                        {isMe && (
                          <span className="ml-2 text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                            {youLabel}
                          </span>
                        )}
                      </span>
                      <span
                        className="shrink-0 text-[12px] font-bold tabular-nums"
                        style={{ color: 'var(--primary)' }}
                      >
                        +{p.weekXp} XP
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT sidebar ─────────────────────────── */}
        <div className="flex flex-col gap-4">

          {/* Your position */}
          <div
            className="rounded-2xl border p-4"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <p
              className="mb-3 text-[11px] font-semibold uppercase tracking-[0.07em]"
              style={{ color: 'var(--muted-foreground)' }}
            >
              {t('yourStats')}
            </p>
            <div
              className="rounded-xl p-3"
              style={{ background: 'color-mix(in srgb, var(--primary) 8%, transparent)' }}
            >
              <div className="flex items-baseline justify-between">
                <span className="text-[11.5px] font-semibold" style={{ color: 'var(--muted-foreground)' }}>
                  {t('level')} {yourLevel}
                </span>
                <span className="text-[15px] font-bold tabular-nums" style={{ color: 'var(--primary)' }}>
                  {yourXp} XP
                </span>
              </div>
              <div
                className="mt-2 h-1.5 overflow-hidden rounded-full"
                style={{ background: 'var(--muted)' }}
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: `${xpPct}%`, background: 'var(--primary)' }}
                />
              </div>
              <div
                className="mt-2 flex items-center justify-between text-[11px]"
                style={{ color: 'var(--muted-foreground)' }}
              >
                <span>{t('rank', { rank: youRank })}</span>
                {xpGap != null && xpGap > 0 && (
                  <span>{t('xpGapToRank', { xp: xpGap, rank: youRank - 1 })}</span>
                )}
              </div>
              {streak > 0 && (
                <div className="mt-2.5 flex items-center gap-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/icons/fire.png" alt="" width={13} height={13} className="dark:invert" style={{ display: 'inline-block' }} />
                  <span className="text-[11px] tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
                    {t('streakDays', { count: streak })} {t('streak')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Weekly focus chart */}
          <div
            className="rounded-2xl border p-4"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <div className="mb-1 flex items-center justify-between">
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.07em]"
                style={{ color: 'var(--muted-foreground)' }}
              >
                {t('weeklyFocus')}
              </p>
              <span
                className="text-[11.5px] tabular-nums"
                style={{ color: totalMin > 0 ? 'var(--foreground)' : 'var(--muted-foreground)' }}
              >
                {focusHrs > 0 ? `${focusHrs}h ` : ''}{focusMins}m
              </span>
            </div>

            <div className="mt-3 flex h-[72px] items-end gap-1">
              {perDay.map((min, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-[3px]"
                    style={{
                      height: `${Math.max(3, Math.round((min / maxMin) * 100))}%`,
                      background: i === todayIndex
                        ? 'var(--primary)'
                        : min > 0
                          ? 'color-mix(in srgb, var(--primary) 35%, var(--muted))'
                          : 'var(--muted)',
                    }}
                  />
                  <span
                    className="text-[9px]"
                    style={{
                      color: i === todayIndex
                        ? 'var(--primary)'
                        : 'color-mix(in srgb, var(--muted-foreground) 60%, transparent)',
                    }}
                  >
                    {DAYS[i]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* This week tasks */}
          <div
            className="rounded-2xl border p-4"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <p
              className="mb-3 text-[11px] font-semibold uppercase tracking-[0.07em]"
              style={{ color: 'var(--muted-foreground)' }}
            >
              {t('weeklyTasks')}
            </p>
            {wCount > 0 ? (
              <div className="flex gap-3">
                <div
                  className="flex flex-1 flex-col items-center rounded-xl py-3"
                  style={{ background: 'var(--muted)' }}
                >
                  <span className="text-[22px] font-bold tabular-nums" style={{ color: 'var(--foreground)' }}>
                    {wCount}
                  </span>
                  <span className="mt-0.5 text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                    {t('tasksLabel')}
                  </span>
                </div>
                {wRate !== null && (
                  <div
                    className="flex flex-1 flex-col items-center rounded-xl py-3"
                    style={{
                      background: wRate >= 70
                        ? 'color-mix(in srgb, var(--success) 12%, var(--muted))'
                        : wRate >= 40
                          ? 'color-mix(in srgb, var(--warning) 12%, var(--muted))'
                          : 'color-mix(in srgb, var(--destructive) 12%, var(--muted))',
                    }}
                  >
                    <span
                      className="text-[22px] font-bold tabular-nums"
                      style={{
                        color: wRate >= 70 ? 'var(--success)' : wRate >= 40 ? 'var(--warning)' : 'var(--destructive)',
                      }}
                    >
                      {wRate}%
                    </span>
                    <span className="mt-0.5 text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                      {t('correctLabel')}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[12px] text-center py-2" style={{ color: 'var(--muted-foreground)' }}>
                {t('noActivity')}
              </p>
            )}
          </div>

          {/* Close rivals */}
          {(rivalAbove || rivalBelow) && (
            <div
              className="rounded-2xl border p-4"
              style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
            >
              <p
                className="mb-3 text-[11px] font-semibold uppercase tracking-[0.07em]"
                style={{ color: 'var(--muted-foreground)' }}
              >
                {t('rivals')}
              </p>
              <div className="space-y-2.5">
                {rivalAbove && (
                  <div className="flex items-center gap-2.5">
                    <span className="w-4 shrink-0 text-center text-[11px] font-bold" style={{ color: 'var(--warning)' }}>↑</span>
                    <UserAvatar url={rivalAbove.avatar_url} name={rivalAbove.full_name} size={28} />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-[12px] font-medium" style={{ color: 'var(--foreground)' }}>
                        {rivalAbove.full_name ?? '—'}
                      </p>
                      <p className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>{t('rivalsAhead')}</p>
                    </div>
                    {xpToOvertake != null && xpToOvertake > 0 && (
                      <span className="shrink-0 text-[11px] font-bold tabular-nums" style={{ color: 'var(--warning)' }}>
                        +{xpToOvertake} XP
                      </span>
                    )}
                  </div>
                )}
                {rivalBelow && (
                  <div className="flex items-center gap-2.5">
                    <span className="w-4 shrink-0 text-center text-[11px] font-bold" style={{ color: 'var(--success)' }}>↓</span>
                    <UserAvatar url={rivalBelow.avatar_url} name={rivalBelow.full_name} size={28} />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-[12px] font-medium" style={{ color: 'var(--foreground)' }}>
                        {rivalBelow.full_name ?? '—'}
                      </p>
                      <p className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>{t('rivalsBelow')}</p>
                    </div>
                    {xpLeadBelow != null && xpLeadBelow >= 0 && (
                      <span className="shrink-0 text-[11px] font-bold tabular-nums" style={{ color: 'var(--success)' }}>
                        +{xpLeadBelow} XP
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>


    </div>
  )
}

/* ─── Podium column ───────────────────────────────── */
function PodiumCol({
  row, isMe, youLabel, baseH, medal, first = false,
}: {
  row: { full_name: string | null; avatar_url: string | null; xp: number; level: number; rank: number }
  isMe: boolean; youLabel: string; baseH: number; medal: string; first?: boolean
}) {
  const name = row.full_name ?? '—'
  return (
    <div className={`flex flex-col items-center ${first ? 'flex-[1.15]' : 'flex-1'}`}>
      {/* medal */}
      <span className={`${first ? 'text-2xl' : 'text-xl'} mb-1.5`}>{medal}</span>

      {/* avatar */}
      <UserAvatar
        url={row.avatar_url}
        name={row.full_name}
        size={first ? 56 : 44}
        highlight={isMe}
      />

      {/* name */}
      <p
        className={`mt-2 max-w-[88px] truncate text-center ${first ? 'text-[13px] font-semibold' : 'text-[12px] font-medium'}`}
        style={{ color: isMe ? 'var(--primary)' : 'var(--foreground)' }}
      >
        {name}
      </p>
      {isMe && (
        <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
          {youLabel}
        </span>
      )}

      {/* XP */}
      <p
        className={`${first ? 'text-[13px]' : 'text-[11.5px]'} font-bold tabular-nums`}
        style={{ color: 'var(--primary)' }}
      >
        {row.xp} <span className="text-[10px] font-normal" style={{ color: 'var(--muted-foreground)' }}>XP</span>
      </p>

      {/* podium base */}
      <div
        className="mt-3 w-full rounded-t-xl"
        style={{
          height: `${baseH}px`,
          background: first
            ? 'color-mix(in srgb, var(--primary) 22%, var(--muted))'
            : 'color-mix(in srgb, var(--muted-foreground) 14%, var(--muted))',
        }}
      />
    </div>
  )
}

