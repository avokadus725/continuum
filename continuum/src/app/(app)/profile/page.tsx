/* Profile page v2 — minimal B layout.
   Settings left column, identity + 4 stats in right rail.
   Reuses AvatarUpload, ProfileEditForm, LanguageSwitcher, ThemeToggle as-is.
   Drops achievement list (still on /gamification). */

import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { ProfileEditForm } from '@/components/features/profile/profile-edit-form'
import { AvatarUpload } from '@/components/features/profile/avatar-upload'
import { LanguageSwitcher } from '@/components/language-switcher'
import { ThemeToggle } from '@/components/theme-toggle'
import { signOut } from '@/app/actions/auth'
import { Timer, Target } from 'lucide-react'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('profile')
  return { title: t('title') }
}

const XP_PER_LEVEL = 100

/* Compute current streak in days from a list of ISO date strings.
   Counts backwards from today; stops at the first missing day. */
function computeStreak(dates: string[]): number {
  if (!dates.length) return 0
  const unique = [...new Set(dates.map(d => d.slice(0, 10)))].sort().reverse()
  const today = new Date().toISOString().slice(0, 10)
  let streak = 0
  let expected = today
  for (const d of unique) {
    if (d === expected) {
      streak++
      const prev = new Date(expected)
      prev.setDate(prev.getDate() - 1)
      expected = prev.toISOString().slice(0, 10)
    } else if (d < expected) {
      break
    }
  }
  return streak
}

