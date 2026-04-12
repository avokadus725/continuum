'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { Trash2, MessageCircle, ChevronDown, ChevronUp, Link2, Heart } from 'lucide-react'
import {
  createPost,
  deletePost,
  togglePostReaction,
  createPostComment,
} from '@/app/actions/posts'

// ── Types ──────────────────────────────────────────────────────

interface ReactionCount { type: string; count: number; reacted: boolean }

interface PostComment {
  id: string
  content: string
  created_at: string
  user_id: string
  parent_id: string | null
  profiles: { full_name: string | null; avatar_url: string | null } | null
}

export interface Post {
  id: string
  content: string
  url: string | null
  url_title: string | null
  created_at: string
  user_id: string
  profiles: { full_name: string | null; avatar_url: string | null } | null
  reactions: ReactionCount[]
  comments: PostComment[]
}

interface PostFeedProps {
  posts: Post[]
  currentUserId: string
}

// ── Helpers ────────────────────────────────────────────────────

function formatRelative(iso: string, locale: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  if (diff < 60)    return rtf.format(0, 'seconds')
  if (diff < 3600)  return rtf.format(-Math.floor(diff / 60), 'minutes')
  if (diff < 86400) return rtf.format(-Math.floor(diff / 3600), 'hours')
  return new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short' })
}

export function Avatar({ name, url, size = 8 }: { name: string | null; url: string | null; size?: number }) {
  const cls = `w-${size} h-${size} rounded-full shrink-0 object-cover`
  if (url) return <img src={url} alt={name ?? ''} className={cls} />
  return (
    <div
      className={`w-${size} h-${size} rounded-full shrink-0 flex items-center justify-center text-xs font-bold`}
      style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
    >
      {(name?.[0] ?? '?').toUpperCase()}
    </div>
  )
}

// ── Create Post Form ───────────────────────────────────────────

export function CreatePostForm({
  currentAvatarUrl,
  currentName,
}: {
  currentAvatarUrl: string | null
  currentName: string | null
}) {
  const t = useTranslations('posts')
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [showUrl, setShowUrl] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    if (!text.trim()) return
    startTransition(async () => {
      const fd = new FormData()
      fd.set('content', text.trim())
      if (url.trim()) fd.set('url', url.trim())
      await createPost(fd)
      setText('')
      setUrl('')
      setShowUrl(false)
    })
  }

  return (
    <div
      className="rounded-2xl border p-4 space-y-3"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      <div className="flex gap-3">
        <Avatar name={currentName} url={currentAvatarUrl} size={9} />
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit() }}
          placeholder={t('placeholder')}
          rows={3}
          className="flex-1 rounded-xl border px-3 py-2 text-sm resize-none outline-none"
          style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
        />
      </div>
      {showUrl && (
        <input
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://..."
          className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
          style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
        />
      )}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowUrl(v => !v)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors"
          style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
        >
          <Link2 className="w-3.5 h-3.5" />
          {t('attachLink')}
        </button>
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || isPending}
          className="px-4 py-1.5 rounded-xl text-sm font-semibold disabled:opacity-40"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
        >
          {isPending ? '…' : t('publish')}
        </button>
      </div>
    </div>
  )
}

// ── Post Item ──────────────────────────────────────────────────

