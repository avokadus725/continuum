'use client'

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
      className="flex flex-none items-center justify-center rounded-full border"
      style={{
        width: dim, height: dim,
        background: 'var(--muted)', color: 'var(--foreground)', borderColor: 'var(--border)',
        fontSize: Math.round(size * 0.38), fontWeight: 700,
      }}
    >
      {(name?.[0] ?? '?').toUpperCase()}
    </div>
  )
}
