'use client'

import { useTranslations } from 'next-intl'
import { useRef, useState, useTransition } from 'react'
import { submitTaskAnswer } from '@/app/actions/tasks'

type TaskType = 'single_choice' | 'multiple_choice' | 'text' | 'code'

interface Option {
  id: string
  text: string
  order_num: number
}

interface TaskFormProps {
  taskId: string
  taskType: TaskType
  options: Option[]
  alreadyCorrect: boolean
  explanation?: string | null
}

export function TaskForm({ taskId, taskType, options, alreadyCorrect, explanation }: TaskFormProps) {
  const t = useTranslations('tasks')
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ isCorrect: boolean; xpEarned: number } | null>(null)

  if (alreadyCorrect) {
    return (
      <div
        className="rounded-2xl border p-5 text-center"
        style={{ background: 'var(--card)', borderColor: 'var(--success)' }}
      >
        <p className="font-semibold" style={{ color: 'var(--success)' }}>
          ✓ {t('alreadyCorrect')}
        </p>
      </div>
    )
  }

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await submitTaskAnswer(formData)
      if ('isCorrect' in res && typeof res.isCorrect === 'boolean') {
        setResult({ isCorrect: res.isCorrect, xpEarned: res.xpEarned as number })
        if (res.isCorrect) formRef.current?.reset()
      }
    })
  }

  const sortedOptions = [...options].sort((a, b) => a.order_num - b.order_num)

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-4">
      <input type="hidden" name="taskId" value={taskId} />
      <input type="hidden" name="taskType" value={taskType} />

      <div
        className="rounded-2xl border p-5 space-y-3"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
          {t(`types.${taskType}`)}
        </p>

        {(taskType === 'single_choice' || taskType === 'multiple_choice') && sortedOptions.map((option) => {
          const inputType = taskType === 'single_choice' ? 'radio' : 'checkbox'
          return (
            <label
              key={option.id}
              className="flex items-start gap-3 cursor-pointer rounded-xl p-3 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            >
              <input
                type={inputType}
                name="answer"
                value={option.id}
                className="mt-0.5 accent-[var(--primary)]"
                disabled={isPending || result?.isCorrect}
              />
              <span className="text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>
                {option.text}
              </span>
            </label>
          )
        })}

        {taskType === 'text' && (
          <textarea
            name="answer"
            rows={4}
            placeholder={t('submit')}
            disabled={isPending || result?.isCorrect}
            className="w-full rounded-xl border px-3 py-2 text-sm resize-none outline-none focus:ring-2"
            style={{
              background: 'var(--background)',
              borderColor: 'var(--border)',
              color: 'var(--foreground)',
            }}
          />
        )}

        {taskType === 'code' && (
          <textarea
            name="answer"
            rows={8}
            placeholder="// code here"
            disabled={isPending || result?.isCorrect}
            className="w-full rounded-xl border px-3 py-2 text-sm resize-y outline-none focus:ring-2 font-mono"
            style={{
              background: 'var(--background)',
              borderColor: 'var(--border)',
              color: 'var(--foreground)',
            }}
          />
        )}
      </div>

      {/* Result feedback */}
      {result && (
        <div
          className="rounded-xl px-4 py-3 text-sm font-medium"
          style={{
            background: result.isCorrect ? 'color-mix(in srgb, var(--success) 15%, transparent)' : 'color-mix(in srgb, var(--destructive) 15%, transparent)',
            color: result.isCorrect ? 'var(--success)' : 'var(--destructive)',
            border: `1px solid ${result.isCorrect ? 'var(--success)' : 'var(--destructive)'}`,
          }}
        >
          {result.isCorrect
            ? t('correct', { xp: result.xpEarned })
            : t('incorrect')}
        </div>
      )}

      {/* Explanation — shown after any attempt */}
      {result && explanation && (
        <div
          className="rounded-xl px-4 py-3 text-sm leading-relaxed"
          style={{
            background: 'color-mix(in srgb, var(--primary) 8%, transparent)',
            border: '1px solid color-mix(in srgb, var(--primary) 25%, transparent)',
            color: 'var(--foreground)',
          }}
        >
          <p className="text-xs font-semibold mb-1" style={{ color: 'var(--primary)' }}>
            💡 {t('explanation')}
          </p>
          <p className="whitespace-pre-wrap">{explanation}</p>
        </div>
      )}

      {!result?.isCorrect && (
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-opacity disabled:opacity-50"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
        >
          {isPending ? '...' : t('submit')}
        </button>
      )}
    </form>
  )
}
