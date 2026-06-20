'use client'

/* Profile edit form – edit display name, bio and language. */

import { useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'
import { updateProfile } from '@/app/actions/profile'

interface ProfileEditFormProps {
  fullName: string | null
  bio: string | null
}

export function ProfileEditForm({ fullName, bio }: ProfileEditFormProps) {
  const t = useTranslations('profile')
  const tCommon = useTranslations('common')
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const res = await updateProfile(formData)
      if ('error' in res && res.error) {
        setError(res.error)
      } else {
        setIsEditing(false)
      }
    })
  }

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="px-4 py-2 rounded-xl text-sm font-medium border transition-colors"
        style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)', background: 'transparent' }}
      >
        {t('edit')}
      </button>
    )
  }

  return (
    <form action={handleSubmit} className="space-y-3 w-full">
      <div>
        <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted-foreground)' }}>
          {t('fullName')}
        </label>
        <input
          name="full_name"
          defaultValue={fullName ?? ''}
          className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2"
          style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
        />
      </div>
      <div>
        <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted-foreground)' }}>
          {t('bio')}
        </label>
        <textarea
          name="bio"
          rows={3}
          defaultValue={bio ?? ''}
          className="w-full rounded-xl border px-3 py-2 text-sm resize-none outline-none focus:ring-2"
          style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
        />
      </div>

      {error && <p className="text-sm" style={{ color: 'var(--destructive)' }}>{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          className="px-4 py-2 rounded-xl text-sm font-medium border"
          style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)', background: 'transparent' }}
        >
          {tCommon('cancel')}
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
        >
          {isPending ? '...' : tCommon('save')}
        </button>
      </div>
    </form>
  )
}
