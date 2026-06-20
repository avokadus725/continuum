'use client'

/* Collection detail client – interactive view of one collection's items. */

import { DIFF_COLOR } from '@/lib/difficulty-colors'
import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import {
  ArrowLeft, Pencil, Plus,
  FileText, Video, Link as LinkIcon, CheckSquare, Sticker, Search, X, Trash2,
} from 'lucide-react'
import { CollectionCover } from './_parts/collection-cover'
import { CoverEditor, type CoverEditorValue } from './_parts/cover-editor'
import { AddPicker } from './_parts/add-picker'
import type { CoverKey } from '@/lib/collection-covers'
import {
  toggleMaterialInCollection, toggleTaskInCollection,
  updateCollectionMeta, deleteCollection,
} from '@/app/actions/collections'

interface Material {
  id: string; title: string; type: string
  content: string | null; url: string | null
  topics: { title: string; icon: string | null } | null
}
interface Task {
  id: string; title: string; description: string
  difficulty: string; type: string; xp_reward: number
  topics: { title: string; icon: string | null } | null
}
interface Note {
  id: string; title: string; content: string | null; updated_at: string
}

interface PickerMaterial { id: string; title: string; topic?: string | null; kind?: 'article' | 'video' | 'link' | 'interactive' }
interface PickerTask     { id: string; title: string; topic?: string | null; difficulty?: string | null }

interface Props {
  collection: {
    id: string
    title: string
    description: string
    emoji: string
    cover: CoverKey
    createdAt: string
    lastAccessedAt: string | null
  }
  materials: Material[]
  tasks: Task[]
  notes: Note[]
  pickerMaterials: PickerMaterial[]
  pickerTasks: PickerTask[]
}

type Tab = 'all' | 'mat' | 'task' | 'note'

