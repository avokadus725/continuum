import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const XP_PER_LEVEL = 100

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const t = await getTranslations('dashboard')
  const tGamification = await getTranslations('gamification')
  const tNav = await getTranslations('nav')

  const [profileRes, progressRes, achievementsRes, recentRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('xp, level, full_name, avatar_url')
      .eq('id', user.id)
      .single(),
    supabase
      .from('student_progress')
      .select('task_id, is_correct', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('is_correct', true),
    supabase
      .from('user_achievements')
      .select('achievement_id', { count: 'exact' })
      .eq('user_id', user.id),
    supabase
      .from('student_progress')
      .select('task_id, is_correct, completed_at, tasks(title, type, xp_reward)')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(5),
  ])

  const profile = profileRes.data
  const tasksCompleted = progressRes.count ?? 0
  const achievementsCount = achievementsRes.count ?? 0
  const recentProgress = recentRes.data ?? []

  const displayName =
    profile?.full_name ??
    user.user_metadata?.full_name ??
    user.email?.split('@')[0] ??
    null

  const xp = profile?.xp ?? 0
  const level = profile?.level ?? 1
  const xpInLevel = xp % XP_PER_LEVEL
  const xpProgress = Math.round((xpInLevel / XP_PER_LEVEL) * 100)

  const avatarUrl = profile?.avatar_url ?? user.user_metadata?.avatar_url ?? null

  return (
    <div className="space-y-8 max-w-3xl">

      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName ?? ''}
              className="w-12 h-12 rounded-full object-cover shrink-0"
            />
          ) : (
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              {(displayName?.[0] ?? user.email?.[0] ?? '?').toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
              {displayName ? t('welcome', { name: displayName }) : t('welcomeGeneric')}
            </h1>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              {t('subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* XP + Level card */}
      <div
        className="rounded-2xl border p-5 space-y-3"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
              {tGamification('level')}
            </span>
            <p className="text-3xl font-bold" style={{ color: 'var(--primary)' }}>{level}</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
              {tGamification('xp')}
            </span>
            <p className="text-3xl font-bold" style={{ color: 'var(--primary)' }}>{xp}</p>
          </div>
        </div>

        {/* XP progress bar */}
        <div>
          <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>
            <span>{xpInLevel} / {XP_PER_LEVEL} XP</span>
            <span>{t('level', { level: level + 1 })}</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--muted)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${xpProgress}%`, background: 'var(--primary)' }}
            />
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t('tasksCompleted', { count: tasksCompleted }), value: tasksCompleted, color: 'var(--primary)', href: '/tasks' },
          { label: tGamification('achievements'),                   value: achievementsCount, color: 'var(--success)', href: '/profile' },
          { label: tGamification('xp'),                             value: xp,               color: 'var(--warning)', href: '/analytics' },
          { label: tGamification('level'),                          value: level,             color: 'var(--primary)', href: '/analytics' },
        ].map(({ label, value, color, href }) => (
          <Link
            key={label}
            href={href}
            className="rounded-xl border p-4 text-center transition-shadow hover:shadow-md block"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <div className="text-2xl font-bold" style={{ color }}>{value}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{label}</div>
          </Link>
        ))}
      </div>

      {/* Recent activity */}
      {recentProgress.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted-foreground)' }}>
            {t('recentTasks')}
          </h2>
          <div
            className="rounded-2xl border divide-y"
            style={{ background: 'var(--card)', borderColor: 'var(--border)', '--tw-divide-opacity': 1 } as React.CSSProperties}
          >
            {recentProgress.map((row, i) => {
              const task = row.tasks as { title: string; type: string; xp_reward: number } | null
              if (!task) return null
              return (
                <Link
                  key={`${row.task_id}-${i}`}
                  href={`/tasks/${row.task_id}`}
                  className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <span style={{ color: row.is_correct ? 'var(--success)' : 'var(--destructive)' }}>
                      {row.is_correct ? '✓' : '✗'}
                    </span>
                    <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                      {task.title}
                    </span>
                  </div>
                  {row.is_correct && (
                    <span className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>
                      +{task.xp_reward} XP
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { href: '/tasks',     label: tNav('tasks'),     icon: '📝' },
          { href: '/materials', label: tNav('materials'), icon: '📚' },
          { href: '/analytics', label: tNav('analytics'), icon: '📊' },
        ].map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className="rounded-xl border px-4 py-3 text-sm font-medium text-center transition-all hover:shadow-md hover:-translate-y-0.5"
            style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
          >
            {icon} {label}
          </Link>
        ))}
      </div>

    </div>
  )
}
