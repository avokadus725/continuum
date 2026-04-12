'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { MessageCircle, ExternalLink, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react'
import { submitTaskAnswer } from '@/app/actions/tasks'
import { CommentsSection } from '@/components/features/comments/comments-section'
import { ReactionsBar } from '@/components/features/reactions/reactions-bar'

// ── Types ──────────────────────────────────────────────────────

type TaskType = 'single_choice' | 'multiple_choice' | 'text' | 'code'
type MaterialType = 'article' | 'video' | 'link' | 'interactive'
type Difficulty = 'beginner' | 'intermediate' | 'advanced'
type ReactionType = 'like' | 'helpful' | 'fire'

interface TaskOption { id: string; text: string }

export interface FeedTask {
  id: string
  title: string
  content: string | null
  type: TaskType
  difficulty: Difficulty
  xp_reward: number
  task_options: TaskOption[]
}

interface Comment {
  id: string
  content: string
  created_at: string
  user_id: string
  parent_id: string | null
  profiles: { full_name: string | null; avatar_url: string | null } | null
}

interface ReactionCount { type: ReactionType; count: number; reacted: boolean }

export interface FeedMaterial {
  id: string
  title: string
  type: MaterialType
  url: string | null
  content: string | null
  comments: Comment[]
  reactions: ReactionCount[]
}

export type FeedItem =
  | { kind: 'task'; data: FeedTask }
  | { kind: 'material'; data: FeedMaterial }

interface AnswerResult { isCorrect: boolean; xpEarned: number }

interface LearningFeedProps {
  /** Server passes items in stable order; client shuffles once on mount */
  initialItems: FeedItem[]
  currentUserId: string
}

// ── Constants ──────────────────────────────────────────────────

const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  beginner:     'var(--success)',
  intermediate: 'var(--warning)',
  advanced:     'var(--destructive)',
}

const MATERIAL_ICON: Record<MaterialType, string> = {
  article:     '📄',
  video:       '🎬',
  link:        '🔗',
  interactive: '🖥',
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ── Task Feed Item ─────────────────────────────────────────────

interface TaskFeedItemProps {
  task: FeedTask
  answeredResult: AnswerResult | undefined
  onAnswered: (id: string, result: AnswerResult) => void
}

function TaskFeedItem({ task, answeredResult, onAnswered }: TaskFeedItemProps) {
  const t = useTranslations('tasks')
  const [selected, setSelected] = useState<string[]>([])
  const [lastResult, setLastResult] = useState<AnswerResult | null>(null)
  const [isPending, startTransition] = useTransition()

  const interactive = task.type === 'single_choice' || task.type === 'multiple_choice'
  const isCompleted = answeredResult?.isCorrect === true

  function toggleOption(id: string) {
    if (isCompleted) return
    if (task.type === 'single_choice') setSelected([id])
    else setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function handleSubmit() {
    if (!selected.length || isPending) return
    startTransition(async () => {
      const fd = new FormData()
      fd.set('taskId', task.id)
      fd.set('taskType', task.type)
      if (task.type === 'single_choice') fd.set('answer', selected[0])
      else selected.forEach(id => fd.append('answer', id))

      const res = await submitTaskAnswer(fd)
      if (res.isCorrect !== undefined) {
        const result = { isCorrect: res.isCorrect, xpEarned: res.xpEarned ?? 0 }
        setLastResult(result)
        onAnswered(task.id, result)
      }
    })
  }

  const diffColor = DIFFICULTY_COLOR[task.difficulty]

  return (
    <article
      className="rounded-2xl border overflow-hidden transition-opacity"
      style={{
        background: 'var(--card)',
        borderColor: isCompleted ? 'var(--success)' : 'var(--border)',
        opacity: isCompleted ? 0.75 : 1,
      }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: `color-mix(in srgb, ${diffColor} 15%, transparent)`,
                color: diffColor,
              }}
            >
              {t(`difficulty.${task.difficulty}`)}
            </span>
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {t(`types.${task.type}`)}
            </span>
            {isCompleted && (
              <span
                className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: 'color-mix(in srgb, var(--success) 15%, transparent)',
                  color: 'var(--success)',
                }}
              >
                <CheckCircle2 className="w-3 h-3" /> {t('done')}
              </span>
            )}
          </div>
          <span className="text-xs font-bold shrink-0" style={{ color: 'var(--primary)' }}>
            +{task.xp_reward} XP
          </span>
        </div>
        <h3 className="font-semibold text-base leading-snug" style={{ color: 'var(--foreground)' }}>
          {task.title}
        </h3>
        {task.content && (
          <p className="mt-1.5 text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
            {task.content}
          </p>
        )}
      </div>

      {/* Answer section */}
      <div className="px-5 pb-5">
        {/* Result feedback */}
        {lastResult && (
          <div
            className="mb-3 px-4 py-3 rounded-xl text-sm font-medium"
            style={{
              background: lastResult.isCorrect
                ? 'color-mix(in srgb, var(--success) 15%, transparent)'
                : 'color-mix(in srgb, var(--destructive) 12%, transparent)',
              color: lastResult.isCorrect ? 'var(--success)' : 'var(--destructive)',
            }}
          >
            {lastResult.isCorrect
              ? t('correct', { xp: lastResult.xpEarned })
              : t('incorrect')}
          </div>
        )}

        {/* Options — shown unless completed */}
        {!isCompleted && interactive ? (
          <div className="space-y-2">
            {task.task_options.map(opt => {
              const isSelected = selected.includes(opt.id)
              return (
                <button
                  key={opt.id}
                  onClick={() => toggleOption(opt.id)}
                  disabled={isPending}
                  className="w-full text-left px-4 py-3 rounded-xl border text-sm transition-all"
                  style={{
                    background: isSelected
                      ? 'color-mix(in srgb, var(--primary) 10%, transparent)'
                      : 'var(--background)',
                    borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
                    color: 'var(--foreground)',
                  }}
                >
                  {opt.text}
                </button>
              )
            })}
            <button
              onClick={handleSubmit}
              disabled={!selected.length || isPending}
              className="w-full py-2.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-40"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              {isPending ? '…' : t('submit')}
            </button>
          </div>
        ) : !isCompleted && !interactive ? (
          <Link
            href={`/tasks/${task.id}`}
            className="text-sm font-medium"
            style={{ color: 'var(--primary)' }}
          >
            {t('submit')} →
          </Link>
        ) : null}
      </div>
    </article>
  )
}

