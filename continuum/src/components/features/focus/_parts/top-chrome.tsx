'use client'

/* Top chrome — minimal exit + action pills.
   Only visible inside the focus room.
   onBack is called when the user clicks the "Home" button — the parent
   decides whether to navigate directly or show the leave-guard dialog. */

import { ArrowLeft, Settings as SettingsIcon, Maximize2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface Props {
  showEnd: boolean
  onBack: () => void
  onEnd: () => void
  onOpenSettings: () => void
  onToggleFullscreen: () => void
}

export function TopChrome({ showEnd, onBack, onEnd, onOpenSettings, onToggleFullscreen }: Props) {
  const t = useTranslations('focus')

  return (
    <header className="relative z-10 flex items-center gap-3.5 px-7 py-5">
      <button onClick={onBack} className={pillCls()} style={{ background: 'transparent' }}>
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden sm:inline">{t('backHome')}</span>
      </button>

      <span
        className="ml-1.5 hidden text-[11px] font-semibold uppercase tracking-[2.4px] sm:inline"
        style={{ color: 'rgba(255,255,255,0.48)' }}
      >
        {t('roomTitle')}
      </span>

      <span className="flex-1" />

      {showEnd && (
        <button
          onClick={onEnd}
          className={pillCls()}
          style={{ color: '#F08585', borderColor: 'rgba(240,133,133,0.45)' }}
        >
          {t('endSession')}
        </button>
      )}

      <button onClick={onOpenSettings} className={pillCls()}>
        <SettingsIcon className="h-4 w-4" />
        <span className="hidden sm:inline">{t('settings')}</span>
      </button>

      <button
        onClick={onToggleFullscreen}
        className="grid h-[34px] w-[34px] place-items-center rounded-full border backdrop-blur-md"
        style={{
          background: 'rgba(15, 22, 18, 0.55)',
          borderColor: 'rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.72)',
        }}
        aria-label={t('fullscreen')}
      >
        <Maximize2 className="h-4 w-4" />
      </button>
    </header>
  )
}

function pillCls() {
  return 'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur-md transition-colors hover:bg-[rgba(255,255,255,0.08)]'
    + ' [background:rgba(15,22,18,0.55)] [color:rgba(255,255,255,0.72)] [border-color:rgba(255,255,255,0.12)]'
}
