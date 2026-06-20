'use client'

/* Intention – either pinned italic line during active session,
   or an inline input when idle. */

import { Pencil } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface PinnedProps { text: string }
export function IntentionPinned({ text }: PinnedProps) {
  return (
    <div
      className="text-center"
      style={{
        fontFamily: '"Instrument Serif", Georgia, serif',
        fontStyle: 'italic',
        fontSize: 22, lineHeight: 1.3, maxWidth: 520,
        color: 'rgba(255,255,255,0.72)',
      }}
    >
      «{text}»
    </div>
  )
}

interface InputProps {
  value: string
  onChange: (v: string) => void
  onSubmit?: () => void
}
export function IntentionInput({ value, onChange, onSubmit }: InputProps) {
  const t = useTranslations('focus')
  return (
    <div
      className="inline-flex w-[min(460px,calc(100vw-2rem))] items-center gap-3 rounded-full border px-5 py-3 backdrop-blur-md"
      style={{
        background:  'rgba(15, 22, 18, 0.55)',
        borderColor: 'rgba(255,255,255,0.12)',
      }}
    >
      <Pencil className="h-4 w-4 shrink-0" style={{ color: 'rgba(255,255,255,0.48)' }} />
      <span className="shrink-0 text-[13px]" style={{ color: 'rgba(255,255,255,0.48)' }}>
        {t('intentionLabel')}
      </span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') onSubmit?.() }}
        placeholder={t('intentionHint')}
        className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:[color:rgba(255,255,255,0.32)]"
        style={{ color: '#FFFFFF' }}
      />
      <span
        className="rounded border px-1.5 py-0.5 text-[10px] font-semibold"
        style={{
          background:  'rgba(255,255,255,0.08)',
          color:       'rgba(255,255,255,0.48)',
          borderColor: 'rgba(255,255,255,0.12)',
        }}
      >↵</span>
    </div>
  )
}
