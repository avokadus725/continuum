'use client'

import { useState, useTransition, useMemo } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Plus, Search, X, ArrowUpDown, MoreHorizontal } from 'lucide-react'
import { CollectionCover } from './_parts/collection-cover'
import { CoverEditor } from './_parts/cover-editor'
import { createCollection, deleteCollection } from '@/app/actions/collections'
import { COVERS, type CoverKey } from '@/lib/collection-covers'

interface Collection {
  id: string
  title: string
  description: string | null
  emoji: string
  cover: CoverKey
  createdAt: string
  lastAccessedAt: string | null
  materialCount: number
  taskCount: number
  noteCount: number
}

interface Props {
  collections: Collection[]
}

export function CollectionsListClient({ collections: initial }: Props) {
  const t = useTranslations('collections')
  const [search, setSearch] = useState('')
  const [creatingOpen, setCreatingOpen] = useState(false)
  const [, startTransition] = useTransition()
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return initial
    return initial.filter(c =>
      c.title.toLowerCase().includes(q) ||
      (c.description ?? '').toLowerCase().includes(q),
    )
  }, [initial, search])

  function handleDelete(id: string) {
    setConfirmDeleteId(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.set('id', id)
      await deleteCollection(fd)
    })
  }

  return (
    <div>
      {/* Page header */}
      <header className="flex items-baseline">
        <div>
          <h1
            className="m-0 text-[30px] font-semibold tracking-[-0.6px]"
            style={{ color: 'var(--foreground)' }}
          >
            {t('title')}
          </h1>
          <p
            className="mt-1.5 max-w-[460px] text-[13px]"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Особисті колекції матеріалів, завдань і нотаток —{' '}
            <span style={{
              fontFamily: '"Instrument Serif", Georgia, serif',
              fontStyle: 'italic',
              color: 'var(--foreground)',
            }}>твої робочі простори</span>{' '}
            під теми, іспити, проєкти.
          </p>
        </div>
        <span className="flex-1" />
        <button
          onClick={() => setCreatingOpen(true)}
          className="inline-flex h-9 items-center gap-[7px] rounded-[10px] border-0 px-3.5 text-[13px] font-semibold text-white"
          style={{ background: 'var(--primary)' }}
        >
          <Plus className="h-4 w-4" />
          {t('create')}
        </button>
      </header>

      {/* Search + sort */}
      {initial.length > 0 && (
        <div className="mt-[22px] mb-[22px] flex items-center gap-2.5">
          <div
            className="flex h-[38px] flex-1 items-center gap-2.5 rounded-[10px] border px-3.5"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <Search className="h-4 w-4 shrink-0" style={{ color: 'color-mix(in srgb, var(--muted-foreground) 70%, transparent)' }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Знайти підбірку…"
              className="flex-1 bg-transparent text-[13.5px] outline-none"
              style={{ color: 'var(--foreground)' }}
            />
            <span className="text-xs" style={{ color: 'color-mix(in srgb, var(--muted-foreground) 70%, transparent)' }}>
              {filtered.length} {filtered.length === 1 ? 'підбірка' : 'підбірок'}
            </span>
            {search && (
              <button onClick={() => setSearch('')} className="opacity-60" style={{ color: 'var(--muted-foreground)' }}>
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button
            className="inline-flex h-[38px] items-center gap-[7px] rounded-[10px] border px-3.5 text-[13px]"
            style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            Нещодавні
          </button>
        </div>
      )}

      {/* Grid */}
      {initial.length === 0 ? (
        <EmptyState onCreate={() => setCreatingOpen(true)} />
      ) : filtered.length === 0 ? (
        <div
          className="mt-6 rounded-2xl border p-12 text-center"
          style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
        >
          Нічого не знайдено за «{search}»
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NewCollectionCard onClick={() => setCreatingOpen(true)} />
          {filtered.map(c => (
            <CollectionCard
              key={c.id}
              c={c}
              menuOpen={menuOpenId === c.id}
              onOpenMenu={() => setMenuOpenId(v => v === c.id ? null : c.id)}
              onCloseMenu={() => setMenuOpenId(null)}
              onDelete={() => setConfirmDeleteId(c.id)}
            />
          ))}
        </div>
      )}

      {/* Create overlay */}
      {creatingOpen && (
        <Overlay onClose={() => setCreatingOpen(false)}>
          <CoverEditor
            mode="create"
            initial={{ title: '', description: '', emoji: '📚', cover: 'default' }}
            onCancel={() => setCreatingOpen(false)}
            onSave={async (v) => {
              const fd = new FormData()
              fd.set('title', v.title)
              if (v.description) fd.set('description', v.description)
              fd.set('emoji', v.emoji)
              fd.set('cover', v.cover)
              await createCollection(fd)
              setCreatingOpen(false)
            }}
          />
        </Overlay>
      )}

      {/* Delete confirmation */}
      {confirmDeleteId && (
        <Overlay onClose={() => setConfirmDeleteId(null)}>
          <div
            className="w-[360px] rounded-2xl border p-6"
            style={{
              background: 'var(--card)', borderColor: 'var(--border)',
              boxShadow: '0 30px 60px -15px rgba(11,22,32,0.22)',
            }}
          >
            <h3 className="m-0 text-base font-semibold" style={{ color: 'var(--foreground)' }}>
              Видалити підбірку?
            </h3>
            <p className="mt-1.5 text-[13px]" style={{ color: 'var(--muted-foreground)' }}>
              Матеріали і завдання залишаться доступними окремо. Лише сама колекція буде видалена.
            </p>
            <div className="mt-5 flex justify-end gap-2.5">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="h-9 rounded-lg border bg-transparent px-3.5 text-[13px]"
                style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
              >
                Скасувати
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="h-9 rounded-lg border-0 px-4 text-[13px] font-semibold text-white"
                style={{ background: 'var(--destructive)' }}
              >
                Видалити
              </button>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  )
}

/* ─────────── Card ─────────── */

function CollectionCard({
  c, menuOpen, onOpenMenu, onCloseMenu, onDelete,
}: {
  c: Collection
  menuOpen: boolean
  onOpenMenu: () => void
  onCloseMenu: () => void
  onDelete: () => void
}) {
  const parts: [number, string][] = []
  if (c.materialCount > 0) parts.push([c.materialCount, c.materialCount === 1 ? 'матеріал' : 'матеріалів'])
  if (c.taskCount     > 0) parts.push([c.taskCount,     c.taskCount === 1     ? 'завдання' : 'завдань'])
  if (c.noteCount     > 0) parts.push([c.noteCount,     c.noteCount === 1     ? 'нотатка'  : 'нотаток'])

  return (
    <div
      className="group relative overflow-hidden rounded-[14px] border transition-transform hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-10px_rgba(11,22,32,0.12)]"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      <Link href={`/collections/${c.id}`} className="block no-underline">
        <CollectionCover emoji={c.emoji} cover={c.cover}>
          <span /> {/* right slot intentionally empty here; menu is absolute below */}
        </CollectionCover>

        <div className="px-[18px] pb-[18px] pt-4">
          <div
            className="line-clamp-2 text-[15.5px] font-semibold leading-[1.25] tracking-[-0.2px]"
            style={{ color: 'var(--foreground)' }}
          >
            {c.title}
          </div>
          {c.description ? (
            <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-[1.5]" style={{ color: 'var(--muted-foreground)' }}>
              {c.description}
            </p>
          ) : (
            <p className="mt-1.5 text-[12.5px] italic" style={{ color: 'color-mix(in srgb, var(--muted-foreground) 60%, transparent)' }}>
              Без опису
            </p>
          )}
          <div
            className="mt-3.5 flex items-center gap-3 border-t pt-3 text-[11.5px]"
            style={{ borderColor: 'color-mix(in srgb, var(--border) 60%, transparent)', color: 'color-mix(in srgb, var(--muted-foreground) 70%, transparent)' }}
          >
            {parts.length === 0 ? (
              <span className="italic">Поки порожньо</span>
            ) : (
              parts.map(([n, label], i) => (
                <span key={i} className="inline-flex items-baseline gap-1">
                  <span className="font-semibold tabular-nums" style={{ color: 'var(--foreground)' }}>{n}</span>
                  <span>{label}</span>
                </span>
              ))
            )}
            <span className="flex-1" />
            {c.lastAccessedAt && <span>{relativeTime(c.lastAccessedAt)}</span>}
          </div>
        </div>
      </Link>

      {/* Hover menu */}
      <button
        onClick={(e) => { e.preventDefault(); onOpenMenu() }}
        className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-lg border-0 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 aria-[expanded=true]:opacity-100"
        aria-expanded={menuOpen}
        aria-label="Меню підбірки"
        style={{ background: 'rgba(255,255,255,0.85)', color: 'var(--muted-foreground)' }}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={onCloseMenu} />
          <div
            className="absolute right-3 top-12 z-50 w-44 overflow-hidden rounded-xl border"
            style={{
              background: 'var(--card)', borderColor: 'var(--border)',
              boxShadow: '0 12px 30px -10px rgba(11,22,32,0.18)',
            }}
          >
            <Link
              href={`/collections/${c.id}`}
              className="block px-3.5 py-2 text-[13px] no-underline hover:bg-[color-mix(in_srgb,var(--primary)_8%,var(--card))]"
              style={{ color: 'var(--foreground)' }}
            >
              Відкрити
            </Link>
            <button
              onClick={() => { onCloseMenu(); onDelete() }}
              className="block w-full px-3.5 py-2 text-left text-[13px]"
              style={{ color: 'var(--destructive)' }}
            >
              Видалити
            </button>
          </div>
        </>
      )}
    </div>
  )
}

/* ─────────── New card placeholder ─────────── */

function NewCollectionCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex min-h-[224px] flex-col items-center justify-center gap-2.5 rounded-[14px] border-[1.5px] border-dashed bg-transparent p-0"
      style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
    >
      <span
        className="grid h-[42px] w-[42px] place-items-center rounded-full border-[1.5px]"
        style={{ borderColor: 'var(--border)' }}
      >
        <Plus className="h-5 w-5" />
      </span>
      <span className="text-[13.5px] font-semibold" style={{ color: 'var(--foreground)' }}>
        Створити підбірку
      </span>
      <span
        className="max-w-[200px] text-center text-xs"
        style={{ color: 'color-mix(in srgb, var(--muted-foreground) 70%, transparent)' }}
      >
        Робочий простір під тему, іспит або проєкт
      </span>
    </button>
  )
}

