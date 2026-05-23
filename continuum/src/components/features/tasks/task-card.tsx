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

  return (
    <Link href={`/tasks/${id}`} className="block group">
      <div
        className="h-full rounded-2xl border p-5 flex flex-col gap-2.5
                   transition-all duration-200 group-hover:shadow-md group-hover:-translate-y-0.5"
        style={{
          background: 'var(--card)',
          borderColor: 'var(--border)',
          opacity: isCompleted ? 0.72 : 1,
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

          {/* Completion OR XP */}
          {isCompleted ? (
            <span
              className="flex items-center gap-1 text-[11px] font-medium"
              style={{ color: 'var(--success)' }}
            >
              <Check size={11} strokeWidth={2.5} />
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

        {/* ── Footer: type · topic · xp (if done) ── */}
        <div
          className="flex items-center justify-between mt-auto pt-1.5 gap-3"
          style={{
            borderTop: '1px solid var(--border)',
          }}
        >
          <span className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
            {t(`types.${type}`)}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            {isCompleted && (
              <span
                className="text-[11px] font-medium tabular-nums"
                style={{ color: 'var(--muted-foreground)' }}
              >
                +{xpReward} XP
              </span>
            )}
            {topic && (
              <span className="text-[11px] truncate" style={{ color: 'var(--muted-foreground)' }}>
                {topic.icon} {topic.title}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
