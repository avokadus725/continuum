'use client'

import { useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'
import { BookMarked } from 'lucide-react'
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export function NotesClient({ notes: initialNotes, collections }: NotesClientProps) {
  const t = useTranslations('notes')
  const tCommon = useTranslations('common')

  const [showCreate, setShowCreate] = useState(false)
  const [editNote, setEditNote] = useState<Note | null>(null)
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
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
          {t('title')}
        </h1>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 rounded-xl text-sm font-semibold transition-opacity"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
        >
          + {t('create')}
        </button>
      </div>

      {/* Notes grid */}
      {initialNotes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {initialNotes.map((note) => {
            const excerpt = note.content
              ? note.content.slice(0, 150) + (note.content.length > 150 ? '…' : '')
              : null

            const linkedTo = note.material?.title || note.task?.title
              || (note.topic ? `${note.topic.icon ?? ''} ${note.topic.title}`.trim() : null)

            return (
              <div
                key={note.id}
                className="rounded-2xl border p-5 flex flex-col gap-3 transition-shadow hover:shadow-md"
                style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3
                    className="font-semibold text-base leading-snug flex-1"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {note.title}
                  </h3>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => setEditNote(note)}
                      className="text-xs px-2 py-1 rounded-lg transition-colors"
                      style={{ color: 'var(--muted-foreground)', background: 'transparent' }}
                    >
                      {tCommon('edit')}
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      disabled={deletingId === note.id || isPending}
                      className="text-xs px-2 py-1 rounded-lg transition-colors disabled:opacity-40"
                      style={{ color: 'var(--destructive)', background: 'transparent' }}
                    >
                      {tCommon('delete')}
                    </button>
                  </div>
                </div>

                {excerpt && (
                  <p className="text-sm leading-relaxed flex-1 whitespace-pre-wrap" style={{ color: 'var(--muted-foreground)' }}>
                    {excerpt}
                  </p>
                )}

                <div className="flex items-center justify-between mt-auto pt-1 gap-2 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    {note.collectionTitle && (
                      <span
                        className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full truncate"
                        style={{
                          background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
                          color: 'var(--primary)',
                        }}
                      >
                        <BookMarked className="w-3 h-3 shrink-0" />
                        {note.collectionTitle}
                      </span>
                    )}
                    {linkedTo && (
                      <span className="text-xs truncate" style={{ color: 'var(--primary)' }}>
                        {t('linkedTo')}: {linkedTo}
                      </span>
                    )}
                  </div>
                  <span className="text-xs shrink-0" style={{ color: 'var(--muted-foreground)' }}>
                    {formatDate(note.updated_at)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div
          className="rounded-2xl border p-12 text-center"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <p style={{ color: 'var(--muted-foreground)' }}>{t('noNotes')}</p>
        </div>
      )}

      {/* Modals */}
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
