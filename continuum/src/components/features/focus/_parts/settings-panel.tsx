'use client'

/* Settings panel (modal). */

import { Bell } from 'lucide-react'
import { useTranslations } from 'next-intl'

export type TimerMode = 'pomodoro' | 'custom'

export interface FocusSettings {
  mode: TimerMode
  workMin: number
  breakMin: number
  targetSessions: number
  endChime: boolean
}

const POMODORO_DEFAULTS = { workMin: 25, breakMin: 5, targetSessions: 4 }
const LS_KEY = 'focus-custom-settings'

interface Props {
  value: FocusSettings
  onChange: (v: FocusSettings) => void
  onCancel: () => void
  onApply: () => void
}

export function SettingsPanel({ value, onChange, onCancel, onApply }: Props) {
  const t = useTranslations('focus')

  /* ── Mode switching with localStorage restore ── */
  function handleModeChange(newMode: TimerMode) {
    if (newMode === 'pomodoro') {
      onChange({ ...value, mode: 'pomodoro', ...POMODORO_DEFAULTS })
    } else {
      try {
        const saved = JSON.parse(localStorage.getItem(LS_KEY) || '{}')
        onChange({
          ...value,
          mode: 'custom',
          workMin:        saved.workMin        ?? value.workMin,
          breakMin:       saved.breakMin       ?? value.breakMin,
          targetSessions: saved.targetSessions ?? value.targetSessions,
        })
      } catch {
        onChange({ ...value, mode: 'custom' })
      }
    }
  }

  /* ── Apply — persist custom settings ── */
  function handleApply() {
    if (value.mode === 'custom') {
      try {
        localStorage.setItem(LS_KEY, JSON.stringify({
          workMin: value.workMin,
          breakMin: value.breakMin,
          targetSessions: value.targetSessions,
        }))
      } catch { /* storage unavailable */ }
    }
    onApply()
  }

  return (
    <div
      className="rounded-[20px] border p-7 backdrop-blur-2xl"
      style={{
        width: 420,
        background: 'rgba(12, 18, 14, 0.85)',
        borderColor: 'rgba(255,255,255,0.12)',
        boxShadow: '0 30px 80px -10px rgba(0,0,0,0.6)',
      }}
    >
      <div className="mb-5 flex items-baseline gap-2.5">
        <span
          className="text-[18px]"
          style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: 'italic', color: '#7AB6EE' }}
        >i.</span>
        <h2
          className="m-0 text-[20px] font-semibold tracking-tight"
          style={{ color: '#FFFFFF' }}
        >{t('settingsTitle')}</h2>
      </div>

      {/* ── Mode picker ── */}
      <Group label={t('mode')}>
        <div
          className="flex rounded-[10px] border p-[3px]"
          style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.12)' }}
        >
          {(['pomodoro', 'custom'] as TimerMode[]).map(id => {
            const isActive = id === value.mode
            const label = id === 'pomodoro' ? t('pomodoro') : t('custom')
            return (
              <button
                key={id}
                onClick={() => handleModeChange(id)}
                className="flex-1 rounded-[7px] border-0 px-3 py-2 text-[13px] font-medium"
                style={{
                  background: isActive ? 'rgba(77,153,224,0.25)' : 'transparent',
                  color: isActive ? '#7AB6EE' : 'rgba(255,255,255,0.72)',
                }}
              >{label}</button>
            )
          })}
        </div>
      </Group>

      {/* ── Pomodoro preset card (no sliders) ── */}
      {value.mode === 'pomodoro' ? (
        <div
          className="mb-5 rounded-xl border px-4 py-4"
          style={{
            background: 'rgba(122,182,238,0.06)',
            borderColor: 'rgba(122,182,238,0.2)',
          }}
        >
          <p className="text-[15px] font-semibold" style={{ color: '#7AB6EE' }}>
            {t('pomodoroPresetDesc')}
          </p>
          <p className="mt-1 text-[12px]" style={{ color: 'rgba(255,255,255,0.42)' }}>
            {t('pomodoroPresetSub')}
          </p>
        </div>
      ) : (
        /* ── Custom sliders ── */
        <>
          <Group label={t('workDuration')}>
            <Slider
              value={value.workMin} min={5} max={90} step={5} unit={t('minutesUnit')} color="#7AB6EE"
              onChange={v => onChange({ ...value, workMin: v })}
            />
            <PresetChips
              items={[15, 25, 45, 60]} active={value.workMin} unit={t('minutesUnit')}
              onPick={v => onChange({ ...value, workMin: v })}
            />
          </Group>

          <Group label={t('breakDuration')}>
            <Slider
              value={value.breakMin} min={1} max={30} step={1} unit={t('minutesUnit')} color="#5BD4A4"
              onChange={v => onChange({ ...value, breakMin: v })}
            />
          </Group>

          <Group label={t('sessionCount')}>
            <Slider
              value={value.targetSessions} min={1} max={8} step={1} unit={t('sessionsUnit')} color="#7AB6EE"
              onChange={v => onChange({ ...value, targetSessions: v })}
            />
          </Group>
        </>
      )}

      {/* ── End chime toggle ── */}
      <div
        className="mt-1 flex items-center gap-2.5 rounded-[10px] border px-3.5 py-3 text-xs"
        style={{
          background: 'rgba(255,255,255,0.04)',
          borderColor: 'rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.72)',
        }}
      >
        <Bell className="h-4 w-4" style={{ color: '#FFD16A' }} />
        {t('endChimeLabel')}
        <span className="flex-1" />
        <ToggleBtn on={value.endChime} onChange={v => onChange({ ...value, endChime: v })} />
      </div>

      <div className="mt-6 flex gap-2.5">
        <button
          onClick={onCancel}
          className="flex h-11 flex-1 items-center justify-center rounded-xl border text-[13px] font-medium"
          style={{
            background: 'transparent', borderColor: 'rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.72)',
          }}
        >{t('cancel')}</button>
        <button
          onClick={handleApply}
          className="flex h-11 flex-[2] items-center justify-center rounded-xl border-0 text-[13.5px] font-semibold"
          style={{ background: '#4D99E0', color: '#FFFFFF' }}
        >{t('apply')}</button>
      </div>
    </div>
  )
}

