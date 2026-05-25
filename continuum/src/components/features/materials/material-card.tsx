import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { AddToCollectionButton } from '@/components/features/collections/add-to-collection-button'
import { MaterialTypeIcon } from '@/components/ui/material-type-icon'
import { TopicIcon } from '@/lib/topic-icons'

type MaterialType = 'article' | 'video' | 'link' | 'interactive'

interface CollectionOption { id: string; title: string; hasItem: boolean }

interface MaterialCardProps {
  id: string
  title: string
  content: string | null
  url: string | null
  type: MaterialType
  topic: { title: string; icon: string | null; slug?: string | null } | null
  collections?: CollectionOption[]
}

const TYPE_ACCENT: Record<MaterialType, string> = {
  article:     'var(--primary)',
  video:       'var(--destructive)',
  link:        'var(--warning)',
  interactive: 'var(--success)',
}

export async function MaterialCard({ id, title, content, url, type, topic, collections }: MaterialCardProps) {
  const t = await getTranslations('materials.types')

  const excerpt = content ? content.slice(0, 130) + (content.length > 130 ? '…' : '') : null
  const accent  = TYPE_ACCENT[type]

  return (
    <div
      className="relative group h-full rounded-2xl border flex flex-col overflow-hidden
                 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      {/* ── Top accent strip (type color) ── */}
      <div style={{ height: 3, background: accent, flexShrink: 0 }} />

      {/* ── Add-to-collection hover button ── */}
      {collections !== undefined && (
        <div className="absolute right-3 bottom-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <AddToCollectionButton itemId={id} itemType="material" collections={collections} compact />
        </div>
      )}

      <Link
        href={`/materials/${id}`}
        className={`flex flex-col flex-1 p-5 gap-2.5 ${collections !== undefined ? 'pb-12' : ''}`}
      >
        {/* ── Type label row ── */}
        <div className="flex items-center justify-between gap-2">
          {/* Type */}
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold"
            style={{ color: accent }}
          >
            <MaterialTypeIcon type={type} size={12} />
            {t(type)}
          </span>

          {/* Topic */}
          {topic && (
            <span
              className="inline-flex items-center gap-1.5 text-[11px] truncate max-w-[130px]"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <TopicIcon slug={topic.slug} size={11} className="shrink-0" />
              <span className="truncate">{topic.title}</span>
            </span>
          )}
        </div>

        {/* ── Title ── */}
        <h3
          className="font-bold text-[15px] leading-snug"
          style={{ color: 'var(--foreground)' }}
        >
          {title}
        </h3>

        {/* ── Excerpt ── */}
        {excerpt && (
          <p
            className="text-[13px] leading-relaxed line-clamp-3 flex-1"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {excerpt}
          </p>
        )}

        {/* ── External link domain ── */}
        {url && !content && (
          <p className="text-[12px]" style={{ color: accent, opacity: 0.8 }}>
            {url.replace(/^https?:\/\//, '').split('/')[0]} ↗
          </p>
        )}
      </Link>
    </div>
  )
}
