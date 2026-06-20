'use client'

/* Floating focus-timer pill – appears on all non-focus pages while
   a session is minimized (user clicked "Browse & return later").
   Polls localStorage once per second and counts down in real time.
   Clicking the pill navigates back to /focus, where the session is restored. */

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Timer } from 'lucide-react'
import { readFocusLive, writeFocusLive, computeSecondsLeft, type FocusLive } from '@/lib/focus-live-store'

function pad(n: number) { return String(n).padStart(2, '0') }

const ACCENT = '#5BD4A4'   // matches the reflection panel green

export function FocusFloatingTimer() {
  const pathname = usePathname()
  const router   = useRouter()
  const t        = useTranslations('focus')

  const [live, setLive]           = useState<FocusLive | null>(null)
  const [displaySecs, setDisplay] = useState(0)

  useEffect(() => {
    function tick() {
      const l = readFocusLive()
      if (!l?.isMinimized) { setLive(null); return }

      const sLeft = computeSecondsLeft(l)

      // Phase ended while browsing away – advance to next phase automatically
      if (l.isRunning && sLeft <= 0) {
        let next: FocusLive
        if (l.phase === 'work') {
          const nextPomos = l.pomodorosCompleted + 1
          // Credit all remaining work seconds to the accumulator
          const newFocusSeconds = l.focusSeconds + l.secondsLeft
          if (nextPomos >= l.targetSessions) {
            // All sessions done – stop the session
            next = { ...l, isRunning: false, secondsLeft: 0, focusSeconds: newFocusSeconds, updatedAt: Date.now() }
          } else {
            // Work done → start break
            next = {
              ...l,
              phase: 'break',
              secondsLeft: l.breakMin * 60,
              pomodorosCompleted: nextPomos,
              focusSeconds: newFocusSeconds,
              updatedAt: Date.now(),
            }
          }
        } else {
          // Credit remaining break seconds and start next work block
          const newBreakSeconds = l.breakSeconds + l.secondsLeft
          next = { ...l, phase: 'work', secondsLeft: l.workMin * 60, breakSeconds: newBreakSeconds, updatedAt: Date.now() }
        }
        writeFocusLive(next)
        setLive(next)
        setDisplay(next.isRunning ? next.secondsLeft : 0)
        return
      }

      setLive(l)
      setDisplay(sLeft)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // Hidden while on the focus page, and when no minimized session
  if (!live || pathname === '/focus') return null

  const mins   = Math.floor(displaySecs / 60)
  const secs   = displaySecs % 60
  const isWork = live.phase === 'work'

  return (
    <button
      onClick={() => router.push('/focus')}
      title={t('floatingReturn')}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-4 py-3 transition-all hover:scale-[1.03] active:scale-[0.98]"
      style={{
        background:              'rgba(12,18,14,0.92)',
        border:                  '1px solid rgba(255,255,255,0.13)',
        boxShadow:               '0 16px 48px -8px rgba(0,0,0,0.5)',
        backdropFilter:          'blur(14px)',
        WebkitBackdropFilter:    'blur(14px)',
        color:                   'white',
      }}
    >
      {/* Phase dot with pulse on active work */}
      <span
        className="relative flex h-9 w-9 flex-none items-center justify-center rounded-full"
        style={{ background: isWork ? 'rgba(91,212,164,0.18)' : 'rgba(255,255,255,0.07)' }}
      >
        {isWork && live.isRunning && (
          <span
            className="absolute inset-0 animate-ping rounded-full"
            style={{ background: 'rgba(91,212,164,0.22)', animationDuration: '2.4s' }}
          />
        )}
        <Timer
          className="relative h-4 w-4"
          style={{ color: isWork ? ACCENT : 'rgba(255,255,255,0.48)' }}
        />
      </span>

      {/* Label + countdown */}
      <div className="min-w-0">
        <div
          className="text-[10px] font-bold uppercase tracking-[2px]"
          style={{ color: isWork ? ACCENT : 'rgba(255,255,255,0.42)' }}
        >
          {live.isRunning
            ? (isWork ? t('work') : t('break'))
            : t('floatingPaused')}
          {' · '}{live.pomodorosCompleted + 1}/{live.targetSessions}
        </div>
        <div
          className="font-mono text-[22px] font-bold leading-tight tabular-nums"
          style={{ color: '#fff', letterSpacing: '-0.5px' }}
        >
          {pad(mins)}:{pad(secs)}
        </div>
      </div>

      {/* Intention text – shown on wider screens */}
      {live.intention && (
        <div
          className="ml-0.5 hidden max-w-[130px] truncate text-[12px] sm:block"
          style={{ color: 'rgba(255,255,255,0.42)' }}
        >
          {live.intention}
        </div>
      )}
    </button>
  )
}
