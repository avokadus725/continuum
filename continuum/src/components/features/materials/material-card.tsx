/* Material card – preview card for a learning material. */

import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { AddToCollectionButton } from '@/components/features/collections/add-to-collection-button'
import { MaterialTypeIcon } from '@/components/ui/material-type-icon'
import { TopicIcon } from '@/lib/topic-icons'
import { topicColor } from '@/lib/topic-colors'
import { Clock, StickyNote, Bookmark } from 'lucide-react'

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
  readMinutes?: number | null
  hasNote?: boolean
  inCollection?: boolean
}

export async function MaterialCard({
  id, title, content, url, type, topic, collections, readMinutes, hasNote, inCollection,
}: MaterialCardProps) {
  const t = await getTranslations('materials.types')
  const tMat = await getTranslations('materials')

  const excerpt = content ? content.slice(0, 130) + (content.length > 130 ? '…' : '') : null
  const accent  = topicColor(topic?.slug)

  return (
    <div
      className="relative group h-full rounded-2xl border flex flex-col overflow-hidden
                 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
      style={{ background: 'var(--card)', borderColor: 'var(--border)', borderLeft: `3px solid ${accent}` }}
    >
      {collections !== undefined && (
        <div className="absolute right-3 top-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <AddToCollectionButton itemId={id} itemType="material" collections={collections} compact />
        </div>
      )}

      <Link href={`/materials/${id}`} className="flex flex-col flex-1 p-4 gap-2.5">
        {/* Type + topic row */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: 'var(--muted-foreground)' }}>
            <MaterialTypeIcon type={type} size={12} />
            {t(type)}
          </span>
          {topic && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold truncate" style={{ color: accent }}>
              <TopicIcon slug={topic.slug} size={11} className="shrink-0" />
              <span className="truncate">{topic.title}</span>
            </span>
          )}
        </div>

        <h3 className="font-bold text-[15px] leading-snug" style={{ color: 'var(--foreground)' }}>
          {title}
        </h3>

        {excerpt && (
          <p className="text-[13px] leading-relaxed line-clamp-2 flex-1" style={{ color: 'var(--muted-foreground)' }}>
            {excerpt}
          </p>
        )}

        {/* Footer meta */}
        <div
          className="mt-auto flex items-center gap-3 pt-2 text-[11px]"
          style={{ borderTop: '1px solid color-mix(in srgb, var(--border) 70%, transparent)', color: 'var(--muted-foreground)' }}
        >
          {readMinutes ? (
            <span className="inline-flex items-center gap-1"><Clock size={11} /> {tMat('minutesShort', { min: readMinutes })}</span>
          ) : url && !content ? (
            <span className="truncate" style={{ color: accent }}>
              {url.replace(/^https?:\/\//, '').split('/')[0]} ↗
            </span>
          ) : null}
          {hasNote && (
            <span className="inline-flex items-center gap-1" style={{ color: '#C2956C' }}><StickyNote size={11} /> {tMat('noteBadge')}</span>
          )}
          {inCollection && (
            <span className="inline-flex items-center gap-1"><Bookmark size={11} /> {tMat('inCollectionBadge')}</span>
          )}
        </div>
      </Link>
    </div>
  )
}
