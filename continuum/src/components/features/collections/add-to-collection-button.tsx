'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { BookMarked, Plus, Check, ChevronDown } from 'lucide-react'
import {
  toggleMaterialInCollection,
  createCollectionWithMaterial,
} from '@/app/actions/collections'

interface CollectionOption {
  id: string
  title: string
  hasMaterial: boolean
}

interface AddToCollectionButtonProps {
  materialId: string
  collections: CollectionOption[]
  /** Smaller variant for use inside material cards */
  compact?: boolean
}

export function AddToCollectionButton({ materialId, collections: initial, compact }: AddToCollectionButtonProps) {
  const t = useTranslations('collections')
  const [open, setOpen] = useState(false)
  const [localCols, setLocalCols] = useState(initial)
  const [showNew, setShowNew] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [isPending, startTransition] = useTransition()
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const anyAdded = localCols.some(c => c.hasMaterial)

  function handleToggle(colId: string, hasMaterial: boolean) {
    // Optimistic update
    setLocalCols(prev =>
      prev.map(c => c.id === colId ? { ...c, hasMaterial: !c.hasMaterial } : c)
    )
    startTransition(async () => {
      const fd = new FormData()
      fd.set('collection_id', colId)
      fd.set('material_id', materialId)
      fd.set('action', hasMaterial ? 'remove' : 'add')
      await toggleMaterialInCollection(fd)
    })
  }

  function handleCreateNew() {
    if (!newTitle.trim()) return
    const title = newTitle.trim()
    // Optimistic: add new collection to local list with hasMaterial=true
    const tempId = `temp-${Date.now()}`
    setLocalCols(prev => [...prev, { id: tempId, title, hasMaterial: true }])
    setNewTitle('')
    setShowNew(false)
    startTransition(async () => {
      const fd = new FormData()
      fd.set('title', title)
      fd.set('material_id', materialId)
      const res = await createCollectionWithMaterial(fd)
      if (res.id) {
        setLocalCols(prev =>
          prev.map(c => c.id === tempId ? { ...c, id: res.id! } : c)
        )
      }
    })
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1.5 border font-medium transition-all rounded-xl ${compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'}`}
        style={{
          background: anyAdded ? 'color-mix(in srgb, var(--primary) 12%, transparent)' : 'var(--card)',
          borderColor: anyAdded ? 'var(--primary)' : 'var(--border)',
          color: anyAdded ? 'var(--primary)' : 'var(--muted-foreground)',
        }}
      >
        <BookMarked className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        {t('addToCollection')}
        <ChevronDown className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      </button>

      {open && (
        <div
          className="absolute top-full mt-2 left-0 z-30 w-64 rounded-2xl border shadow-xl overflow-hidden"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          {/* Existing collections */}
          <div className="max-h-52 overflow-y-auto">
            {localCols.length === 0 && !showNew && (
              <p className="px-4 py-3 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                {t('noCollections')}
              </p>
            )}
            {localCols.map(col => (
              <button
                key={col.id}
                onClick={() => handleToggle(col.id, col.hasMaterial)}
                disabled={isPending}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-60"
                style={{ color: 'var(--foreground)' }}
              >
                <div
                  className="w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors"
                  style={{
                    background: col.hasMaterial ? 'var(--primary)' : 'transparent',
                    borderColor: col.hasMaterial ? 'var(--primary)' : 'var(--border)',
                  }}
                >
                  {col.hasMaterial && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="truncate">{col.title}</span>
              </button>
            ))}
          </div>

          {/* New collection */}
          <div className="border-t" style={{ borderColor: 'var(--border)' }}>
            {showNew ? (
              <div className="p-3 flex gap-2">
                <input
                  autoFocus
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleCreateNew(); if (e.key === 'Escape') setShowNew(false) }}
                  placeholder={t('titlePlaceholder')}
                  className="flex-1 rounded-lg border px-2 py-1.5 text-xs outline-none"
                  style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                />
                <button
                  onClick={handleCreateNew}
                  disabled={!newTitle.trim() || isPending}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40"
                  style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                >
                  +
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowNew(true)}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                style={{ color: 'var(--primary)' }}
              >
                <Plus className="w-4 h-4" />
                {t('create')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
