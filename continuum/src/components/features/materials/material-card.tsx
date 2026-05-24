import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { AddToCollectionButton } from '@/components/features/collections/add-to-collection-button'

type MaterialType = 'article' | 'video' | 'link' | 'interactive'

interface CollectionOption { id: string; title: string; hasItem: boolean }

interface MaterialCardProps {
  id: string
  title: string
  content: string | null
  url: string | null
  type: MaterialType
  topic: { title: string; icon: string | null } | null
  /** Pass user's collections to show the "Add to collection" button */
  collections?: CollectionOption[]
}

const TYPE_ACCENT: Record<MaterialType, string> = {
  article:     'var(--primary)',
  video:       'var(--destructive)',
  link:        'var(--warning)',
  interactive: 'var(--success)',
}

const typeIcons: Record<MaterialType, string> = {
  article:     '📄',
  video:       '🎬',
  link:        '🔗',
  interactive: '⚡',
}

export async function MaterialCard({ id, title, content, url, type, topic, collections }: MaterialCardProps) {
  const t = await getTranslations('materials.types')

  const excerpt = content ? content.slice(0, 140) + (content.length > 140 ? '…' : '') : null
  const accent  = TYPE_ACCENT[type]

  return (
    <div
      className="relative group h-full rounded-2xl border flex flex-col
                 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
      style={{
        background:  'var(--card)',
        borderColor: 'var(--border)',
        borderLeft:  `3px solid ${accent}`,
      }}
    >
      {/* ── Add-to-collection hover overlay ── */}
      {collections !== undefined && (
        <div className="absolute right-3 top-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <AddToCollectionButton itemId={id} itemType="material" collections={collections} compact />
        </div>
      )}

      <Link href={`/materials/${id}`} className="block p-5 flex-1">

        {/* Top row: type badge + topic */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: `color-mix(in srgb, ${accent} 12%, var(--muted))`,
              color: accent,
            }}
          >
            {typeIcons[type]} {t(type)}
          </span>
          {topic && (
            <span
              className="text-[11px] ml-auto truncate max-w-[120px]"
              style={{ color: 'var(--muted-foreground)' }}
            >
              {topic.icon} {topic.title}
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          className="font-semibold text-[15px] leading-snug mb-2"
          style={{ color: 'var(--foreground)' }}
        >
          {title}
        </h3>

        {/* Excerpt */}
        {excerpt && (
          <p
            className="text-[13px] leading-relaxed line-clamp-3 flex-1"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {excerpt}
          </p>
        )}

        {/* External link domain */}
        {url && !content && (
          <p className="text-[12px] mt-2" style={{ color: 'var(--primary)' }}>
            {url.replace(/^https?:\/\//, '').split('/')[0]} ↗
          </p>
        )}
      </Link>
    </div>
  )
}
