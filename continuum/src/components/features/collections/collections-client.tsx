'use client'

/* Collections client — grid of the user's collections with create / rename / delete. */

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { BookMarked, Plus, Trash2, ChevronRight, Search, X } from 'lucide-react'
import { createCollection, deleteCollection } from '@/app/actions/collections'

interface Collection {
  id: string
  title: string
  materialCount: number
  taskCount: number
  created_at: string
}

interface CollectionsClientProps {
  collections: Collection[]
}

export function CollectionsClient({ collections: initial }: CollectionsClientProps) {
  const t = useTranslations('collections')
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle]     = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [search, setSearch]         = useState('')
  const [isPending, startTransition] = useTransition()

  const filtered = search.trim()
    ? initial.filter(c => c.title.toLowerCase().includes(search.trim().toLowerCase()))
    : initial

  function handleCreate() {
    if (!newTitle.trim()) return
    startTransition(async () => {
      const fd = new FormData()
      fd.set('title', newTitle.trim())
      await createCollection(fd)
      setNewTitle('')
      setShowCreate(false)
    })
  }

  function handleDelete(id: string) {
    if (!confirm(t('deleteConfirm'))) return
    setDeletingId(id)
    startTransition(async () => {
      const fd = new FormData()
      fd.set('id', id)
      await deleteCollection(fd)
      setDeletingId(null)
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
          {t('title')}
        </h1>
        <button
          onClick={() => setShowCreate(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-opacity"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
        >
          <Plus className="w-4 h-4" />
          {t('create')}
        </button>
      </div>

      {/* Inline create form */}
      {showCreate && (
        <div
          className="rounded-2xl border p-4 flex gap-2"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <input
            autoFocus
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setShowCreate(false) }}
            placeholder={t('titlePlaceholder')}
            className="flex-1 rounded-xl border px-3 py-2 text-sm outline-none"
            style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
          />
          <button
            onClick={handleCreate}
            disabled={!newTitle.trim() || isPending}
            className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-40 transition-opacity"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            {t('create')}
          </button>
          <button
            onClick={() => setShowCreate(false)}
            className="px-3 py-2 rounded-xl text-sm border"
            style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Search */}
      {initial.length > 0 && (
        <div
          className="flex items-center gap-2 rounded-xl border px-3 py-2"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <Search className="w-4 h-4 shrink-0" style={{ color: 'var(--muted-foreground)' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Пошук підбірок…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--foreground)' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ color: 'var(--muted-foreground)' }}>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Collections grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(col => {
            const parts: string[] = []
            if (col.materialCount > 0) parts.push(`${col.materialCount} ${t('materials')}`)
            if (col.taskCount > 0) parts.push(`${col.taskCount} завд.`)

            return (
              <div
                key={col.id}
                className="rounded-2xl border overflow-hidden transition-shadow hover:shadow-md"
                style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
              >
                <Link href={`/collections/${col.id}`} className="block p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <BookMarked className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--primary)' }} />
                    <ChevronRight className="w-4 h-4 shrink-0" style={{ color: 'var(--muted-foreground)' }} />
                  </div>
                  <h3 className="font-semibold text-base leading-snug mb-1" style={{ color: 'var(--foreground)' }}>
                    {col.title}
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {parts.length > 0 ? parts.join(' · ') : `0 ${t('materials')}`}
                  </p>
                </Link>
                <div className="border-t px-5 py-2 flex justify-end" style={{ borderColor: 'var(--border)' }}>
                  <button
                    onClick={() => handleDelete(col.id)}
                    disabled={deletingId === col.id || isPending}
                    className="flex items-center gap-1.5 text-xs py-1 disabled:opacity-40 transition-opacity"
                    style={{ color: 'var(--destructive)' }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {t('deleteCollection')}
                  </button>
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
          <BookMarked className="w-10 h-10 mx-auto mb-3 opacity-30" style={{ color: 'var(--muted-foreground)' }} />
          <p style={{ color: 'var(--muted-foreground)' }}>
            {search ? 'Нічого не знайдено' : t('noCollections')}
          </p>
        </div>
      )}
    </div>
  )
}
