'use client'

/* Bottom dock — single pill bar with Scene · Sound · Volume · Notification. */

import { ChevronDown, Volume2, Bell, BellOff } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { BackgroundPreset, SoundPreset } from '@/lib/focus-presets'

interface Props {
  scene: BackgroundPreset
  sound: SoundPreset
  sceneLabel: string
  soundLabel: string
  volume: number
  onVolume: (v: number) => void
  onOpenScene: () => void
  onOpenSound: () => void
  onToggleBell: () => void
  bellOn: boolean
}

export function Dock({
  scene, sound, sceneLabel, soundLabel, volume,
  onVolume, onOpenScene, onOpenSound, onToggleBell, bellOn,
}: Props) {
  const t = useTranslations('focus')

  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-full border p-1 backdrop-blur-xl"
      style={{
        background: 'rgba(12, 18, 14, 0.78)',
        borderColor: 'rgba(255,255,255,0.12)',
        boxShadow: '0 16px 36px -10px rgba(0,0,0,0.5)',
      }}
    >
      <button onClick={onOpenScene} className={dockBtn}>
        <span className="text-sm">🖼</span>
        <span className="ml-1.5">{sceneLabel}</span>
        <ChevronDown className="ml-1.5 h-3.5 w-3.5 opacity-60" />
      </button>

      <Divider />

      <button onClick={onOpenSound} className={dockBtn}>
        <span className="text-sm">{sound.icon}</span>
        <span className="ml-1.5">{soundLabel}</span>
        <ChevronDown className="ml-1.5 h-3.5 w-3.5 opacity-60" />
      </button>

      <VolumeStrip value={volume} onChange={onVolume} disabled={sound.id === 'none'} />

      <Divider />

      {/* Notification toggle — BellOff + strikethrough when disabled */}
      <button
        onClick={onToggleBell}
        className={dockBtn}
        aria-pressed={bellOn}
      >
        {bellOn
          ? <Bell    className="h-3.5 w-3.5" style={{ color: '#FFD16A' }} />
          : <BellOff className="h-3.5 w-3.5" style={{ color: 'rgba(255,255,255,0.35)' }} />
        }
        <span
          className="ml-1.5"
          style={{ color: bellOn ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.35)' }}
        >
          {t('notifications')}
        </span>
      </button>

      {/* Silence the unused-var warning while keeping the prop available for consumers */}
      <span aria-hidden className="hidden">{scene.id}</span>
    </div>
  )
}

const dockBtn = 'inline-flex items-center rounded-full border-0 bg-transparent px-3.5 py-2 text-[12.5px] font-medium text-[rgba(255,255,255,0.72)] hover:bg-[rgba(255,255,255,0.06)]'

function Divider() {
  return <span className="mx-1 h-4 w-px" style={{ background: 'rgba(255,255,255,0.12)' }} aria-hidden />
}

function VolumeStrip({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-2" style={{ opacity: disabled ? 0.4 : 1 }}>
      <Volume2 className="h-3.5 w-3.5" style={{ color: 'rgba(255,255,255,0.5)' }} />
      <input
        type="range" min={0} max={1} step={0.05} value={value}
        onChange={e => onChange(Number(e.target.value))}
        disabled={disabled}
        className="cont-volume w-16 cursor-pointer"
        aria-label="Volume"
      />
      <style>{`
        .cont-volume {
          appearance: none; height: 3px; border-radius: 999px;
          background: linear-gradient(to right, #FFFFFF 0%, #FFFFFF ${value*100}%, rgba(255,255,255,0.15) ${value*100}%, rgba(255,255,255,0.15) 100%);
        }
        .cont-volume::-webkit-slider-thumb {
          appearance: none; width: 10px; height: 10px; border-radius: 999px;
          background: #fff; cursor: pointer; border: none;
        }
        .cont-volume::-moz-range-thumb {
          width: 10px; height: 10px; border-radius: 999px;
          background: #fff; cursor: pointer; border: none;
        }
      `}</style>
    </div>
  )
}
