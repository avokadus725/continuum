'use client'

/* PostCard — one post item with kind-aware styling, link preview,
   hashtags, like + comment + save actions, comment thread. */

import { useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import {
  Heart, MessageCircle, Bookmark, Trash2,
  Send, X, Link2 as LinkIcon, HelpCircle, Share2,
  Check, CircleAlert,
} from 'lucide-react'
import {
  togglePostReaction, createPostComment,
  deletePost, toggleSavePost, markQuestionSolved,
} from '@/app/actions/posts'
import { AutoLink } from '@/components/auto-link'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { toast } from 'sonner'
import { Avatar } from './avatar'
import type { CommunityPost, PostComment } from '../_types'

function formatRelative(iso: string, locale: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  if (diff < 60)     return rtf.format(0, 'seconds')
  if (diff < 3600)   return rtf.format(-Math.floor(diff / 60), 'minutes')
  if (diff < 86400)  return rtf.format(-Math.floor(diff / 3600), 'hours')
  if (diff < 604800) return rtf.format(-Math.floor(diff / 86400), 'days')
  return new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short' })
}

interface Props {
  post: CommunityPost
  currentUserId: string
}

export function PostCard({ post, currentUserId }: Props) {
  const t         = useTranslations('posts')
  const tc        = useTranslations('community.post')
  const tComments = useTranslations('comments')
  const tCommon   = useTranslations('common')
  const locale    = useLocale()

  const [likes,   setLikes]    = useState(post.likes)
  const [liked,   setLiked]    = useState(post.liked)
  const [saved,   setSaved]    = useState(post.saved)
  const [solved,  setSolved]   = useState(post.is_solved)
  const [showCm,  setShowCm]   = useState(false)
  const [text,    setText]     = useState('')
  const [reply,   setReply]    = useState<{ id: string; name: string } | null>(null)
  const [comments,setComments] = useState<PostComment[]>(post.comments)
  const [isPending, startTr]   = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleted, setDeleted] = useState(false)
  const taRef = useRef<HTMLTextAreaElement>(null)

  if (deleted) return null

  const isOwn = post.user_id === currentUserId
  const topLvl = comments.filter(c => !c.parent_id)
  const replies = new Map<string, PostComment[]>()
  for (const c of comments) {
    if (c.parent_id) {
      const arr = replies.get(c.parent_id) ?? []
      arr.push(c)
      replies.set(c.parent_id, arr)
    }
  }

  function handleLike() {
    setLikes(n => liked ? n - 1 : n + 1); setLiked(v => !v)
    startTr(async () => {
      const fd = new FormData(); fd.set('post_id', post.id); fd.set('type', 'like')
      const r = await togglePostReaction(fd)
      if (r?.error) { setLikes(post.likes); setLiked(post.liked) }
    })
  }

  function handleSave() {
    setSaved(v => !v)
    startTr(async () => {
      const fd = new FormData(); fd.set('post_id', post.id)
      const r = await toggleSavePost(fd)
      if (r?.error) setSaved(post.saved)
    })
  }

  function handleToggleSolved() {
    if (!isOwn || post.kind !== 'question') return
    setSolved(v => !v)
    startTr(async () => {
      const fd = new FormData()
      fd.set('post_id', post.id); fd.set('solved', String(!solved))
      await markQuestionSolved(fd)
    })
  }

  function handleComment() {
    if (!text.trim()) return
    const optimistic: PostComment = {
      id: `temp-${Date.now()}`,
      content: text.trim(),
      created_at: new Date().toISOString(),
      user_id: currentUserId,
      parent_id: reply?.id ?? null,
      profiles: null,
    }
    setComments(prev => [...prev, optimistic])
    const captured = text.trim()
    const capturedReply = reply
    setText(''); setReply(null)
    startTr(async () => {
      const fd = new FormData()
      fd.set('content', captured); fd.set('post_id', post.id)
      if (capturedReply) fd.set('parent_id', capturedReply.id)
      await createPostComment(fd)
    })
  }

  const author = post.profiles
  const domain = post.url
    ? (() => {
        try {
          return new URL(post.url!.startsWith('http') ? post.url! : `https://${post.url}`).hostname.replace('www.', '')
        } catch { return null }
      })()
    : null

  const kindBorder =
    post.kind === 'question' ? '3px solid var(--warning)'
    : '1px solid var(--border)'
  const kindBadge =
    post.kind === 'question' ? <KindBadge icon={<HelpCircle className="h-3 w-3" />} label={tc('kindQuestion')} color="var(--warning)" />
    : post.kind === 'share'  ? <KindBadge icon={<Share2     className="h-3 w-3" />} label={tc('kindShare')}    color="var(--primary)" />
    : null

  return (
    <article
      id={`post-${post.id}`}
      className="mb-2.5 overflow-hidden rounded-2xl border"
      style={{
        background: 'var(--card)',
        borderColor: 'var(--border)',
        borderLeft: kindBorder,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-[18px] pb-2 pt-4">
        <Avatar name={author?.full_name ?? null} url={author?.avatar_url ?? null} size={34} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[13.5px] font-semibold" style={{ color: 'var(--foreground)' }}>
              {author?.full_name ?? '—'}
            </span>
            {kindBadge}
          </div>
          <p className="text-[11.5px]" style={{ color: 'color-mix(in srgb, var(--muted-foreground) 80%, transparent)' }}>
            {formatRelative(post.created_at, locale)}
          </p>
        </div>
        {isOwn && (
          <button
            onClick={() => setConfirmOpen(true)}
            className="rounded-md p-1.5 text-[var(--muted-foreground)]"
            title={tCommon('delete')}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="px-[18px] pb-3">
        {post.kind === 'question' && post.title && (
          <h3 className="m-0 mb-1.5 text-[16px] font-semibold tracking-[-0.2px]" style={{ color: 'var(--foreground)' }}>
            {post.title}
          </h3>
        )}
        <p className="m-0 whitespace-pre-wrap text-[13.5px] leading-relaxed" style={{ color: 'var(--foreground)' }}>
          <AutoLink text={post.content} />
        </p>

        {/* Link preview for share posts */}
        {post.url && (
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex gap-3 rounded-xl border p-3 no-underline transition-colors hover:bg-[color-mix(in_srgb,var(--primary)_4%,transparent)]"
            style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}
          >
            <div
              className="flex h-16 w-[88px] flex-none items-center justify-center rounded-md text-2xl font-bold text-white"
              style={{
                background: 'linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 70%, #000))',
              }}
            >
              {(domain?.[0] ?? '↗').toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'color-mix(in srgb, var(--muted-foreground) 80%, transparent)' }}>
                <LinkIcon className="h-3 w-3" style={{ color: 'var(--primary)' }} />
                {domain}
              </div>
              {post.url_title && (
                <p className="mt-1 text-[13.5px] font-semibold leading-[1.3]" style={{ color: 'var(--foreground)' }}>
                  {post.url_title}
                </p>
              )}
            </div>
          </a>
        )}

        {/* Hashtags */}
        {post.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {post.tags.map(slug => (
              <Link key={slug} href={`/community/tag/${slug}`} className="text-[12px] font-medium no-underline" style={{ color: 'var(--primary)' }}>
                #{slug}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Action bar */}
      <div
        className="flex items-center gap-4 border-t px-[18px] py-2.5 text-[12.5px]"
        style={{ borderColor: 'color-mix(in srgb, var(--border) 60%, transparent)' }}
      >
        <button
          onClick={handleLike}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 border-0 bg-transparent p-0"
          style={{ color: liked ? '#e11d48' : 'var(--muted-foreground)' }}
        >
          <Heart className="h-3.5 w-3.5" fill={liked ? '#e11d48' : 'none'} />
          <span className="font-semibold tabular-nums">{likes}</span>
        </button>
        <button
          onClick={() => { setShowCm(v => !v); if (!showCm) setTimeout(() => taRef.current?.focus(), 50) }}
          className="inline-flex items-center gap-1.5 border-0 bg-transparent p-0"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          <span className="font-semibold tabular-nums">{comments.length}</span>
        </button>

        {post.kind === 'question' && (
          <button
            onClick={handleToggleSolved}
            disabled={!isOwn}
            className="ml-auto inline-flex items-center gap-1 text-[11.5px] font-medium"
            style={{ color: solved ? 'var(--success)' : 'var(--warning)' }}
            title={isOwn ? 'Позначити' : ''}
          >
            {solved
              ? <Check className="h-3.5 w-3.5" />
              : <CircleAlert className="h-3.5 w-3.5" />}
            {solved ? tc('solved') : tc('unsolved')}
          </button>
        )}
        {post.kind !== 'question' && <span className="flex-1" />}

        <button
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 border-0 bg-transparent p-0 text-[12px]"
          style={{ color: saved ? 'var(--primary)' : 'var(--muted-foreground)' }}
        >
          <Bookmark className="h-3.5 w-3.5" fill={saved ? 'currentColor' : 'none'} />
          {saved ? tc('saved') : tc('save')}
        </button>
      </div>

      {/* Comments */}
      {showCm && (
        <div
          className="space-y-3.5 border-t px-[18px] py-4"
          style={{ borderColor: 'color-mix(in srgb, var(--border) 60%, transparent)' }}
        >
          {topLvl.map(c => (
            <CommentItem
              key={c.id} comment={c} replies={replies.get(c.id) ?? []}
              onReply={() => { setReply({ id: c.id, name: c.profiles?.full_name ?? '—' }); taRef.current?.focus() }}
              locale={locale}
            />
          ))}

          {/* Composer */}
          <div className="space-y-2">
            {reply && (
              <div
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[11.5px]"
                style={{ background: 'color-mix(in srgb, var(--primary) 8%, transparent)', color: 'var(--muted-foreground)' }}
              >
                <span>{tc('replyingTo')} <strong style={{ color: 'var(--foreground)' }}>{reply.name}</strong></span>
                <button onClick={() => setReply(null)} className="ml-auto" aria-label="Скасувати">
                  <X size={12} />
                </button>
              </div>
            )}
            <div className="flex gap-2.5">
              <Avatar name={null} url={null} size={28} />
              <div
                className="flex flex-1 items-end gap-2 rounded-2xl rounded-tl-sm border px-3 py-2"
                style={{ background: 'var(--muted)', borderColor: 'transparent' }}
              >
                <textarea
                  ref={taRef}
                  value={text} onChange={e => setText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment() } }}
                  rows={1}
                  placeholder={tComments('placeholder')}
                  className="flex-1 resize-none bg-transparent text-[13px] outline-none"
                  style={{ color: 'var(--foreground)' }}
                />
                <button
                  onClick={handleComment}
                  disabled={!text.trim() || isPending}
                  className="rounded-full p-1.5 disabled:opacity-30"
                  style={{
                    background: text.trim() ? 'var(--primary)' : 'transparent',
                    color: text.trim() ? '#fff' : 'var(--muted-foreground)',
                  }}
                  aria-label={tComments('submit')}
                >
                  <Send size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmOpen && (
        <ConfirmDialog
          message={t('deleteConfirm')}
          confirmLabel={tCommon('delete')}
          cancelLabel={tCommon('cancel')}
          onConfirm={() => {
            setDeleted(true)
            startTr(async () => {
              const fd = new FormData(); fd.set('id', post.id)
              await deletePost(fd)
              toast.success(t('toastDeleted'))
            })
          }}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </article>
  )
}

/* ─── pieces ─── */

function KindBadge({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-px text-[10.5px] font-semibold"
      style={{ background: `color-mix(in srgb, ${color} 14%, transparent)`, color }}
    >
      {icon}{label}
    </span>
  )
}

function CommentItem({
  comment, replies, onReply, locale,
}: { comment: PostComment; replies: PostComment[]; onReply: () => void; locale: string }) {
  const tc = useTranslations('community.post')
  return (
    <div>
      <div className="flex gap-2.5">
        <Avatar name={comment.profiles?.full_name ?? null} url={comment.profiles?.avatar_url ?? null} size={28} />
        <div className="min-w-0 flex-1">
          <div className="rounded-2xl rounded-tl-sm px-3 py-2.5" style={{ background: 'var(--muted)' }}>
            <span className="text-[12px] font-semibold" style={{ color: 'var(--foreground)' }}>
              {comment.profiles?.full_name ?? '—'}
            </span>
            <p className="mt-0.5 whitespace-pre-wrap text-[13px] leading-relaxed" style={{ color: 'var(--foreground)' }}>
              <AutoLink text={comment.content} />
            </p>
          </div>
          <div className="mt-1 flex items-center gap-3 pl-1">
            <span className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
              {formatRelative(comment.created_at, locale)}
            </span>
            <button onClick={onReply} className="text-[11px] font-medium" style={{ color: 'var(--muted-foreground)' }}>
              {tc('reply')}
            </button>
          </div>
        </div>
      </div>
      {replies.map(r => (
        <div key={r.id} className="ml-9 mt-2.5 flex gap-2.5">
          <Avatar name={r.profiles?.full_name ?? null} url={r.profiles?.avatar_url ?? null} size={24} />
          <div className="min-w-0 flex-1">
            <div className="rounded-2xl rounded-tl-sm px-3 py-2" style={{ background: 'var(--muted)' }}>
              <span className="text-[11.5px] font-semibold" style={{ color: 'var(--foreground)' }}>
                {r.profiles?.full_name ?? '—'}
              </span>
              <p className="mt-0.5 whitespace-pre-wrap text-[12.5px] leading-relaxed" style={{ color: 'var(--foreground)' }}>
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
  )
}
