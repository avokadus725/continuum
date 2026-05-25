/* Weekly focus-time chart. Server component. */

import Link from 'next/link'
import { getTranslations, getLocale } from 'next-intl/server'

interface Props {
  /** Minutes per weekday — index 0 = Monday … 6 = Sunday. Length 7. */
  perDay: number[]
  /** Index 0..6 of the day to highlight (usually today). */
  todayIndex?: number
}

/** Returns 7 short weekday labels starting on Monday, localised. */
function weekdayLabels(locale: string): string[] {
  // January 1, 2024 = Monday — safe anchor date
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(2024, 0, 1 + i)
    return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(d)
  })
}

const BAR_H = 68 // px available for bars (label row ~20px makes total ~88px)

export async function WeeklyChartCard({ perDay, todayIndex }: Props) {
  const [t, locale] = await Promise.all([getTranslations('dashboard'), getLocale()])

  const total   = perDay.reduce((a, b) => a + b, 0)
  const max     = Math.max(...perDay, 1)
  const hours   = Math.floor(total / 60)
  const minutes = total % 60
  const WEEKDAYS = weekdayLabels(locale)

  const totalLabel = total < 60
    ? t('weeklyFocusTotalMin', { minutes: total })
    : t('weeklyFocusTotal', { hours, minutes })

  return (
    <section
      className="rounded-xl border p-4"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      <header className="flex items-center justify-between">
        <h3 className="m-0 text-[13px] font-semibold tracking-[-0.1px]" style={{ color: 'var(--foreground)' }}>
          {t('weeklyTitle')}
        </h3>
        <Link href="/analytics" className="text-[11.5px] no-underline" style={{ color: 'var(--primary)' }}>
          {t('weeklyDetails')}
        </Link>
      </header>
      <div className="mt-1 text-[11.5px]" style={{ color: 'var(--muted-foreground)' }}>
        {totalLabel}
      </div>

      {/* Bar chart — pixel heights so bars render correctly in flex layout */}
      <div className="mt-3.5 flex items-end gap-1.5">
        {perDay.map((val, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
            <div
              className="w-full rounded-[3px] transition-all"
              style={{
                height: `${(val / max) * BAR_H}px`,
                minHeight: val > 0 ? 3 : 0,
                background: i === todayIndex ? 'var(--primary)' : 'var(--muted)',
              }}
            />
            <span className="text-[10px]" style={{ color: 'color-mix(in srgb, var(--muted-foreground) 70%, transparent)' }}>
              {WEEKDAYS[i]}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
