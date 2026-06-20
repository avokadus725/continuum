'use client'

/* Focus accent band – live-aware client component.
   Reads localStorage every second.
   - Minimized session active → shows live countdown, progress bar, "Return to room"
   - Idle                     → shows static 25:00 with "Start session" */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Timer, ArrowRight } from 'lucide-react'
import { readFocusLive, computeSecondsLeft, type FocusLive } from '@/lib/focus-live-store'

function pad(n: number) { return String(n).padStart(2, '0') }
function fmt(s: number)  { return `${pad(Math.floor(s / 60))}:${pad(s % 60)}` }

export function FocusBand() {
  const t = useTranslations('dashboard')

  // Start null so first (server) render is always idle – no hydration mismatch.
  const [live, setLive]           = useState<FocusLive | null>(null)
  const [displaySecs, setDisplay] = useState(0)

  useEffect(() => {
    function tick() {
      const l = readFocusLive()
      if (!l?.isMinimized) { setLive(null); return }
      setLive(l)
      setDisplay(computeSecondsLeft(l))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const isWork = live?.phase === 'work'
  const totalSecs = live
    ? (isWork ? live.workMin * 60 : live.breakMin * 60)
    : 25 * 60
  const progress = live ? Math.min(100, (1 - displaySecs / totalSecs) * 100) : 0

  const cfg = live
    ? {
        eyebrow:  t(isWork ? 'focusEyebrowWork' : 'focusEyebrowRoom'),
        dotColor: live.isRunning && isWork ? '#D45050' : '#C2956C',
        pulse:    live.isRunning && isWork,
        status:   live.isRunning
                    ? t('focusRunning', { n: live.pomodorosCompleted + 1, total: live.targetSessions })
                    : t('focusPaused',  { n: live.pomodorosCompleted + 1, total: live.targetSessions }),
        time:     fmt(displaySecs),
        cta:      t('focusCtaReturn'),
      }
    : {
        eyebrow:  t('focusEyebrowRoom'),
        dotColor: 'var(--muted-foreground)',
        pulse:    false,
        status:   t('focusIdle', { work: 25, rest: 5 }),
        time:     '25:00',
        cta:      t('focusCtaStart'),
      }

  return (
    <Link
      href="/focus"
      className="relative mb-7 flex flex-col items-start gap-4 overflow-hidden rounded-2xl border px-6 py-4 pl-[26px] no-underline transition-colors hover:border-[color-mix(in_srgb,var(--primary)_30%,var(--border))] sm:flex-row sm:items-center sm:gap-6"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      {/* left accent strip */}
      <span
        className="absolute bottom-0 left-0 top-0 w-[3px]"
        style={{ background: 'var(--primary)' }}
        aria-hidden
      />

      {/* eyebrow + status */}
      <div className="flex flex-col gap-1.5 sm:min-w-[220px]">
        <div
          className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[1.4px]"
          style={{ color: 'var(--primary)' }}
        >
          <Timer size={14} />
          {cfg.eyebrow}
        </div>
        <div
          className="inline-flex items-center gap-2 text-[13px]"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <span
            className={cfg.pulse ? 'cont-pulse' : ''}
            style={{
              display: 'inline-block', width: 6, height: 6,
              borderRadius: 999, background: cfg.dotColor,
            }}
          />
          {cfg.status}
        </div>
      </div>

      {/* big live timer */}
      <div className="flex w-full flex-1 flex-col items-center sm:w-auto">
        <div
          className="text-[38px] font-semibold leading-none tracking-[-1.4px] tabular-nums"
          style={{ color: 'var(--foreground)' }}
        >
          {cfg.time}
        </div>
        <div
          className="mt-2.5 h-[3px] w-full max-w-[220px] overflow-hidden rounded-full"
          style={{ background: 'var(--muted)' }}
        >
          <div
            className="h-full transition-[width] duration-700"
            style={{ width: `${progress}%`, background: 'var(--primary)' }}
          />
        </div>
      </div>

      {/* CTA */}
      <div
        className="inline-flex items-center gap-2 text-[13px] font-semibold"
        style={{ color: 'var(--primary)' }}
      >
        {cfg.cta}
        <ArrowRight size={16} />
      </div>

      <style>{`
        @keyframes cont-pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.35 } }
        .cont-pulse { animation: cont-pulse 1.6s ease-in-out infinite; }
      `}</style>
    </Link>
  )
}
