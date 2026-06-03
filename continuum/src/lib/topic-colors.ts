/* Topic color helper — single source of truth for the accent color
   used by material/task/note cards and detail pages.
   Mirrors the colors already defined in topic-icons.tsx so cards,
   notes and badges all share one palette keyed by topic slug. */

import { TOPIC_ICON_MAP } from '@/lib/topic-icons'

const FALLBACK_COLOR = 'var(--muted-foreground)'

/** Accent color for a topic slug. Falls back to muted when unknown/null. */
export function topicColor(slug?: string | null): string {
  if (!slug) return FALLBACK_COLOR
  return TOPIC_ICON_MAP[slug]?.color ?? FALLBACK_COLOR
}

/** Soft tinted background derived from the topic color. */
export function topicTint(slug?: string | null, pct = 12): string {
  const c = topicColor(slug)
  if (c === FALLBACK_COLOR) return 'var(--muted)'
  return `color-mix(in srgb, ${c} ${pct}%, var(--card))`
}