export function CollectionDetailClient({
  collection, materials, tasks, notes, pickerMaterials, pickerTasks,
}: Props) {
  const t       = useTranslations('collections')
  const tCommon = useTranslations('common')
  const router  = useRouter()
  const [tab, setTab] = useState<Tab>('all')
  const [search, setSearch] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [, startTransition] = useTransition()

  const total = materials.length + tasks.length + notes.length

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const matchesQ = (t: string, d?: string | null) =>
      !q || t.toLowerCase().includes(q) || (d ?? '').toLowerCase().includes(q)
    return {
      mat:  materials.filter(m => matchesQ(m.title, m.content)),
      task: tasks.filter(t     => matchesQ(t.title, t.description)),
      note: notes.filter(n     => matchesQ(n.title, n.content ?? '')),
    }
  }, [search, materials, tasks, notes])

  function handleSaveMeta(v: CoverEditorValue) {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('id', collection.id)
      fd.set('title', v.title)
      fd.set('description', v.description)
      fd.set('emoji', v.emoji)
      fd.set('cover', v.cover)
      await updateCollectionMeta(fd)
      setEditorOpen(false)
      toast.success(t('toastUpdated'))
    })
  }

  function handleDeleteCollection() {
    toast(t('deleteDialogTitle'), {
      description: t('deleteIrreversible'),
      action: {
        label: t('deleteItem'),
        onClick: () => {
          startTransition(async () => {
            const fd = new FormData()
            fd.set('id', collection.id)
            await deleteCollection(fd)
            toast.success(t('toastDeleted'))
            router.push('/collections')
          })
        },
      },
      cancel: { label: t('cancelAction'), onClick: () => {} },
    })
  }

  function handleRemoveMaterial(id: string, title: string) {
    toast(t('removeItemConfirm', { title }), {
      description: t('removeMaterialDesc'),
      action: {
        label: t('removeAction'),
        onClick: () => {
          startTransition(async () => {
            const fd = new FormData()
            fd.set('collection_id', collection.id)
            fd.set('material_id', id)
            fd.set('action', 'remove')
            await toggleMaterialInCollection(fd)
            toast.success(t('toastMaterialRemoved'))
          })
        },
      },
      cancel: { label: t('cancelAction'), onClick: () => {} },
    })
  }

  function handleRemoveTask(id: string, title: string) {
    toast(t('removeItemConfirm', { title }), {
      description: t('removeTaskDesc'),
      action: {
        label: t('removeAction'),
        onClick: () => {
          startTransition(async () => {
            const fd = new FormData()
            fd.set('collection_id', collection.id)
            fd.set('task_id', id)
            fd.set('action', 'remove')
            await toggleTaskInCollection(fd)
            toast.success(t('toastTaskRemoved'))
          })
        },
      },
      cancel: { label: t('cancelAction'), onClick: () => {} },
    })
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="overflow-hidden rounded-[18px] border" style={{ borderColor: 'var(--border)' }}>
        <CollectionCover emoji={collection.emoji} cover={collection.cover}>
          {/* Frosted buttons – always dark text so they're visible on any cover */}
          <div className="flex gap-2">
            <Link
              href="/collections"
              className="inline-flex h-[30px] items-center gap-1.5 rounded-lg px-3 text-xs font-semibold no-underline"
              style={{ background: 'rgba(255,255,255,0.88)', color: '#18181b' }}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t('backToCollections')}
            </Link>
            <button
              onClick={() => setEditorOpen(true)}
              className="grid h-[30px] w-[30px] place-items-center rounded-lg border-0"
              style={{ background: 'rgba(255,255,255,0.88)', color: '#18181b' }}
              aria-label={tCommon('edit')}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </div>
        </CollectionCover>

        <div className="relative px-5 pb-5 pt-4 sm:px-7 sm:pb-6 sm:pt-5" style={{ background: 'var(--card)' }}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
            <div className="flex-1">
              <h1
                className="m-0 text-[30px] font-semibold tracking-[-0.6px]"
                style={{ color: 'var(--foreground)', lineHeight: 1.15 }}
              >
                {collection.title}
              </h1>
              {collection.description && (
                <p className="mt-1.5 max-w-[540px] text-sm leading-[1.55]" style={{ color: 'var(--muted-foreground)' }}>
                  {collection.description}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3.5 text-[12.5px]"
                style={{ color: 'color-mix(in srgb, var(--muted-foreground) 70%, transparent)' }}
              >
                <Count icon={<FileText className="h-3.5 w-3.5" />} n={materials.length} label={t('materialMany')} tone="var(--primary)" />
                <Count icon={<CheckSquare className="h-3.5 w-3.5" />} n={tasks.length} label={t('taskMany')} tone="var(--success)" />
                <Count icon={<Sticker className="h-3.5 w-3.5" />} n={notes.length} label={t('noteMany')} tone="#C2956C" />
              </div>
            </div>
            <div className="flex items-center gap-2 sm:flex-none">
              <button
                onClick={handleDeleteCollection}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] border transition-colors hover:bg-red-50 dark:hover:bg-red-950/30 sm:h-9 sm:w-9"
                style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
                title={t('deleteCollectionTitle')}
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPickerOpen(true)}
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-[10px] border-0 px-4 text-[13.5px] font-semibold text-white sm:flex-initial"
                style={{ background: 'var(--primary)' }}
              >
                <Plus className="h-4 w-4" />
                {t('addAction')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs + search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Tabs
          tab={tab}
          onTab={setTab}
          counts={{ all: total, mat: materials.length, task: tasks.length, note: notes.length }}
        />
        <span className="hidden sm:block sm:flex-1" />
        {total > 0 && (
          <div
            className="flex h-9 w-full min-w-0 items-center gap-2 rounded-lg border px-3 sm:w-[240px]"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <Search className="h-3.5 w-3.5" style={{ color: 'color-mix(in srgb, var(--muted-foreground) 70%, transparent)' }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t('detailSearchPlaceholder')}
              className="min-w-0 flex-1 bg-transparent text-[13px] outline-none"
              style={{ color: 'var(--foreground)' }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ color: 'var(--muted-foreground)' }}>
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Feed */}
      <div className="space-y-0">
        {(tab === 'all' || tab === 'mat') && filtered.mat.map((m, i, arr) => (
          <MaterialRow
            key={m.id} m={m}
            last={tab !== 'all' && i === arr.length - 1 && filtered.task.length === 0 && filtered.note.length === 0}
            onRemove={() => handleRemoveMaterial(m.id, m.title)}
          />
        ))}
        {(tab === 'all' || tab === 'task') && filtered.task.map((t, i, arr) => (
          <TaskRow
            key={t.id} t={t}
            last={tab === 'task' && i === arr.length - 1}
            onRemove={() => handleRemoveTask(t.id, t.title)}
          />
        ))}
        {(tab === 'all' || tab === 'note') && filtered.note.map((n, i, arr) => (
          <NoteRow key={n.id} n={n} last={i === arr.length - 1} />
        ))}

        {((tab === 'all'  && total === 0) ||
          (tab === 'mat'  && materials.length === 0) ||
          (tab === 'task' && tasks.length === 0) ||
          (tab === 'note' && notes.length === 0)) && (
          <div
            className="mt-2 rounded-2xl border p-9 text-center text-sm"
            style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
          >
            <p className="m-0">{t('detailEmpty')}</p>
            <button
              onClick={() => setPickerOpen(true)}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold"
              style={{ color: 'var(--primary)' }}
            >
              <Plus className="h-4 w-4" /> {t('addFirstItem')}
            </button>
          </div>
        )}
      </div>

      {/* Picker overlay */}
      {pickerOpen && (
        <Overlay onClose={() => setPickerOpen(false)}>
          <AddPicker
            collectionId={collection.id}
            materials={pickerMaterials}
            tasks={pickerTasks}
            onClose={() => setPickerOpen(false)}
            onCreateNote={() => {
              setPickerOpen(false)
              router.push(`/notes?collection_id=${collection.id}`)
            }}
          />
        </Overlay>
      )}

      {/* Cover editor overlay */}
      {editorOpen && (
        <Overlay onClose={() => setEditorOpen(false)}>
          <CoverEditor
            mode="edit"
            initial={{
              title: collection.title,
              description: collection.description,
              emoji: collection.emoji,
              cover: collection.cover,
            }}
            onCancel={() => setEditorOpen(false)}
            onSave={handleSaveMeta}
            onDelete={handleDeleteCollection}
          />
        </Overlay>
      )}
    </div>
  )
}

