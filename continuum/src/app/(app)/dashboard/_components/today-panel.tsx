'use client'

/* Today panel – interactive checklist of what to close before evening.
   Quiz tasks are read-only (completed on the task detail page).
   Personal to-dos are created, toggled, and deleted inline. */

import { useState, useTransition, useOptimistic, useRef } from 'react'
import Link from 'next/link'
import { ChevronRight, X, Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Panel } from './panel'
import { createTodo, toggleTodo, deleteTodo } from '@/app/actions/todos'

export type TodayItemKind = 'task' | 'note' | 'deadline' | 'material' | 'todo'

export interface TodayItem {
  id: string
  kind: TodayItemKind
  title: string
  meta: string
  href?: string
  done: boolean
  urgent?: boolean
}

interface Props {
  items: TodayItem[]
}

const KIND_COLOR: Record<TodayItemKind, string> = {
  task:     'var(--primary)',
  note:     'var(--muted-foreground)',
  deadline: 'var(--destructive)',
  material: 'var(--success)',
  todo:     '#C2956C',
}

type OptAction =
  | { op: 'toggle'; id: string }
  | { op: 'delete'; id: string }
  | { op: 'add';    item: TodayItem }

export function TodayPanel({ items }: Props) {
  const t = useTranslations('dashboard')
  const inputRef = useRef<HTMLInputElement>(null)
  const [inputValue, setInputValue] = useState('')
  const [, start] = useTransition()

  const [optimistic, applyOptimistic] = useOptimistic(
    items,
    (state: TodayItem[], action: OptAction) => {
      switch (action.op) {
        case 'toggle': return state.map(i => i.id === action.id ? { ...i, done: !i.done } : i)
        case 'delete': return state.filter(i => i.id !== action.id)
        case 'add':    return [...state, action.item]
      }
    },
  )

  const done = optimistic.filter(i => i.done).length

  const kindLabel: Record<TodayItemKind, string> = {
    task:     t('kindTask'),
    note:     t('kindNote'),
    deadline: t('kindDeadline'),
    material: t('kindMaterial'),
    todo:     t('kindTodo'),
  }

  function handleAdd() {
    const title = inputValue.trim()
    if (!title) return
    const tempId = `tmp-${Date.now()}`
    const newItem: TodayItem = { id: tempId, kind: 'todo', title, meta: '', done: false }
    setInputValue('')                             // clear immediately (sync)
    start(async () => {
      applyOptimistic({ op: 'add', item: newItem })
      await createTodo(title)
    })
  }

  return (
    <Panel title={t('todayTitle')} sub={t('todaySub')} counter={`${done} / ${optimistic.length}`}>
      <ul className="flex flex-col">
        {optimistic.map((it, i) => (
          <Row
            key={it.id}
            it={it}
            last={i === optimistic.length - 1}
            kindLabel={kindLabel[it.kind]}
            markDoneLabel={t('markDone')}
            markUndoneLabel={t('markUndone')}
            deleteTodoLabel={t('deleteTodo')}
            onToggle={it.kind === 'todo' ? () => {
              start(async () => {
                applyOptimistic({ op: 'toggle', id: it.id })
                await toggleTodo(it.id)
              })
            } : undefined}
            onDelete={it.kind === 'todo' ? () => {
              start(async () => {
                applyOptimistic({ op: 'delete', id: it.id })
                await deleteTodo(it.id)
              })
            } : undefined}
          />
        ))}
      </ul>

      {/* Inline add-todo form */}
      <div
        className="mt-2 flex items-center gap-2 rounded-xl border px-3 py-2"
        style={{ borderColor: 'color-mix(in srgb, var(--border) 80%, transparent)', background: 'var(--muted)' }}
      >
        <Plus size={14} style={{ color: '#C2956C', flexShrink: 0 }} />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
          placeholder={t('addTodoPlaceholder')}
          className="min-w-0 flex-1 bg-transparent text-[13px] outline-none"
          style={{ color: 'var(--foreground)' }}
        />
        {inputValue.trim() && (
          <button
            type="button"
            onClick={handleAdd}
            className="flex-none rounded-lg px-2.5 py-1 text-[12px] font-semibold transition-colors"
            style={{ background: '#C2956C', color: '#fff' }}
          >
            {t('addTodoButton')}
          </button>
        )}
      </div>
    </Panel>
  )
}

function Row({
  it, last, kindLabel, markDoneLabel, markUndoneLabel, deleteTodoLabel, onToggle, onDelete,
}: {
  it: TodayItem
  last: boolean
  kindLabel: string
  markDoneLabel: string
  markUndoneLabel: string
  deleteTodoLabel: string
  onToggle?: () => void
  onDelete?: () => void
}) {
  const tone       = KIND_COLOR[it.kind]
  const isTodo     = it.kind === 'todo'
  const interactive = isTodo || it.kind === 'material'

  return (
    <li
      className="group flex items-center gap-3 py-3"
      style={{ borderBottom: last ? 'none' : '1px solid color-mix(in srgb, var(--border) 70%, transparent)' }}
    >
      {/* Checkbox */}
      <button
        type="button"
        onClick={interactive ? onToggle : undefined}
        aria-label={it.done ? markUndoneLabel : markDoneLabel}
        className="inline-flex h-[18px] w-[18px] flex-none items-center justify-center rounded-[5px] border-[1.5px] transition-colors"
        style={{
          borderColor: it.done ? 'var(--success)' : 'color-mix(in srgb, var(--border) 140%, transparent)',
          background:  it.done ? 'var(--success)' : 'transparent',
          cursor: interactive ? 'pointer' : 'default',
        }}
      >
        {it.done && (
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
            <path d="M2 5.5L4 7.5L8 2.5" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Kind label */}
      <span
        className="inline-flex min-w-[64px] flex-none text-[10px] font-semibold uppercase tracking-wide"
        style={{ color: tone }}
      >
        {kindLabel}
      </span>

      {/* Title */}
      {it.href ? (
        <Link
          href={it.href}
          className="flex-1 text-[13.5px] font-medium no-underline"
          style={{
            color: it.done ? 'color-mix(in srgb, var(--muted-foreground) 80%, transparent)' : 'var(--foreground)',
            textDecoration: it.done ? 'line-through' : 'none',
          }}
        >
          {it.title}
        </Link>
      ) : (
        <span
          className="flex-1 text-[13.5px] font-medium"
          style={{
            color: it.done ? 'color-mix(in srgb, var(--muted-foreground) 80%, transparent)' : 'var(--foreground)',
            textDecoration: it.done ? 'line-through' : 'none',
          }}
        >
          {it.title}
        </span>
      )}

      {/* Meta or delete */}
      {isTodo ? (
        <button
          type="button"
          onClick={onDelete}
          aria-label={deleteTodoLabel}
          className="flex-none opacity-0 transition-opacity group-hover:opacity-100"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <X size={14} />
        </button>
      ) : (
        <>
          <span
            className="text-[11.5px]"
            style={{
              color: it.urgent ? 'var(--destructive)' : 'color-mix(in srgb, var(--muted-foreground) 75%, transparent)',
              fontWeight: it.urgent ? 600 : 400,
            }}
          >
            {it.meta}
          </span>
          <ChevronRight size={14} className="opacity-40" style={{ color: 'var(--muted-foreground)' }} />
        </>
      )}
    </li>
  )
}
