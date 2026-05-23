'use client'

/* End-of-session reflection panel.
   Shows summary + mood picker, then proceeds back to idle. */

import { Play } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface Props {
  pomodorosCompleted: number
  totalSessions: number
  focusSeconds: number
  mood: number | null
  onMood: (n: number) => void
  onAnother: () => void
  onExit: () => void
}

const MOOD_EMOJI = ['😞', '😐', '🙂', '😊', '🤩']

export function ReflectionPanel({
  pomodorosCompleted, totalSessions, focusSeconds, mood, onMood, onAnother, onExit,
}: Props) {
  const t = useTranslations('focus')

  const h = Math.floor(focusSeconds / 3600)
  const m = Math.floor((focusSeconds % 3600) / 60)
  const formatted = h > 0
    ? t('focusTimeH', { h, m })
    : t('focusTimeM', { m })

  return (
    <div
      className="rounded-[20px] border p-7 text-center backdrop-blur-2xl"
      style={{
        width: 460,
        background: 'rgba(12, 18, 14, 0.85)',
        borderColor: 'rgba(255,255,255,0.12)',
        boxShadow: '0 30px 80px -10px rgba(0,0,0,0.6)',
      }}
    >
      <div
        className="mb-3.5 text-[11px] font-bold uppercase tracking-[3.2px]"
        style={{ color: '#5BD4A4' }}
      >
        {t('reflectionDone', { completed: pomodorosCompleted, total: totalSessions })}
      </div>

      <h2
        className="m-0 text-[38px] font-semibold leading-[1.1] tracking-[-0.8px]"
        style={{ color: '#FFFFFF' }}
      >
        {t('reflectionTitle')}{' '}
        <span
          className="font-normal"
          style={{
            fontFamily: '"Instrument Serif", Georgia, serif',
            fontStyle: 'italic',
            color: '#5BD4A4',
          }}
        >{t('reflectionTitleAccent')}</span>
      </h2>

      <p
        className="mt-3 text-sm"
        style={{ color: 'rgba(255,255,255,0.72)', lineHeight: 1.5 }}
      >
        {t('reflectionFocusTime')}{' '}
        <span className="font-semibold" style={{ color: '#FFFFFF' }}>{formatted}</span>
        {' · '}{t('reflectionSessions', { n: pomodorosCompleted })}
      </p>

      <div
        className="mt-5 rounded-xl border p-3.5"
        style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.12)' }}
      >
        <div
          className="mb-1.5 text-[11px] font-semibold uppercase tracking-[1px]"
          style={{ color: 'rgba(255,255,255,0.48)' }}
        >
          {t('reflectionMoodLabel')}
        </div>
        <div className="flex justify-center gap-2.5">
          {MOOD_EMOJI.map((e, i) => {
            const isActive = i === mood
            return (
              <button
                key={i}
                onClick={() => onMood(i)}
                aria-label={`${i + 1}`}
                className="grid h-10 w-10 place-items-center rounded-full border text-lg"
                style={{
                  background: isActive ? 'rgba(91,212,164,0.15)' : 'transparent',
                  borderColor: isActive ? '#5BD4A4' : 'rgba(255,255,255,0.12)',
                }}
              >{e}</button>
            )
          })}
        </div>
      </div>

      <div className="mt-5 flex gap-2.5">
        <button
          onClick={onExit}
          className="flex h-11 flex-1 items-center justify-center rounded-xl border text-[13px] font-medium"
          style={{
            background: 'transparent', borderColor: 'rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.72)',
          }}
        >{t('backHome')}</button>
        <button
          onClick={onAnother}
          className="flex h-11 flex-[2] items-center justify-center gap-2 rounded-xl border-0 text-[13.5px] font-bold"
          style={{ background: '#5BD4A4', color: '#0c1812' }}
        >
          <Play className="h-4 w-4" fill="currentColor" />
          {t('reflectionAnother')}
        </button>
      </div>
    </div>
  )
}
