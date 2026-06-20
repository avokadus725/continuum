'use client'

/* Notification bell – dropdown of the user's notifications with an unread badge. */

import { useEffect, useRef, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import {
  Bell, Heart, MessageCircle, CornerDownRight,
  Trophy, FileText, Sparkles,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Notification {
  id: string
  type: string
  title: string
  body: string | null
  is_read: boolean
  created_at: string
  meta: Record<string, string> | null
}

interface TypeMeta { icon: React.ReactNode; color: string; bg: string }

const TYPE_META: Record<string, TypeMeta> = {
  post_reaction:  { icon: <Heart  className="w-3.5 h-3.5" />,             color: '#ef4444', bg: 'color-mix(in srgb, #ef4444 14%, transparent)' },
  post_comment:   { icon: <MessageCircle className="w-3.5 h-3.5" />,       color: 'var(--primary)', bg: 'color-mix(in srgb, var(--primary) 12%, transparent)' },
  comment_reply:  { icon: <CornerDownRight className="w-3.5 h-3.5" />,     color: 'var(--primary)', bg: 'color-mix(in srgb, var(--primary) 12%, transparent)' },
  achievement:    { icon: <Trophy className="w-3.5 h-3.5" />,              color: '#f59e0b', bg: 'color-mix(in srgb, #f59e0b 14%, transparent)' },
  new_task:       { icon: <FileText className="w-3.5 h-3.5" />,            color: '#22c55e', bg: 'color-mix(in srgb, #22c55e 14%, transparent)' },
  recommendation: { icon: <Sparkles className="w-3.5 h-3.5" />,           color: '#8b5cf6', bg: 'color-mix(in srgb, #8b5cf6 14%, transparent)' },
}

const FALLBACK_META: TypeMeta = {
  icon: <Bell className="w-3.5 h-3.5" />,
  color: 'var(--muted-foreground)',
  bg: 'var(--muted)',
}

const POST_TYPES = new Set(['post_reaction', 'post_comment', 'comment_reply'])

function formatRelative(iso: string, locale: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  if (diff < 60)    return rtf.format(0, 'seconds')
  if (diff < 3600)  return rtf.format(-Math.floor(diff / 60), 'minutes')
  if (diff < 86400) return rtf.format(-Math.floor(diff / 3600), 'hours')
  return new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short' })
}

export function NotificationBell({ userId }: { userId: string }) {
  const t = useTranslations('notifications')
  const locale = useLocale()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const unread = notifications.filter(n => !n.is_read).length

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data }) => setNotifications((data as Notification[]) ?? []))

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => { setNotifications(prev => [payload.new as Notification, ...prev]) }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  async function markAllRead() {
    const supabase = createClient()
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  async function markOneRead(id: string) {
    const supabase = createClient()
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="relative flex items-center justify-center w-9 h-9 rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5"
        style={{ color: 'var(--muted-foreground)' }}
        title={t('title')}
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
            style={{ background: 'var(--destructive)', color: '#fff' }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute top-full mt-2 right-0 z-50 w-[340px] rounded-2xl border shadow-xl overflow-hidden"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              {t('title')}
            </span>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs font-medium" style={{ color: 'var(--primary)' }}>
                {t('markAllRead')}
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-sm text-center" style={{ color: 'var(--muted-foreground)' }}>
                {t('empty')}
              </p>
            ) : (
              notifications.map(n => {
                const meta = TYPE_META[n.type] ?? FALLBACK_META
                const postId = n.meta?.post_id
                const isPostNotif = POST_TYPES.has(n.type) && postId

                return (
                  <div
                    key={n.id}
                    onClick={() => markOneRead(n.id)}
                    className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/5 border-b last:border-b-0"
                    style={{
                      borderColor: 'color-mix(in srgb, var(--border) 50%, transparent)',
                      background: n.is_read ? 'transparent' : 'color-mix(in srgb, var(--primary) 4%, transparent)',
                    }}
                  >
                    {/* Icon circle */}
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: meta.bg, color: meta.color }}
                    >
                      {meta.icon}
                    </span>

                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium leading-snug" style={{ color: 'var(--foreground)' }}>
                        {n.title}
                      </p>
                      {n.body && (
                        isPostNotif ? (
                          <Link
                            href={`/community#post-${postId}`}
                            onClick={() => setOpen(false)}
                            className="text-xs mt-0.5 truncate hover:underline block"
                            style={{ color: 'var(--primary)' }}
                          >
                            {n.body}
                          </Link>
                        ) : (
                          <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted-foreground)' }}>
                            {n.body}
                          </p>
                        )
                      )}
                      <p className="text-[11px] mt-1" style={{ color: 'color-mix(in srgb, var(--muted-foreground) 70%, transparent)' }}>
                        {formatRelative(n.created_at, locale)}
                      </p>
                    </div>

                    {!n.is_read && (
                      <div className="w-2 h-2 rounded-full shrink-0 mt-2" style={{ background: 'var(--primary)' }} />
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
