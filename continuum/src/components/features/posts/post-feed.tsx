'use client'

/* Post feed – renders a stream of community posts. */

import { useState, useTransition, useRef, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Trash2, MessageCircle, Link2, Heart, Send, X } from 'lucide-react'
import {
  createPost,
  deletePost,
  togglePostReaction,
  createPostComment,
} from '@/app/actions/posts'
import { AutoLink } from '@/components/auto-link'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { UserAvatar } from '@/components/ui/user-avatar'
import { toast } from 'sonner'

/* ─── Types ────────────────────────────────────────── */
interface ReactionCount { type: string; count: number; reacted: boolean }

interface PostComment {
  id: string; content: string; created_at: string
  user_id: string; parent_id: string | null
  profiles: { full_name: string | null; avatar_url: string | null } | null
}

export interface Post {
  id: string; content: string
  url: string | null; url_title: string | null
  created_at: string; user_id: string
  profiles: { full_name: string | null; avatar_url: string | null } | null
  reactions: ReactionCount[]
  comments: PostComment[]
}

/* ─── Helpers ──────────────────────────────────────── */
function formatRelative(iso: string, locale: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  const rtf  = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  if (diff < 60)    return rtf.format(0, 'seconds')
  if (diff < 3600)  return rtf.format(-Math.floor(diff / 60), 'minutes')
  if (diff < 86400) return rtf.format(-Math.floor(diff / 3600), 'hours')
  if (diff < 604800) return rtf.format(-Math.floor(diff / 86400), 'days')
  return new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short' })
}

