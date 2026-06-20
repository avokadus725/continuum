'use client'

/* Avatar – community user avatar with image fallback to initials. */

import { useState } from 'react'

interface Props {
  name: string | null
  url: string | null
  size?: number
}

export function Avatar({ name, url, size = 36 }: Props) {
  const dim = `${size}px`
  const [imgFailed, setImgFailed] = useState(false)

  if (url && !imgFailed) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={url}
        alt={name ?? ''}
        className="rounded-full object-cover"
        style={{ width: dim, height: dim, flexShrink: 0 }}
        onError={() => setImgFailed(true)}
      />
    )
  }
  return (
    <div
      className="flex flex-none items-center justify-center rounded-full"
      style={{
        width: dim, height: dim,
        background: 'color-mix(in srgb, var(--primary) 14%, var(--muted))',
        color: 'var(--primary)',
        border: '1.5px solid color-mix(in srgb, var(--primary) 25%, var(--border))',
        fontSize: Math.round(size * 0.38), fontWeight: 700,
      }}
    >
      {(name?.[0] ?? '?').toUpperCase()}
    </div>
  )
}
