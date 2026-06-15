/* Task card — preview card for a practice task. */

import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Check } from 'lucide-react'
import { DIFF_COLOR, type Difficulty } from '@/lib/difficulty-colors'
import { TopicIcon } from '@/lib/topic-icons'
import { topicColor } from '@/lib/topic-colors'

type TaskType = 'single_choice' | 'multiple_choice' | 'text' | 'code'

interface TaskCardProps {
  id: string
  title: string
  description: string
  difficulty: Difficulty
  type: TaskType
  xpReward: number
  topic: { title: string; icon: string | null; slug?: string | null } | null
  isCompleted?: boolean
}

export async function TaskCard({
  id, title, description, difficulty, type, xpReward, topic, isCompleted,
}: TaskCardProps) {
  const t = await getTranslations('tasks')
  const diffColor   = DIFF_COLOR[difficulty]
  const topicAccent = topicColor(topic?.slug)
  const accentColor = isCompleted ? 'var(--success)' : topicAccent

  return (
    <Link href={`/tasks/${id}`} className="block group">
      <div
        className="h-full rounded-2xl p-4 flex flex-col gap-2.5 transition-all duration-200 group-hover:shadow-md group-hover:-translate-y-0.5"
        style={{
          background: isCompleted ? 'color-mix(in srgb, var(--success) 4%, var(--card))' : 'var(--card)',
          border: isCompleted ? '1px solid color-mix(in srgb, var(--success) 25%, var(--border))' : '1px solid var(--border)',
          borderLeft: `3px solid ${accentColor}`,
        }}
      >
        {/* difficulty + topic + completion/xp */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: diffColor }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: diffColor, display: 'inline-block', flexShrink: 0 }} />
            {t(`difficulty.${difficulty}`)}
          </span>
          {topic && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold truncate" style={{ color: topicAccent }}>
              <TopicIcon slug={topic.slug} size={11} className="shrink-0" />
              <span className="truncate">{topic.title}</span>
            </span>
          )}
          <span className="ml-auto shrink-0">
            {isCompleted ? (
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                style={{ background: 'color-mix(in srgb, var(--success) 15%, transparent)', color: 'var(--success)' }}>
                <Check size={10} strokeWidth={3} />
                {t('done')}
              </span>
            ) : (
              <span className="text-[11px] font-bold tabular-nums" style={{ color: 'var(--primary)' }}>
                +{xpReward} XP
              </span>
            )}
          </span>
        </div>

        <h3 className="font-semibold text-[15px] leading-snug" style={{ color: 'var(--foreground)' }}>
          {title}
        </h3>

        <p className="text-[13px] leading-relaxed flex-1 line-clamp-2" style={{ color: 'var(--muted-foreground)' }}>
          {description}
        </p>

        <div className="mt-auto pt-2 text-[11px]"
          style={{ borderTop: '1px solid color-mix(in srgb, var(--border) 70%, transparent)', color: 'var(--muted-foreground)' }}>
          {t(`types.${type}`)}
        </div>
      </div>
    </Link>
  )
}
