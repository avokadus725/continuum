'use client'

/* Add picker overlay — search + tab + batch-select, then add many items at once.
   Caller provides material/task lists already excluded of items already in
   the collection (so we don't show duplicates). */

import { useMemo, useState, useTransition } from 'react'
import { Search, X, FileText, CheckSquare, Plus, Check } from 'lucide-react'
import { addItemsToCollection } from '@/app/actions/collections'

interface PickerMaterial { id: string; title: string; topic?: string | null; kind?: 'article' | 'video' | 'link' | 'interactive' }
interface PickerTask     { id: string; title: string; topic?: string | null; difficulty?: string | null }

interface Props {
  collectionId: string
  materials: PickerMaterial[]
  tasks: PickerTask[]
  onClose: () => void
  onCreateNote: () => void
}

type Tab = 'mat' | 'task'

export function AddPicker({ collectionId, materials, tasks, onClose, onCreateNote }: Props) {
  const [tab, setTab] = useState<Tab>('mat')
  const [search, setSearch] = useState('')
  const [pickedMats,  setPickedMats]  = useState<Set<string>>(new Set())
  const [pickedTasks, setPickedTasks] = useState<Set<string>>(new Set())
  const [, startTransition] = useTransition()

  const list = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (tab === 'mat') {
      return materials.filter(m => !q || m.title.toLowerCase().includes(q))
    }
    return tasks.filter(t => !q || t.title.toLowerCase().includes(q))
  }, [tab, search, materials, tasks])

  const pickedCount = pickedMats.size + pickedTasks.size

  function toggleMat(id: string) {
    setPickedMats(s => {
      const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n
    })
  }
  function toggleTask(id: string) {
    setPickedTasks(s => {
      const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n
    })
  }

  function handleAdd() {
    if (pickedCount === 0) return
    startTransition(async () => {
      const fd = new FormData()
      fd.set('collection_id', collectionId)
      pickedMats.forEach(id => fd.append('material_ids[]', id))
      pickedTasks.forEach(id => fd.append('task_ids[]', id))
      await addItemsToCollection(fd)
      onClose()
    })
  }

  return (
    <div
      className="w-[520px] overflow-hidden rounded-2xl border"
      style={{
        background: 'var(--card)', borderColor: 'var(--border)',
        boxShadow: '0 30px 60px -15px rgba(11,22,32,0.22)',
      }}
    >
      <header
        className="border-b px-5 pb-3.5 pt-[18px]"
        style={{ borderColor: 'color-mix(in srgb, var(--border) 70%, transparent)' }}
      >
        <div className="flex items-baseline gap-2">
          <span style={{
            fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: 'italic',
            color: 'var(--primary)', fontSize: 18,
          }}>i.</span>
          <h3 className="m-0 text-base font-semibold tracking-[-0.2px]" style={{ color: 'var(--foreground)' }}>
            Додати в підбірку
          </h3>
          <span className="flex-1" />
          <button onClick={onClose} className="bg-transparent" style={{ color: 'color-mix(in srgb, var(--muted-foreground) 70%, transparent)' }}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1.5 text-[12.5px]" style={{ color: 'var(--muted-foreground)' }}>
          Знайди серед твоїх матеріалів і завдань, або створи нотатку прямо тут.
        </p>
      </header>

      <div className="px-5 py-3.5">
        {/* Tabs */}
        <div
          className="inline-flex gap-1 rounded-lg border p-[3px]"
          style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}
        >
          <TabBtn active={tab === 'mat'} onClick={() => setTab('mat')}>
            <FileText className="h-3.5 w-3.5" /> Матеріали
            <span style={{ color: 'color-mix(in srgb, var(--muted-foreground) 70%, transparent)', fontSize: 10.5 }}>{materials.length}</span>
          </TabBtn>
          <TabBtn active={tab === 'task'} onClick={() => setTab('task')}>
            <CheckSquare className="h-3.5 w-3.5" /> Завдання
            <span style={{ color: 'color-mix(in srgb, var(--muted-foreground) 70%, transparent)', fontSize: 10.5 }}>{tasks.length}</span>
          </TabBtn>
          <button
            onClick={onCreateNote}
            className="inline-flex items-center gap-1.5 rounded-md border-0 bg-transparent px-2.5 py-[5px] text-[12px] font-semibold"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <Plus className="h-3.5 w-3.5" /> Нотатка
          </button>
        </div>

        {/* Search */}
        <div
          className="mt-3 flex h-9 items-center gap-2 rounded-lg border px-3"
          style={{ background: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
        >
          <Search className="h-3.5 w-3.5" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={tab === 'mat' ? 'Шукати у матеріалах…' : 'Шукати у завданнях…'}
            className="flex-1 bg-transparent text-[13px] outline-none"
            style={{ color: 'var(--foreground)' }}
          />
        </div>

        {/* Results */}
        <div className="mt-3 max-h-[280px] overflow-y-auto">
          {list.length === 0 ? (
            <div className="py-8 text-center text-[13px]" style={{ color: 'var(--muted-foreground)' }}>
              Нічого не знайдено
            </div>
          ) : tab === 'mat' ? (
            list.map(m => {
              const picked = pickedMats.has((m as PickerMaterial).id)
              return <ResultRow key={(m as PickerMaterial).id}
                picked={picked} onToggle={() => toggleMat((m as PickerMaterial).id)}
                icon={<FileText className="h-3.5 w-3.5" />}
                title={(m as PickerMaterial).title}
                sub={(m as PickerMaterial).topic ?? 'Матеріал'}
              />
            })
          ) : (
            list.map(t => {
              const picked = pickedTasks.has((t as PickerTask).id)
              return <ResultRow key={(t as PickerTask).id}
                picked={picked} onToggle={() => toggleTask((t as PickerTask).id)}
                icon={<CheckSquare className="h-3.5 w-3.5" />}
                title={(t as PickerTask).title}
                sub={(t as PickerTask).topic ?? 'Завдання'}
              />
            })
          )}
        </div>
      </div>

      <footer
        className="flex items-center gap-2.5 border-t px-5 py-3.5"
        style={{ borderColor: 'color-mix(in srgb, var(--border) 70%, transparent)' }}
      >
        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          <strong className="font-semibold" style={{ color: 'var(--foreground)' }}>{pickedCount}</strong> вибрано
        </span>
        <span className="flex-1" />
        <button
          onClick={onClose}
          className="h-[34px] rounded-lg border bg-transparent px-3.5 text-[12.5px]"
          style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
        >
          Скасувати
        </button>
        <button
          onClick={handleAdd}
          disabled={pickedCount === 0}
          className="h-[34px] rounded-lg border-0 px-4 text-[12.5px] font-semibold text-white disabled:opacity-50"
          style={{ background: 'var(--primary)' }}
        >
          Додати{pickedCount > 0 ? ` ${pickedCount}` : ''}
        </button>
      </footer>
    </div>
  )
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-md border-0 px-2.5 py-[5px] text-[12px] font-semibold"
      style={{
        background: active ? 'var(--card)' : 'transparent',
        color: active ? 'var(--foreground)' : 'var(--muted-foreground)',
      }}
    >
      {children}
    </button>
  )
}

function ResultRow({ icon, title, sub, picked, onToggle }: { icon: React.ReactNode; title: string; sub: string; picked: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center gap-3 rounded-lg border-0 px-2 py-2.5 text-left"
      style={{ background: picked ? 'color-mix(in srgb, var(--primary) 6%, transparent)' : 'transparent' }}
    >
      <span
        className="grid h-7 w-7 place-items-center rounded-md"
        style={{ background: 'var(--muted)', color: 'var(--primary)' }}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-semibold" style={{ color: 'var(--foreground)' }}>{title}</div>
        <div className="truncate text-[11.5px]" style={{ color: 'color-mix(in srgb, var(--muted-foreground) 70%, transparent)' }}>{sub}</div>
      </div>
      <span
        className="grid h-[18px] w-[18px] place-items-center rounded-[5px] border-[1.5px]"
        style={{
          background: picked ? 'var(--primary)' : 'transparent',
          borderColor: picked ? 'var(--primary)' : 'var(--border)',
          color: '#fff',
        }}
      >
        {picked && <Check className="h-3 w-3" />}
      </span>
    </button>
  )
}
