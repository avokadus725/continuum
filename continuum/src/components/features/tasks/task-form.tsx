'use client'

/* Task form — answer input for the four task types; submits and shows the result. */

import { useTranslations } from 'next-intl'
import { useRef, useState, useTransition } from 'react'
import { Check } from 'lucide-react'
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
  const [isPending, startTransition]  = useTransition()
  const [result, setResult]           = useState<{ isCorrect: boolean; xpEarned: number } | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  /* ── Already solved ───────────────────────────── */
  if (alreadyCorrect) {
    return (
      <div
        className="rounded-2xl p-5 mb-4"
        style={{
          background: 'color-mix(in srgb, var(--success) 6%, var(--card))',
          border: '1px solid color-mix(in srgb, var(--success) 30%, var(--border))',
          borderLeft: '3px solid var(--success)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full shrink-0"
            style={{ background: 'color-mix(in srgb, var(--success) 15%, transparent)' }}
          >
            <Check size={18} style={{ color: 'var(--success)' }} strokeWidth={2.5} />
          </div>
          <p className="font-semibold text-[14px]" style={{ color: 'var(--success)' }}>
            {t('alreadyCorrect')}
          </p>
        </div>

        {explanation && (
          <div
            className="mt-3.5 rounded-xl px-4 py-3 text-[13px] leading-relaxed"
            style={{
              background: 'color-mix(in srgb, var(--primary) 8%, transparent)',
              border: '1px solid color-mix(in srgb, var(--primary) 25%, transparent)',
              color: 'var(--foreground)',
            }}
          >
            <p className="text-[11.5px] font-semibold mb-1.5" style={{ color: 'var(--primary)' }}>
              💡 {t('explanation')}
            </p>
            <p className="whitespace-pre-wrap">{explanation}</p>
          </div>
        )}
      </div>
    )
  }

  /* ── Option selection handler ────────────────── */
  function handleSelect(optionId: string) {
    if (isPending || result?.isCorrect) return
    if (taskType === 'single_choice') {
      setSelectedIds([optionId])
    } else {
      setSelectedIds(prev =>
        prev.includes(optionId)
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId],
      )
    }
  }

  /* ── Form submission ─────────────────────────── */
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
  const isChoiceType  = taskType === 'single_choice' || taskType === 'multiple_choice'

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-3 mb-4">
      <input type="hidden" name="taskId"   value={taskId} />
      <input type="hidden" name="taskType" value={taskType} />

      {/* Inject selected IDs as hidden inputs for form submission */}
      {selectedIds.map(id => (
        <input key={id} type="hidden" name="answer" value={id} />
      ))}

      <div
        className="rounded-2xl border overflow-hidden"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        {/* Type hint */}
        <div
          className="px-5 pt-4 pb-2 flex items-center justify-between"
          style={{ borderBottom: '1px solid color-mix(in srgb, var(--border) 60%, transparent)' }}
        >
          <p className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
            {t(`types.${taskType}`)}
          </p>
          {isChoiceType && (
            <p className="text-[11.5px]" style={{ color: 'var(--muted-foreground)' }}>
              {taskType === 'single_choice' ? t('selectHint') : t('selectMultiHint')}
            </p>
          )}
        </div>

        <div className="p-4 space-y-2">
          {/* ── Choice options ── */}
          {isChoiceType && sortedOptions.map((option, idx) => {
            const isSelected = selectedIds.includes(option.id)
            const letter     = String.fromCharCode(65 + idx) // A, B, C, D…

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelect(option.id)}
                disabled={isPending || !!result?.isCorrect}
                className="flex items-center gap-3 w-full text-left rounded-xl border px-4 py-3 transition-all duration-150 disabled:cursor-not-allowed"
                style={{
                  background: isSelected
                    ? 'color-mix(in srgb, var(--primary) 8%, transparent)'
                    : 'transparent',
                  borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
                }}
              >
                {/* Letter badge */}
                <span
                  className="flex-none w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-bold shrink-0 transition-all duration-150"
                  style={{
                    background: isSelected ? 'var(--primary)' : 'var(--muted)',
                    color:      isSelected ? '#fff' : 'var(--muted-foreground)',
                  }}
                >
                  {letter}
                </span>

                <span
                  className="text-[13.5px] leading-relaxed flex-1"
                  style={{
                    color: isSelected ? 'var(--foreground)' : 'var(--muted-foreground)',
                    fontWeight: isSelected ? 500 : 400,
                  }}
                >
                  {option.text}
                </span>

                {isSelected && (
                  <Check
                    size={14}
                    className="shrink-0"
                    style={{ color: 'var(--primary)' }}
                  />
                )}
              </button>
            )
          })}

          {/* ── Text answer ── */}
          {taskType === 'text' && (
            <textarea
              name="answer"
              rows={4}
              placeholder={t('textAnswerPlaceholder')}
              disabled={isPending || result?.isCorrect}
              className="w-full rounded-xl border px-3.5 py-2.5 text-[13.5px] resize-none outline-none
                         focus:border-[var(--primary)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--primary)_15%,transparent)]
                         transition-colors"
              style={{
                background: 'var(--background)',
                borderColor: 'var(--border)',
                color: 'var(--foreground)',
              }}
            />
          )}

          {/* ── Code answer ── */}
          {taskType === 'code' && (
            <textarea
              name="answer"
              rows={8}
              placeholder="// write your code here"
              disabled={isPending || result?.isCorrect}
              className="w-full rounded-xl border px-3.5 py-2.5 text-[13px] resize-y outline-none font-mono
                         focus:border-[var(--primary)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--primary)_15%,transparent)]
                         transition-colors"
              style={{
                background: 'var(--background)',
                borderColor: 'var(--border)',
                color: 'var(--foreground)',
              }}
            />
          )}
        </div>
      </div>

      {/* ── Result feedback ─────────────────────── */}
      {result && (
        <div
          className="rounded-xl px-4 py-3 text-[13.5px] font-medium"
          style={{
            background: result.isCorrect
              ? 'color-mix(in srgb, var(--success) 12%, transparent)'
              : 'color-mix(in srgb, var(--destructive) 12%, transparent)',
            color:  result.isCorrect ? 'var(--success)' : 'var(--destructive)',
            border: `1px solid ${result.isCorrect ? 'color-mix(in srgb, var(--success) 40%, transparent)' : 'color-mix(in srgb, var(--destructive) 40%, transparent)'}`,
          }}
        >
          {result.isCorrect
            ? `✓ ${t('correct', { xp: result.xpEarned })}`
            : `✗ ${t('incorrect')}`}
        </div>
      )}

      {/* ── Explanation ─────────────────────────── */}
      {result && explanation && (
        <div
          className="rounded-xl px-4 py-3.5 text-[13px] leading-relaxed"
          style={{
            background: 'color-mix(in srgb, var(--primary) 8%, transparent)',
            border: '1px solid color-mix(in srgb, var(--primary) 25%, transparent)',
            color: 'var(--foreground)',
          }}
        >
          <p className="text-[11.5px] font-semibold mb-1.5" style={{ color: 'var(--primary)' }}>
            💡 {t('explanation')}
          </p>
          <p className="whitespace-pre-wrap">{explanation}</p>
        </div>
      )}

      {/* ── Submit button ───────────────────────── */}
      {!result?.isCorrect && (
        <button
          type="submit"
          disabled={isPending || (isChoiceType && selectedIds.length === 0)}
          className="w-full rounded-xl px-4 py-3 text-[13.5px] font-semibold transition-all
                     disabled:opacity-40 disabled:cursor-not-allowed
                     hover:opacity-90 active:scale-[0.99]"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
        >
          {isPending ? '…' : t('submit')}
        </button>
      )}
    </form>
  )
}
