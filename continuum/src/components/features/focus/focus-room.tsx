'use client'

import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useRef, useState } from 'react'
import { saveFocusSession } from '@/app/actions/focus'
import { toast } from 'sonner'
import {
  BACKGROUND_PRESETS, SOUND_PRESETS, SOUND_TO_BG,
  DEFAULT_WORK_MINUTES, DEFAULT_BREAK_MINUTES,
} from '@/lib/focus-presets'

// ─── Types ────────────────────────────────────────────────────

type Phase = 'idle' | 'work' | 'break'
type TimerMode = 'pomodoro' | 'custom'

interface Settings {
  mode: TimerMode
  workMin: number
  breakMin: number
}

// ─── Helpers ──────────────────────────────────────────────────

function pad(n: number) { return String(n).padStart(2, '0') }

function formatSeconds(s: number) {
  const m = Math.floor(s / 60)
  return `${pad(m)}:${pad(s % 60)}`
}

function formatFocusTime(s: number) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h}г ${m}хв`
  return `${m}хв ${s % 60}с`
}

// ─── Component ────────────────────────────────────────────────

export function FocusRoom() {
  const t = useTranslations('focus')

  // Settings
  const [settings, setSettings] = useState<Settings>({
    mode: 'pomodoro',
    workMin: DEFAULT_WORK_MINUTES,
    breakMin: DEFAULT_BREAK_MINUTES,
  })
  const [showSettings, setShowSettings] = useState(false)
  const [pendingSettings, setPendingSettings] = useState<Settings>(settings)

  // Timer state
  const [phase, setPhase] = useState<Phase>('idle')
  const [secondsLeft, setSecondsLeft] = useState(settings.workMin * 60)
  const [isRunning, setIsRunning] = useState(false)

  // Session accumulators
  const [pomodorosCompleted, setPomodorosCompleted] = useState(0)
  const [focusSeconds, setFocusSeconds] = useState(0)
  const [breakSeconds, setBreakSeconds] = useState(0)
  const sessionStartRef = useRef<Date | null>(null)

  // UI
  const [bgId, setBgId] = useState(BACKGROUND_PRESETS[0].id)
  const [soundId, setSoundId] = useState('none')
  const [volume, setVolume] = useState(0.5)
  const [showBgPicker, setShowBgPicker] = useState(false)
  const [showSoundPicker, setShowSoundPicker] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const bg = BACKGROUND_PRESETS.find(b => b.id === bgId) ?? BACKGROUND_PRESETS[0]
  const sound = SOUND_PRESETS.find(s => s.id === soundId) ?? SOUND_PRESETS[0]

  /** Select a sound and auto-switch the background to the matching image.
   *  The user can still change the background manually afterwards. */
  function handleSoundChange(id: string) {
    setSoundId(id)
    const matchedBg = SOUND_TO_BG[id]
    if (matchedBg) setBgId(matchedBg)
  }

  // ── Audio ────────────────────────────────────────────────────

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.loop = true
    }
    const audio = audioRef.current
    audio.volume = volume

    if (sound.src && sound.id !== 'none') {
      if (audio.src !== window.location.origin + sound.src) {
        audio.src = sound.src
        audio.load()
      }
      if (isRunning) {
        audio.play().catch(() => {/* file not found — silent */})
      } else {
        audio.pause()
      }
    } else {
      audio.pause()
      audio.src = ''
    }
  }, [soundId, isRunning, volume, sound])

  useEffect(() => {
    return () => { audioRef.current?.pause() }
  }, [])

  // ── Notifications ─────────────────────────────────────────────

  function requestNotificationPermission() {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }

  function showNotification(title: string, body: string) {
    // In-app toast via sonner
    toast.info(`${title} — ${body}`, { duration: 4000 })

    // Browser notification
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' })
    }
  }

  // ── Phase transitions ─────────────────────────────────────────

  const transitionToBreak = useCallback(() => {
    setPomodorosCompleted(p => p + 1)
    setPhase('break')
    setSecondsLeft(settings.breakMin * 60)
    showNotification(t('notification.breakTitle'), t('notification.breakBody'))
  }, [settings.breakMin, t])

  const transitionToWork = useCallback(() => {
    setPhase('work')
    setSecondsLeft(settings.workMin * 60)
    showNotification(t('notification.workTitle'), t('notification.workBody'))
  }, [settings.workMin, t])

  // ── Countdown tick ────────────────────────────────────────────

  useEffect(() => {
    if (!isRunning || phase === 'idle') return

    const id = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          if (phase === 'work') transitionToBreak()
          else transitionToWork()
          return 0
        }
        return prev - 1
      })

      // Accumulate time
      if (phase === 'work') setFocusSeconds(s => s + 1)
      else if (phase === 'break') setBreakSeconds(s => s + 1)
    }, 1000)

    return () => clearInterval(id)
  }, [isRunning, phase, transitionToBreak, transitionToWork])

  // ── Controls ──────────────────────────────────────────────────

  function handleStart() {
    requestNotificationPermission()
    sessionStartRef.current = new Date()
    setPhase('work')
    setSecondsLeft(settings.workMin * 60)
    setFocusSeconds(0)
    setBreakSeconds(0)
    setPomodorosCompleted(0)
    setIsRunning(true)
  }

  function handlePauseResume() {
    setIsRunning(r => !r)
  }

  function handleSkip() {
    if (phase === 'work') transitionToBreak()
    else if (phase === 'break') transitionToWork()
  }

  async function handleStop(status: 'completed' | 'interrupted') {
    setIsRunning(false)
    setPhase('idle')
    setSecondsLeft(settings.workMin * 60)

    if (sessionStartRef.current && (focusSeconds > 0 || breakSeconds > 0)) {
      setIsSaving(true)
      await saveFocusSession({
        startedAt: sessionStartRef.current.toISOString(),
        endedAt: new Date().toISOString(),
        focusSeconds,
        breakSeconds,
        pomodorosCompleted,
        mode: settings.mode,
        workDurationMin: settings.workMin,
        breakDurationMin: settings.breakMin,
        status,
      })
      setIsSaving(false)
      toast.success(t('sessionSaved'))
    }

    sessionStartRef.current = null
    setFocusSeconds(0)
    setBreakSeconds(0)
    setPomodorosCompleted(0)
  }

  function applySettings() {
    setSettings(pendingSettings)
    setSecondsLeft(pendingSettings.workMin * 60)
    setShowSettings(false)
    if (phase !== 'idle') handleStop('interrupted')
  }

  // ── Fullscreen ────────────────────────────────────────────────

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }

  // ── Progress arc ──────────────────────────────────────────────

  const totalSeconds = phase === 'break'
    ? settings.breakMin * 60
    : settings.workMin * 60
  const progress = phase === 'idle' ? 0 : 1 - secondsLeft / totalSeconds
  const radius = 120
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progress)

  const phaseColor = phase === 'break' ? '#009E73' : '#4D99E0'

  // ─────────────────────────────────────────────────────────────

  return (
    <div
      ref={containerRef}
      className="relative flex-1 flex flex-col overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 z-0">
        {bg.type === 'image' && (
          <img src={bg.src} alt="" className="w-full h-full object-cover" />
        )}
        {bg.type === 'video' && (
          <video src={bg.src} autoPlay loop muted className="w-full h-full object-cover" />
        )}
        {/* Overlay */}
        <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.45)' }} />
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3 md:px-6 md:py-4">
        <span className="hidden sm:block text-white/70 text-sm font-medium tracking-widest uppercase">
          {t('title')}
        </span>
        <div className="flex items-center gap-2 ml-auto">
          {phase !== 'idle' && (
            <button
              onClick={() => handleStop('interrupted')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/70 border border-white/20 hover:bg-white/10 transition-colors"
            >
              {t('stop')}
            </button>
          )}
          {/* Settings: icon only on mobile, icon + label on desktop */}
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white/70 border border-white/20 hover:bg-white/10 transition-colors"
          >
            <span>⚙</span>
            <span className="hidden sm:inline">{t('settings')}</span>
          </button>
          <button onClick={toggleFullscreen}
            className="hidden sm:flex w-8 h-8 items-center justify-center rounded-lg text-white/70 border border-white/20 hover:bg-white/10 transition-colors">
            ⛶
          </button>
        </div>
      </div>

      {/* Center — timer */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-6">

        {/* Phase label */}
        <div className="text-sm font-semibold tracking-[0.3em] uppercase"
          style={{ color: phaseColor }}>
          {phase === 'work' ? t('work')
            : phase === 'break' ? t('break')
            : t('ready')}
        </div>

        {/* SVG arc timer — smaller on mobile */}
        <div className="relative">
          <svg width="240" height="240" viewBox="0 0 280 280" className="-rotate-90 w-48 h-48 sm:w-64 sm:h-64 md:w-72 md:h-72">
            <circle cx="140" cy="140" r={radius} fill="none"
              stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
            <circle cx="140" cy="140" r={radius} fill="none"
              stroke={phaseColor} strokeWidth="4" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl sm:text-6xl font-bold text-white tabular-nums tracking-tight">
              {formatSeconds(secondsLeft)}
            </span>
            {pomodorosCompleted > 0 && (
              <span className="text-white/50 text-sm mt-2">
                🍅 × {pomodorosCompleted}
              </span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          {phase === 'idle' ? (
            <button onClick={handleStart}
              className="px-10 py-3 rounded-full text-sm font-bold tracking-wide transition-all hover:scale-105"
              style={{ background: phaseColor, color: '#fff' }}>
              {t('start')}
            </button>
          ) : (
            <>
              <button onClick={handlePauseResume}
                className="px-8 py-3 rounded-full text-sm font-bold tracking-wide transition-all hover:scale-105"
                style={{ background: phaseColor, color: '#fff' }}>
                {isRunning ? t('pause') : t('resume')}
              </button>
              <button onClick={handleSkip}
                className="px-5 py-3 rounded-full text-sm font-medium text-white/70 border border-white/20 hover:bg-white/10 transition-colors">
                {t('skip')} ⏭
              </button>
            </>
          )}
        </div>

        {/* Session stats */}
        {/* {(focusSeconds > 0 || breakSeconds > 0) && (
          <div className="flex gap-6 text-center">
            <div>
              <p className="text-white/40 text-xs uppercase tracking-wide">{t('focusTime')}</p>
              <p className="text-white font-semibold text-sm">{formatFocusTime(focusSeconds)}</p>
            </div>
            {breakSeconds > 0 && (
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wide">{t('breakTime')}</p>
                <p className="text-white font-semibold text-sm">{formatFocusTime(breakSeconds)}</p>
              </div>
            )}
          </div>
        )} */}
      </div>

      {/* Bottom bar — sound + background pickers */}
      <div className="relative z-10 flex items-center justify-center gap-3 px-4 py-4 md:gap-4 md:px-6 md:py-5">

        {/* Sound picker */}
        <div className="relative">
          <button
            onClick={() => { setShowSoundPicker(v => !v); setShowBgPicker(false) }}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm text-white/80 border border-white/20 hover:bg-white/10 transition-colors"
          >
            {sound.icon} {t(`sounds.${sound.id}`)}
          </button>
          {showSoundPicker && (
            <div className="absolute bottom-12 left-0 rounded-2xl border p-3 w-52 shadow-xl"
              style={{ background: 'rgba(20,20,20,0.9)', borderColor: 'rgba(255,255,255,0.1)' }}>
              <div className="space-y-1">
                {SOUND_PRESETS.map(s => (
                  <button key={s.id} onClick={() => { handleSoundChange(s.id); setShowSoundPicker(false) }}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-left transition-colors"
                    style={{
                      background: soundId === s.id ? 'rgba(255,255,255,0.15)' : 'transparent',
                      color: 'rgba(255,255,255,0.85)',
                    }}>
                    <span>{s.icon}</span>
                    <span>{t(`sounds.${s.id}`)}</span>
                    {s.isPremium && <span className="ml-auto text-xs" style={{ color: '#FFD060' }}>PRO</span>}
                  </button>
                ))}
              </div>
              {/* Volume */}
              {soundId !== 'none' && (
                <div className="mt-3 px-3 pb-1">
                  <input type="range" min={0} max={1} step={0.05} value={volume}
                    onChange={e => setVolume(Number(e.target.value))}
                    className="w-full accent-white/70" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Background picker */}
        <div className="relative">
          <button
            onClick={() => { setShowBgPicker(v => !v); setShowSoundPicker(false) }}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm text-white/80 border border-white/20 hover:bg-white/10 transition-colors"
          >
            🖼 {t(`backgrounds.${bg.id}`)}
          </button>
          {showBgPicker && (
            <div className="absolute bottom-12 right-0 rounded-2xl border p-3 shadow-xl"
              style={{ background: 'rgba(20,20,20,0.9)', borderColor: 'rgba(255,255,255,0.1)' }}>
              <div className="grid grid-cols-3 gap-2">
                {BACKGROUND_PRESETS.map(b => (
                  <button key={b.id} onClick={() => { setBgId(b.id); setShowBgPicker(false) }}
                    className="relative rounded-xl overflow-hidden transition-all hover:scale-105"
                    style={{ border: bgId === b.id ? '2px solid white' : '2px solid transparent' }}>
                    <img src={b.thumbnail} alt={b.id} className="w-20 h-14 object-cover" />
                    <span className="absolute bottom-0 left-0 right-0 text-center text-white text-xs py-0.5"
                      style={{ background: 'rgba(0,0,0,0.5)' }}>
                      {t(`backgrounds.${b.id}`)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Settings modal */}
      {showSettings && (
        <div className="absolute inset-0 z-30 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowSettings(false) }}>
          <div className="rounded-2xl border p-6 w-80 space-y-5"
            style={{ background: 'rgba(20,20,20,0.95)', borderColor: 'rgba(255,255,255,0.15)' }}>
            <h2 className="text-white font-semibold">{t('settings')}</h2>

            {/* Mode */}
            <div>
              <p className="text-white/50 text-xs mb-2 uppercase tracking-wide">{t('mode')}</p>
              <div className="flex gap-2">
                {(['pomodoro', 'custom'] as TimerMode[]).map(m => (
                  <button key={m} onClick={() => setPendingSettings(s => ({
                    ...s, mode: m,
                    workMin: m === 'pomodoro' ? DEFAULT_WORK_MINUTES : s.workMin,
                    breakMin: m === 'pomodoro' ? DEFAULT_BREAK_MINUTES : s.breakMin,
                  }))}
                    className="flex-1 py-2 rounded-xl text-sm font-medium transition-colors"
                    style={{
                      background: pendingSettings.mode === m ? 'rgba(77,153,224,0.3)' : 'rgba(255,255,255,0.05)',
                      color: pendingSettings.mode === m ? '#4D99E0' : 'rgba(255,255,255,0.6)',
                      border: `1px solid ${pendingSettings.mode === m ? '#4D99E0' : 'rgba(255,255,255,0.1)'}`,
                    }}>
                    {t(m)}
                  </button>
                ))}
              </div>
            </div>

            {/* Work duration */}
            <div>
              <label className="text-white/50 text-xs uppercase tracking-wide block mb-2">
                {t('workDuration')}
              </label>
              <div className="flex items-center gap-3">
                <input type="range" min={5} max={90} step={5}
                  value={pendingSettings.workMin}
                  onChange={e => setPendingSettings(s => ({ ...s, workMin: Number(e.target.value) }))}
                  className="flex-1 accent-[#4D99E0]" />
                <span className="text-white text-sm w-12 text-right">
                  {pendingSettings.workMin} хв
                </span>
              </div>
            </div>

            {/* Break duration */}
            <div>
              <label className="text-white/50 text-xs uppercase tracking-wide block mb-2">
                {t('breakDuration')}
              </label>
              <div className="flex items-center gap-3">
                <input type="range" min={1} max={30} step={1}
                  value={pendingSettings.breakMin}
                  onChange={e => setPendingSettings(s => ({ ...s, breakMin: Number(e.target.value) }))}
                  className="flex-1 accent-[#009E73]" />
                <span className="text-white text-sm w-12 text-right">
                  {pendingSettings.breakMin} хв
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowSettings(false)}
                className="flex-1 py-2 rounded-xl text-sm text-white/50 border border-white/10">
                {t('cancel')}
              </button>
              <button onClick={applySettings}
                className="flex-1 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: '#4D99E0' }}>
                {t('apply')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