export default async function ProfilePage() {
  const supabase  = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const t = await getTranslations('profile')

  /* ── parallel data fetch ──────────────────────────────── */
  const [profileRes, progressRes, sessionsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('xp, level, full_name, bio, avatar_url')
      .eq('id', user.id)
      .single(),

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('student_progress')
      .select('is_correct, created_at')
      .eq('user_id', user.id),

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('focus_sessions')
      .select('focus_seconds, started_at, status')
      .eq('user_id', user.id),
  ])

  const profile   = profileRes.data
  const progress  = (progressRes.data ?? []) as { is_correct: boolean; created_at: string }[]
  const sessions  = (sessionsRes.data ?? []) as { focus_seconds: number; started_at: string }[]

  /* ── computed stats ───────────────────────────────────── */
  const xp        = profile?.xp ?? 0
  const level     = profile?.level ?? 1
  const xpInLevel = xp % XP_PER_LEVEL
  const xpPct     = Math.round((xpInLevel / XP_PER_LEVEL) * 100)

  const totalAttempts  = progress.length
  const correctCount   = progress.filter(p => p.is_correct).length
  const accuracy       = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : null

  const focusTotalSec  = sessions.reduce((s, r) => s + (r.focus_seconds ?? 0), 0)
  const focusH         = Math.floor(focusTotalSec / 3600)
  const focusM         = Math.floor((focusTotalSec % 3600) / 60)
  const focusLabel     = focusTotalSec === 0
    ? '—'
    : focusH > 0 ? `${focusH}г ${focusM}хв` : `${focusM} хв`

  const activityDates  = [
    ...progress.map(p => p.created_at),
    ...sessions.map(s => s.started_at),
  ]
  const streakDays = computeStreak(activityDates)

  const displayName  = profile?.full_name ?? user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? null
  const avatarUrl    = profile?.avatar_url ?? user.user_metadata?.avatar_url ?? null

  /* ── render ───────────────────────────────────────────── */
  return (
    <div className="max-w-[980px]">
      <h1
        className="mb-5 text-[24px] font-semibold tracking-[-0.4px]"
        style={{ color: 'var(--foreground)' }}
      >
        {t('title')}
      </h1>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_288px] lg:items-start">

        {/* ── LEFT — Settings ──────────────────────────── */}
        <div
          className="rounded-2xl border p-6"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          {/* Personal data */}
          <SectionTitle>{t('personalData')}</SectionTitle>

          <div className="mt-4 flex items-start gap-4">
            <AvatarUpload currentUrl={avatarUrl} displayName={displayName} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold leading-tight" style={{ color: 'var(--foreground)' }}>
                {displayName ?? user.email}
              </p>
              <p className="mt-0.5 text-[12.5px]" style={{ color: 'var(--muted-foreground)' }}>
                {user.email}
              </p>
            </div>
          </div>

          <div className="mt-5">
            <ProfileEditForm fullName={profile?.full_name ?? null} bio={profile?.bio ?? null} />
          </div>

          <Divider />

          {/* Appearance */}
          <SectionTitle>{t('appearance')}</SectionTitle>

          <div className="mt-4 flex flex-col gap-3">
            <Row label={t('theme')} sub={t('themeSub')}>
              <ThemeToggle />
            </Row>
            <Row label={t('language')} sub={t('languageSub')}>
              <LanguageSwitcher variant="full" />
            </Row>
          </div>

          <Divider />

          {/* Account */}
          <SectionTitle>{t('account')}</SectionTitle>

          <div className="mt-4 space-y-3">
            <div>
              <FieldLabel>{t('email')}</FieldLabel>
              <div
                className="mt-1.5 flex h-10 items-center rounded-[9px] border px-3.5 text-[13px] font-mono"
                style={{ background: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
              >
                {user.email}
              </div>
            </div>

            <form action={signOut}>
              <button
                type="submit"
                className="inline-flex h-9 items-center gap-2 rounded-[9px] border px-4 text-[13px] font-semibold transition-colors"
                style={{
                  background: 'transparent',
                  borderColor: 'color-mix(in srgb, var(--destructive) 35%, var(--border))',
                  color: 'var(--destructive)',
                }}
              >
                {t('signOut')}
              </button>
            </form>
          </div>
        </div>

        {/* ── RIGHT RAIL — Identity + stats ────────────── */}
        <div className="flex flex-col gap-4">

          {/* Identity card */}
          <p className="text-[11px] font-semibold uppercase tracking-[0.5px]" style={{ color: 'var(--muted-foreground)' }}>
            {t('othersView')}
          </p>
          <div
            className="-mt-2 rounded-2xl border p-5 text-center"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <div className="mx-auto mb-3 w-fit">
              <AvatarUpload currentUrl={avatarUrl} displayName={displayName} readOnly />
            </div>
            <p className="text-[17px] font-bold" style={{ color: 'var(--foreground)' }}>
              {displayName ?? '—'}
            </p>
            <p className="mt-1 text-[12.5px]" style={{ color: 'var(--muted-foreground)' }}>
              {user.email}
            </p>
            {profile?.bio && (
              <p className="mt-2.5 text-[13px] leading-snug" style={{ color: 'var(--foreground)' }}>
                {profile.bio}
              </p>
            )}
          </div>

          {/* Stats card */}
          <div
            className="overflow-hidden rounded-2xl border"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          >
            {/* Level/XP strip */}
            <div
              className="px-[18px] py-3.5"
              style={{
                background: 'color-mix(in srgb, var(--primary) 9%, var(--card))',
                borderBottom: '1px solid color-mix(in srgb, var(--border) 70%, transparent)',
              }}
            >
              <div className="flex items-baseline justify-between">
                <span className="text-[12px] font-semibold" style={{ color: 'var(--muted-foreground)' }}>
                  {t('level')}{' '}
                  <span
                    className="text-[15px] font-normal"
                    style={{
                      fontFamily: '"Instrument Serif", Georgia, serif',
                      fontStyle: 'italic',
                      color: 'var(--primary)',
                    }}
                  >
                    {level}
                  </span>
                </span>
                <span className="text-[12px]" style={{ color: 'var(--muted-foreground)' }}>
                  <span className="text-[14px] font-bold" style={{ color: 'var(--foreground)' }}>{xpInLevel}</span>
                  {' '}/ {XP_PER_LEVEL} XP
                </span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full" style={{ background: 'var(--muted)' }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${xpPct}%`, background: 'var(--primary)' }}
                />
              </div>
              <div className="mt-1.5 text-[10.5px]" style={{ color: 'var(--muted-foreground)' }}>
                {t('xpToNext', { xp: XP_PER_LEVEL - xpInLevel, next: level + 1 })}
              </div>
            </div>

            {/* 3 stat rows */}
            {[
              {
                icon: <img src="/icons/fire.png" alt="" width={14} height={14} className="dark:invert" />,
                color: 'var(--primary)',
                label: t('streak'),
                value: streakDays > 0 ? `${streakDays}` : '—',
                sub: streakDays > 0 ? t('streakDays') : t('streakNone'),
              },
              {
                icon: <Timer className="h-3.5 w-3.5" />,
                color: 'var(--primary)',
                label: t('focusTime'),
                value: focusLabel,
                sub: t('focusTotal'),
              },
              {
                icon: <Target className="h-3.5 w-3.5" />,
                color: 'var(--success)',
                label: t('accuracy'),
                value: accuracy !== null ? `${accuracy}%` : '—',
                sub: totalAttempts > 0 ? t('accuracySub', { count: totalAttempts }) : t('accuracyNone'),
              },
            ].map((s, i, arr) => (
              <div
                key={s.label}
                className="flex items-center gap-3 px-[18px] py-3"
                style={{
                  borderBottom: i < arr.length - 1 ? '1px solid color-mix(in srgb, var(--border) 60%, transparent)' : 'none',
                }}
              >
                <span
                  className="inline-flex h-7 w-7 flex-none items-center justify-center rounded-[7px]"
                  style={{
                    background: `color-mix(in srgb, ${s.color} 14%, transparent)`,
                    color: s.color,
                  }}
                >
                  {s.icon}
                </span>
                <span className="text-[12px] font-medium" style={{ color: 'var(--muted-foreground)' }}>
                  {s.label}
                </span>
                <div className="ml-auto text-right">
                  <div
                    className="text-[15px] font-bold tabular-nums leading-none"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {s.value}
                  </div>
                  <div className="mt-0.5 text-[10.5px]" style={{ color: 'var(--muted-foreground)' }}>
                    {s.sub}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── small presentational helpers ─── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[13.5px] font-semibold" style={{ color: 'var(--foreground)' }}>
      {children}
    </h2>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-[11px] font-semibold uppercase tracking-[0.5px]"
      style={{ color: 'var(--muted-foreground)' }}
    >
      {children}
    </div>
  )
}

function Divider() {
  return (
    <div className="my-5 h-px" style={{ background: 'color-mix(in srgb, var(--border) 70%, transparent)' }} />
  )
}

function Row({
  label, sub, children,
}: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-[13px]" style={{ color: 'var(--foreground)' }}>{label}</div>
        {sub && <div className="mt-0.5 text-[12px]" style={{ color: 'var(--muted-foreground)' }}>{sub}</div>}
      </div>
      {children}
    </div>
  )
}
