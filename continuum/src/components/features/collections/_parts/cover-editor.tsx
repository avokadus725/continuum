'use client'

/* Cover editor — used for both create (in the list) and update (in detail).
   Self-contained: caller passes an onSave handler that performs the action. */

import { useState } from 'react'
import { X, Trash2 } from 'lucide-react'
import { COVERS, COVER_KEYS, EMOJI_PICKER, type CoverKey } from '@/lib/collection-covers'

export interface CoverEditorValue {
  title: string
  description: string
  emoji: string
  cover: CoverKey
}

interface Props {
  mode: 'create' | 'edit'
  initial: CoverEditorValue
  onCancel: () => void
  onSave: (v: CoverEditorValue) => void | Promise<void>
  onDelete?: () => void
}

export function CoverEditor({ mode, initial, onCancel, onSave, onDelete }: Props) {
  const [val, setVal] = useState<CoverEditorValue>(initial)
  const palette = COVERS[val.cover] ?? COVERS.default
  const canSave = val.title.trim().length > 0

  return (
    <div
      className="w-[460px] rounded-2xl border"
      style={{
        background: 'var(--card)', borderColor: 'var(--border)',
        boxShadow: '0 30px 60px -15px rgba(11,22,32,0.22)',
      }}
    >
      <header
        className="flex items-baseline gap-2 border-b px-5 pb-3.5 pt-[18px]"
        style={{ borderColor: 'color-mix(in srgb, var(--border) 70%, transparent)' }}
      >
        <span style={{
          fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: 'italic',
          color: 'var(--primary)', fontSize: 18,
        }}>{mode === 'create' ? 'i.' : 'ii.'}</span>
        <h3 className="m-0 text-base font-semibold tracking-[-0.2px]" style={{ color: 'var(--foreground)' }}>
          {mode === 'create' ? 'Нова підбірка' : 'Налаштувати підбірку'}
        </h3>
        <span className="flex-1" />
        <button onClick={onCancel} className="bg-transparent" style={{ color: 'color-mix(in srgb, var(--muted-foreground) 70%, transparent)' }}>
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="px-5 pb-5 pt-[18px]">
        {/* Preview cover */}
        <div
          className="flex h-[90px] items-start rounded-xl px-[18px] py-3.5"
          style={{ background: palette.tint }}
        >
          <span style={{ fontSize: 32 }}>{val.emoji}</span>
        </div>

        <Label>Назва</Label>
        <input
          autoFocus
          value={val.title}
          onChange={e => setVal(v => ({ ...v, title: e.target.value }))}
          placeholder="напр. Алгоритми та структури даних"
          className="h-[38px] w-full rounded-lg border bg-[var(--background)] px-3 text-[13.5px] outline-none"
          style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
        />

        <Label>Опис · необов&apos;язково</Label>
        <input
          value={val.description}
          onChange={e => setVal(v => ({ ...v, description: e.target.value }))}
          placeholder="Підготовка до колоквіуму, кінець семестру…"
          className="h-[38px] w-full rounded-lg border bg-[var(--background)] px-3 text-[13.5px] outline-none"
          style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
        />

        <Label>Емодзі</Label>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {EMOJI_PICKER.map(e => {
            const active = e === val.emoji
            return (
              <button
                key={e}
                type="button"
                onClick={() => setVal(v => ({ ...v, emoji: e }))}
                className="h-9 w-9 rounded-lg text-[18px]"
                style={{
                  background: active
                    ? 'color-mix(in srgb, var(--primary) 14%, transparent)'
                    : 'var(--muted)',
                  outline: active ? `2px solid var(--primary)` : 'none',
                  outlineOffset: -2,
                }}
              >{e}</button>
            )
          })}
        </div>

        <Label>Колір обкладинки</Label>
        <div className="mt-1.5 flex gap-2">
          {COVER_KEYS.map(k => {
            const v = COVERS[k]
            const active = k === val.cover
            return (
              <button
                key={k}
                type="button"
                onClick={() => setVal(prev => ({ ...prev, cover: k }))}
                className="relative h-9 w-9 rounded-[10px]"
                aria-label={k}
                style={{
                  background: v.tint,
                  outline: active ? `2px solid var(--primary)` : 'none',
                  outlineOffset: 2,
                }}
              >
                <span
                  className="absolute bottom-1.5 right-1.5 h-3 w-3 rounded-full"
                  style={{ background: v.deep }}
                />
              </button>
            )
          })}
        </div>
      </div>

      <footer
        className="flex items-center gap-2.5 border-t px-5 py-3.5"
        style={{ borderColor: 'color-mix(in srgb, var(--border) 70%, transparent)' }}
      >
        {mode === 'edit' && onDelete && (
          <button
            onClick={onDelete}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-transparent px-3.5 text-[12.5px] font-semibold"
            style={{ color: 'var(--destructive)' }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Видалити підбірку
          </button>
        )}
        <span className="flex-1" />
        <button
          onClick={onCancel}
          className="h-9 rounded-lg border bg-transparent px-3.5 text-[12.5px]"
          style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
        >
          Скасувати
        </button>
        <button
          onClick={() => canSave && onSave({ ...val, title: val.title.trim(), description: val.description.trim() })}
          disabled={!canSave}
          className="h-9 rounded-lg border-0 px-4 text-[12.5px] font-semibold text-white disabled:opacity-50"
          style={{ background: 'var(--primary)' }}
        >
          {mode === 'create' ? 'Створити' : 'Зберегти'}
        </button>
      </footer>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mt-3.5 mb-1 block text-[11px] font-semibold uppercase tracking-[0.8px]"
      style={{ color: 'color-mix(in srgb, var(--muted-foreground) 70%, transparent)' }}>
      {children}
    </label>
  )
}