/* ─────────── pieces ─────────── */

function Tabs({
  tab, onTab, counts,
}: { tab: Tab; onTab: (t: Tab) => void; counts: Record<Tab, number> }) {
  const t = useTranslations('collections')
  const items: [Tab, string][] = [['all', t('tabAll')], ['mat', t('tabMaterials')], ['task', t('tabTasks')], ['note', t('tabNotes')]]
  return (
    <div
      className="inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-[10px] border p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}
    >
      {items.map(([k, label]) => {
        const active = k === tab
        return (
          <button
            key={k}
            onClick={() => onTab(k)}
            className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border-0 px-3 py-1.5 text-[12.5px] font-semibold"
            style={{
              background: active ? 'var(--card)' : 'transparent',
              color: active ? 'var(--foreground)' : 'var(--muted-foreground)',
              boxShadow: active ? '0 1px 0 rgba(11,22,32,0.05)' : 'none',
            }}
          >
            {label}
            <span
              className="rounded-full px-1.5 text-[11px] font-semibold tabular-nums"
              style={{ color: 'color-mix(in srgb, var(--muted-foreground) 70%, transparent)' }}
            >{counts[k]}</span>
          </button>
        )
      })}
    </div>
  )
}

function Count({ icon, n, label, tone }: { icon: React.ReactNode; n: number; label: string; tone: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span style={{ color: tone, display: 'inline-flex' }}>{icon}</span>
      <span><strong className="font-semibold" style={{ color: 'currentcolor' }}>{n}</strong> {label}</span>
    </span>
  )
}

