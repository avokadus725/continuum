'use client'

/* Task form modal – create or edit a task with its answer options. */

import { useTranslations } from 'next-intl'
import { useRef, useState, useTransition } from 'react'
import { createTask, updateTask } from '@/app/actions/admin'
import { toast } from 'sonner'

interface Topic { id: string; title: string; icon: string | null }
interface Option { text: string; is_correct: boolean }

interface TaskFormModalProps {
  topics: Topic[]
  task?: {
    id: string; title: string; description: string
    difficulty: string; type: string; xp_reward: number
    topic_id: string | null; is_published: boolean
    explanation?: string | null
    options: Option[]
  }
  onClose: () => void
}

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const
const TYPES = ['single_choice', 'multiple_choice', 'text', 'code'] as const

export function TaskFormModal({ topics, task, onClose }: TaskFormModalProps) {
  const t = useTranslations('tasks')
  const tCommon = useTranslations('common')
  const tAdmin = useTranslations('admin')

  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [type, setType] = useState(task?.type ?? 'single_choice')
  const [options, setOptions] = useState<Option[]>(
    task?.options.length ? task.options : [{ text: '', is_correct: false }, { text: '', is_correct: false }]
  )

  const needsOptions = type === 'single_choice' || type === 'multiple_choice'

  function addOption() {
    setOptions([...options, { text: '', is_correct: false }])
  }

  function removeOption(i: number) {
    setOptions(options.filter((_, idx) => idx !== i))
  }

  function updateOption(i: number, field: keyof Option, value: string | boolean) {
    const next = options.map((o, idx) => idx === i ? { ...o, [field]: value } : o)
    // single_choice: only one correct
    if (field === 'is_correct' && value === true && type === 'single_choice') {
      setOptions(next.map((o, idx) => ({ ...o, is_correct: idx === i })))
    } else {
      setOptions(next)
    }
  }

  async function handleSubmit(formData: FormData) {
    setError(null)
    if (needsOptions) formData.set('options', JSON.stringify(options.filter(o => o.text.trim())))
    startTransition(async () => {
      const res = task ? await updateTask(formData) : await createTask(formData)
      if ('error' in res && res.error) {
        setError(res.error)
      } else {
        toast.success(task ? tCommon('toastUpdated') : tCommon('toastCreated'))
        onClose()
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-2xl rounded-2xl border shadow-xl max-h-[90dvh] overflow-y-auto"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
            {task ? tAdmin('editTask') : tAdmin('createTask')}
          </h2>
          <button onClick={onClose}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-lg transition-colors hover:bg-[var(--muted)]"
            style={{ color: 'var(--muted-foreground)' }}>×</button>
        </div>

        <form ref={formRef} action={handleSubmit} className="p-6 space-y-4">
          {task && <input type="hidden" name="id" value={task.id} />}

          {/* Title */}
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: 'var(--muted-foreground)' }}>{tAdmin('name')}</label>
            <input name="title" required defaultValue={task?.title}
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: 'var(--muted-foreground)' }}>{tAdmin('description')}</label>
            <textarea name="description" required rows={3} defaultValue={task?.description}
              className="w-full rounded-xl border px-3 py-2 text-sm resize-none outline-none"
              style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
          </div>

          {/* Row: type + difficulty + xp */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--muted-foreground)' }}>{tAdmin('taskType')}</label>
              <select name="type" defaultValue={task?.type ?? 'single_choice'}
                onChange={e => setType(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                {TYPES.map(v => <option key={v} value={v}>{t(`types.${v}`)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--muted-foreground)' }}>{tAdmin('difficulty')}</label>
              <select name="difficulty" defaultValue={task?.difficulty ?? 'beginner'}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                {DIFFICULTIES.map(v => <option key={v} value={v}>{t(`difficulty.${v}`)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--muted-foreground)' }}>XP</label>
              <input name="xp_reward" type="number" min={1} max={100} defaultValue={task?.xp_reward ?? 10}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
            </div>
          </div>

          {/* Topic + published */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--muted-foreground)' }}>{tAdmin('topic')}</label>
              <select name="topic_id" defaultValue={task?.topic_id ?? ''}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                <option value="">–</option>
                {topics.map(tp => <option key={tp.id} value={tp.id}>{tp.icon} {tp.title}</option>)}
              </select>
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" name="is_published" value="true" defaultChecked={task?.is_published ?? true}
                  className="accent-[var(--primary)]" />
                <span style={{ color: 'var(--foreground)' }}>{tAdmin('published')}</span>
              </label>
            </div>
          </div>

          {/* Explanation */}
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: 'var(--muted-foreground)' }}>{tAdmin('explanation')}</label>
            <textarea name="explanation" rows={3} defaultValue={task?.explanation ?? ''}
              placeholder={tAdmin('explanationPlaceholder')}
              className="w-full rounded-xl border px-3 py-2 text-sm resize-none outline-none"
              style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
          </div>

          {/* Options */}
          {needsOptions && (
            <div className="space-y-2">
              <label className="text-xs font-medium block" style={{ color: 'var(--muted-foreground)' }}>
                {tAdmin('options')} {type === 'single_choice' ? tAdmin('optionsSingleHint') : tAdmin('optionsMultiHint')}
              </label>
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type={type === 'single_choice' ? 'radio' : 'checkbox'}
                    checked={opt.is_correct}
                    onChange={e => updateOption(i, 'is_correct', e.target.checked)}
                    className="accent-[var(--primary)] shrink-0"
                    name="_correct_visual"
                  />
                  <input value={opt.text} onChange={e => updateOption(i, 'text', e.target.value)}
                    placeholder={`${tAdmin('option')} ${i + 1}`}
                    className="flex-1 rounded-xl border px-3 py-1.5 text-sm outline-none"
                    style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
                  {options.length > 2 && (
                    <button type="button" onClick={() => removeOption(i)}
                      className="text-sm shrink-0" style={{ color: 'var(--destructive)' }}>×</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addOption}
                className="text-xs px-3 py-1 rounded-lg border"
                style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}>
                + {tAdmin('addOption')}
              </button>
            </div>
          )}

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