/* ─── Create Post Form ─────────────────────────────── */
export function CreatePostForm({
  currentAvatarUrl,
  currentName,
}: {
  currentAvatarUrl: string | null
  currentName: string | null
}) {
  const t = useTranslations('posts')
  const [text, setText]           = useState('')
  const [url, setUrl]             = useState('')
  const [showUrl, setShowUrl]     = useState(false)
  const [focused, setFocused]     = useState(false)
  const [isPending, startTr]      = useTransition()
  const textareaRef               = useRef<HTMLTextAreaElement>(null)

  /* auto-grow textarea */
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${ta.scrollHeight}px`
  }, [text])

  function handleSubmit() {
    if (!text.trim()) return
    startTr(async () => {
      const fd = new FormData()
      fd.set('content', text.trim())
      if (url.trim()) fd.set('url', url.trim())
      await createPost(fd)
      setText(''); setUrl(''); setShowUrl(false); setFocused(false)
      toast.success(t('toastPublished'))
    })
  }

  const isActive = focused || text.length > 0

  return (
    <div
      className="rounded-2xl border transition-shadow"
      style={{
        background: 'var(--card)',
        borderColor: isActive ? 'color-mix(in srgb, var(--primary) 40%, var(--border))' : 'var(--border)',
        boxShadow: isActive ? '0 0 0 3px color-mix(in srgb, var(--primary) 8%, transparent)' : 'none',
      }}
    >
      <div className="flex gap-3 p-4">
        <div className="shrink-0 pt-0.5">
          <UserAvatar name={currentName} url={currentAvatarUrl} size={36} />
        </div>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => { if (!text) setFocused(false) }}
          onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit() }}
          placeholder={t('placeholder')}
          rows={isActive ? 3 : 2}
          className="flex-1 resize-none bg-transparent outline-none text-[14px] leading-relaxed placeholder:text-[var(--muted-foreground)]"
          style={{ color: 'var(--foreground)', minHeight: '44px' }}
        />
      </div>

      {/* URL input */}
      {showUrl && (
        <div className="px-4 pb-3">
          <div
            className="flex items-center gap-2 rounded-xl border px-3 py-2"
            style={{ background: 'var(--background)', borderColor: 'var(--border)' }}
          >
            <Link2 size={13} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://..."
              className="flex-1 bg-transparent text-[13px] outline-none"
              style={{ color: 'var(--foreground)' }}
              autoFocus
            />
            {url && (
              <button onClick={() => { setUrl(''); setShowUrl(false) }}>
                <X size={13} style={{ color: 'var(--muted-foreground)' }} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Footer: actions */}
      {isActive && (
        <div
          className="flex items-center justify-between border-t px-4 py-2.5"
          style={{ borderColor: 'color-mix(in srgb, var(--border) 60%, transparent)' }}
        >
          <button
            onClick={() => setShowUrl(v => !v)}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] transition-colors"
            style={{
              color: showUrl ? 'var(--primary)' : 'var(--muted-foreground)',
              background: showUrl ? 'color-mix(in srgb, var(--primary) 8%, transparent)' : 'transparent',
            }}
          >
            <Link2 size={13} />
            {t('attachLink')}
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[11px] tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
              {text.length > 0 ? text.length : ''}
            </span>
            <button
              onClick={handleSubmit}
              disabled={!text.trim() || isPending}
              className="flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-[13px] font-semibold transition-opacity disabled:opacity-40"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              <Send size={12} />
              {isPending ? '…' : t('publish')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Post Item ────────────────────────────────────── */
export function PostItem({ post, currentUserId }: { post: Post; currentUserId: string }) {
  const t         = useTranslations('posts')
  const tComments = useTranslations('comments')
  const tCommon   = useTranslations('common')
  const locale    = useLocale()

  const likeReaction = post.reactions.find(r => r.type === 'like') ?? { type: 'like', count: 0, reacted: false }
  const [localLike, setLocalLike]         = useState(likeReaction)
  const [showComments, setShowComments]   = useState(false)
  const [commentText, setCommentText]     = useState('')
  const [replyTo, setReplyTo]             = useState<{ id: string; name: string } | null>(null)
  const [comments, setComments]           = useState<PostComment[]>(post.comments)
  const [isPending, startTr]              = useTransition()
  const [deletingPost, setDeletingPost]   = useState(false)
  const [showConfirm, setShowConfirm]     = useState(false)
  const commentInputRef                   = useRef<HTMLTextAreaElement>(null)

  const isOwn       = post.user_id === currentUserId
  const topComments = comments.filter(c => !c.parent_id)
  const repliesMap  = new Map<string, PostComment[]>()
  for (const c of comments) {
    if (c.parent_id) {
      const arr = repliesMap.get(c.parent_id) ?? []
      arr.push(c)
      repliesMap.set(c.parent_id, arr)
    }
  }

  function handleLike() {
    const prev = localLike
    setLocalLike({ ...prev, count: prev.reacted ? prev.count - 1 : prev.count + 1, reacted: !prev.reacted })
    startTr(async () => {
      const fd = new FormData()
      fd.set('post_id', post.id); fd.set('type', 'like')
      const result = await togglePostReaction(fd)
      if (result?.error) setLocalLike(prev)
    })
  }

  function handleToggleComments() {
    setShowComments(v => !v)
    if (!showComments) {
      setTimeout(() => commentInputRef.current?.focus(), 100)
    }
  }

  function handleComment() {
    if (!commentText.trim()) return
    const optimistic: PostComment = {
      id: `temp-${Date.now()}`,
      content: commentText.trim(),
      created_at: new Date().toISOString(),
      user_id: currentUserId,
      parent_id: replyTo?.id ?? null,
      profiles: null,
    }
    setComments(prev => [...prev, optimistic])
    const captured = commentText.trim()
    const capturedReply = replyTo
    setCommentText(''); setReplyTo(null)
    startTr(async () => {
      const fd = new FormData()
      fd.set('content', captured); fd.set('post_id', post.id)
      if (capturedReply) fd.set('parent_id', capturedReply.id)
      await createPostComment(fd)
    })
  }

  if (deletingPost) return null

  const author     = post.profiles
  const authorName = author?.full_name ?? '–'
  const domain     = post.url ? new URL(post.url.startsWith('http') ? post.url : `https://${post.url}`).hostname.replace('www.', '') : null

  return (
    <article
      id={`post-${post.id}`}
      className="group rounded-2xl border overflow-hidden transition-shadow hover:shadow-md"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      {/* ── Header ── */}
      <div className="flex items-start gap-3 px-5 pt-4 pb-3">
        <UserAvatar name={author?.full_name ?? null} url={author?.avatar_url ?? null} size={38} />
        <div className="flex-1 min-w-0">
          <p className="text-[13.5px] font-semibold truncate" style={{ color: 'var(--foreground)' }}>
            {authorName}
          </p>
          <p className="text-[11.5px]" style={{ color: 'var(--muted-foreground)' }}>
            {formatRelative(post.created_at, locale)}
          </p>
        </div>
        {isOwn && (
          <button
            onClick={() => setShowConfirm(true)}
            disabled={isPending}
            title={t('deleteConfirm')}
            className="shrink-0 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all hover:bg-[color-mix(in_srgb,var(--destructive)_10%,transparent)] disabled:opacity-30"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* ── Content ── */}
      <div className="px-5 pb-4">
        <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--foreground)' }}>
          <AutoLink text={post.content} />
        </p>

        {/* URL preview */}
        {post.url && (
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 no-underline transition-colors hover:bg-[color-mix(in_srgb,var(--primary)_4%,transparent)]"
            style={{ borderColor: 'var(--border)' }}
          >
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold"
              style={{ background: 'color-mix(in srgb, var(--primary) 12%, var(--muted))', color: 'var(--primary)' }}
            >
              {domain?.[0]?.toUpperCase() ?? '↗'}
            </div>
            <div className="min-w-0">
              {post.url_title && (
                <p className="truncate text-[12.5px] font-medium" style={{ color: 'var(--foreground)' }}>
                  {post.url_title}
                </p>
              )}
              <p className="truncate text-[11.5px]" style={{ color: 'var(--primary)' }}>
                {domain}
              </p>
            </div>
          </a>
        )}
      </div>

      {/* ── Action bar ── */}
      <div
        className="flex items-center gap-1 border-t px-3 py-1.5"
        style={{ borderColor: 'color-mix(in srgb, var(--border) 60%, transparent)' }}
      >
        {/* Like */}
        <button
          onClick={handleLike}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-all disabled:opacity-60"
          style={{
            background: localLike.reacted
              ? 'color-mix(in srgb, #e11d48 10%, transparent)'
              : 'transparent',
            color: localLike.reacted ? '#e11d48' : 'var(--muted-foreground)',
          }}
        >
          <Heart
            size={14}
            fill={localLike.reacted ? '#e11d48' : 'none'}
            stroke={localLike.reacted ? '#e11d48' : 'currentColor'}
            className="transition-all"
          />
          {localLike.count > 0 && <span className="tabular-nums">{localLike.count}</span>}
        </button>

        {/* Comments toggle */}
        <button
          onClick={handleToggleComments}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-all"
          style={{
            background: showComments
              ? 'color-mix(in srgb, var(--primary) 8%, transparent)'
              : 'transparent',
            color: showComments ? 'var(--primary)' : 'var(--muted-foreground)',
          }}
        >
          <MessageCircle size={14} />
          {comments.length > 0
            ? <span className="tabular-nums">{comments.length}</span>
            : <span>{tComments('title')}</span>
          }
        </button>
      </div>

      {/* ── Comments section ── */}
      {showComments && (
        <div
          className="border-t px-5 py-4 space-y-4"
          style={{ borderColor: 'color-mix(in srgb, var(--border) 60%, transparent)' }}
        >
          {/* Comment list */}
          {topComments.length > 0 && (
            <div className="space-y-4">
              {topComments.map(c => (
                <div key={c.id}>
                  <div className="flex gap-2.5">
                    <UserAvatar name={c.profiles?.full_name ?? null} url={c.profiles?.avatar_url ?? null} size={28} />
                    <div className="flex-1 min-w-0">
                      <div
                        className="rounded-2xl rounded-tl-sm px-3 py-2.5"
                        style={{ background: 'var(--muted)' }}
                      >
                        <span className="text-[12px] font-semibold" style={{ color: 'var(--foreground)' }}>
                          {c.profiles?.full_name ?? '–'}
                        </span>
                        <p className="mt-0.5 text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--foreground)' }}>
                          <AutoLink text={c.content} />
                        </p>
                      </div>
                      <div className="mt-1 flex items-center gap-3 pl-1">
                        <span className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                          {formatRelative(c.created_at, locale)}
                        </span>
                        <button
                          onClick={() => { setReplyTo({ id: c.id, name: c.profiles?.full_name ?? '–' }); commentInputRef.current?.focus() }}
                          className="text-[11px] font-medium transition-colors"
                          style={{ color: 'var(--muted-foreground)' }}
                        >
                          {tComments('reply')}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Replies */}
                  {(repliesMap.get(c.id) ?? []).map(r => (
                    <div key={r.id} className="ml-9 mt-2.5 flex gap-2.5">
                      <UserAvatar name={r.profiles?.full_name ?? null} url={r.profiles?.avatar_url ?? null} size={24} />
                      <div className="flex-1 min-w-0">
                        <div
                          className="rounded-2xl rounded-tl-sm px-3 py-2"
                          style={{ background: 'var(--muted)' }}
                        >
                          <span className="text-[11.5px] font-semibold" style={{ color: 'var(--foreground)' }}>
                            {r.profiles?.full_name ?? '–'}
                          </span>
                          <p className="mt-0.5 text-[12.5px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--foreground)' }}>
                            <AutoLink text={r.content} />
                          </p>
                        </div>
                        <span className="mt-1 block pl-1 text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                          {formatRelative(r.created_at, locale)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Comment form */}
          <div className="space-y-2">
            {replyTo && (
              <div
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[11.5px]"
                style={{ background: 'color-mix(in srgb, var(--primary) 8%, transparent)', color: 'var(--muted-foreground)' }}
              >
                <span>↩ {tComments('reply')}: <strong style={{ color: 'var(--foreground)' }}>{replyTo.name}</strong></span>
                <button
                  onClick={() => setReplyTo(null)}
                  className="ml-auto rounded p-0.5 transition-colors hover:bg-[var(--muted)]"
                >
                  <X size={12} />
                </button>
              </div>
            )}
            <div className="flex gap-2.5">
              <UserAvatar name={null} url={null} size={28} />
              <div
                className="flex flex-1 items-end gap-2 rounded-2xl rounded-tl-sm border px-3 py-2"
                style={{ background: 'var(--muted)', borderColor: 'transparent' }}
              >
                <textarea
                  ref={commentInputRef}
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment() } }}
                  rows={1}
                  placeholder={tComments('placeholder')}
                  className="flex-1 resize-none bg-transparent text-[13px] leading-relaxed outline-none placeholder:text-[var(--muted-foreground)]"
                  style={{ color: 'var(--foreground)' }}
                />
                <button
                  onClick={handleComment}
                  disabled={!commentText.trim() || isPending}
                  className="shrink-0 rounded-full p-1.5 transition-all disabled:opacity-30"
                  style={{
                    background: commentText.trim() ? 'var(--primary)' : 'transparent',
                    color: commentText.trim() ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                  }}
                >
                  <Send size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showConfirm && (
        <ConfirmDialog
          message={t('deleteConfirm')}
          confirmLabel={tCommon('delete')}
          cancelLabel={tCommon('cancel')}
          onConfirm={() => { setDeletingPost(true); startTr(async () => { const fd = new FormData(); fd.set('id', post.id); await deletePost(fd); toast.success(t('toastDeleted')) }) }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </article>
  )
}

/* ─── Post Feed ────────────────────────────────────── */
export function PostFeed({ posts, currentUserId }: { posts: Post[]; currentUserId: string }) {
  const t = useTranslations('posts')
  return (
    <div className="space-y-3">
      {posts.length === 0 ? (
        <div
          className="rounded-2xl border py-16 text-center"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <p className="mb-2 text-4xl">💬</p>
          <p className="text-[13px]" style={{ color: 'var(--muted-foreground)' }}>
            {t('empty')}
          </p>
        </div>
      ) : (
        posts.map(post => <PostItem key={post.id} post={post} currentUserId={currentUserId} />)
      )}
    </div>
  )
}
