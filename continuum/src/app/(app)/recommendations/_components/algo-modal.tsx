'use client'

/* Algorithm modal — explains how the recommendation score (urgency, difficulty, novelty) is computed. */

import { useState, useRef, useCallback, useEffect } from 'react'
import { Info } from 'lucide-react'

export interface AlgoSignal {
  label: string
  maxPts: number
  ptsLabel: string
  tone: string
  desc: string
}

export interface AlgoStrings {
  ariaLabel: string
  title: string
  desc: string
  signals: AlgoSignal[]
  footnote: string
}

export function AlgoInfoButton({ strings }: { strings: AlgoStrings }) {
  const [open, setOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }, [])

  const scheduleClose = useCallback(() => {
    closeTimer.current = setTimeout(() => setOpen(false), 150)
  }, [])

  /* close on click-outside (mobile / keyboard) */
  useEffect(() => {
    if (!open) return
    function onOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [open])

  return (
    <div
      ref={wrapperRef}
      className="relative"
      onMouseEnter={() => { cancelClose(); setOpen(true) }}
      onMouseLeave={scheduleClose}
    >
      {/* trigger */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-label={strings.ariaLabel}
        aria-expanded={open}
        className="inline-flex h-7 w-7 items-center justify-center rounded-full border transition-colors hover:bg-[color-mix(in_srgb,var(--primary)_8%,var(--card))]"
        style={{ borderColor: 'var(--border)', color: open ? 'var(--primary)' : 'var(--muted-foreground)' }}
      >
        <Info size={14} />
      </button>

      {/* popover */}
      {open && (
        <div
          className="absolute right-0 top-9 z-50 w-[320px] rounded-2xl border p-5 shadow-xl"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          {/* arrow caret */}
          <div
            className="absolute -top-[5px] right-[9px] h-[9px] w-[9px] rotate-45 border-l border-t"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          />

          <p className="text-[13px] font-bold tracking-[-0.2px]" style={{ color: 'var(--foreground)' }}>
            {strings.title}
          </p>
          <p className="mt-0.5 mb-4 text-[11.5px] leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
            {strings.desc}
          </p>

          <div className="flex flex-col gap-3">
            {strings.signals.map(s => (
              <div key={s.label}>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-[12px] font-semibold" style={{ color: 'var(--foreground)' }}>
                    {s.label}
                  </span>
                  <span className="flex-none text-[10.5px] tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
                    {s.ptsLabel}
                  </span>
                </div>
                <div className="mb-1 h-[3px] overflow-hidden rounded-full" style={{ background: 'var(--muted)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.round((s.maxPts / 115) * 100)}%`, background: s.tone }}
                  />
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>

          <p
            className="mt-4 rounded-xl border px-3 py-2 text-[11px] leading-relaxed"
            style={{
              borderColor: 'color-mix(in srgb, var(--border) 70%, transparent)',
              background: 'var(--muted)',
              color: 'var(--muted-foreground)',
            }}
          >
            {strings.footnote}
          </p>
        </div>
      )}
    </div>
  )
}
