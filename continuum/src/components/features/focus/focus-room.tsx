'use client'

/* Continuum Focus Room — main orchestrator.
   Replaces continuum/src/components/features/focus/focus-room.tsx.

   - Hides app chrome (assumes sidebar-layout sees /focus as full-bleed and
     hides sidebar + topbar — see updated sidebar-layout.tsx).
   - Background image fills the viewport.
   - State machine: idle → work → break → … → reflection (after last session). */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import {
  BACKGROUND_PRESETS, SOUND_PRESETS, SOUND_TO_BG,
  DEFAULT_WORK_MINUTES, DEFAULT_BREAK_MINUTES,
} from '@/lib/focus-presets'
import { saveFocusSession } from '@/app/actions/focus'

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
  const t = useTranslations('focus')

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
  const [phase, setPhase] = useState<Phase>('idle')
  const [secondsLeft, setSecondsLeft] = useState(settings.workMin * 60)
  const [isRunning, setIsRunning] = useState(false)

  // ── session accumulators ────────────────────────────────
  const [pomodorosCompleted, setPomodorosCompleted] = useState(0)
  const [focusSeconds, setFocusSeconds] = useState(0)
  const [breakSeconds, setBreakSeconds] = useState(0)
  const sessionStartRef = useRef<Date | null>(null)

  // ── room mood ───────────────────────────────────────────
  const [intention, setIntention] = useState('')
  const [bgId, setBgId] = useState(BACKGROUND_PRESETS[0].id)
  const [soundId, setSoundId] = useState('none')
  const [volume, setVolume] = useState(0.5)
  const [picker, setPicker] = useState<'none' | 'scene' | 'sound'>('none')

  // ── reflection ──────────────────────────────────────────
  const [showReflection, setShowReflection] = useState(false)
  const [mood, setMood] = useState<number | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const scene = BACKGROUND_PRESETS.find(b => b.id === bgId) ?? BACKGROUND_PRESETS[0]
  const sound = SOUND_PRESETS.find(s => s.id === soundId) ?? SOUND_PRESETS[0]

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
    toast.info(`${title} — ${body}`, { duration: 4000 })
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' })
    }
  }

  // ── phase transitions ──────────────────────────────────
  const transitionToBreak = useCallback(() => {
    const next = pomodorosCompleted + 1
    setPomodorosCompleted(next)

    // Final session done → reflection
    if (next >= settings.targetSessions) {
      setPhase('idle')
      setIsRunning(false)
      setShowReflection(true)
      return
    }

    setPhase('break')
    setSecondsLeft(settings.breakMin * 60)
    showNotification(t('notification.breakTitle'), t('notification.breakBody'))
  }, [pomodorosCompleted, settings.breakMin, settings.targetSessions, t])

  const transitionToWork = useCallback(() => {
    setPhase('work')
    setSecondsLeft(settings.workMin * 60)
    showNotification(t('notification.workTitle'), t('notification.workBody'))
  }, [settings.workMin, t])

  // ── countdown tick ─────────────────────────────────────
  useEffect(() => {
    if (!isRunning || phase === 'idle') return
    const id = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          if (phase === 'work')  transitionToBreak()
          else                   transitionToWork()
          return 0
        }
        return prev - 1
      })
      if (phase === 'work')  setFocusSeconds(s => s + 1)
      if (phase === 'break') setBreakSeconds(s => s + 1)
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
    if (sessionStartRef.current && (focusSeconds > 0 || breakSeconds > 0)) {
      await saveFocusSession({
        startedAt: sessionStartRef.current.toISOString(),
        endedAt: new Date().toISOString(),
        focusSeconds, breakSeconds, pomodorosCompleted,
        mode: settings.mode,
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
  function handleExitToDashboard() {
    void persistAndReset(phase === 'idle' ? 'completed' : 'interrupted')
    // Navigation handled by the user clicking out; we just reset.
  }

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
          onEnd={handleEnd}
          onOpenSettings={() => { setPendingSettings(settings); setShowSettings(true) }}
          onToggleFullscreen={toggleFullscreen}
        />

        {/* Center */}
        <div className="flex flex-1 flex-col items-center justify-center gap-7 py-4">
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

          <TimerArc
            time={timeStr} progress={progress} phase={phase}
            subtitle={phase === 'idle' ? t('ready') : undefined}
          />

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

          {/* Pickers */}
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

      {/* Settings overlay */}
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

      {/* Reflection overlay */}
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
    </div>
  )
}
