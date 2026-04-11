import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { ProfileEditForm } from '@/components/features/profile/profile-edit-form'
import { LanguageSwitcher } from '@/components/language-switcher'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('profile')
  return { title: t('title') }
}

const XP_PER_LEVEL = 100

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const t = await getTranslations('profile')
  const tGamification = await getTranslations('gamification')

  const [profileRes, achievementsRes, statsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('xp, level, full_name, bio, avatar_url, created_at')
      .eq('id', user.id)
      .single(),
    supabase
      .from('user_achievements')
      .select('earned_at, achievements(title, description, icon, xp_reward)')
      .eq('user_id', user.id)
      .order('earned_at', { ascending: false }),
    supabase
      .from('student_progress')
      .select('is_correct', { count: 'exact' })
      .eq('user_id', user.id),
  ])

  const profile = profileRes.data
  const userAchievements = achievementsRes.data ?? []
  const totalAttempts = statsRes.count ?? 0

  const xp = profile?.xp ?? 0
  const level = profile?.level ?? 1
  const xpInLevel = xp % XP_PER_LEVEL
  const xpProgress = Math.round((xpInLevel / XP_PER_LEVEL) * 100)

  const displayName =
    profile?.full_name ??
    user.user_metadata?.full_name ??
    user.email?.split('@')[0] ??
    null

  const avatarUrl = profile?.avatar_url ?? user.user_metadata?.avatar_url ?? null

  return (
    <div className="space-y-6 max-w-2xl">

      <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
        {t('title')}
      </h1>

      {/* Profile card */}
      <div
        className="rounded-2xl border p-6 space-y-4"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-start gap-4">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName ?? ''}
              className="w-16 h-16 rounded-full object-cover shrink-0"
            />
          ) : (
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shrink-0"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              {(displayName?.[0] ?? user.email?.[0] ?? '?').toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-lg truncate" style={{ color: 'var(--foreground)' }}>
              {displayName ?? user.email}
            </p>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              {user.email}
            </p>
            {profile?.bio && (
              <p className="text-sm mt-2 whitespace-pre-wrap" style={{ color: 'var(--muted-foreground)' }}>
                {profile.bio}
              </p>
            )}
          </div>
        </div>

        <ProfileEditForm fullName={profile?.full_name ?? null} bio={profile?.bio ?? null} />
      </div>

      {/* XP / Level */}
      <div
        className="rounded-2xl border p-5 space-y-3"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
              {tGamification('level')}
            </p>
            <p className="text-3xl font-bold" style={{ color: 'var(--primary)' }}>{level}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
              {tGamification('xp')}
            </p>
            <p className="text-3xl font-bold" style={{ color: 'var(--primary)' }}>{xp}</p>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>
            <span>{xpInLevel} / {XP_PER_LEVEL} XP</span>
            <span>{xpProgress}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--muted)' }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${xpProgress}%`, background: 'var(--primary)' }}
            />
          </div>
        </div>
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          {tGamification('achievements')}: {userAchievements.length} · {totalAttempts} спроб
        </p>
      </div>

      {/* Achievements */}
      <div
        className="rounded-2xl border p-5"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
          {tGamification('achievements')}
        </h2>
        {userAchievements.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {userAchievements.map((ua) => {
              const a = ua.achievements as { title: string; description: string; icon: string | null; xp_reward: number } | null
              if (!a) return null
              return (
                <div
                  key={ua.earned_at}
                  className="flex items-center gap-3 rounded-xl border p-3"
                  style={{ borderColor: 'var(--border)', background: 'var(--background)' }}
                >
                  <span className="text-2xl">{a.icon ?? '🏅'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                      {a.title}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      {a.description}
                    </p>
                  </div>
                  <span className="text-xs font-semibold shrink-0" style={{ color: 'var(--primary)' }}>
                    +{a.xp_reward} XP
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {tGamification('newAchievement')}
          </p>
        )}
      </div>

      {/* Language preference */}
      <div
        className="rounded-2xl border p-5 flex items-center justify-between"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
            {t('language')}
          </p>
        </div>
        <LanguageSwitcher variant="full" />
      </div>

    </div>
  )
}
