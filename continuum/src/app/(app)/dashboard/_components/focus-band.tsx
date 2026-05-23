/* Focus accent band.
   NOT an interactive timer — pure navigation accent to /focus.
   Three states: 'running' (active session somewhere), 'paused', 'idle'. */

import Link from 'next/link'
import { Timer, ArrowRight } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

type FocusState =
  | { state: 'running'; time: string; progress: number; session: number; total: number }
  | { state: 'paused';  time: string; progress: number; session: number; total: number }
  | { state: 'idle'; workMin: number; breakMin: number }

interface FocusBandProps {
  focus: FocusState
}

export async function FocusBand({ focus }: FocusBandProps) {
  const t = await getTranslations('dashboard')

  const cfg = (() => {
    if (focus.state === 'running') {
      return {
        eyebrow: t('focusEyebrowWork'),
        dotColor: '#D45050', pulse: true,
        status: t('focusRunning', { n: focus.session, total: focus.total }),
        time: focus.time, progress: focus.progress,
        cta: t('focusCtaReturn'),
      }
    }
    if (focus.state === 'paused') {
      return {
        eyebrow: t('focusEyebrowWork'),
        dotColor: '#C2956C', pulse: false,
        status: t('focusPaused', { n: focus.session, total: focus.total }),
        time: focus.time, progress: focus.progress,
        cta: t('focusCtaResume'),
      }
    }
    const workMin  = focus.state === 'idle' ? focus.workMin  : 25
    const breakMin = focus.state === 'idle' ? focus.breakMin : 5
    return {
      eyebrow: t('focusEyebrowRoom'),
      dotColor: 'var(--muted-foreground)', pulse: false,
      status: t('focusIdle', { work: workMin, rest: breakMin }),
      time: `${String(workMin).padStart(2, '0')}:00`, progress: 0,
      cta: t('focusCtaStart'),
    }
  })()

  return (
    <Link
      href="/focus"
      className="relative mb-7 flex items-center gap-6 overflow-hidden rounded-2xl border px-6 py-4 pl-[26px] no-underline transition-colors hover:border-[color-mix(in_srgb,var(--primary)_30%,var(--border))]"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      {/* primary accent strip */}
      <span
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ background: 'var(--primary)' }}
        aria-hidden
      />

      {/* eyebrow + status */}
      <div className="flex min-w-[220px] flex-col gap-1.5">
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
              display: 'inline-block', width: 6, height: 6, borderRadius: 999,
              background: cfg.dotColor,
            }}
          />
          {cfg.status}
        </div>
      </div>

      {/* big timer (display only) */}
      <div className="flex flex-1 flex-col items-center">
        <div
          className="text-[38px] font-semibold leading-none tracking-[-1.4px] tabular-nums"
          style={{ color: 'var(--foreground)' }}
        >
          {cfg.time}
        </div>
        <div
          className="mt-2.5 h-[3px] w-[220px] overflow-hidden rounded-full"
          style={{ background: 'var(--muted)' }}
        >
          <div className="h-full" style={{ width: `${cfg.progress}%`, background: 'var(--primary)' }} />
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
