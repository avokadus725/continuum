'use client'

/* Single "helpful" reaction button — replaces the 3-emoji ReactionsBar
   on material detail. Optimistic, server-synced. */

import { useState, useTransition } from 'react'
import { Heart } from 'lucide-react'
import { toggleReaction } from '@/app/actions/reactions'

interface Props {
  materialId: string
  count: number
  reacted: boolean
}

export function HelpfulButton({ materialId, count, reacted }: Props) {
  const [isPending, startTransition] = useTransition()
  const [local, setLocal] = useState({ count, reacted })

  function handle() {
    setLocal(prev => ({
      count: prev.reacted ? prev.count - 1 : prev.count + 1,
      reacted: !prev.reacted,
    }))
    startTransition(async () => {
      const fd = new FormData()
      fd.set('type', 'helpful')
      fd.set('material_id', materialId)
      await toggleReaction(fd)
    })
  }

  return (
    <button
      onClick={handle}
      disabled={isPending}
      className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-[9px] border text-[12.5px] font-semibold transition-all disabled:opacity-60"
      style={{
        background: local.reacted ? 'color-mix(in srgb, #e11d48 8%, transparent)' : 'var(--card)',
        borderColor: local.reacted ? 'color-mix(in srgb, #e11d48 30%, transparent)' : 'var(--border)',
        color: local.reacted ? '#e11d48' : 'var(--muted-foreground)',
      }}
    >
      <Heart className="h-3.5 w-3.5" fill={local.reacted ? 'currentColor' : 'none'} />
      Корисно{local.count > 0 ? ` · ${local.count}` : ''}
    </button>
  )
}
