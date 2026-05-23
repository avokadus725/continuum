/* Leaderboard widget with the user's XP + level + rank integrated.
   Server component. */

import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

interface LeaderRow {
  rank: number
  name: string
  xp: number
  avatarUrl?: string | null
}

interface Props {
  level: number
  xp: number
  xpForNextLevel: number
  yourRank: number
  nextRank: number | null
  xpGapToNextRank: number | null
  topThree: LeaderRow[]
  you: LeaderRow
}

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

export async function LeaderboardCard({
  level, xp, xpForNextLevel, yourRank, nextRank, xpGapToNextRank, topThree, you,
}: Props) {
  const t = await getTranslations('dashboard')

  const pct = Math.min(100, Math.round((xp / xpForNextLevel) * 100))
  const xpToLevel = Math.max(0, xpForNextLevel - xp)
  const nextLevelLabel = ROMAN[level + 1] || String(level + 1)
  const youLabel = t('youLabel')

  return (
    <section
      className="rounded-xl border p-4"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      <header className="flex items-center justify-between">
        <h3 className="m-0 text-[13px] font-semibold tracking-[-0.1px]" style={{ color: 'var(--foreground)' }}>
          {t('leaderboardTitle')}
        </h3>
        <Link href="/gamification" className="text-[11.5px] no-underline" style={{ color: 'var(--primary)' }}>
          {t('leaderboardAll')}
        </Link>
      </header>

      {/* Your XP / Level / Rank */}
      <div
        className="mt-3.5 rounded-[10px] border p-3"
        style={{
          background: 'color-mix(in srgb, var(--primary) 8%, transparent)',
          borderColor: 'color-mix(in srgb, var(--border) 60%, transparent)',
        }}
      >
        <div className="flex items-baseline justify-between">
          <div
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: 'color-mix(in srgb, var(--muted-foreground) 70%, transparent)' }}
          >
            {t('levelLabel')}{' '}
            <span
              className="ml-0.5 text-[14px] normal-case"
              style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: 'italic', fontWeight: 400, color: 'var(--primary)' }}
            >
              {ROMAN[level] || level}
            </span>
          </div>
          <div className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
            <span className="text-[14px] font-bold tabular-nums" style={{ color: 'var(--foreground)' }}>{xp}</span>
            <span style={{ color: 'color-mix(in srgb, var(--muted-foreground) 70%, transparent)' }}> / {xpForNextLevel} XP</span>
          </div>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full" style={{ background: 'var(--muted)' }}>
          <div className="h-full" style={{ width: `${pct}%`, background: 'var(--primary)' }} />
        </div>
        <div
          className="mt-2 flex justify-between text-[11px]"
          style={{ color: 'color-mix(in srgb, var(--muted-foreground) 70%, transparent)' }}
        >
          <span>{t('rankInStream', { rank: yourRank })}</span>
          <span>{t('xpToNextLevel', { xp: xpToLevel, level: nextLevelLabel })}</span>
        </div>
      </div>

      {/* Top 3 */}
      <ul className="mt-3.5 flex flex-col gap-0.5">
        {topThree.map(r => <LeaderItem key={r.rank} row={r} youLabel={youLabel} />)}
        <li className="mx-1 my-1.5 h-px" style={{ background: 'color-mix(in srgb, var(--border) 60%, transparent)' }} />
        <LeaderItem row={you} you youLabel={youLabel} />
      </ul>

      {nextRank != null && xpGapToNextRank != null && (
        <p className="mt-1 text-[11px]" style={{ color: 'color-mix(in srgb, var(--muted-foreground) 70%, transparent)' }}>
          {t('xpToNextRank', { xp: xpGapToNextRank, rank: nextRank })}
        </p>
      )}
    </section>
  )
}

function LeaderItem({ row, you, youLabel }: { row: LeaderRow; you?: boolean; youLabel: string }) {
  const initial = row.name.charAt(0).toUpperCase()
  return (
    <li className="flex items-center gap-2.5 px-1 py-1.5">
      <span
        className="w-[18px] text-right text-[11.5px] tabular-nums"
        style={{
          fontWeight: you ? 700 : 600,
          color: you ? 'var(--primary)' : 'color-mix(in srgb, var(--muted-foreground) 70%, transparent)',
        }}
      >
        {row.rank}
      </span>
      {row.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={row.avatarUrl} alt="" className="h-[22px] w-[22px] rounded-full object-cover" />
      ) : (
        <div
          className="flex h-[22px] w-[22px] items-center justify-center rounded-full text-[10px] font-bold"
          style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
        >{initial}</div>
      )}
      <span
        className="text-[12.5px]"
        style={{
          color: you ? 'var(--primary)' : 'var(--foreground)',
          fontWeight: you ? 600 : 500,
        }}
      >
        {row.name}
      </span>
      {you && (
        <span
          className="rounded px-1.5 py-px text-[10px]"
          style={{ background: 'var(--muted)', color: 'color-mix(in srgb, var(--muted-foreground) 70%, transparent)' }}
        >{youLabel}</span>
      )}
      <span className="flex-1" />
      <span
        className="text-[12px] font-bold tabular-nums"
        style={{ color: you ? 'var(--primary)' : 'var(--foreground)' }}
      >
        {row.xp}
      </span>
    </li>
  )
}