/* ─── helpers ─── */

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div
        className="mb-2.5 text-[11px] font-semibold uppercase tracking-[1.2px]"
        style={{ color: 'rgba(255,255,255,0.48)' }}
      >{label}</div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  )
}

function Slider({ value, min, max, step, unit, color, onChange }: { value: number; min: number; max: number; step: number; unit: string; color: string; onChange: (v: number) => void }) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className="flex items-center gap-3.5 py-1">
      <div className="relative h-1 flex-1 rounded-full" style={{ background: 'rgba(255,255,255,0.12)' }}>
        <div className="absolute h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full cursor-pointer opacity-0"
          aria-label={unit}
        />
        <span
          className="absolute -top-1.5 h-3.5 w-3.5 rounded-full"
          style={{ left: `calc(${pct}% - 7px)`, background: '#FFFFFF', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}
        />
      </div>
      <span
        className="w-[60px] text-right text-[13px] font-semibold"
        style={{ color: '#FFFFFF' }}
      >{value} {unit}</span>
    </div>
  )
}

function PresetChips({ items, active, unit, onPick }: { items: number[]; active: number; unit: string; onPick: (v: number) => void }) {
  return (
    <div className="mt-1 flex gap-1.5">
      {items.map(v => {
        const isActive = v === active
        return (
          <button
            key={v} onClick={() => onPick(v)}
            className="rounded-full border px-2.5 py-1 text-[11px] font-semibold"
            style={{
              background: isActive ? 'rgba(122,182,238,0.18)' : 'transparent',
              borderColor: isActive ? '#7AB6EE' : 'rgba(255,255,255,0.12)',
              color: isActive ? '#7AB6EE' : 'rgba(255,255,255,0.48)',
            }}
          >{v} {unit}</button>
        )
      })}
    </div>
  )
}

function ToggleBtn({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      aria-pressed={on}
      className="flex items-center rounded-full p-0.5 transition-colors"
      style={{
        width: 30, height: 18,
        background: on ? '#7AB6EE' : 'rgba(255,255,255,0.15)',
        justifyContent: on ? 'flex-end' : 'flex-start',
      }}
    >
      <span className="block h-3.5 w-3.5 rounded-full bg-white" />
    </button>
  )
}
