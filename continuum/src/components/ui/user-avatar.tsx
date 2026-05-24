'use client'

import { useState } from 'react'

interface Props {
  name: string | null
  url?: string | null
  size?: number
  highlight?: boolean
}

export function UserAvatar({ name, url, size = 36, highlight = false }: Props) {
  const dim = `${size}px`
  const [imgFailed, setImgFailed] = useState(false)

  if (url && !imgFailed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name ?? ''}
        className="rounded-full object-cover"
        style={{
          width: dim, height: dim, flexShrink: 0,
          border: highlight ? '2px solid var(--primary)' : undefined,
        }}
        onError={() => setImgFailed(true)}
      />
    )
  }

  return (
    <div
      className="flex flex-none items-center justify-center rounded-full"
      style={{
        width: dim, height: dim,
        background: highlight
          ? 'color-mix(in srgb, var(--primary) 15%, var(--muted))'
          : 'var(--muted)',
        color: highlight ? 'var(--primary)' : 'var(--foreground)',
        border: highlight ? '2px solid var(--primary)' : '1px solid var(--border)',
        fontSize: Math.round(size * 0.38),
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {(name?.[0] ?? '?').toUpperCase()}
    </div>
  )
}
