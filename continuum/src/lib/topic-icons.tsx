import { Network, Database, Globe, Calculator, Layers, BookOpen, type LucideIcon } from 'lucide-react'

interface TopicIconMeta {
  Icon: LucideIcon
  color: string
}

export const TOPIC_ICON_MAP: Record<string, TopicIconMeta> = {
  algorithms:             { Icon: Network,    color: '#6366f1' }, // indigo
  databases:              { Icon: Database,   color: '#a855f7' }, // purple
  web:                    { Icon: Globe,      color: '#3b82f6' }, // blue
  math:                   { Icon: Calculator, color: '#f59e0b' }, // amber
  'software-engineering': { Icon: Layers,     color: '#10b981' }, // emerald
}

const FALLBACK: TopicIconMeta = { Icon: BookOpen, color: 'var(--muted-foreground)' }

export function TopicIcon({
  slug,
  size = 12,
  className = '',
}: {
  slug?: string | null
  size?: number
  className?: string
}) {
  const meta = (slug && TOPIC_ICON_MAP[slug]) || FALLBACK
  const { Icon } = meta
  return <Icon size={size} className={className} style={{ color: meta.color }} />
}