export function PostItem({ post, currentUserId }: { post: Post; currentUserId: string }) {
  const t = useTranslations('posts')
  const tComments = useTranslations('comments')
  const locale = useLocale()

  const likeReaction = post.reactions.find(r => r.type === 'like') ?? { type: 'like', count: 0, reacted: false }
  const [localLike, setLocalLike] = useState(likeReaction)
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null)
  const [comments, setComments] = useState<PostComment[]>(post.comments)
  const [isPending, startTransition] = useTransition()
  const [deletingPost, setDeletingPost] = useState(false)

  const topComments = comments.filter(c => !c.parent_id)
  const repliesMap = new Map<string, PostComment[]>()
  for (const c of comments) {
    if (c.parent_id) {
      const arr = repliesMap.get(c.parent_id) ?? []
      arr.push(c)
      repliesMap.set(c.parent_id, arr)
    }
  }

  function handleLike() {
    const prev = localLike
    const next = { ...prev, count: prev.reacted ? prev.count - 1 : prev.count + 1, reacted: !prev.reacted }
    setLocalLike(next)
    startTransition(async () => {
      const fd = new FormData()
      fd.set('post_id', post.id)
      fd.set('type', 'like')
      const result = await togglePostReaction(fd)
      if (result?.error) {
        // revert optimistic update
        console.error('[like] DB error:', result.error)
        setLocalLike(prev)
      }
    })
  }

  function handleDeletePost() {
    if (!confirm(t('deleteConfirm'))) return
    setDeletingPost(true)
    startTransition(async () => {
      const fd = new FormData()
      fd.set('id', post.id)
      await deletePost(fd)
    })
  }

  function handleComment() {
    if (!commentText.trim()) return
    const optimisticComment: PostComment = {
      id: `temp-${Date.now()}`,
      content: commentText.trim(),
      created_at: new Date().toISOString(),
      user_id: currentUserId,
      parent_id: replyTo?.id ?? null,
      profiles: null,
    }
    setComments(prev => [...prev, optimisticComment])
    const captured = commentText.trim()
    const capturedReplyTo = replyTo
    setCommentText('')
    setReplyTo(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.set('content', captured)
      fd.set('post_id', post.id)
      if (capturedReplyTo) fd.set('parent_id', capturedReplyTo.id)
      await createPostComment(fd)
    })
  }

  if (deletingPost) return null

  const author = post.profiles
  const authorName = author?.full_name ?? '—'

  return (
    <article
      id={`post-${post.id}`}
      className="rounded-2xl border overflow-hidden"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar name={author?.full_name ?? null} url={author?.avatar_url ?? null} />
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{authorName}</p>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                {formatRelative(post.created_at, locale)}
              </p>
            </div>
          </div>
          {post.user_id === currentUserId && (
            <button
              onClick={handleDeletePost}
              disabled={isPending}
              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-40"
              style={{ color: 'var(--destructive)' }}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content */}
        <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--foreground)' }}>
          {post.content}
        </p>

        {/* Attached URL */}
        {post.url && (
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            style={{ borderColor: 'var(--border)', color: 'var(--primary)' }}
          >
            <Link2 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{post.url_title || post.url}</span>
          </a>
        )}
      </div>

      {/* Like button */}
      <div className="px-5 pb-3">
        <button
          onClick={handleLike}
          disabled={isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all disabled:opacity-60"
          style={{
            background: localLike.reacted
              ? 'color-mix(in srgb, #e11d48 12%, transparent)'
              : 'var(--background)',
            borderColor: localLike.reacted ? '#e11d48' : 'var(--border)',
            color: localLike.reacted ? '#e11d48' : 'var(--muted-foreground)',
          }}
        >
          <Heart
            className="w-3.5 h-3.5 transition-all"
            fill={localLike.reacted ? '#e11d48' : 'none'}
            stroke={localLike.reacted ? '#e11d48' : 'currentColor'}
          />
          {localLike.count > 0 && <span className="text-xs font-medium">{localLike.count}</span>}
        </button>
      </div>

      {/* Comments toggle */}
      <div className="border-t" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={() => setShowComments(v => !v)}
          className="flex items-center gap-2 px-5 py-2.5 w-full text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <MessageCircle className="w-4 h-4" />
          <span>{tComments('title')}{comments.length > 0 && ` (${comments.length})`}</span>
          <span className="ml-auto">
            {showComments ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </button>

        {showComments && (
          <div className="px-5 pb-5 space-y-4">
            {/* Comment list */}
            {topComments.map(c => (
              <div key={c.id} className="space-y-3">
                <div className="flex gap-3">
                  <Avatar name={c.profiles?.full_name ?? null} url={c.profiles?.avatar_url ?? null} size={7} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>
                        {c.profiles?.full_name ?? '—'}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        {formatRelative(c.created_at, locale)}
                      </span>
                    </div>
                    <p className="text-sm mt-0.5 whitespace-pre-wrap" style={{ color: 'var(--foreground)' }}>
                      {c.content}
                    </p>
                    <button
                      onClick={() => setReplyTo({ id: c.id, name: c.profiles?.full_name ?? '—' })}
                      className="text-xs mt-1"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      {tComments('reply')}
                    </button>
                  </div>
                </div>
                {/* Replies */}
                {(repliesMap.get(c.id) ?? []).map(r => (
                  <div key={r.id} className="ml-10 flex gap-3">
                    <Avatar name={r.profiles?.full_name ?? null} url={r.profiles?.avatar_url ?? null} size={6} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>
                          {r.profiles?.full_name ?? '—'}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                          {formatRelative(r.created_at, locale)}
                        </span>
                      </div>
                      <p className="text-sm mt-0.5 whitespace-pre-wrap" style={{ color: 'var(--foreground)' }}>
                        {r.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {/* Comment form */}
            <div className="space-y-2 pt-1">
              {replyTo && (
                <div
                  className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg"
                  style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
                >
                  <span>↩ {tComments('reply')}: <strong>{replyTo.name}</strong></span>
                  <button onClick={() => setReplyTo(null)} className="ml-auto">×</button>
                </div>
              )}
              <div className="flex gap-2">
                <textarea
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  rows={2}
                  placeholder={tComments('placeholder')}
                  className="flex-1 rounded-xl border px-3 py-2 text-sm resize-none outline-none"
                  style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                />
                <button
                  onClick={handleComment}
                  disabled={!commentText.trim() || isPending}
                  className="px-3 py-2 rounded-xl text-sm font-semibold self-end disabled:opacity-40"
                  style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                >
                  {tComments('submit')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </article>
  )
}

// ── Post Feed ──────────────────────────────────────────────────

export function PostFeed({ posts, currentUserId }: PostFeedProps) {
  const t = useTranslations('posts')
  return (
    <div className="space-y-4">
      {posts.length === 0 ? (
        <div
          className="rounded-2xl border p-12 text-center"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <p className="text-3xl mb-2">💬</p>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {t('empty')}
          </p>
        </div>
      ) : (
        posts.map(post => <PostItem key={post.id} post={post} currentUserId={currentUserId} />)
      )}
    </div>
  )
}
