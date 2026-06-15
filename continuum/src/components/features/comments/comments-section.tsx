'use client'

/* Comments section — threaded comments with replies for a material or task. */

import { useTranslations } from 'next-intl'
import { useRef, useState, useTransition } from 'react'
import { createComment, deleteComment } from '@/app/actions/comments'
import { UserAvatar } from '@/components/ui/user-avatar'

interface Comment {
  id: string
  content: string
  created_at: string
  user_id: string
  parent_id: string | null
  profiles: { full_name: string | null; avatar_url: string | null } | null
}

interface CommentsSectionProps {
  comments: Comment[]
  materialId?: string
  taskId?: string
  currentUserId: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })
}

export function CommentsSection({ comments, materialId, taskId, currentUserId }: CommentsSectionProps) {
  const t = useTranslations('comments')
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null)

  // Build threaded structure: top-level + replies
  const topLevel = comments.filter((c) => !c.parent_id)
  const replies = new Map<string, Comment[]>()
  for (const c of comments) {
    if (c.parent_id) {
      const arr = replies.get(c.parent_id) ?? []
      arr.push(c)
      replies.set(c.parent_id, arr)
    }
  }

  function handleDelete(id: string) {
    if (!confirm(t('deleteConfirm'))) return
    setDeletingId(id)
    startTransition(async () => {
      const fd = new FormData()
      fd.set('id', id)
      if (materialId) fd.set('material_id', materialId)
      if (taskId) fd.set('task_id', taskId)
      await deleteComment(fd)
      setDeletingId(null)
    })
  }

  async function handleSubmit(formData: FormData) {
    if (materialId) formData.set('material_id', materialId)
    if (taskId) formData.set('task_id', taskId)
    if (replyTo) formData.set('parent_id', replyTo.id)
    startTransition(async () => {
      await createComment(formData)
      formRef.current?.reset()
      setReplyTo(null)
    })
  }

  function CommentItem({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) {
    const name = comment.profiles?.full_name ?? '—'
    const commentReplies = replies.get(comment.id) ?? []
    return (
      <div className={isReply ? 'ml-8' : ''}>
        <div className="flex gap-3">
          <UserAvatar name={comment.profiles?.full_name ?? null} url={comment.profiles?.avatar_url ?? null} size={28} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>{name}</span>
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{formatDate(comment.created_at)}</span>
            </div>
            <p className="text-sm mt-1 whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--foreground)' }}>
              {comment.content}
            </p>
            <div className="flex gap-3 mt-1">
              {!isReply && (
                <button
                  onClick={() => setReplyTo({ id: comment.id, name })}
                  className="text-xs"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  {t('reply')}
                </button>
              )}
              {comment.user_id === currentUserId && (
                <button
                  onClick={() => handleDelete(comment.id)}
                  disabled={deletingId === comment.id || isPending}
                  className="text-xs disabled:opacity-40"
                  style={{ color: 'var(--destructive)' }}
                >
                  {t('delete')}
                </button>
              )}
            </div>
          </div>
        </div>
        {/* Replies */}
        {commentReplies.length > 0 && (
          <div className="mt-3 space-y-3 border-l-2 pl-4 ml-3.5" style={{ borderColor: 'var(--border)' }}>
            {commentReplies.map((r) => (
              <CommentItem key={r.id} comment={r} isReply />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
        {t('title')} {comments.length > 0 && `(${comments.length})`}
      </h2>

      {/* Comments list */}
      {topLevel.length > 0 ? (
        <div className="space-y-4">
          {topLevel.map((c) => <CommentItem key={c.id} comment={c} />)}
        </div>
      ) : (
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{t('noComments')}</p>
      )}

      {/* Comment form */}
      <form ref={formRef} action={handleSubmit} className="space-y-2">
        {replyTo && (
          <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
            <span>↩ {t('reply')}: <strong>{replyTo.name}</strong></span>
            <button type="button" onClick={() => setReplyTo(null)} className="ml-auto">×</button>
          </div>
        )}
        <div className="flex gap-2">
          <textarea
            name="content"
            required
            rows={2}
            placeholder={t('placeholder')}
            className="flex-1 rounded-xl border px-3 py-2 text-sm resize-none outline-none"
            style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
          />
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 rounded-xl text-sm font-semibold self-end transition-opacity disabled:opacity-50"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            {t('submit')}
          </button>
        </div>
      </form>
    </div>
  )
}
