import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const t = await getTranslations('admin')

  const [usersRes, tasksRes, materialsRes, progressRes] = await Promise.all([
    supabase.from('profiles').select('id, full_name, role, xp, level, created_at').order('created_at', { ascending: false }),
    supabase.from('tasks').select('id, title, difficulty, is_published, xp_reward').order('created_at', { ascending: false }),
    supabase.from('materials').select('id, title, type, is_published').order('created_at', { ascending: false }),
    supabase.from('student_progress').select('id', { count: 'exact', head: true }),
  ])

  const users = usersRes.data ?? []
  const tasks = tasksRes.data ?? []
  const materials = materialsRes.data ?? []
  const totalAttempts = progressRes.count ?? 0

  const stats = [
    { label: t('users'),     value: users.length },
    { label: t('materials'), value: materials.length },
    { label: t('tasks'),     value: tasks.length },
    { label: t('attempts'),  value: totalAttempts },
  ]

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
        {t('title')}
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map(({ label, value }) => (
          <div
            key={label}
            className="rounded-2xl border p-4 text-center"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <p className="text-3xl font-bold" style={{ color: 'var(--primary)' }}>{value}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Users table */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted-foreground)' }}>
          {t('users')}
        </h2>
        <div
          className="rounded-2xl border overflow-x-auto"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--muted)' }}>
                {[t('name'), t('role'), t('level'), t('xp'), t('date')].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-2 text-xs font-semibold"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-4 py-2.5" style={{ color: 'var(--foreground)' }}>
                    {u.full_name ?? <span style={{ color: 'var(--muted-foreground)' }}>—</span>}
                    {u.id === user.id && (
                      <span className="ml-2 text-xs" style={{ color: 'var(--primary)' }}>{t('you')}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: u.role === 'admin' ? 'var(--primary)' : 'var(--muted)',
                        color: u.role === 'admin' ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                      }}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-2.5" style={{ color: 'var(--foreground)' }}>{u.level}</td>
                  <td className="px-4 py-2.5 font-semibold" style={{ color: 'var(--primary)' }}>{u.xp}</td>
                  <td className="px-4 py-2.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {new Date(u.created_at).toLocaleDateString('uk-UA')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Tasks table */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted-foreground)' }}>
          {t('tasks')}
        </h2>
        <div
          className="rounded-2xl border overflow-x-auto"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <table className="w-full text-sm min-w-[400px]">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--muted)' }}>
                {[t('name'), t('difficulty'), t('xp'), t('status')].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-2 text-xs font-semibold"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/tasks/${task.id}`}
                      className="hover:underline"
                      style={{ color: 'var(--foreground)' }}
                    >
                      {task.title}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {task.difficulty}
                  </td>
                  <td className="px-4 py-2.5 text-xs font-semibold" style={{ color: 'var(--primary)' }}>
                    +{task.xp_reward}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: task.is_published ? 'color-mix(in srgb, var(--success) 20%, transparent)' : 'var(--muted)',
                        color: task.is_published ? 'var(--success)' : 'var(--muted-foreground)',
                      }}
                    >
                      {task.is_published ? '✓' : '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  )
}
