import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Check } from 'lucide-react'

type Difficulty = 'beginner' | 'intermediate' | 'advanced'
type TaskType   = 'single_choice' | 'multiple_choice' | 'text' | 'code'

interface TaskCardProps {
  id: string
  title: string
  description: string
  difficulty: Difficulty
  type: TaskType
  xpReward: number
  topic: { title: string; icon: string | null } | null
  isCompleted?: boolean
}

const DIFF_COLOR: Record<Difficulty, string> = {
  beginner:     'var(--success)',
  intermediate: 'var(--warning)',
  advanced:     'var(--destructive)',
}

export async function TaskCard({
  id, title, description, difficulty, type, xpReward, topic, isCompleted,
}: TaskCardProps) {
  const t = await getTranslations('tasks')
  const diffColor = DIFF_COLOR[difficulty]
  const accentColor = isCompleted ? 'var(--success)' : diffColor

  return (
    <Link href={`/tasks/${id}`} className="block group">
      <div
        className="h-full rounded-2xl p-5 flex flex-col gap-2.5
                   transition-all duration-200 group-hover:shadow-md group-hover:-translate-y-0.5"
        style={{
          background: isCompleted
            ? 'color-mix(in srgb, var(--success) 4%, var(--card))'
            : 'var(--card)',
          border: isCompleted
            ? '1px solid color-mix(in srgb, var(--success) 25%, var(--border))'
            : '1px solid var(--border)',
          borderLeft: `3px solid ${accentColor}`,
        }}
      >
        {/* ── Top row: difficulty + completion / xp ── */}
        <div className="flex items-center justify-between gap-2">
          {/* Difficulty dot + label */}
          <span
            className="flex items-center gap-1.5 text-[11px] font-medium"
            style={{ color: diffColor }}
          >
            <span
              style={{
                display: 'inline-block',
                width: 6, height: 6,
                borderRadius: '50%',
                background: diffColor,
                flexShrink: 0,
              }}
            />
            {t(`difficulty.${difficulty}`)}
          </span>

          {/* Done badge or XP */}
          {isCompleted ? (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
              style={{
                background: 'color-mix(in srgb, var(--success) 15%, transparent)',
                color: 'var(--success)',
              }}
            >
              <Check size={10} strokeWidth={3} />
              {t('done')}
            </span>
          ) : (
            <span
              className="text-[11px] font-semibold tabular-nums"
              style={{ color: 'var(--primary)', opacity: 0.8 }}
            >
              +{xpReward} XP
            </span>
          )}
        </div>

        {/* ── Title ── */}
        <h3
          className="font-semibold text-[15px] leading-snug"
          style={{ color: 'var(--foreground)' }}
        >
          {title}
        </h3>

        {/* ── Excerpt ── */}
        <p
          className="text-[13px] leading-relaxed flex-1 line-clamp-2"
          style={{ color: 'var(--muted-foreground)' }}
        >
          {description}
        </p>

        {/* ── Footer: type · topic ── */}
        <div
          className="flex items-center justify-between mt-auto pt-1.5 gap-3"
          style={{ borderTop: '1px solid color-mix(in srgb, var(--border) 70%, transparent)' }}
        >
          <span className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
            {t(`types.${type}`)}
          </span>
          {topic && (
            <span className="text-[11px] truncate" style={{ color: 'var(--muted-foreground)' }}>
              {topic.icon} {topic.title}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
