/* Personalized greeting with inline stats strip.
   Server component — receives data as props. */

import { getTranslations } from 'next-intl/server'

interface HeroProps {
  firstName: string
  dateLabel: string          // "Friday · 22 May"
  encouragement?: string     // plain text (translated by page)
  streakDays: number
  todayDone: number
  todayTotal: number
  focusMinutesToday: number
}

export async function Hero({
  firstName,
  dateLabel,
  encouragement,
  streakDays,
  todayDone,
  todayTotal,
  focusMinutesToday,
}: HeroProps) {
  const t = await getTranslations('dashboard')

  const focusH = Math.floor(focusMinutesToday / 60)
  const focusM = focusMinutesToday % 60
  const focusValue = focusH > 0 ? `${focusH}г ${focusM}` : `${focusM}`

  const stats = [
    { label: t('streakLabel'),  value: String(streakDays),            sub: t('streakUnit') },
    { label: t('todayLabel'),   value: `${todayDone}/${todayTotal}`,  sub: t('todayUnit') },
    { label: t('focusLabel'),   value: focusValue,                    sub: t('focusUnit') },
  ]

  return (
    <section className="mb-7 flex items-center gap-8">
      <div className="flex-1">
        <div className="mb-1.5 text-xs tracking-wide" style={{ color: 'color-mix(in srgb, var(--muted-foreground) 70%, transparent)' }}>
          {dateLabel}
        </div>
        <h1
          className="m-0 text-[38px] font-semibold leading-[1.1] tracking-[-0.8px]"
          style={{ color: 'var(--foreground)' }}
        >
          {t('greetingPrefix')}{' '}
          <span
            className="font-normal"
            style={{
              fontFamily: '"Instrument Serif", Georgia, serif',
              fontStyle: 'italic',
              color: 'var(--primary)',
            }}
          >
            {firstName}.
          </span>
        </h1>
        {encouragement && (
          <p
            className="mt-2 text-sm"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {encouragement}
          </p>
        )}
      </div>

      <ul
        className="flex items-stretch overflow-hidden rounded-xl border"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        {stats.map((s, i) => (
          <li
            key={s.label}
            className="flex min-w-[92px] flex-col justify-center px-[18px] py-3"
            style={{
              borderRight: i < stats.length - 1 ? '1px solid var(--border)' : 'none',
            }}
          >
            <div
              className="text-[10.5px] font-semibold uppercase tracking-wider"
              style={{ color: 'color-mix(in srgb, var(--muted-foreground) 70%, transparent)' }}
            >
              {s.label}
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span
                className="text-[22px] font-bold leading-none tracking-tight tabular-nums"
                style={{ color: 'var(--foreground)' }}
              >
                {s.value}
              </span>
              <span className="text-[11px]" style={{ color: 'color-mix(in srgb, var(--muted-foreground) 70%, transparent)' }}>
                {s.sub}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
