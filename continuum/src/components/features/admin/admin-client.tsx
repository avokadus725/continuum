'use client'

import { useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'
import { toggleUserStatus, deleteTask, deleteMaterial } from '@/app/actions/admin'
import { TaskFormModal } from './task-form-modal'
import { MaterialFormModal } from './material-form-modal'

interface Topic { id: string; title: string; icon: string | null }

interface User {
  id: string; full_name: string | null; role: string
  xp: number; level: number; created_at: string; is_active: boolean
}

interface Task {
  id: string; title: string; difficulty: string; type: string
  xp_reward: number; is_published: boolean; topic_id: string | null
  description: string
  options: { text: string; is_correct: boolean }[]
}

interface Material {
  id: string; title: string; type: string; is_published: boolean
  topic_id: string | null; content: string | null; url: string | null
}

interface AdminClientProps {
  currentUserId: string
  users: User[]
  tasks: Task[]
  materials: Material[]
  topics: Topic[]
  totalAttempts: number
}

type Tab = 'users' | 'tasks' | 'materials'

export function AdminClient({ currentUserId, users, tasks, materials, topics, totalAttempts }: AdminClientProps) {
  const t = useTranslations('admin')
  const tCommon = useTranslations('common')
  const [tab, setTab] = useState<Tab>('users')
  const [isPending, startTransition] = useTransition()
  const [pendingId, setPendingId] = useState<string | null>(null)

  // Modals
  const [taskModal, setTaskModal] = useState<{ open: boolean; task?: Task }>({ open: false })
  const [matModal, setMatModal] = useState<{ open: boolean; material?: Material }>({ open: false })

  function handleToggleUser(userId: string, isActive: boolean) {
    setPendingId(userId)
    startTransition(async () => {
      const fd = new FormData()
      fd.set('user_id', userId)
      fd.set('is_active', String(isActive))
      await toggleUserStatus(fd)
      setPendingId(null)
    })
  }

  function handleDeleteTask(id: string) {
    if (!confirm(t('deleteConfirm'))) return
    setPendingId(id)
    startTransition(async () => {
      const fd = new FormData()
      fd.set('id', id)
      await deleteTask(fd)
      setPendingId(null)
    })
  }

  function handleDeleteMaterial(id: string) {
    if (!confirm(t('deleteConfirm'))) return
    setPendingId(id)
    startTransition(async () => {
      const fd = new FormData()
      fd.set('id', id)
      await deleteMaterial(fd)
      setPendingId(null)
    })
  }

  const stats = [
    { label: t('users'),    value: users.length },
    { label: t('materials'), value: materials.length },
    { label: t('tasks'),    value: tasks.length },
    { label: t('attempts'), value: totalAttempts },
  ]

  const tabs: { key: Tab; label: string }[] = [
    { key: 'users',     label: t('users') },
    { key: 'tasks',     label: t('tasks') },
    { key: 'materials', label: t('materials') },
  ]

  return (
    <>
      <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{t('title')}</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map(({ label, value }) => (
          <div key={label} className="rounded-2xl border p-4 text-center"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <p className="text-3xl font-bold" style={{ color: 'var(--primary)' }}>{value}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b" style={{ borderColor: 'var(--border)' }}>
        {tabs.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className="px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px"
            style={{
              borderColor: tab === key ? 'var(--primary)' : 'transparent',
              color: tab === key ? 'var(--primary)' : 'var(--muted-foreground)',
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── USERS ── */}
      {tab === 'users' && (
        <div className="rounded-2xl border overflow-x-auto" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--muted)' }}>
                {[t('name'), t('role'), t('level'), t('xp'), t('status'), ''].map(h => (
                  <th key={h} className="text-left px-4 py-2 text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-4 py-2.5" style={{ color: 'var(--foreground)' }}>
                    {u.full_name ?? <span style={{ color: 'var(--muted-foreground)' }}>—</span>}
                    {u.id === currentUserId && <span className="ml-1 text-xs" style={{ color: 'var(--primary)' }}>{t('you')}</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: u.role === 'admin' ? 'var(--primary)' : 'var(--muted)',
                        color: u.role === 'admin' ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                      }}>{u.role}</span>
                  </td>
                  <td className="px-4 py-2.5" style={{ color: 'var(--foreground)' }}>{u.level}</td>
                  <td className="px-4 py-2.5 font-semibold" style={{ color: 'var(--primary)' }}>{u.xp}</td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: u.is_active ? 'color-mix(in srgb, var(--success) 20%, transparent)' : 'var(--muted)',
                        color: u.is_active ? 'var(--success)' : 'var(--muted-foreground)',
                      }}>
                      {u.is_active ? t('active') : t('inactive')}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    {u.id !== currentUserId && (
                      <button
                        onClick={() => handleToggleUser(u.id, u.is_active)}
                        disabled={pendingId === u.id || isPending}
                        className="text-xs px-2 py-1 rounded-lg border transition-colors disabled:opacity-40"
                        style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
                        {u.is_active ? t('deactivate') : t('activate')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── TASKS ── */}
      {tab === 'tasks' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={() => setTaskModal({ open: true })}
              className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
              + {t('createTask')}
            </button>
          </div>
          <div className="rounded-2xl border overflow-x-auto" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--muted)' }}>
                  {[t('name'), t('difficulty'), t('taskType'), 'XP', t('status'), ''].map(h => (
                    <th key={h} className="text-left px-4 py-2 text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => (
                  <tr key={task.id} className="border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
                    <td className="px-4 py-2.5 font-medium" style={{ color: 'var(--foreground)' }}>{task.title}</td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>{task.difficulty}</td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>{task.type}</td>
                    <td className="px-4 py-2.5 text-xs font-semibold" style={{ color: 'var(--primary)' }}>+{task.xp_reward}</td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: task.is_published ? 'color-mix(in srgb, var(--success) 20%, transparent)' : 'var(--muted)',
                          color: task.is_published ? 'var(--success)' : 'var(--muted-foreground)',
                        }}>
                        {task.is_published ? '✓' : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-2">
                        <button onClick={() => setTaskModal({ open: true, task })}
                          className="text-xs px-2 py-1 rounded-lg border"
                          style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
                          {tCommon('edit')}
                        </button>
                        <button onClick={() => handleDeleteTask(task.id)}
                          disabled={pendingId === task.id || isPending}
                          className="text-xs px-2 py-1 rounded-lg border disabled:opacity-40"
                          style={{ borderColor: 'var(--destructive)', color: 'var(--destructive)' }}>
                          {tCommon('delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MATERIALS ── */}
      {tab === 'materials' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={() => setMatModal({ open: true })}
              className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
              + {t('createMaterial')}
            </button>
          </div>
          <div className="rounded-2xl border overflow-x-auto" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <table className="w-full text-sm min-w-[460px]">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--muted)' }}>
                  {[t('name'), t('materialType'), t('status'), ''].map(h => (
                    <th key={h} className="text-left px-4 py-2 text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {materials.map(mat => (
                  <tr key={mat.id} className="border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
                    <td className="px-4 py-2.5 font-medium" style={{ color: 'var(--foreground)' }}>{mat.title}</td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>{mat.type}</td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: mat.is_published ? 'color-mix(in srgb, var(--success) 20%, transparent)' : 'var(--muted)',
                          color: mat.is_published ? 'var(--success)' : 'var(--muted-foreground)',
                        }}>
                        {mat.is_published ? '✓' : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-2">
                        <button onClick={() => setMatModal({ open: true, material: mat })}
                          className="text-xs px-2 py-1 rounded-lg border"
                          style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
                          {tCommon('edit')}
                        </button>
                        <button onClick={() => handleDeleteMaterial(mat.id)}
                          disabled={pendingId === mat.id || isPending}
                          className="text-xs px-2 py-1 rounded-lg border disabled:opacity-40"
                          style={{ borderColor: 'var(--destructive)', color: 'var(--destructive)' }}>
                          {tCommon('delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {taskModal.open && (
        <TaskFormModal topics={topics} task={taskModal.task} onClose={() => setTaskModal({ open: false })} />
      )}
      {matModal.open && (
        <MaterialFormModal topics={topics} material={matModal.material} onClose={() => setMatModal({ open: false })} />
      )}
    </>
  )
}
