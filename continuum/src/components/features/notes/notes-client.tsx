'use client'

import { useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'
import { BookMarked, Pencil, Trash2, StickyNote } from 'lucide-react'
import { NoteEditor } from './note-editor'
import { deleteNote } from '@/app/actions/notes'

interface Collection { id: string; title: string }

interface Note {
  id: string
  title: string
  content: string | null
  created_at: string
  updated_at: string
  collectionId?: string | null
  collectionTitle?: string | null
  material?: { title: string } | null
  task?: { title: string } | null
  topic?: { title: string; icon: string | null } | null
}

interface NotesClientProps {
  notes: Note[]
  collections: Collection[]
}

/* Accent color palette – cycling across notes */
const NOTE_PALETTE = [
  { accent: '#f59e0b' }, // amber
  { accent: '#10b981' }, // emerald
  { accent: '#6366f1' }, // indigo
  { accent: '#ec4899' }, // pink
  { accent: '#0ea5e9' }, // sky
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export function NotesClient({ notes: initialNotes, collections }: NotesClientProps) {
  const t = useTranslations('notes')
  const tCommon = useTranslations('common')

  const [showCreate, setShowCreate] = useState(false)
  const [editNote, setEditNote]     = useState<Note | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete(id: string) {
    if (!confirm(t('deleteConfirm'))) return
    setDeletingId(id)
    startTransition(async () => {
      const fd = new FormData()
      fd.set('id', id)
      await deleteNote(fd)
      setDeletingId(null)
    })
  }

  return (
    <>
      {/* ── Header ───────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h1
          className="text-2xl font-bold tracking-[-0.3px]"
          style={{ color: 'var(--foreground)' }}
        >
          {t('title')}
        </h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
        >
          <span className="text-base leading-none">+</span>
          {t('create')}
        </button>
      </div>

      {/* ── Notes masonry ────────────────────────── */}
      {initialNotes.length > 0 ? (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
          {initialNotes.map((note, idx) => {
            const { accent } = NOTE_PALETTE[idx % NOTE_PALETTE.length]

            const excerpt = note.content
              ? note.content.slice(0, 220) + (note.content.length > 220 ? '…' : '')
              : null

            const linkedTo =
              note.material?.title ||
              note.task?.title ||
              (note.topic
                ? `${note.topic.icon ?? ''} ${note.topic.title}`.trim()
                : null)

            return (
              <div
                key={note.id}
                className="group relative mb-4 break-inside-avoid rounded-2xl border overflow-hidden
                           transition-all duration-200 hover:shadow-lg hover:-translate-y-[2px]"
                style={{
                  background: `color-mix(in srgb, ${accent} 6%, var(--card))`,
                  borderColor: `color-mix(in srgb, ${accent} 22%, var(--border))`,
                }}
              >
                {/* Colored top stripe */}
                <div style={{ height: '3px', background: accent, opacity: 0.8 }} />

                <div className="p-5">
                  {/* Title + hover actions */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3
                      className="font-semibold text-[15px] leading-snug flex-1"
                      style={{ color: 'var(--foreground)' }}
                    >
                      {note.title}
                    </h3>

                    <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditNote(note)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: 'var(--muted-foreground)' }}
                        title={tCommon('edit')}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        disabled={deletingId === note.id || isPending}
                        className="p-1.5 rounded-lg transition-colors disabled:opacity-40"
                        style={{ color: 'var(--destructive)' }}
                        title={tCommon('delete')}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Excerpt */}
                  {excerpt && (
                    <p
                      className="text-[13px] leading-[1.75] whitespace-pre-wrap mb-4"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      {excerpt}
                    </p>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 min-w-0">
                      {note.collectionTitle && (
                        <span
                          className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium truncate"
                          style={{
                            background: `color-mix(in srgb, ${accent} 15%, transparent)`,
                            color: accent,
                          }}
                        >
                          <BookMarked size={9} className="shrink-0" />
                          {note.collectionTitle}
                        </span>
                      )}
                      {linkedTo && (
                        <span
                          className="text-[11px] truncate"
                          style={{ color: 'var(--muted-foreground)' }}
                        >
                          📎 {linkedTo}
                        </span>
                      )}
                    </div>
                    <span
                      className="text-[11px] shrink-0 tabular-nums"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      {formatDate(note.updated_at)}
                    </span>
                  </div>
                </div>

                {/* Corner fold — paper feel */}
                <div
                  className="absolute bottom-0 right-0 pointer-events-none"
                  style={{
                    width: 0,
                    height: 0,
                    borderStyle: 'solid',
                    borderWidth: '0 0 20px 20px',
                    borderColor: `transparent transparent var(--background) transparent`,
                    opacity: 0.6,
                  }}
                />
              </div>
            )
          })}
        </div>
      ) : (
        /* ── Empty state ─────────────────────────── */
        <div
          className="rounded-2xl border border-dashed p-16 text-center flex flex-col items-center gap-4"
          style={{ borderColor: 'var(--border)' }}
        >
          <StickyNote
            size={40}
            style={{ color: 'var(--muted-foreground)', opacity: 0.25 }}
          />
          <p className="text-[14px]" style={{ color: 'var(--muted-foreground)' }}>
            {t('noNotes')}
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="text-[13px] font-medium px-4 py-2 rounded-xl transition-opacity hover:opacity-80"
            style={{
              background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
              color: 'var(--primary)',
            }}
          >
            + {t('create')}
          </button>
        </div>
      )}

      {/* ── Modals ───────────────────────────────── */}
      {showCreate && (
        <NoteEditor collections={collections} onClose={() => setShowCreate(false)} />
      )}
      {editNote && (
        <NoteEditor
          note={editNote}
          collections={collections}
          onClose={() => setEditNote(null)}
        />
      )}
    </>
  )
}
