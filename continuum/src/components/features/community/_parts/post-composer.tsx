'use client'

/* Composer with type selector, hashtag chips, attach link, send.
   Handles the three flows: discussion / question (with title) / share (with URL). */

import { useEffect, useRef, useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Send, X, Link2, MessageSquare, HelpCircle, Share2, Hash } from 'lucide-react'

import { toast } from 'sonner'
import { createPost } from '@/app/actions/posts'
import { extractHashtags, slugifyTag, SUGGESTED_TAGS } from '@/lib/hashtags'
import { Avatar } from './avatar'
import type { PostKind } from '../_types'

interface Props {
  avatarUrl: string | null
  name: string | null
  initialKind?: PostKind
}

export function PostComposer({ avatarUrl, name, initialKind = 'discussion' }: Props) {
  const t  = useTranslations('posts')
  const tc = useTranslations('community')
  const [expanded, setExpanded] = useState(false)
  const [kind, setKind] = useState<PostKind>(initialKind)
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [isPending, startTr] = useTransition()
  const taRef = useRef<HTMLTextAreaElement>(null)

  /* auto-grow textarea */
  useEffect(() => {
    const ta = taRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${ta.scrollHeight}px`
  }, [text])

  /* Auto-promote to "share" when a URL is added. */
  useEffect(() => {
    if (url.trim() && kind === 'discussion') setKind('share')
  }, [url, kind])

  /* Extract hashtags from text on the fly, merge with explicit chips. */
  const inlineTags = extractHashtags(text + ' ' + (title || ''))
  const allTags = [...new Set([...tags, ...inlineTags])].slice(0, 5)

  function addTag(slug: string) {
    const s = slugifyTag(slug)
    if (!s) return
    setTags(prev => prev.includes(s) ? prev : [...prev, s].slice(0, 5))
  }

  function removeTag(slug: string) {
    setTags(prev => prev.filter(t => t !== slug))
    setText(prev => prev.replace(new RegExp(`#${slug}\\b`, 'g'), '').replace(/\s+/g, ' ').trim())
    setTitle(prev => prev.replace(new RegExp(`#${slug}\\b`, 'g'), '').trim())
  }

  function reset() {
    setText(''); setTitle(''); setUrl(''); setTags([])
    setExpanded(false); setKind('discussion'); setShowUrlInput(false)
  }

  function handleSubmit() {
    if (!text.trim()) return
    if (kind === 'question' && !title.trim()) {
      toast.error(tc('compose.errorNoTitle'))
      return
    }
    startTr(async () => {
      const fd = new FormData()
      fd.set('content', text.trim())
      fd.set('kind', kind)
      if (kind === 'question' && title.trim()) fd.set('title', title.trim())
      if (url.trim()) fd.set('url', url.trim())
      allTags.forEach(s => fd.append('tags[]', s))
      const res = await createPost(fd)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success(t('toastPublished'))
        reset()
      }
    })
  }

  if (!expanded) {
    return (
      <div
        className="mb-4 flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition-colors hover:border-[color-mix(in_srgb,var(--primary)_30%,var(--border))]"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <Avatar name={name} url={avatarUrl} size={36} />
        <button
          onClick={() => setExpanded(true)}
          className="flex-1 cursor-text bg-transparent text-left text-[13.5px]"
          style={{ color: 'color-mix(in srgb, var(--muted-foreground) 80%, transparent)' }}
        >
          {tc('compose.placeholder')}
        </button>
        <button
          onClick={() => setExpanded(true)}
          className="h-8 rounded-lg border-0 px-3 text-[12.5px] font-semibold text-white"
          style={{ background: 'var(--primary)' }}
        >
          {tc('compose.create')}
        </button>
      </div>
    )
  }

  return (
    <div
      className="relative mb-4 overflow-hidden rounded-2xl border-[1.5px]"
      style={{
        background: 'var(--card)', borderColor: 'var(--primary)',
        boxShadow: '0 0 0 3px color-mix(in srgb, var(--primary) 8%, transparent)',
      }}
    >
      {/* Type selector */}
      <div className="flex items-center gap-1.5 px-4 pt-3">
        <TypePill icon={<MessageSquare className="h-3.5 w-3.5" />} label={tc('kinds.discussion')} active={kind === 'discussion'} onClick={() => setKind('discussion')} />
        <TypePill icon={<HelpCircle    className="h-3.5 w-3.5" />} label={tc('kinds.question')}    active={kind === 'question'}    onClick={() => setKind('question')}    accent="var(--warning)" />
        <TypePill icon={<Share2        className="h-3.5 w-3.5" />} label={tc('kinds.share')}        active={kind === 'share'}       onClick={() => setKind('share')} />
        <span className="flex-1" />
        <button onClick={reset} aria-label={tc('compose.close')} className="rounded-md p-1 text-[var(--muted-foreground)]">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="px-4 pt-3.5">
        <div className="flex gap-3">
          <Avatar name={name} url={avatarUrl} size={36} />
          <div className="flex-1 min-w-0">
            {kind === 'question' && (
              <input
                autoFocus
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={tc('compose.questionTitle')}
                className="mb-2 w-full bg-transparent text-[17px] font-semibold tracking-[-0.2px] outline-none"
                style={{ color: 'var(--foreground)' }}
              />
            )}
            <textarea
              ref={taRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleSubmit() }}
              rows={kind === 'question' ? 3 : 4}
              placeholder={
                kind === 'question' ? tc('compose.questionBody')
                : kind === 'share'  ? tc('compose.shareBody')
                : tc('compose.discussionBody')
              }
              autoFocus={kind !== 'question'}
              className="w-full resize-none bg-transparent text-sm leading-relaxed outline-none"
              style={{ color: 'var(--foreground)' }}
            />

            {/* URL input — appears either via button or auto when share kind */}
            {(showUrlInput || kind === 'share') && (
              <div
                className="mt-2 flex items-center gap-2 rounded-xl border px-3 py-2"
                style={{ background: 'var(--background)', borderColor: 'var(--border)' }}
              >
                <Link2 size={13} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
                <input
                  value={url} onChange={e => setUrl(e.target.value)}
                  placeholder="https://…"
                  className="flex-1 bg-transparent text-[13px] outline-none"
                  style={{ color: 'var(--foreground)' }}
                />
                {url && (
                  <button onClick={() => setUrl('')} aria-label={tc('compose.removeLink')}>
                    <X size={13} style={{ color: 'var(--muted-foreground)' }} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Hashtag row */}
        <div
          className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-dashed pt-3"
          style={{ borderColor: 'color-mix(in srgb, var(--border) 70%, transparent)' }}
        >
          <span className="mr-1 text-[11px]" style={{ color: 'color-mix(in srgb, var(--muted-foreground) 70%, transparent)' }}>
            {tc('compose.tags')}
          </span>
          {allTags.map(slug => (
            <button
              key={slug}
              onClick={() => removeTag(slug)}
              className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11.5px] font-semibold"
              style={{
                background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
                borderColor: 'var(--primary)', color: 'var(--primary)',
              }}
              title="Прибрати тег"
            >
              #{slug}<X className="h-2.5 w-2.5 opacity-70" />
            </button>
          ))}
          {SUGGESTED_TAGS[kind].filter(s => !allTags.includes(s)).slice(0, 2).map(s => (
            <button
              key={s}
              onClick={() => addTag(s)}
              className="inline-flex items-center rounded-full border border-dashed px-2.5 py-0.5 text-[11.5px] font-semibold"
              style={{
                background: 'transparent', borderColor: 'var(--border)',
                color: 'color-mix(in srgb, var(--muted-foreground) 80%, transparent)',
              }}
            >
              #{s}
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div
        className="mt-3 flex items-center gap-1.5 border-t px-3 py-2.5"
        style={{ borderColor: 'color-mix(in srgb, var(--border) 70%, transparent)' }}
      >
        {kind !== 'share' && (
          <button
            onClick={() => setShowUrlInput(v => !v)}
            className="grid h-8 w-8 place-items-center rounded-md"
            style={{ color: showUrlInput ? 'var(--primary)' : 'var(--muted-foreground)' }}
            title={tc('compose.addLink')}
          >
            <Link2 className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={() => addTag(prompt(tc('compose.tagPrompt')) ?? '')}
          className="grid h-8 w-8 place-items-center rounded-md"
          style={{ color: 'var(--muted-foreground)' }}
          title={tc('compose.addTag')}
        >
          <Hash className="h-4 w-4" />
        </button>
        <span className="flex-1" />
        <span className="text-[11px]" style={{ color: 'color-mix(in srgb, var(--muted-foreground) 70%, transparent)' }}>
          {tc('compose.shortcut')}
        </span>
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || isPending || (kind === 'question' && !title.trim())}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border-0 px-3.5 text-[12.5px] font-semibold text-white disabled:opacity-40"
          style={{ background: 'var(--primary)' }}
        >
          <Send className="h-3.5 w-3.5" />
          {isPending ? '…' : t('publish')}
        </button>
      </div>
    </div>
  )
}

/* ─── helpers ─── */

function TypePill({
  icon, label, active, onClick, accent,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
  accent?: string
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border-0 px-3 py-1.5 text-[12.5px] font-semibold"
      style={{
        background: active
          ? (accent ? `color-mix(in srgb, ${accent} 14%, transparent)` : 'color-mix(in srgb, var(--primary) 10%, transparent)')
          : 'transparent',
        color: active ? (accent || 'var(--primary)') : 'var(--muted-foreground)',
      }}
    >
      {icon}{label}
    </button>
  )
}
