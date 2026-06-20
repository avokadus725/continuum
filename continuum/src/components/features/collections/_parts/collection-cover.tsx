'use client'

/* Reusable cover band – emoji on a tinted background.
   Used in the list card and the detail hero. */

import { COVERS, type CoverKey } from '@/lib/collection-covers'

interface Props {
  emoji: string
  cover: CoverKey
  size?: 'sm' | 'md'
  children?: React.ReactNode  // right-aligned overlay (e.g. ⋯ menu)
}

export function CollectionCover({ emoji, cover, size = 'md', children }: Props) {
  const palette = COVERS[cover] ?? COVERS.default
  const height = size === 'sm' ? 92 : 96
  const emojiSize = size === 'sm' ? 32 : 40
  return (
    <div
      className="relative flex items-start justify-between"
      style={{
        height, padding: '14px 18px',
        background: palette.tint,
      }}
    >
      <span style={{ fontSize: emojiSize, lineHeight: 1 }}>{emoji}</span>
      {children}
      <span
        aria-hidden
        className="absolute bottom-0 left-0"
        style={{
          width: 6, height: 6,
          borderRadius: '0 4px 0 0',
          background: palette.deep,
          opacity: 0.6,
        }}
      />
    </div>
  )
}
