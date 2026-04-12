import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { AddToCollectionButton } from '@/components/features/collections/add-to-collection-button'

type MaterialType = 'article' | 'video' | 'link' | 'interactive'

interface CollectionOption { id: string; title: string; hasMaterial: boolean }

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

const typeColors: Record<MaterialType, string> = {
  article:     'bg-blue-100 text-blue-700',
  video:       'bg-purple-100 text-purple-700',
  link:        'bg-amber-100 text-amber-700',
  interactive: 'bg-green-100 text-green-700',
}

const typeIcons: Record<MaterialType, string> = {
  article:     '📄',
  video:       '🎬',
  link:        '🔗',
  interactive: '⚡',
}

export async function MaterialCard({ id, title, content, url, type, topic, collections }: MaterialCardProps) {
  const t = await getTranslations('materials.types')

  const excerpt = content ? content.slice(0, 120) + (content.length > 120 ? '…' : '') : null

  return (
    <div
      className="h-full rounded-2xl border flex flex-col transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      <Link href={`/materials/${id}`} className="block p-5 flex-1 group">
        {/* Top row: type badge + topic */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${typeColors[type]}`}>
            <span>{typeIcons[type]}</span>
            {t(type)}
          </span>
          {topic && (
            <span className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
              {topic.icon} {topic.title}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-base leading-snug mb-2 group-hover:underline"
          style={{ color: 'var(--foreground)' }}>
          {title}
        </h3>

        {/* Excerpt */}
        {excerpt && (
          <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
            {excerpt}
          </p>
        )}

        {/* External link indicator */}
        {url && !content && (
          <p className="text-xs mt-2" style={{ color: 'var(--primary)' }}>
            {url.replace(/^https?:\/\//, '').split('/')[0]} ↗
          </p>
        )}
      </Link>

      {/* Collection button — only when collections are provided (logged-in context) */}
      {collections !== undefined && (
        <div className="px-4 pb-4 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
          <AddToCollectionButton materialId={id} collections={collections} compact />
        </div>
      )}
    </div>
  )
}
