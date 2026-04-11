import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const t = await getTranslations('gamification')

  const { data: leaders } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, xp, level')
    .order('xp', { ascending: false })
    .limit(20)

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
        {t('leaderboard')}
      </h1>

      <div
        className="rounded-2xl border overflow-hidden"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        {(leaders ?? []).map((p, i) => {
          const isMe = p.id === user.id
          const rankEmoji = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null
          const displayName = p.full_name ?? '—'

          return (
            <div
              key={p.id}
              className="flex items-center gap-4 px-5 py-3 border-b last:border-b-0 transition-colors"
              style={{
                borderColor: 'var(--border)',
                background: isMe ? 'color-mix(in srgb, var(--primary) 8%, transparent)' : 'transparent',
              }}
            >
              {/* Rank */}
              <span
                className="text-sm font-bold w-7 text-center shrink-0"
                style={{ color: rankEmoji ? 'var(--foreground)' : 'var(--muted-foreground)' }}
              >
                {rankEmoji ?? `#${i + 1}`}
              </span>

              {/* Avatar */}
              {p.avatar_url ? (
                <img
                  src={p.avatar_url}
                  alt={displayName}
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
                >
                  {(p.full_name?.[0] ?? '?').toUpperCase()}
                </div>
              )}

              {/* Name */}
              <span
                className="flex-1 text-sm font-medium truncate"
                style={{ color: isMe ? 'var(--primary)' : 'var(--foreground)' }}
              >
                {displayName}
                {isMe && ` ${t('you')}`}
              </span>

              {/* Level + XP */}
              <div className="text-right shrink-0">
                <p className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>
                  {p.xp} XP
                </p>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  {t('level')} {p.level}
                </p>
              </div>
            </div>
          )
        })}

        {(!leaders || leaders.length === 0) && (
          <p className="text-sm text-center py-10" style={{ color: 'var(--muted-foreground)' }}>
            —
          </p>
        )}
      </div>
    </div>
  )
}
