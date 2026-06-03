'use client'

import { useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'
import { BookMarked, Pencil, Trash2, StickyNote, Search, X, Paperclip } from 'lucide-react'
import { topicColor } from '@/lib/topic-colors'
import { NoteEditor } from './note-editor'
import { deleteNote } from '@/app/actions/notes'
import { ConfirmDialog } from '@/components/confirm-dialog'

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
  topic?: { title: string; icon: string | null; slug?: string | null } | null
  topicSlug?: string | null
}

interface NotesClientProps {
  notes: Note[]
  collections: Collection[]
}


function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export function NotesClient({ notes: initialNotes, collections }: NotesClientProps) {
  const t       = useTranslations('notes')
  const tCommon = useTranslations('common')

  const [showCreate,      setShowCreate]      = useState(false)
  const [editNote,        setEditNote]        = useState<Note | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [isPending, startTransition]          = useTransition()
  const [search,    setSearch]                = useState('')
  const [filterCol, setFilterCol]             = useState<string>('') // '' = all, '__none__' = uncategorized

  function handleDelete(id: string) {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('id', id)
      await deleteNote(fd)
      setConfirmDeleteId(null)
    })
  }

  /* Collections that actually appear in current notes (for filter chips) */
  const usedCollections = collections.filter(c =>
    initialNotes.some(n => n.collectionId === c.id),
  )
  const hasUncategorized = initialNotes.some(n => !n.collectionId)

  /* Client-side filtering */
  const filtered = initialNotes.filter(note => {
    const q = search.trim().toLowerCase()
    const matchesSearch = !q ||
      note.title.toLowerCase().includes(q) ||
      (note.content?.toLowerCase().includes(q) ?? false)
    const matchesCol = !filterCol ||
      (filterCol === '__none__' ? !note.collectionId : note.collectionId === filterCol)
    return matchesSearch && matchesCol
  })

  return (
    <>
      {/* ── Header ───────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <h1
          className="text-2xl font-bold tracking-[-0.3px] mr-auto"
          style={{ color: 'var(--foreground)' }}
        >
          {t('title')}
        </h1>

        {/* Search */}
        <div
          className="flex items-center gap-2 rounded-xl border px-3 py-[7px]"
          style={{ background: 'var(--card)', borderColor: 'var(--border)', width: 200 }}
        >
          <Search size={13} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('search')}
            className="flex-1 bg-transparent text-[12.5px] outline-none min-w-0"
            style={{ color: 'var(--foreground)' }}
          />
          {search && (
            <button onClick={() => setSearch('')}>
              <X size={12} style={{ color: 'var(--muted-foreground)' }} />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
        >
          <span className="text-base leading-none">+</span>
          {t('create')}
        </button>
      </div>

      {/* ── Collection filter chips ───────────────── */}
      {(usedCollections.length > 0 || hasUncategorized) && (
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          <FilterChip
            active={filterCol === ''}
            label={t('filterAll')}
            onClick={() => setFilterCol('')}
          />
          {usedCollections.map(c => (
            <FilterChip
              key={c.id}
              active={filterCol === c.id}
              label={c.title}
              icon={<BookMarked size={10} />}
              onClick={() => setFilterCol(filterCol === c.id ? '' : c.id)}
            />
          ))}
          {hasUncategorized && (
            <FilterChip
              active={filterCol === '__none__'}
              label={t('filterNone')}
              onClick={() => setFilterCol(filterCol === '__none__' ? '' : '__none__')}
            />
          )}
        </div>
      )}

      {/* ── Notes masonry ────────────────────────── */}
      {filtered.length > 0 ? (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 mt-2">
          {filtered.map(note => {
            const accent = topicColor(note.topicSlug)

            const excerpt = note.content
              ? note.content.slice(0, 220) + (note.content.length > 220 ? '…' : '')
              : null

            const linkedTo =
              note.material?.title ||
              note.task?.title ||
              note.topic?.title ||
              null

            return (
              <div
                key={note.id}
                onClick={() => setEditNote(note)}
                className="group relative mb-4 break-inside-avoid rounded-2xl border overflow-hidden
                           transition-all duration-200 hover:shadow-lg hover:-translate-y-[2px] cursor-pointer"
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
                        onClick={e => { e.stopPropagation(); setEditNote(note) }}
                        className="p-1.5 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                        style={{ color: 'var(--muted-foreground)' }}
                        title={tCommon('edit')}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); setConfirmDeleteId(note.id) }}
                        disabled={isPending}
                        className="p-1.5 rounded-lg transition-colors hover:bg-red-50 dark:hover:bg-red-900/10 disabled:opacity-40"
                        style={{ color: 'var(--destructive)' }}
                        title={tCommon('delete')}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Excerpt / empty hint */}
                  {excerpt ? (
                    <p
                      className="text-[13px] leading-[1.75] whitespace-pre-wrap mb-4"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      {excerpt}
                    </p>
                  ) : (
                    <p
                      className="text-[12.5px] italic mb-4"
                      style={{ color: 'color-mix(in srgb, var(--muted-foreground) 45%, transparent)' }}
                    >
                      {t('emptyContent')}
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
                          <Paperclip size={10} className="shrink-0" /> {linkedTo}
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

                {/* Corner fold */}
                <div
                  className="absolute bottom-0 right-0 pointer-events-none"
                  style={{
                    width: 0, height: 0,
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

      ) : initialNotes.length > 0 ? (

        /* ── No search/filter results ───────────── */
        <div
          className="mt-2 rounded-2xl border border-dashed p-12 text-center flex flex-col items-center gap-3"
          style={{ borderColor: 'var(--border)' }}
        >
          <Search size={32} style={{ color: 'var(--muted-foreground)', opacity: 0.25 }} />
          <p className="text-[13.5px] font-medium" style={{ color: 'var(--foreground)' }}>
            {t('noResults')}
          </p>
          <button
            onClick={() => { setSearch(''); setFilterCol('') }}
            className="text-[12.5px] font-medium hover:underline"
            style={{ color: 'var(--primary)' }}
          >
            {t('clearFilters')}
          </button>
        </div>

      ) : (

        /* ── Truly empty ──────────────────────── */
        <div
          className="mt-2 rounded-2xl border border-dashed p-16 text-center flex flex-col items-center gap-4"
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

      {/* ── Confirm delete ────────────────────────── */}
      {confirmDeleteId && (
        <ConfirmDialog
          message={t('deleteConfirm')}
          confirmLabel={tCommon('delete')}
          cancelLabel={tCommon('cancel')}
          onConfirm={() => handleDelete(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
        />
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

/* ─── Filter chip ────────────────────────────────── */
function FilterChip({
  active, label, icon, onClick,
}: {
  active: boolean
  label: string
  icon?: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition-all"
      style={{
        background: active ? 'var(--primary)' : 'transparent',
        borderColor: active ? 'var(--primary)' : 'var(--border)',
        color: active ? '#fff' : 'var(--muted-foreground)',
      }}
    >
      {icon}{label}
    </button>
  )
}