// ── Material Feed Item ─────────────────────────────────────────

function MaterialFeedItem({
  material, currentUserId,
}: { material: FeedMaterial; currentUserId: string }) {
  const t = useTranslations('comments')
  const tMat = useTranslations('materials')
  const [showComments, setShowComments] = useState(false)

  return (
    <article
      className="rounded-2xl border overflow-hidden"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base">{MATERIAL_ICON[material.type]}</span>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
              color: 'var(--primary)',
            }}
          >
            {tMat(`types.${material.type}`)}
          </span>
        </div>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-base leading-snug" style={{ color: 'var(--foreground)' }}>
            {material.url ? (
              <a
                href={material.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline inline-flex items-center gap-1.5"
              >
                {material.title}
                <ExternalLink className="w-3.5 h-3.5 opacity-60 shrink-0" />
              </a>
            ) : material.title}
          </h3>
          <Link
            href={`/materials/${material.id}`}
            className="text-xs shrink-0 font-medium hover:underline"
            style={{ color: 'var(--primary)' }}
          >
            {tMat('readMore')}
          </Link>
        </div>
        {material.content && (
          <p
            className="mt-1.5 text-sm leading-relaxed line-clamp-3"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {material.content}
          </p>
        )}
      </div>

      {/* Reactions — optimistic updates inside ReactionsBar */}
      <div className="px-5 pb-4">
        <ReactionsBar reactions={material.reactions} materialId={material.id} />
      </div>

      {/* Comments */}
      <div className="border-t" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={() => setShowComments(v => !v)}
          className="flex items-center gap-2 px-5 py-3 w-full text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <MessageCircle className="w-4 h-4" />
          <span>
            {t('title')}{material.comments.length > 0 && ` (${material.comments.length})`}
          </span>
          <span className="ml-auto">
            {showComments ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </button>
        {showComments && (
          <div className="px-5 pb-5">
            <CommentsSection
              comments={material.comments}
              materialId={material.id}
              currentUserId={currentUserId}
            />
          </div>
        )}
      </div>
    </article>
  )
}

// ── Learning Feed ──────────────────────────────────────────────

export function LearningFeed({ initialItems, currentUserId }: LearningFeedProps) {
  const tDash = useTranslations('dashboard')
  // Shuffle once on client mount — stable across server re-renders
  const [items, setItems] = useState<FeedItem[]>(() => shuffle(initialItems))
  const [answered, setAnswered] = useState<Map<string, AnswerResult>>(new Map())

  function handleTaskAnswered(taskId: string, result: AnswerResult) {
    setAnswered(prev => new Map(prev).set(taskId, result))
    if (result.isCorrect) {
      // Move the task to the bottom of the feed (keep it visible)
     /*  setItems(prev => {
        const idx = prev.findIndex(i => i.kind === 'task' && i.data.id === taskId)
        if (idx === -1) return prev
        const item = prev[idx]
        return [...prev.slice(0, idx), ...prev.slice(idx + 1), item]
      }) */
    }
  }

  if (!items.length) {
    return (
      <div
        className="rounded-2xl border p-12 text-center"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <p className="text-4xl mb-3">🎉</p>
        <p className="font-medium" style={{ color: 'var(--foreground)' }}>
          {tDash('allTasksDone')}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {items.map(item =>
        item.kind === 'task' ? (
          <TaskFeedItem
            key={`t-${item.data.id}`}
            task={item.data}
            answeredResult={answered.get(item.data.id)}
            onAnswered={handleTaskAnswered}
          />
        ) : (
          <MaterialFeedItem
            key={`m-${item.data.id}`}
            material={item.data}
            currentUserId={currentUserId}
          />
        )
      )}
    </div>
  )
}
