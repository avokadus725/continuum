'use client'

/* Tabs + sort dropdown.
   Tabs are URL-driven via shallow router navigation. */

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronDown, MessageSquare, HelpCircle, Share2 } from 'lucide-react'
import type { FeedKindFilter, FeedSort } from '../_types'

interface Props {
  kind: FeedKindFilter
  sort: FeedSort
  counts: { all: number; discussion: number; question: number; share: number }
  basePath?: string
}

export function FeedFilterBar({ kind, sort, counts, basePath = '/community' }: Props) {
  const t = useTranslations('community.filter')
  const router = useRouter()
  const params = useSearchParams()
  const [open, setOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  const SORT_LABEL: Record<FeedSort, string> = {
    recent:   t('sortRecent'),
    top:      t('sortTop'),
    unsolved: t('sortUnsolved'),
  }

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  function setKind(next: FeedKindFilter) {
    const sp = new URLSearchParams(params.toString())
    if (next === 'all') sp.delete('kind'); else sp.set('kind', next)
    router.push(`${basePath}${sp.toString() ? '?' + sp.toString() : ''}`)
  }

  function setSort(next: FeedSort) {
    const sp = new URLSearchParams(params.toString())
    if (next === 'recent') sp.delete('sort'); else sp.set('sort', next)
    router.push(`${basePath}${sp.toString() ? '?' + sp.toString() : ''}`)
    setOpen(false)
  }

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2.5 pt-1">
      <div
        className="inline-flex gap-1 rounded-[10px] border p-[3px]"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <TypeTab icon={null}                                  label={t('all')}         n={counts.all}        active={kind === 'all'}        onClick={() => setKind('all')} />
        <TypeTab icon={<HelpCircle    className="h-3.5 w-3.5" />} label={t('questions')}  n={counts.question}   active={kind === 'question'}   onClick={() => setKind('question')}   accent="var(--warning)" />
        <TypeTab icon={<Share2        className="h-3.5 w-3.5" />} label={t('shared')}     n={counts.share}      active={kind === 'share'}      onClick={() => setKind('share')} />
        <TypeTab icon={<MessageSquare className="h-3.5 w-3.5" />} label={t('discussions')} n={counts.discussion} active={kind === 'discussion'} onClick={() => setKind('discussion')} />
      </div>

      <span className="flex-1" />

      {/* Sort dropdown */}
      <div ref={popoverRef} className="relative">
        <button
          onClick={() => setOpen(v => !v)}
          className="inline-flex h-[34px] items-center gap-1.5 rounded-lg border bg-[var(--card)] px-3 text-[12.5px] font-medium"
          style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
        >
          {t('sort')}:&nbsp;
          <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{SORT_LABEL[sort]}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-70" />
        </button>
        {open && (
          <div
            className="absolute right-0 top-[110%] z-20 w-[170px] overflow-hidden rounded-lg border py-1"
            style={{ background: 'var(--card)', borderColor: 'var(--border)', boxShadow: '0 12px 30px -10px rgba(11,22,32,0.2)' }}
          >
            {(['recent', 'top', 'unsolved'] as FeedSort[]).map(s => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className="block w-full px-3 py-1.5 text-left text-[13px]"
                style={{
                  background: s === sort ? 'color-mix(in srgb, var(--primary) 10%, transparent)' : 'transparent',
                  color: s === sort ? 'var(--primary)' : 'var(--foreground)',
                  fontWeight: s === sort ? 600 : 500,
                }}
              >
                {SORT_LABEL[s]}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TypeTab({
  icon, label, n, active, onClick, accent,
}: {
  icon: React.ReactNode
  label: string
  n: number
  active: boolean
  onClick: () => void
  accent?: string
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-md border-0 px-2.5 py-[5px] text-[12.5px] font-semibold"
      style={{
        background: active
          ? (accent ? `color-mix(in srgb, ${accent} 14%, transparent)` : 'color-mix(in srgb, var(--primary) 10%, transparent)')
          : 'transparent',
        color: active ? (accent || 'var(--primary)') : 'var(--muted-foreground)',
      }}
    >
      {icon}
      {label}
      <span
        className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] tabular-nums font-bold"
        style={{
          background: active
            ? (accent ? `color-mix(in srgb, ${accent} 18%, transparent)` : 'color-mix(in srgb, var(--primary) 15%, transparent)')
            : 'color-mix(in srgb, var(--muted-foreground) 15%, transparent)',
          color: 'currentColor',
        }}
      >
        {n}
      </span>
    </button>
  )
}
