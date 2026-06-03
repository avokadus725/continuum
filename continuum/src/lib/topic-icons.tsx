import {
  Network, Database, Globe, Calculator, Layers, BookOpen,
  Cpu, Wifi, BoxSelect, type LucideIcon,
} from 'lucide-react'

interface TopicIconMeta {
  Icon: LucideIcon
  color: string
}

export const TOPIC_ICON_MAP: Record<string, TopicIconMeta> = {
  // canonical slugs after merge
  'algorithms-ds':        { Icon: Network,    color: '#6366f1' }, // indigo
  databases:              { Icon: Database,   color: '#a855f7' }, // purple
  'web-development':      { Icon: Globe,      color: '#3b82f6' }, // blue
  mathematics:            { Icon: Calculator, color: '#f59e0b' }, // amber
  'software-engineering': { Icon: Layers,     color: '#10b981' }, // emerald
  oop:                    { Icon: BoxSelect,  color: '#ec4899' }, // pink
  'operating-systems':    { Icon: Cpu,        color: '#f97316' }, // orange
  'computer-networks':    { Icon: Wifi,       color: '#06b6d4' }, // cyan
  // legacy aliases (keep for safety)
  algorithms:             { Icon: Network,    color: '#6366f1' },
  web:                    { Icon: Globe,      color: '#3b82f6' },
  math:                   { Icon: Calculator, color: '#f59e0b' },
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