function MaterialRow({ m, last, onRemove }: { m: Material; last: boolean; onRemove: () => void }) {
  const tTypes = useTranslations('materials.types')
  const Icon =
    m.type === 'video'  ? Video
    : m.type === 'link' ? LinkIcon
    : FileText
  const labelKind = m.type === 'video' ? tTypes('video') : m.type === 'link' ? tTypes('link') : tTypes('article')
  const excerpt = m.content?.slice(0, 140) ?? (m.url ? m.url.replace(/^https?:\/\//, '') : null)
  return (
    <Row
      icon={<Icon className="h-3.5 w-3.5" />}
      iconTone="var(--primary)"
      kind={labelKind}
      title={<Link href={`/materials/${m.id}`} className="no-underline" style={{ color: 'var(--foreground)' }}>{m.title}</Link>}
      desc={excerpt}
      meta={null}
      onRemove={onRemove}
      last={last}
    />
  )
}

function TaskRow({ t, last, onRemove }: { t: Task; last: boolean; onRemove: () => void }) {
  const tc = useTranslations('collections')
  const tDiff = useTranslations('tasks.difficulty')
  const tone = DIFF_COLOR[t.difficulty as keyof typeof DIFF_COLOR] ?? 'var(--muted-foreground)'
  const label = (['beginner', 'intermediate', 'advanced'].includes(t.difficulty)
    ? tDiff(t.difficulty as 'beginner' | 'intermediate' | 'advanced')
    : t.difficulty)
  return (
    <Row
      icon={<CheckSquare className="h-3.5 w-3.5" />}
      iconTone="var(--success)"
      kind={tc('itemKindTask')}
      badge={<><span className="h-1.5 w-1.5 rounded-full" style={{ background: tone }}/> {label}</>}
      badgeColor={tone}
      title={<Link href={`/tasks/${t.id}`} className="no-underline" style={{ color: 'var(--foreground)' }}>{t.title}</Link>}
      desc={t.description}
      rightExtra={
        <span className="text-[11.5px] font-semibold" style={{ color: 'var(--success)' }}>
          +{t.xp_reward} XP
        </span>
      }
      onRemove={onRemove}
      last={last}
    />
  )
}

function NoteRow({ n, last }: { n: Note; last: boolean }) {
  const tc = useTranslations('collections')
  return (
    <Row
      icon={<Sticker className="h-3.5 w-3.5" />}
      iconTone="#C2956C"
      kind={tc('itemKindNote')}
      title={<Link href={`/notes#${n.id}`} className="no-underline" style={{ color: 'var(--foreground)' }}>{n.title}</Link>}
      desc={n.content}
      meta={tc('updatedAt', { date: new Date(n.updated_at).toLocaleDateString('uk-UA') })}
      last={last}
    />
  )
}

function Row({
  icon, iconTone, kind, badge, badgeColor, title, desc, meta, rightExtra, onRemove, last,
}: {
  icon: React.ReactNode
  iconTone: string
  kind: string
  badge?: React.ReactNode
  badgeColor?: string
  title: React.ReactNode
  desc?: string | null
  meta?: string | null
  rightExtra?: React.ReactNode
  onRemove?: () => void
  last?: boolean
}) {
  const tc = useTranslations('collections')
  return (
    <div
      className="group flex items-start gap-3.5 py-3.5"
      style={{ borderBottom: last ? 'none' : '1px solid color-mix(in srgb, var(--border) 60%, transparent)' }}
    >
      <span
        className="grid h-8 w-8 flex-none place-items-center rounded-lg"
        style={{ background: 'var(--muted)', color: iconTone }}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.8px]" style={{ color: 'var(--muted-foreground)' }}>
            {kind}
          </span>
          {badge && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium" style={{ color: badgeColor }}>
              {badge}
            </span>
          )}
        </div>
        <div className="text-[14.5px] font-semibold leading-[1.3]" style={{ color: 'var(--foreground)' }}>{title}</div>
        {desc && (
          <p className="mt-1 line-clamp-2 text-[13px] leading-[1.5]" style={{ color: 'var(--muted-foreground)' }}>{desc}</p>
        )}
        {meta && <p className="mt-1.5 text-[11.5px]" style={{ color: 'color-mix(in srgb, var(--muted-foreground) 70%, transparent)' }}>{meta}</p>}
      </div>
      <div className="flex flex-none items-center gap-3">
        {rightExtra}
        {onRemove && (
          <button
            onClick={onRemove}
            className="grid h-7 w-7 place-items-center rounded-md border-0 bg-transparent opacity-0 transition-opacity group-hover:opacity-100"
            style={{ color: 'var(--muted-foreground)' }}
            title={tc('removeFromCollection')}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-[2px]"
      style={{ background: 'rgba(11,22,32,0.34)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      {children}
    </div>
  )
}
