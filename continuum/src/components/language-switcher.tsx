'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { setLocale } from '@/app/actions/set-locale'

const locales = [
  { code: 'uk', flag: '🇺🇦' },
  { code: 'en', flag: '🇬🇧' },
] as const

interface LanguageSwitcherProps {
  variant?: 'compact' | 'full'
}

export function LanguageSwitcher({ variant = 'compact' }: LanguageSwitcherProps) {
  const t = useTranslations('profile.languages')
  const currentLocale = useLocale()
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSwitch(code: string) {
    if (code === currentLocale) return
    startTransition(async () => {
      await setLocale(code)
      router.refresh()
    })
  }

  return (
    <div
      className="inline-flex items-center gap-1 rounded-xl p-1 border"
      style={{
        background: 'var(--muted)',
        borderColor: 'var(--border)',
        opacity: isPending ? 0.6 : 1,
      }}
    >
      {locales.map(({ code, flag }) => {
        const isActive = code === currentLocale
        return (
          <button
            key={code}
            onClick={() => handleSwitch(code)}
            disabled={isPending}
            title={t(code as 'uk' | 'en')}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all duration-150"
            style={{
              background: isActive ? 'var(--card)' : 'transparent',
              color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)',
              boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
              cursor: isActive ? 'default' : 'pointer',
            }}
          >
            <span>{flag}</span>
            {variant === 'full' && <span>{t(code as 'uk' | 'en')}</span>}
          </button>
        )
      })}
    </div>
  )
}
