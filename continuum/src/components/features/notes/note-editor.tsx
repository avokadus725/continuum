'use client'

import { useTranslations } from 'next-intl'
import { useRef, useState, useTransition } from 'react'
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

export function NoteEditor({ note, collections = [], onClose, materialId, materialTitle, taskId, taskTitle }: NoteEditorProps) {
  const t = useTranslations('notes')
  const tCommon = useTranslations('common')
  const tCol = useTranslations('collections')
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

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
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-lg rounded-2xl border shadow-xl p-6 space-y-4"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
            {note ? tCommon('edit') : t('create')}
          </h2>
          <button onClick={onClose} className="text-xl leading-none" style={{ color: 'var(--muted-foreground)' }}>
            ×
          </button>
        </div>

        <form ref={formRef} action={handleSubmit} className="space-y-3">
          {note && <input type="hidden" name="id" value={note.id} />}
          {materialId && <input type="hidden" name="material_id" value={materialId} />}
          {taskId && <input type="hidden" name="task_id" value={taskId} />}

          {/* Linked context badge */}
          {(materialTitle || taskTitle) && (
            <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg"
              style={{ background: 'color-mix(in srgb, var(--primary) 10%, transparent)', color: 'var(--primary)' }}>
              <span>📎</span>
              <span>{t('linkedTo')}: <strong>{materialTitle ?? taskTitle}</strong></span>
            </div>
          )}

          <input
            name="title"
            required
            defaultValue={note?.title ?? ''}
            placeholder={t('titlePlaceholder')}
            className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2"
            style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
          />

          <textarea
            name="content"
            rows={7}
            defaultValue={note?.content ?? ''}
            placeholder={t('placeholder')}
            className="w-full rounded-xl border px-3 py-2 text-sm resize-none outline-none focus:ring-2"
            style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
          />

          {/* Collection selector */}
          {collections.length > 0 && (
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>
                {tCol('title')}
              </label>
              <select
                name="collection_id"
                defaultValue={note?.collectionId ?? ''}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
              >
                <option value="">— {t('noCollection')} —</option>
                {collections.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <p className="text-sm" style={{ color: 'var(--destructive)' }}>{error}</p>
          )}

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium border transition-colors"
              style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)', background: 'transparent' }}
            >
              {tCommon('cancel')}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-50"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              {isPending ? '...' : tCommon('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
