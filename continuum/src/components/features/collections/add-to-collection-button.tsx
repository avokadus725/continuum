'use client'

/* Add-to-collection button — opens the picker to save an item into a collection. */

import { useState, useRef, useEffect, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'
import { BookMarked, Plus, Check, ChevronDown } from 'lucide-react'
import {
  toggleMaterialInCollection,
  createCollectionWithMaterial,
  toggleTaskInCollection,
  createCollectionWithTask,
} from '@/app/actions/collections'

interface CollectionOption {
  id: string
  title: string
  hasItem: boolean
}

interface AddToCollectionButtonProps {
  itemId: string
  itemType: 'material' | 'task'
  collections: CollectionOption[]
  /** Smaller variant for use inside cards */
  compact?: boolean
}

interface DropdownPos { top: number; left: number; width: number }

export function AddToCollectionButton({ itemId, itemType, collections: initial, compact }: AddToCollectionButtonProps) {
  const t = useTranslations('collections')
  const [open, setOpen] = useState(false)
  const [localCols, setLocalCols] = useState(initial)
  const [showNew, setShowNew] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [isPending, startTransition] = useTransition()
  const [pos, setPos] = useState<DropdownPos | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  /* Position dropdown under the trigger using fixed coords (portal) */
  function openDropdown() {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const dropH = 260 // approximate max dropdown height

    setPos({
      top: spaceBelow >= dropH ? rect.bottom + 6 : rect.top - dropH - 6,
      left: Math.min(rect.left, window.innerWidth - 260 - 8),
      width: 260,
    })
    setOpen(true)
  }

  /* Close on outside click */
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      const target = e.target as Node
      if (
        triggerRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const anyAdded = localCols.some(c => c.hasItem)

  function handleToggle(colId: string, hasItem: boolean) {
    setLocalCols(prev => prev.map(c => c.id === colId ? { ...c, hasItem: !c.hasItem } : c))
    startTransition(async () => {
      const fd = new FormData()
      fd.set('collection_id', colId)
      fd.set('action', hasItem ? 'remove' : 'add')
      if (itemType === 'task') {
        fd.set('task_id', itemId)
        await toggleTaskInCollection(fd)
      } else {
        fd.set('material_id', itemId)
        await toggleMaterialInCollection(fd)
      }
    })
  }

  function handleCreateNew() {
    if (!newTitle.trim()) return
    const title = newTitle.trim()
    const tempId = `temp-${Date.now()}`
    setLocalCols(prev => [...prev, { id: tempId, title, hasItem: true }])
    setNewTitle('')
    setShowNew(false)
    startTransition(async () => {
      const fd = new FormData()
      fd.set('title', title)
      let res: { id?: string; error?: string }
      if (itemType === 'task') {
        fd.set('task_id', itemId)
        res = await createCollectionWithTask(fd)
      } else {
        fd.set('material_id', itemId)
        res = await createCollectionWithMaterial(fd)
      }
      if (res.id) {
        setLocalCols(prev => prev.map(c => c.id === tempId ? { ...c, id: res.id! } : c))
      }
    })
  }

  const dropdown = open && pos ? (
    <div
      ref={dropdownRef}
      className="rounded-2xl border shadow-xl overflow-hidden"
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        width: pos.width,
        zIndex: 9999,
        background: 'var(--card)',
        borderColor: 'var(--border)',
        boxShadow: '0 16px 40px -8px rgba(0,0,0,0.22)',
      }}
    >
      <div className="max-h-52 overflow-y-auto">
        {localCols.length === 0 && !showNew && (
          <p className="px-4 py-3 text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {t('noCollections')}
          </p>
        )}
        {localCols.map(col => (
          <button
            key={col.id}
            onClick={() => handleToggle(col.id, col.hasItem)}
            disabled={isPending}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-60"
            style={{ color: 'var(--foreground)' }}
          >
            <div
              className="w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors"
              style={{
                background:  col.hasItem ? 'var(--primary)' : 'transparent',
                borderColor: col.hasItem ? 'var(--primary)' : 'var(--border)',
              }}
            >
              {col.hasItem && <Check className="w-3 h-3 text-white" />}
            </div>
            <span className="truncate">{col.title}</span>
          </button>
        ))}
      </div>

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
  ) : null

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={open ? () => setOpen(false) : openDropdown}
        className={`flex items-center gap-1.5 border font-medium transition-all rounded-xl ${compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'}`}
        style={{
          background:   anyAdded ? 'color-mix(in srgb, var(--primary) 12%, transparent)' : 'var(--card)',
          borderColor:  anyAdded ? 'var(--primary)' : 'var(--border)',
          color:        anyAdded ? 'var(--primary)' : 'var(--muted-foreground)',
        }}
      >
        <BookMarked className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        {t('addToCollection')}
        <ChevronDown className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      </button>

      {typeof document !== 'undefined' && createPortal(dropdown, document.body)}
    </div>
  )
}
