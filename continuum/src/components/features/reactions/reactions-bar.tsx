'use client'

import { useTranslations } from 'next-intl'
import { useTransition } from 'react'
import { toggleReaction } from '@/app/actions/reactions'

type ReactionType = 'like' | 'helpful' | 'fire'

interface ReactionCount {
  type: ReactionType
  count: number
  reacted: boolean
}

interface ReactionsBarProps {
  reactions: ReactionCount[]
  materialId: string
}

export function ReactionsBar({ reactions, materialId }: ReactionsBarProps) {
  const t = useTranslations('reactions')
  const [isPending, startTransition] = useTransition()

  function handle(type: ReactionType) {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('type', type)
      fd.set('material_id', materialId)
      await toggleReaction(fd)
    })
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {reactions.map(({ type, count, reacted }) => (
        <button
          key={type}
          onClick={() => handle(type)}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all disabled:opacity-60"
          style={{
            background: reacted ? 'color-mix(in srgb, var(--primary) 15%, transparent)' : 'var(--card)',
            borderColor: reacted ? 'var(--primary)' : 'var(--border)',
            color: reacted ? 'var(--primary)' : 'var(--muted-foreground)',
          }}
        >
          <span>{t(type)}</span>
          {count > 0 && <span>{count}</span>}
        </button>
      ))}
    </div>
  )
}
