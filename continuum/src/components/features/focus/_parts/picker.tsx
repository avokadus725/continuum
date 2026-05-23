'use client'

/* Picker popover — used for sound or scene selection from the dock. */

import { Check } from 'lucide-react'

interface Option {
  id: string
  label: string
  icon?: string
  pro?: boolean
  thumbnail?: string
}

interface Props {
  title: string
  options: Option[]
  active: string
  onPick: (id: string) => void
  /** "list" (sound) or "grid" (scene). */
  layout?: 'list' | 'grid'
}

export function Picker({ title, options, active, onPick, layout = 'list' }: Props) {
  return (
    <div
      className="rounded-2xl border p-2 backdrop-blur-xl"
      style={{
        width: layout === 'grid' ? 340 : 280,
        background: 'rgba(12, 18, 14, 0.85)',
        borderColor: 'rgba(255,255,255,0.12)',
        boxShadow: '0 20px 50px -10px rgba(0,0,0,0.6)',
      }}
    >
      <div className="flex items-center justify-between px-3 pt-1 pb-1.5">
        <span
          className="text-[11px] font-semibold uppercase tracking-[1.4px]"
          style={{ color: 'rgba(255,255,255,0.48)' }}
        >
          {title}
        </span>
        <span
          className="text-[14px]"
          style={{
            fontFamily: '"Instrument Serif", Georgia, serif',
            fontStyle: 'italic',
            color: '#7AB6EE',
          }}
        >i.</span>
      </div>

      {layout === 'list' && (
        <ul className="flex flex-col gap-px">
          {options.map(o => {
            const isActive = o.id === active
            return (
              <li key={o.id}>
                <button
                  onClick={() => onPick(o.id)}
                  className="flex w-full items-center gap-2.5 rounded-lg border-0 px-3 py-2 text-left text-[13px]"
                  style={{
                    background: isActive ? 'rgba(122,182,238,0.15)' : 'transparent',
                    color: isActive ? '#7AB6EE' : 'rgba(255,255,255,0.72)',
                  }}
                >
                  <span className="text-base">{o.icon}</span>
                  <span className="flex-1">{o.label}</span>
                  {o.pro && (
                    <span
                      className="rounded px-1.5 py-0.5 text-[9px] font-bold"
                      style={{ background: 'rgba(255,209,106,0.12)', color: '#FFD16A' }}
                    >PRO</span>
                  )}
                  {isActive && <Check className="h-3.5 w-3.5" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {layout === 'grid' && (
        <ul className="grid grid-cols-3 gap-2 p-2">
          {options.map(o => {
            const isActive = o.id === active
            return (
              <li key={o.id}>
                <button
                  onClick={() => onPick(o.id)}
                  className="relative w-full overflow-hidden rounded-xl transition-transform hover:scale-[1.03]"
                  style={{
                    border: `2px solid ${isActive ? '#FFFFFF' : 'transparent'}`,
                  }}
                >
                  {o.thumbnail
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={o.thumbnail} alt={o.label} className="block h-14 w-full object-cover" />
                    : <div className="h-14 w-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
                  }
                  <span
                    className="block py-1 text-center text-[10.5px] font-medium"
                    style={{ background: 'rgba(0,0,0,0.55)', color: '#FFFFFF' }}
                  >
                    {o.label}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
