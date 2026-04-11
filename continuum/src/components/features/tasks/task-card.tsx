import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

type Difficulty = 'beginner' | 'intermediate' | 'advanced'
type TaskType = 'single_choice' | 'multiple_choice' | 'text' | 'code'

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

const difficultyColors: Record<Difficulty, string> = {
  beginner:     'bg-green-100 text-green-700',
  intermediate: 'bg-amber-100 text-amber-700',
  advanced:     'bg-red-100 text-red-700',
}

const typeIcons: Record<TaskType, string> = {
  single_choice:   '🔘',
  multiple_choice: '☑️',
  text:            '✍️',
  code:            '💻',
}

export async function TaskCard({
  id, title, description, difficulty, type, xpReward, topic, isCompleted,
}: TaskCardProps) {
  const t = await getTranslations('tasks')

  const excerpt = description.slice(0, 100) + (description.length > 100 ? '…' : '')

  return (
    <Link href={`/tasks/${id}`} className="block group">
      <div
        className="h-full rounded-2xl border p-5 flex flex-col gap-3 transition-all duration-200 group-hover:shadow-md group-hover:-translate-y-0.5"
        style={{
          background: isCompleted ? 'var(--card)' : 'var(--card)',
          borderColor: isCompleted ? 'var(--success)' : 'var(--border)',
          opacity: isCompleted ? 0.8 : 1,
        }}
      >
        {/* Top row */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${difficultyColors[difficulty]}`}
          >
            {t(`difficulty.${difficulty}`)}
          </span>
          <div className="flex items-center gap-2">
            {isCompleted && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: 'var(--success)', color: '#fff' }}>
                ✓
              </span>
            )}
            <span className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>
              +{xpReward} XP
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-base leading-snug" style={{ color: 'var(--foreground)' }}>
          {title}
        </h3>

        {/* Excerpt */}
        <p className="text-sm leading-relaxed flex-1" style={{ color: 'var(--muted-foreground)' }}>
          {excerpt}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-1">
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {typeIcons[type]} {t(`types.${type}`)}
          </span>
          {topic && (
            <span className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
              {topic.icon} {topic.title}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
