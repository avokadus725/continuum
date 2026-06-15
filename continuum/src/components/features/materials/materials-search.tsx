'use client'

/* Materials search — client search / filter controls for the materials list. */

import { useRouter, usePathname } from 'next/navigation'
import { useRef } from 'react'
import { Search, X } from 'lucide-react'

interface MaterialsSearchProps {
  q: string
  topicSlug?: string
  placeholder: string
}

export function MaterialsSearch({ q, topicSlug, placeholder }: MaterialsSearchProps) {
  const router = useRouter()
  const pathname = usePathname()
  const inputRef = useRef<HTMLInputElement>(null)

  function buildHref(newQ: string) {
    const params = new URLSearchParams()
    if (topicSlug && topicSlug !== 'all') params.set('topic', topicSlug)
    if (newQ) params.set('q', newQ)
    const qs = params.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const val = inputRef.current?.value.trim() ?? ''
    router.push(buildHref(val))
  }

  function handleClear() {
    if (inputRef.current) inputRef.current.value = ''
    router.push(buildHref(''))
  }

  return (
    <form onSubmit={handleSubmit} className="relative flex items-center">
      <Search
        size={14}
        className="absolute left-3 pointer-events-none"
        style={{ color: 'var(--muted-foreground)' }}
      />
      <input
        ref={inputRef}
        type="text"
        defaultValue={q}
        placeholder={placeholder}
        className="w-full rounded-xl border py-2 pl-8 pr-8 text-sm outline-none transition-colors focus:ring-2"
        style={{
          background: 'var(--card)',
          borderColor: 'var(--border)',
          color: 'var(--foreground)',
        }}
      />
      {q && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 p-0.5 rounded transition-colors hover:bg-black/10 dark:hover:bg-white/10"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <X size={13} />
        </button>
      )}
    </form>
  )
}
