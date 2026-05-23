'use client'

import { useTranslations } from 'next-intl'
import { useRef, useState, useTransition } from 'react'
import { X } from 'lucide-react'
import { createNote, updateNote } from '@/app/actions/notes'

interface Collection { id: string; title: string }

interface NoteEditorProps {
  note?: {
    id: string
    title: string
    content: string | null
    collectionId?: string | null
  }
  collections?: Collection[]
  onClose: () => void
  materialId?: string
  materialTitle?: string
  taskId?: string
  taskTitle?: string
}

/* Line height must match repeating-gradient step in the paper area */
const LINE_H = 28

export function NoteEditor({
  note,
  collections = [],
  onClose,
  materialId,
  materialTitle,
  taskId,
  taskTitle,
}: NoteEditorProps) {
  const t       = useTranslations('notes')
  const tCommon = useTranslations('common')
  const tCol    = useTranslations('collections')
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError]            = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const res = note ? await updateNote(formData) : await createNote(formData)
      if ('error' in res && res.error) {
        setError(res.error)
      } else {
        onClose()
      }
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        {/* Top accent stripe */}
        <div style={{ height: '3px', background: 'var(--primary)' }} />

        <form ref={formRef} action={handleSubmit}>
          {note      && <input type="hidden" name="id"          value={note.id} />}
          {materialId && <input type="hidden" name="material_id" value={materialId} />}
          {taskId     && <input type="hidden" name="task_id"     value={taskId} />}

          {/* ── Title row ─────────────────────────── */}
          <div
            className="flex items-center gap-3 px-6 pt-5 pb-4 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            {/* Vertical accent bar */}
            <div
              style={{
                width: 3, height: 28, borderRadius: 99, flexShrink: 0,
                background: 'var(--primary)',
              }}
            />
            <input
              name="title"
              required
              defaultValue={note?.title ?? ''}
              placeholder={t('titlePlaceholder')}
              className="flex-1 text-[17px] font-semibold bg-transparent outline-none
                         placeholder:font-normal"
              style={{
                color: 'var(--foreground)',
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ['--tw-placeholder-color' as any]: 'var(--muted-foreground)',
              }}
            />
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg transition-colors shrink-0"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <X size={17} />
            </button>
          </div>

          {/* ── Linked context badge ──────────────── */}
          {(materialTitle || taskTitle) && (
            <div className="px-6 pt-3">
              <span
                className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full"
                style={{
                  background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
                  color: 'var(--primary)',
                }}
              >
                📎 {t('linkedTo')}: <strong>{materialTitle ?? taskTitle}</strong>
              </span>
            </div>
          )}

          {/* ── Lined paper textarea ──────────────── */}
          <div
            style={{
              background: `repeating-linear-gradient(
                transparent,
                transparent ${LINE_H - 1}px,
                color-mix(in srgb, var(--border) 55%, transparent) ${LINE_H - 1}px,
                color-mix(in srgb, var(--border) 55%, transparent) ${LINE_H}px
              )`,
              backgroundPositionY: `${LINE_H + 4}px`,
            }}
          >
            <textarea
              name="content"
              rows={10}
              defaultValue={note?.content ?? ''}
              placeholder={t('placeholder')}
              className="w-full px-6 pt-3 pb-4 bg-transparent outline-none resize-none text-[14px]"
              style={{
                color: 'var(--foreground)',
                lineHeight: `${LINE_H}px`,
              }}
            />
          </div>

          {/* ── Footer ───────────────────────────── */}
          <div
            className="flex items-center gap-3 px-6 py-4 border-t flex-wrap"
            style={{ borderColor: 'var(--border)' }}
          >
            {collections.length > 0 && (
              <select
                name="collection_id"
                defaultValue={note?.collectionId ?? ''}
                className="text-[12px] rounded-lg border px-2.5 py-1.5 outline-none flex-1 min-w-0 max-w-[200px]"
                style={{
                  background: 'var(--background)',
                  borderColor: 'var(--border)',
                  color: 'var(--foreground)',
                }}
              >
                <option value="">— {t('noCollection')} —</option>
                {collections.map(c => (
                  <option key={c.id} value={c.id}>{tCol('title') ? c.title : c.title}</option>
                ))}
              </select>
            )}

            {error && (
              <p className="text-[12px] flex-1" style={{ color: 'var(--destructive)' }}>
                {error}
              </p>
            )}

            <div className="flex gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-xl text-[13px] border transition-colors"
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--muted-foreground)',
                  background: 'transparent',
                }}
              >
                {tCommon('cancel')}
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-1.5 rounded-xl text-[13px] font-semibold transition-opacity disabled:opacity-50"
                style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
              >
                {isPending ? '…' : tCommon('save')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