/* ─────────── Empty state ─────────── */

function EmptyState({ onCreate }: { onCreate: () => void }) {
  const examples = [
    { emoji: '🧮', cover: 'blue'   as CoverKey, title: 'Підготовка до іспиту',  hint: 'матеріали + завдання + конспекти' },
    { emoji: '🛠', cover: 'violet' as CoverKey, title: 'Дипломна / курсова',    hint: 'research notes + посилання' },
    { emoji: '🌐', cover: 'amber'  as CoverKey, title: 'Англійська на щодень', hint: 'reading practice' },
  ]
  return (
    <div
      className="mt-5 rounded-2xl border p-9 text-center"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      <div className="mb-4 text-5xl leading-none">🗂</div>
      <h2 className="m-0 text-[22px] font-semibold tracking-[-0.4px]" style={{ color: 'var(--foreground)' }}>
        Ще немає{' '}
        <span style={{
          fontFamily: '"Instrument Serif", Georgia, serif',
          fontStyle: 'italic', fontWeight: 400, color: 'var(--primary)',
        }}>жодної підбірки</span>
      </h2>
      <p className="mx-auto mt-2 max-w-[460px] text-[14px]" style={{ color: 'var(--muted-foreground)' }}>
        Створи перший робочий простір. Ось ідеї, з яких часто починають:
      </p>
      <div className="mt-6 flex justify-center gap-3">
        {examples.map((ex) => {
          const palette = COVERS[ex.cover]
          return (
            <button
              key={ex.title}
              onClick={onCreate}
              className="relative w-[200px] rounded-xl p-3.5 text-left"
              style={{ background: palette.tint }}
            >
              <div className="text-2xl">{ex.emoji}</div>
              <div className="mt-2 text-[13px] font-semibold" style={{ color: 'var(--foreground)' }}>{ex.title}</div>
              <div className="mt-1 text-[11.5px]" style={{ color: 'var(--muted-foreground)' }}>{ex.hint}</div>
              <span className="absolute right-3 top-3.5 text-[11px] font-semibold" style={{ color: palette.deep }}>
                + Створити
              </span>
            </button>
          )
        })}
      </div>
      <button
        onClick={onCreate}
        className="mt-6 inline-flex h-10 items-center gap-2 rounded-[10px] border-0 px-4 text-[13.5px] font-semibold text-white"
        style={{ background: 'var(--primary)' }}
      >
        <Plus className="h-4 w-4" />
        Створити з нуля
      </button>
    </div>
  )
}

/* ─────────── Overlay helper ─────────── */

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

/* ─────────── helpers ─────────── */

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const m = Math.floor(ms / 60000)
  if (m < 1)  return 'щойно'
  if (m < 60) return `${m} хв тому`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} год тому`
  const d = Math.floor(h / 24)
  if (d === 1) return 'учора'
  if (d < 7)  return `${d} дн тому`
  return new Date(iso).toLocaleDateString('uk-UA')
}
