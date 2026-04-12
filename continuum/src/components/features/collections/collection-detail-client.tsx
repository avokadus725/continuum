'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Pencil, Trash2, Check, X, FileText } from 'lucide-react'
import { renameCollection, toggleMaterialInCollection } from '@/app/actions/collections'

const MAT_ICON: Record<string, string> = {
  article:     '📄',
  video:       '🎬',
  link:        '🔗',
  interactive: '🖥',
}

interface Material {
  id: string
  title: string
  type: string
  content: string | null
  url: string | null
  topics: { title: string; icon: string | null } | null
}

interface Note {
  id: string
  title: string
  content: string | null
  updated_at: string
}

interface CollectionDetailClientProps {
  collection: { id: string; title: string }
  materials: Material[]
  notes: Note[]
}

export function CollectionDetailClient({
  collection, materials, notes,
}: CollectionDetailClientProps) {
  const t = useTranslations('collections')
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState(collection.title)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleRename() {
    if (!titleInput.trim() || titleInput === collection.title) {
      setEditingTitle(false)
      return
    }
    startTransition(async () => {
      const fd = new FormData()
      fd.set('id', collection.id)
      fd.set('title', titleInput.trim())
      await renameCollection(fd)
      setEditingTitle(false)
    })
  }

  function handleRemoveMaterial(materialId: string) {
    setRemovingId(materialId)
    startTransition(async () => {
      const fd = new FormData()
      fd.set('collection_id', collection.id)
      fd.set('material_id', materialId)
      fd.set('action', 'remove')
      await toggleMaterialInCollection(fd)
      setRemovingId(null)
    })
  }

  return (
    <div className="space-y-8">
      {/* Collection title */}
      <div className="flex items-center gap-3">
        {editingTitle ? (
          <>
            <input
              autoFocus
              value={titleInput}
              onChange={e => setTitleInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setEditingTitle(false) }}
              className="text-2xl font-bold bg-transparent border-b-2 outline-none flex-1"
              style={{ borderColor: 'var(--primary)', color: 'var(--foreground)' }}
            />
            <button onClick={handleRename} disabled={isPending}
              className="p-2 rounded-xl" style={{ color: 'var(--success)' }}>
              <Check className="w-5 h-5" />
            </button>
            <button onClick={() => { setEditingTitle(false); setTitleInput(collection.title) }}
              className="p-2 rounded-xl" style={{ color: 'var(--muted-foreground)' }}>
              <X className="w-5 h-5" />
            </button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold flex-1" style={{ color: 'var(--foreground)' }}>
              {collection.title}
            </h1>
            <button
              onClick={() => setEditingTitle(true)}
              className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <Pencil className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Materials */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest mb-4"
          style={{ color: 'var(--muted-foreground)' }}>
          {t('materialsSection')} ({materials.length})
        </h2>

        {materials.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {materials.map(m => {
              const excerpt = m.content?.slice(0, 100) + (m.content && m.content.length > 100 ? '…' : '') || null
              return (
                <div
                  key={m.id}
                  className="rounded-2xl border p-4 flex flex-col gap-2"
                  style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{MAT_ICON[m.type] ?? '📄'}</span>
                      {m.topics && (
                        <span className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
                          {m.topics.icon} {m.topics.title}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveMaterial(m.id)}
                      disabled={removingId === m.id || isPending}
                      className="p-1.5 rounded-lg disabled:opacity-40 hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0"
                      style={{ color: 'var(--destructive)' }}
                      title={t('removeMaterial')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <Link href={`/materials/${m.id}`}
                    className="font-semibold text-sm leading-snug hover:underline"
                    style={{ color: 'var(--foreground)' }}>
                    {m.title}
                  </Link>
                  {excerpt && (
                    <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--muted-foreground)' }}>
                      {excerpt}
                    </p>
                  )}
                  {m.url && !m.content && (
                    <a href={m.url} target="_blank" rel="noopener noreferrer"
                      className="text-xs" style={{ color: 'var(--primary)' }}>
                      {m.url.replace(/^https?:\/\//, '').split('/')[0]} ↗
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-2xl border p-8 text-center" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              {t('emptyMaterials')}
            </p>
            <Link href="/materials" className="text-sm font-medium mt-2 inline-block" style={{ color: 'var(--primary)' }}>
              Переглянути матеріали →
            </Link>
          </div>
        )}
      </section>

      {/* Notes */}
      {notes.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: 'var(--muted-foreground)' }}>
            Нотатки ({notes.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {notes.map(note => (
              <Link key={note.id} href="/notes"
                className="rounded-2xl border p-4 flex flex-col gap-2 hover:shadow-md transition-shadow"
                style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 shrink-0" style={{ color: 'var(--primary)' }} />
                  <p className="font-semibold text-sm leading-snug" style={{ color: 'var(--foreground)' }}>
                    {note.title}
                  </p>
                </div>
                {note.content && (
                  <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--muted-foreground)' }}>
                    {note.content}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
