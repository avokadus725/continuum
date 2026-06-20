'use client'

/* Pomodoro round indicator – N dots, current one elongated, completed muted. */

import { useTranslations } from 'next-intl'

interface Props {
  current: number
  total: number
  phase: 'work' | 'break' | 'idle'
}

export function PomodoroDots({ current, total, phase }: Props) {
  const t     = useTranslations('focus')
  const color = phase === 'break' ? '#5BD4A4' : '#7AB6EE'

  const phaseLabel =
    phase === 'break' ? t('break') :
    phase === 'idle'  ? t('ready') :
    t('work')

  return (
    <div className="flex flex-col items-center gap-3.5">
      <div
        className="text-[11px] font-bold uppercase tracking-[3.6px]"
        style={{ color }}
      >
        {phaseLabel}
      </div>

      <div className="flex items-center gap-2.5">
        {Array.from({ length: total }).map((_, i) => {
          const isCurrent = i === current - 1
          const isDone    = i <  current - 1
          return (
            <span
              key={i}
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width:      isCurrent ? 28 : 8,
                background: isDone ? color : isCurrent ? color : 'rgba(255,255,255,0.22)',
                opacity:    isDone ? 0.55 : 1,
              }}
            />
          )
        })}
      </div>

      <div className="text-xs" style={{ color: 'rgba(255,255,255,0.48)' }}>
        {t('sessionCounter', { n: current, total })}
      </div>
    </div>
  )
}
