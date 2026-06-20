'use client'

/* Continuum Focus Room – main orchestrator.
   State machine: idle → work → break → … → reflection (after last session).

   Leave-guard flow:
   - Clicking "Home" while a session is active shows a confirm dialog with 3 options:
       • Keep focusing  – dismiss, stay
       • Browse & return later  – writes session to localStorage (isMinimized:true), navigates away;
                                  the FocusFloatingTimer pill appears on all other pages
       • End session  – persists as interrupted, navigates to /dashboard

   Session restoration:
   - On mount, if localStorage contains an isMinimized session, state is restored
     and the session continues as if the user never left. */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import {
  BACKGROUND_PRESETS, SOUND_PRESETS, SOUND_TO_BG,
  DEFAULT_WORK_MINUTES, DEFAULT_BREAK_MINUTES,
} from '@/lib/focus-presets'
import { saveFocusSession } from '@/app/actions/focus'
import {
  writeFocusLive, clearFocusLive, readFocusLive, computeSecondsLeft,
} from '@/lib/focus-live-store'

import { TopChrome } from './_parts/top-chrome'
import { PomodoroDots } from './_parts/pomodoro-dots'
import { TimerArc } from './_parts/timer-arc'
import { IntentionInput, IntentionPinned } from './_parts/intention'
import { FocusControls } from './_parts/controls'
import { Dock } from './_parts/dock'
import { Picker } from './_parts/picker'
import { SettingsPanel, type FocusSettings } from './_parts/settings-panel'
import { ReflectionPanel } from './_parts/reflection-panel'

const DEFAULT_TARGET_SESSIONS = 4

type Phase = 'idle' | 'work' | 'break'

function pad(n: number) { return String(n).padStart(2, '0') }
function formatSeconds(s: number) { return `${pad(Math.floor(s / 60))}:${pad(s % 60)}` }

