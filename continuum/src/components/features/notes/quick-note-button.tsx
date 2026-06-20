'use client'

/* Quick-note button – creates a note linked to the current material or task. */

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { NoteEditor } from './note-editor'

interface QuickNoteButtonProps {
  materialId?: string
  materialTitle?: string
  taskId?: string
  taskTitle?: string
  collections?: { id: string; title: string }[]
}

export function QuickNoteButton({ materialId, materialTitle, taskId, taskTitle, collections }: QuickNoteButtonProps) {
  const t = useTranslations('notes')
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex w-full items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border whitespace-nowrap transition-colors hover:bg-black/5 dark:hover:bg-white/5"
        style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/note.png" alt="" width={15} height={15} className="dark:invert" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
        <span>{t('create')}</span>
      </button>

      {open && (
        <NoteEditor
          onClose={() => setOpen(false)}
          materialId={materialId}
          materialTitle={materialTitle}
          taskId={taskId}
          taskTitle={taskTitle}
          collections={collections}
        />
      )}
    </>
  )
}
