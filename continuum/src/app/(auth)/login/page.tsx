'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

export default function LoginPage() {
  const t = useTranslations('auth.login')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGoogleLogin() {
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(t('error'))
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">

      {/* Language switcher — top right */}
      <div className="flex justify-end mb-6">
        <LanguageSwitcher />
      </div>

      {/* Brand */}
      <div className="text-center mb-10">
        <div
          className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4"
          style={{ background: 'var(--primary)' }}
        >
          <span
            className="font-bold text-xl"
            style={{ color: 'var(--primary-foreground)' }}
          >
            C
          </span>
        </div>
        <h1
          className="text-4xl font-bold tracking-tight"
          style={{ color: 'var(--primary)' }}
        >
          {t('brand')}
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {t('tagline')}
        </p>
      </div>

      {/* Card */}
      <div
        className="rounded-2xl p-8 shadow-xl border"
        style={{
          background: 'var(--card)',
          borderColor: 'var(--border)',
        }}
      >
        <h2
          className="text-xl font-semibold mb-1"
          style={{ color: 'var(--foreground)' }}
        >
          {t('heading')}
        </h2>
        <p className="text-sm mb-8" style={{ color: 'var(--muted-foreground)' }}>
          {t('description')}
        </p>

        {/* Error */}
        {error && (
          <div
            className="mb-6 p-3 rounded-lg text-sm border"
            style={{
              background: 'color-mix(in srgb, var(--destructive) 10%, transparent)',
              borderColor: 'color-mix(in srgb, var(--destructive) 30%, transparent)',
              color: 'var(--destructive)',
            }}
          >
            {error}
          </div>
        )}

        {/* Google OAuth Button */}
        <Button
          variant="outline"
          className="w-full h-11 gap-3 text-sm font-medium"
          onClick={handleGoogleLogin}
          disabled={isLoading}
        >
          {isLoading ? <Spinner /> : <GoogleIcon />}
          {isLoading ? t('loading') : t('googleButton')}
        </Button>

        <p
          className="text-xs text-center mt-6 leading-relaxed"
          style={{ color: 'var(--muted-foreground)' }}
        >
          {t('terms')}
        </p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908C16.658 14.382 17.64 12.075 17.64 9.2z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
      <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 12 0 12 4.418 4 4.418 4 12h4z" />
    </svg>
  )
}
