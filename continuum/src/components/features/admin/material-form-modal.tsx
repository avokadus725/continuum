'use client'

/* Material form modal — create or edit a learning material. */

import { useTranslations } from 'next-intl'
import { useRef, useState, useTransition } from 'react'
import { createMaterial, updateMaterial } from '@/app/actions/admin'
import { toast } from 'sonner'

interface Topic { id: string; title: string; icon: string | null }

interface MaterialFormModalProps {
  topics: Topic[]
  material?: {
    id: string; title: string; content: string | null; url: string | null
    type: string; topic_id: string | null; is_published: boolean
  }
  onClose: () => void
}

const TYPES = ['article', 'video', 'link', 'interactive'] as const

export function MaterialFormModal({ topics, material, onClose }: MaterialFormModalProps) {
  const t = useTranslations('materials')
  const tCommon = useTranslations('common')
  const tAdmin = useTranslations('admin')
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const res = material ? await updateMaterial(formData) : await createMaterial(formData)
      if ('error' in res && res.error) {
        setError(res.error)
      } else {
        toast.success(material ? tCommon('toastUpdated') : tCommon('toastCreated'))
        onClose()
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-xl rounded-2xl border shadow-xl my-4"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>

        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
            {material ? tAdmin('editMaterial') : tAdmin('createMaterial')}
          </h2>
          <button onClick={onClose} style={{ color: 'var(--muted-foreground)' }}>×</button>
        </div>

        <form ref={formRef} action={handleSubmit} className="p-6 space-y-4">
          {material && <input type="hidden" name="id" value={material.id} />}

          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: 'var(--muted-foreground)' }}>{tAdmin('name')}</label>
            <input name="title" required defaultValue={material?.title}
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--muted-foreground)' }}>{tAdmin('materialType')}</label>
              <select name="type" defaultValue={material?.type ?? 'article'}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                {TYPES.map(v => <option key={v} value={v}>{t(`types.${v}`)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--muted-foreground)' }}>{tAdmin('topic')}</label>
              <select name="topic_id" defaultValue={material?.topic_id ?? ''}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                <option value="">—</option>
                {topics.map(tp => <option key={tp.id} value={tp.id}>{tp.icon} {tp.title}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: 'var(--muted-foreground)' }}>URL</label>
            <input name="url" type="url" defaultValue={material?.url ?? ''}
              placeholder="https://..."
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
          </div>

          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: 'var(--muted-foreground)' }}>{tAdmin('content')}</label>
            <textarea name="content" rows={6} defaultValue={material?.content ?? ''}
              className="w-full rounded-xl border px-3 py-2 text-sm resize-none outline-none"
              style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" name="is_published" value="true" defaultChecked={material?.is_published ?? true}
              className="accent-[var(--primary)]" />
            <span style={{ color: 'var(--foreground)' }}>{tAdmin('published')}</span>
          </label>

          {error && <p className="text-sm" style={{ color: 'var(--destructive)' }}>{error}</p>}

          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm border"
              style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
              {tCommon('cancel')}
            </button>
            <button type="submit" disabled={isPending}
              className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
              {isPending ? '...' : tCommon('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
