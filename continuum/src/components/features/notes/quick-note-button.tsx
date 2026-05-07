'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { NoteEditor } from './note-editor'

interface QuickNoteButtonProps {
  materialId?: string
  materialTitle?: string
  taskId?: string
  taskTitle?: string
}

export function QuickNoteButton({ materialId, materialTitle, taskId, taskTitle }: QuickNoteButtonProps) {
  const t = useTranslations('notes')
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors hover:bg-black/5 dark:hover:bg-white/5"
        style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
      >
        <span>📝</span>
        <span>{t('create')}</span>
      </button>

      {open && (
        <NoteEditor
          onClose={() => setOpen(false)}
          materialId={materialId}
          materialTitle={materialTitle}
          taskId={taskId}
          taskTitle={taskTitle}
        />
      )}
    </>
  )
}
