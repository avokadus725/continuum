'use client'

/* Thin client wrapper so onError works inside server components.
   Hides the img entirely if the file isn't present yet, so the
   badge still looks clean until you drop in public/icons/material-*.png */

export function MaterialTypeIcon({ type, size = 11 }: { type: string; size?: number }) {
  return (
    <img
      src={`/icons/material-${type}.png`}
      alt=""
      width={size}
      height={size}
      className="dark:invert"
      style={{ display: 'inline-block' }}
      onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
    />
  )
}