export function FocusRoom() {
  const t      = useTranslations('focus')
  const router = useRouter()

  // ── settings ───────────────────────────────────────────
  const [settings, setSettings] = useState<FocusSettings>({
    mode: 'pomodoro',
    workMin: DEFAULT_WORK_MINUTES,
    breakMin: DEFAULT_BREAK_MINUTES,
    targetSessions: DEFAULT_TARGET_SESSIONS,
    endChime: true,
  })
  const [showSettings, setShowSettings] = useState(false)
  const [pendingSettings, setPendingSettings] = useState(settings)

  // ── timer state ─────────────────────────────────────────
  const [phase, setPhase]           = useState<Phase>('idle')
  const [secondsLeft, setSecondsLeft] = useState(settings.workMin * 60)
  const [isRunning, setIsRunning]   = useState(false)

  // ── session accumulators ────────────────────────────────
  const [pomodorosCompleted, setPomodorosCompleted] = useState(0)
  const [focusSeconds, setFocusSeconds] = useState(0)
  const [breakSeconds, setBreakSeconds] = useState(0)
  const sessionStartRef = useRef<Date | null>(null)

  // ── room mood ───────────────────────────────────────────
  const [intention, setIntention]   = useState('')
  const [bgId, setBgId]             = useState(BACKGROUND_PRESETS[0].id)
  const [soundId, setSoundId]       = useState('none')
  const [volume, setVolume]         = useState(0.5)
  const [picker, setPicker]         = useState<'none' | 'scene' | 'sound'>('none')

  // ── reflection / leave guard ────────────────────────────
  const [showReflection,   setShowReflection]   = useState(false)
  const [mood, setMood]                         = useState<number | null>(null)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)

  const containerRef   = useRef<HTMLDivElement>(null)
  const audioRef       = useRef<HTMLAudioElement | null>(null)
  // Ref – not state – so the sync effect reads the latest value without
  // triggering an extra re-render that could race with the write.
  const isMinimizedRef = useRef(false)
  // Mirror endChime setting into a ref so playChime() never goes stale
  // inside useCallback closures.
  const endChimeRef    = useRef(settings.endChime)
  endChimeRef.current  = settings.endChime
  // Readable synchronously inside setInterval without adding secondsLeft to
  // the countdown effect's dep array (which would restart the interval every tick).
  const secondsLeftRef = useRef(secondsLeft)
  secondsLeftRef.current = secondsLeft

  const scene = BACKGROUND_PRESETS.find(b => b.id === bgId) ?? BACKGROUND_PRESETS[0]
  const sound = SOUND_PRESETS.find(s => s.id === soundId) ?? SOUND_PRESETS[0]

  // ── restore minimized session on mount ─────────────────
  useEffect(() => {
    const live = readFocusLive()
    if (!live?.isMinimized) {
      clearFocusLive()   // clear any orphaned data
      return
    }
    // Restore
    const adjSecs = computeSecondsLeft(live)
    sessionStartRef.current = new Date(live.sessionStartMs)
    setPhase(live.phase)
    setSecondsLeft(adjSecs)
    setIsRunning(live.isRunning)
    setPomodorosCompleted(live.pomodorosCompleted)
    setFocusSeconds(live.focusSeconds)
    setBreakSeconds(live.breakSeconds)
    setIntention(live.intention)
    setSettings(s => ({
      ...s,
      workMin: live.workMin,
      breakMin: live.breakMin,
      targetSessions: live.targetSessions,
    }))
    // clearFocusLive() – intentionally NOT called here;
    // the sync effect below will overwrite it with isMinimized:false on the next render.
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── sync live state to localStorage (for floating timer) ─
  useEffect(() => {
    if (phase === 'idle') {
      clearFocusLive()
      return
    }
    writeFocusLive({
      phase,
      secondsLeft,
      updatedAt: Date.now(),
      isRunning,
      isMinimized: isMinimizedRef.current,   // true once user clicked "Browse & return"
      pomodorosCompleted,
      targetSessions: settings.targetSessions,
      workMin:        settings.workMin,
      breakMin:       settings.breakMin,
      intention,
      focusSeconds,
      breakSeconds,
      sessionStartMs: sessionStartRef.current?.getTime() ?? Date.now(),
    })
  }, [phase, secondsLeft, isRunning, pomodorosCompleted,
      settings.targetSessions, settings.workMin, settings.breakMin,
      intention, focusSeconds, breakSeconds])

  // ── audio ───────────────────────────────────────────────
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
      if (isRunning) audio.play().catch(() => {})
      else           audio.pause()
    } else {
      audio.pause()
      audio.src = ''
    }
  }, [soundId, isRunning, volume, sound])
  useEffect(() => () => { audioRef.current?.pause() }, [])

  // ── end-of-phase chime (Web Audio API, no file needed) ──
  function playChime(type: 'work' | 'break') {
    if (!endChimeRef.current) return
    try {
      const ctx = new AudioContext()
      // Two harmonics → bell-like tone; 'work' phase done = higher pitch, 'break' done = lower
      const pairs: [number, number][] = type === 'work'
        ? [[880, 0.30], [1320, 0.15]]   // A5 + E6 – bright "break time" ding
        : [[660, 0.30], [990,  0.15]]   // E5 + B5 – mellower "back to work" ding
      pairs.forEach(([freq, vol]) => {
        const osc  = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.value = freq
        const now = ctx.currentTime
        gain.gain.setValueAtTime(vol, now)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2)
        osc.start(now)
        osc.stop(now + 2.2)
      })
      setTimeout(() => ctx.close(), 3000)
    } catch { /* AudioContext blocked (e.g. no user gesture) – silently ignore */ }
  }

  function pickSound(id: string) {
    setSoundId(id)
    const matchedBg = SOUND_TO_BG[id]
    if (matchedBg) setBgId(matchedBg)
    setPicker('none')
  }

  // ── notifications ───────────────────────────────────────
  function requestNotificationPermission() {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }
  function showNotification(title: string, body: string) {
    toast.info(`${title} – ${body}`, { duration: 4000 })
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' })
    }
  }

  // ── phase transitions ──────────────────────────────────
  const transitionToBreak = useCallback(() => {
    const next = pomodorosCompleted + 1
    setPomodorosCompleted(next)
    playChime('work')   // work phase just ended → bright ding

    if (next >= settings.targetSessions) {
      setPhase('idle')
      setIsRunning(false)
      setShowReflection(true)
      return
    }

    setPhase('break')
    setSecondsLeft(settings.breakMin * 60)
    showNotification(t('notification.breakTitle'), t('notification.breakBody'))
  }, [pomodorosCompleted, settings.breakMin, settings.targetSessions, t]) // eslint-disable-line react-hooks/exhaustive-deps

  const transitionToWork = useCallback(() => {
    playChime('break')  // break phase just ended → mellower ding
    setPhase('work')
    setSecondsLeft(settings.workMin * 60)
    showNotification(t('notification.workTitle'), t('notification.workBody'))
  }, [settings.workMin, t]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── countdown tick ─────────────────────────────────────
  useEffect(() => {
    if (!isRunning || phase === 'idle') return
    const id = setInterval(() => {
      if (secondsLeftRef.current <= 1) {
        // Transition must be called OUTSIDE a setState updater.
        // React 18 Strict Mode double-invokes updater functions to detect
        // side effects – calling showNotification() inside one fires it twice.
        setSecondsLeft(0)
        if (phase === 'work')  { setFocusSeconds(s => s + 1); transitionToBreak() }
        else                   { setBreakSeconds(s => s + 1); transitionToWork()  }
      } else {
        setSecondsLeft(s => s - 1)
        if (phase === 'work')  setFocusSeconds(s => s + 1)
        if (phase === 'break') setBreakSeconds(s => s + 1)
      }
    }, 1000)
    return () => clearInterval(id)
  }, [isRunning, phase, transitionToBreak, transitionToWork])

  // ── controls ───────────────────────────────────────────
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
  function handlePauseResume() { setIsRunning(r => !r) }
  function handleSkip() {
    if (phase === 'work')  transitionToBreak()
    if (phase === 'break') transitionToWork()
  }

  async function persistAndReset(status: 'completed' | 'interrupted') {
    isMinimizedRef.current = false   // ensure sync effect won't re-minimize
    clearFocusLive()                 // immediately clear so the pill disappears
    if (sessionStartRef.current && (focusSeconds > 0 || breakSeconds > 0)) {
      await saveFocusSession({
        startedAt:       sessionStartRef.current.toISOString(),
        endedAt:         new Date().toISOString(),
        focusSeconds, breakSeconds, pomodorosCompleted,
        mode:            settings.mode,
        workDurationMin: settings.workMin,
        breakDurationMin: settings.breakMin,
        status,
        intention,
        mood,
      })
      toast.success(t('sessionSaved'))
    }
    sessionStartRef.current = null
    setIsRunning(false)
    setPhase('idle')
    setSecondsLeft(settings.workMin * 60)
    setFocusSeconds(0)
    setBreakSeconds(0)
    setPomodorosCompleted(0)
    setIntention('')
    setMood(null)
    setShowReflection(false)
  }

  function handleEnd() {
    setIsRunning(false)
    setShowReflection(true)
  }
  function handleAnother() {
    void persistAndReset('completed')
    setTimeout(handleStart, 0)
  }
  async function handleExitToDashboard() {
    await persistAndReset(pomodorosCompleted > 0 ? 'completed' : 'interrupted')
    router.push('/dashboard')
  }

  // ── leave guard ────────────────────────────────────────
  function handleBackHome() {
    if (phase !== 'idle') {
      setShowLeaveConfirm(true)
    } else {
      router.push('/dashboard')
    }
  }

  function handleMinimizeAndLeave() {
    if (!sessionStartRef.current || phase === 'idle') return
    // Set the ref FIRST so that if the countdown interval fires and
    // triggers the sync effect before the component unmounts, it will
    // still write isMinimized:true (not false).
    isMinimizedRef.current = true
    writeFocusLive({
      phase: phase as 'work' | 'break',
      secondsLeft,
      updatedAt:        Date.now(),
      isRunning,
      isMinimized:      true,
      pomodorosCompleted,
      targetSessions:   settings.targetSessions,
      workMin:          settings.workMin,
      breakMin:         settings.breakMin,
      intention,
      focusSeconds,
      breakSeconds,
      sessionStartMs:   sessionStartRef.current.getTime(),
    })
    setShowLeaveConfirm(false)
    router.push('/dashboard')
  }

  async function handleLeaveAndEnd() {
    setShowLeaveConfirm(false)
    await persistAndReset('interrupted')
    router.push('/dashboard')
  }

  // ── settings ───────────────────────────────────────────
  function applySettings() {
    setSettings(pendingSettings)
    setSecondsLeft(pendingSettings.workMin * 60)
    setShowSettings(false)
    if (phase !== 'idle') void persistAndReset('interrupted')
  }

  // ── fullscreen ─────────────────────────────────────────
  function toggleFullscreen() {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen().catch(() => {})
    else                              document.exitFullscreen().catch(() => {})
  }

  // ── progress ───────────────────────────────────────────
  const totalSecondsThisPhase = phase === 'break' ? settings.breakMin * 60 : settings.workMin * 60
  const progress = phase === 'idle' ? 0 : 1 - secondsLeft / totalSecondsThisPhase
  const timeStr  = phase === 'idle' ? formatSeconds(settings.workMin * 60) : formatSeconds(secondsLeft)
  const currentRound = phase === 'idle' ? 1 : Math.max(1, pomodorosCompleted + 1)

  /* ── render ──────────────────────────────────────────── */

  return (
    <div ref={containerRef} className="relative flex-1 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        {scene.type === 'image' && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={scene.src} alt="" className="h-full w-full object-cover" />
        )}
        {scene.type === 'video' && (
          <video src={scene.src} autoPlay loop muted className="h-full w-full object-cover" />
        )}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, rgba(8,14,11,0.42) 0%, rgba(8,14,11,0.5) 50%, rgba(5,9,8,0.65) 100%)' }}
        />
      </div>

      {/* Layout column */}
      <div className="relative z-10 flex h-full min-h-0 flex-col overflow-y-auto">
        <TopChrome
          showEnd={phase !== 'idle'}
          onBack={handleBackHome}
          onEnd={handleEnd}
          onOpenSettings={() => { setPendingSettings(settings); setShowSettings(true) }}
          onToggleFullscreen={toggleFullscreen}
        />

        {/* Center */}
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-4 sm:gap-7">
          <PomodoroDots
            current={currentRound}
            total={settings.targetSessions}
            phase={phase}
          />

          {phase === 'idle'
            ? <IntentionInput value={intention} onChange={setIntention} />
            : intention
              ? <IntentionPinned text={intention} />
              : <div style={{ height: 30 }} />
          }

          <div className="origin-center max-[420px]:scale-[0.8]">
            <TimerArc
              time={timeStr} progress={progress} phase={phase}
              subtitle={phase === 'idle' ? t('ready') : undefined}
            />
          </div>

          <FocusControls
            phase={phase} isRunning={isRunning}
            onStart={handleStart}
            onPauseResume={handlePauseResume}
            onSkip={handleSkip}
          />
        </div>

        {/* Bottom dock */}
        <div className="relative flex justify-center pb-7">
          <Dock
            scene={scene}
            sound={sound}
            sceneLabel={t(`backgrounds.${scene.id}`)}
            soundLabel={t(`sounds.${sound.id}`)}
            volume={volume}
            onVolume={setVolume}
            onOpenScene={() => setPicker(p => p === 'scene' ? 'none' : 'scene')}
            onOpenSound={() => setPicker(p => p === 'sound' ? 'none' : 'sound')}
            bellOn={settings.endChime}
            onToggleBell={() => setSettings(s => ({ ...s, endChime: !s.endChime }))}
          />

          {picker !== 'none' && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2">
              {picker === 'sound' && (
                <Picker
                  title={t('soundPickerTitle')}
                  active={soundId}
                  onPick={pickSound}
                  options={SOUND_PRESETS.map(s => ({
                    id: s.id, label: t(`sounds.${s.id}`), icon: s.icon, pro: s.isPremium,
                  }))}
                />
              )}
              {picker === 'scene' && (
                <Picker
                  title={t('scenePickerTitle')}
                  layout="grid"
                  active={bgId}
                  onPick={(id) => { setBgId(id); setPicker('none') }}
                  options={BACKGROUND_PRESETS.map(b => ({
                    id: b.id, label: t(`backgrounds.${b.id}`), thumbnail: b.thumbnail,
                  }))}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Settings overlay ──────────────────────────────── */}
      {showSettings && (
        <div
          className="absolute inset-0 z-30 grid place-items-center"
          style={{ background: 'rgba(5, 9, 8, 0.5)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowSettings(false) }}
        >
          <SettingsPanel
            value={pendingSettings}
            onChange={setPendingSettings}
            onCancel={() => setShowSettings(false)}
            onApply={applySettings}
          />
        </div>
      )}

      {/* ── Reflection overlay ────────────────────────────── */}
      {showReflection && (
        <div
          className="absolute inset-0 z-30 grid place-items-center"
          style={{ background: 'rgba(5, 9, 8, 0.55)' }}
        >
          <ReflectionPanel
            pomodorosCompleted={pomodorosCompleted}
            totalSessions={settings.targetSessions}
            focusSeconds={focusSeconds}
            mood={mood}
            onMood={setMood}
            onAnother={handleAnother}
            onExit={handleExitToDashboard}
          />
        </div>
      )}

      {/* ── Leave-guard overlay ───────────────────────────── */}
      {showLeaveConfirm && (
        <div
          className="absolute inset-0 z-40 grid place-items-center"
          style={{ background: 'rgba(5,9,8,0.62)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowLeaveConfirm(false) }}
        >
          <div
            className="mx-4 w-full max-w-[340px] rounded-[22px] border p-7 text-center"
            style={{
              background:   'rgba(12,18,14,0.94)',
              borderColor:  'rgba(255,255,255,0.12)',
              boxShadow:    '0 30px 80px -10px rgba(0,0,0,0.65)',
            }}
          >
            <p
              className="text-[22px] font-semibold leading-snug tracking-[-0.3px]"
              style={{ color: '#fff' }}
            >
              {t('leaveTitle')}
            </p>
            <p
              className="mt-2.5 text-sm leading-[1.55]"
              style={{ color: 'rgba(255,255,255,0.58)' }}
            >
              {t('leaveBody')}
            </p>

            <div className="mt-7 flex flex-col gap-2.5">
              {/* Primary – keep focusing */}
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="h-11 w-full rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
                style={{ background: '#5BD4A4', color: '#0c1812' }}
              >
                {t('leaveKeep')}
              </button>

              {/* Secondary – minimize (browse & return) */}
              <button
                onClick={handleMinimizeAndLeave}
                className="h-11 w-full rounded-xl border text-sm font-semibold transition-colors hover:bg-white/[0.06]"
                style={{
                  borderColor: 'rgba(255,255,255,0.16)',
                  color:       'rgba(255,255,255,0.82)',
                }}
              >
                {t('leaveMinimize')}
              </button>

              {/* Tertiary – end session */}
              <button
                onClick={handleLeaveAndEnd}
                className="h-9 w-full text-sm font-medium transition-colors hover:text-white/80"
                style={{ color: 'rgba(255,255,255,0.36)' }}
              >
                {t('leaveEnd')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
