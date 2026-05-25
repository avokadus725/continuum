'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useRef, useState } from 'react'
import { Search, X } from 'lucide-react'

interface LiveSearchProps {
  /** Current value from URL (server-rendered) */
  q: string
  /** Extra params to preserve (e.g. topic, difficulty) */
  extraParams?: Record<string, string | undefined>
  placeholder: string
  /** Debounce ms — default 300 */
  debounce?: number
}

export function LiveSearch({ q, extraParams = {}, placeholder, debounce = 300 }: LiveSearchProps) {
  const router   = useRouter()
  const pathname = usePathname()
  const timer    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [value, setValue] = useState(q)

  function buildHref(newQ: string) {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries(extraParams)) {
      if (v) params.set(k, v)
    }
    if (newQ) params.set('q', newQ)
    const qs = params.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setValue(val)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      router.replace(buildHref(val.trim()))
    }, debounce)
  }

  function handleClear() {
    setValue('')
    if (timer.current) clearTimeout(timer.current)
    router.replace(buildHref(''))
  }

  return (
    <div className="relative flex items-center">
      <Search
        size={14}
        className="absolute left-3 pointer-events-none"
        style={{ color: 'var(--muted-foreground)' }}
      />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full rounded-xl border py-2 pl-8 pr-8 text-sm outline-none"
        style={{
          background:  'var(--card)',
          borderColor: 'var(--border)',
          color:       'var(--foreground)',
        }}
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 p-0.5 rounded transition-colors hover:bg-black/10 dark:hover:bg-white/10"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <X size={13} />
        </button>
      )}
    </div>
  )
}
