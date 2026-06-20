'use client'

/* Note editor – rich-text editor for creating and editing a note. */

import { useTranslations } from 'next-intl'
import { useRef, useState, useTransition, useEffect } from 'react'
import { X, BookMarked, ChevronDown, Paperclip } from 'lucide-react'
import { toast } from 'sonner'
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
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition]          = useTransition()
  const [error, setError]                     = useState<string | null>(null)
  const [selectedCollection, setSelectedCollection] = useState<string>(note?.collectionId ?? '')
  const [collectionOpen, setCollectionOpen]   = useState(false)
  const collectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (collectionRef.current && !collectionRef.current.contains(e.target as Node)) {
        setCollectionOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  /* Auto-grow the textarea as content grows */
  function autoGrow(ta: HTMLTextAreaElement) {
    ta.style.height = 'auto'
    ta.style.height = `${ta.scrollHeight}px`
  }

  async function handleSubmit(formData: FormData) {
    setError(null)
    // Inject the controlled collection value – not from a native <select>
    formData.set('collection_id', selectedCollection)
    startTransition(async () => {
      const res = note ? await updateNote(formData) : await createNote(formData)
      if ('error' in res && res.error) {
        setError(res.error)
        toast.error(res.error)
      } else {
        toast.success(note ? t('toastUpdated') : t('toastSaved'))
        onClose()
      }
    })
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
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
          {note       && <input type="hidden" name="id"          value={note.id} />}
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
              autoFocus
              defaultValue={note?.title ?? ''}
              placeholder={t('titlePlaceholder')}
              className="flex-1 text-[17px] font-semibold bg-transparent outline-none placeholder:font-normal"
              style={{ color: 'var(--foreground)' }}
            />
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg transition-colors shrink-0 hover:bg-black/5 dark:hover:bg-white/5"
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
                <Paperclip size={11} className="shrink-0" />
                {t('linkedTo')}: <strong>{materialTitle ?? taskTitle}</strong>
              </span>
            </div>
          )}

          {/* ── Lined paper textarea (auto-grow) ─── */}
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
              defaultValue={note?.content ?? ''}
              placeholder={t('placeholder')}
              onInput={e => autoGrow(e.currentTarget)}
              className="w-full px-6 pt-3 pb-4 bg-transparent outline-none resize-none text-[14px]"
              style={{
                color: 'var(--foreground)',
                lineHeight: `${LINE_H}px`,
                minHeight: `${LINE_H * 5}px`,
              }}
            />
          </div>

          {/* ── Collection picker (chip-style dropdown) ────── */}
          {collections.length > 0 && (
            <div
              className="flex items-center gap-2 px-6 py-3 border-t"
              style={{ borderColor: 'color-mix(in srgb, var(--border) 60%, transparent)' }}
            >
              <BookMarked size={12} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
              <div ref={collectionRef} className="relative">
                {/* Trigger chip */}
                <button
                  type="button"
                  onClick={() => setCollectionOpen(v => !v)}
                  className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11.5px] font-medium transition-all"
                  style={{
                    background: selectedCollection
                      ? 'color-mix(in srgb, var(--primary) 12%, transparent)'
                      : 'var(--muted)',
                    borderColor: selectedCollection ? 'var(--primary)' : 'transparent',
                    color: selectedCollection ? 'var(--primary)' : 'var(--foreground)',
                  }}
                >
                  {selectedCollection
                    ? (collections.find(c => c.id === selectedCollection)?.title ?? t('noCollection'))
                    : t('noCollection')}
                  <ChevronDown size={10} style={{ opacity: 0.7 }} />
                </button>

                {/* Dropdown list */}
                {collectionOpen && (
                  <div
                    className="absolute bottom-full left-0 z-10 mb-1.5 min-w-[180px] overflow-hidden rounded-xl border py-1 shadow-xl"
                    style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
                  >
                    {[{ id: '', title: t('noCollection') }, ...collections].map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => { setSelectedCollection(c.id); setCollectionOpen(false) }}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12.5px] transition-colors"
                        style={{
                          background: selectedCollection === c.id
                            ? 'color-mix(in srgb, var(--primary) 8%, transparent)'
                            : 'transparent',
                          color: selectedCollection === c.id ? 'var(--primary)' : 'var(--foreground)',
                          fontWeight: selectedCollection === c.id ? 600 : 400,
                        }}
                      >
                        {c.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Footer ───────────────────────────── */}
          <div
            className="flex items-center gap-3 px-6 py-4 border-t"
            style={{ borderColor: 'var(--border)' }}
          >
            {error && (
              <p className="text-[12px] flex-1" style={{ color: 'var(--destructive)' }}>
                {error}
              </p>
            )}
            <div className="flex gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-xl text-[13px] border transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)', background: 'transparent' }}
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
