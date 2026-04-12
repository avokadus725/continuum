'use client'

import { useRef, useState, useTransition } from 'react'
import { Camera } from 'lucide-react'
import { uploadAvatar } from '@/app/actions/profile'

interface AvatarUploadProps {
  currentUrl: string | null
  displayName: string | null
}

export function AvatarUpload({ currentUrl, displayName }: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Show preview immediately
    const url = URL.createObjectURL(file)
    setPreview(url)
    setError(null)

    const fd = new FormData()
    fd.set('avatar', file)
    startTransition(async () => {
      const res = await uploadAvatar(fd)
      if ('error' in res && res.error) {
        setError(res.error)
        setPreview(currentUrl)
      }
    })
  }

  const initials = (displayName?.[0] ?? '?').toUpperCase()

  return (
    <div className="relative shrink-0">
      {/* Avatar */}
      <div className="w-20 h-20 rounded-full overflow-hidden relative"
        style={{ background: 'var(--primary)' }}>
        {preview ? (
          <img src={preview} alt={displayName ?? ''} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl font-bold"
            style={{ color: 'var(--primary-foreground)' }}>
            {initials}
          </div>
        )}
        {isPending && (
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.4)' }}>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Camera button overlay */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isPending}
        className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors hover:scale-110"
        style={{
          background: 'var(--primary)',
          borderColor: 'var(--card)',
          color: 'var(--primary-foreground)',
        }}
        title="Змінити аватарку"
      >
        <Camera className="w-3.5 h-3.5" />
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {error && (
        <p className="absolute top-full mt-1 left-0 text-xs whitespace-nowrap"
          style={{ color: 'var(--destructive)' }}>
          {error}
        </p>
      )}
    </div>
  )
}
