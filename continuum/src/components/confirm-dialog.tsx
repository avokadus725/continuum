'use client'

import { useEffect } from 'react'

interface ConfirmDialogProps {
  message: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  message, confirmLabel, cancelLabel, onConfirm, onCancel,
}: ConfirmDialogProps) {
  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={e => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div
        className="w-full max-w-sm rounded-2xl border shadow-2xl p-6 space-y-5"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <p className="text-sm font-medium text-center" style={{ color: 'var(--foreground)' }}>
          {message}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-xl text-sm border transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => { onConfirm(); onCancel() }}
            className="flex-1 py-2 rounded-xl text-sm font-semibold text-white transition-colors hover:opacity-90"
            style={{ background: 'var(--destructive)' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
