'use client'

/* Controls — Start (idle) or Pause+Skip (running). */

import { Play, Pause, SkipForward } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface Props {
  phase: 'idle' | 'work' | 'break'
  isRunning: boolean
  onStart: () => void
  onPauseResume: () => void
  onSkip: () => void
}

export function FocusControls({ phase, isRunning, onStart, onPauseResume, onSkip }: Props) {
  const t = useTranslations('focus')
  const color = phase === 'break' ? '#5BD4A4' : '#4D99E0'
  const textOnColor = phase === 'break' ? '#0c1812' : '#FFFFFF'

  if (phase === 'idle') {
    return (
      <button
        onClick={onStart}
        className="inline-flex h-14 items-center gap-3 rounded-full border-0 px-9 text-base font-semibold transition-transform hover:scale-[1.02]"
        style={{
          background: '#4D99E0', color: '#FFFFFF',
          boxShadow: '0 10px 30px -10px rgba(77,153,224,0.5)',
        }}
      >
        <Play className="h-4 w-4" fill="currentColor" />
        {t('startFocus')}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onPauseResume}
        className="inline-flex h-12 items-center gap-2.5 rounded-full border-0 px-6 text-sm font-semibold"
        style={{ background: color, color: textOnColor }}
      >
        {isRunning
          ? <Pause className="h-4 w-4" fill="currentColor" />
          : <Play  className="h-4 w-4" fill="currentColor" />
        }
        {isRunning ? t('pause') : t('resume')}
      </button>
      <button
        onClick={onSkip}
        className="inline-flex h-12 items-center gap-2 rounded-full border px-4.5 text-[13px] font-medium backdrop-blur-md"
        style={{
          background: 'rgba(15, 22, 18, 0.55)',
          borderColor: 'rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.72)',
        }}
      >
        {t('skip')}
        <SkipForward className="h-4 w-4" fill="currentColor" />
      </button>
    </div>
  )
}
