'use client'

import { createClient } from '@/lib/supabase/client'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useTranslations } from 'next-intl'
import { useState, useEffect } from 'react'

type ModalId = 'what' | 'support' | 'terms' | 'privacy' | null

export default function LoginPage() {
  const t = useTranslations('auth.login')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalId>(null)

  // Close on Escape
  useEffect(() => {
    if (!modal) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setModal(null) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [modal])

  async function handleGoogleLogin() {
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })

    if (error) {
      setError(t('error'))
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#F5F3EE] text-[#1A2A3A] font-sans">
      {/* Paper noise */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[1] opacity-60 mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/><feColorMatrix values='0 0 0 0 0   0 0 0 0 0   0 0 0 0 0   0 0 0 0.05 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />

      {/* Massive background word */}
      <div
        aria-hidden
        className="pointer-events-none fixed left-[-2vw] right-[-2vw] bottom-[-8vw] z-0 whitespace-nowrap select-none font-extrabold leading-[0.82] opacity-[0.07]"
        style={{
          fontSize: 'clamp(280px, 33vw, 620px)',
          letterSpacing: '-0.03em',
          color: 'transparent',
          WebkitTextStroke: '1px #0B1620',
        }}
      >
        {t('brand')}
      </div>

      {/* Page */}
      <div className="relative z-[2] flex min-h-screen flex-col px-7 sm:px-12 lg:px-16 pt-7">
        {/* Top nav */}
        <header className="flex items-center justify-between gap-8">
          <div className="inline-flex items-center gap-3 text-[17px] font-bold tracking-[-0.2px] text-[#0B1620]">
            <ContinuumMark size={32} />
            {t('brand')}
          </div>
          {/* mid links */}
          <nav className="hidden md:flex gap-7 text-[13px] text-[#6B7A88]">
            <button onClick={() => setModal('what')} className="transition-colors hover:text-[#0B1620] bg-transparent border-0 p-0 cursor-pointer font-[inherit] text-[13px]">{t('navWhat')}</button>
            <button onClick={() => setModal('support')} className="transition-colors hover:text-[#0B1620] bg-transparent border-0 p-0 cursor-pointer font-[inherit] text-[13px]">{t('navSupport')}</button>
          </nav>
          <LanguageSwitcher />
        </header>

        {/* Hero */}
        <main className="mx-auto grid w-full max-w-[1440px] flex-1 grid-cols-1 items-center gap-10 py-12 lg:grid-cols-[1.15fr_1fr] lg:gap-24 lg:py-20">
          {/* Left — story */}
          <section>
            <div className="mb-6 inline-flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[1.6px] text-[#005CAB]">
              <span className="h-px w-7 bg-[#005CAB]" />
              {t('eyebrow')}
            </div>

            <h1
              className="m-0 font-bold text-[#0B1620] text-balance"
              style={{
                fontSize: 'clamp(48px, 6.5vw, 88px)',
                lineHeight: 0.95,
                letterSpacing: '-0.04em',
              }}
            >
              {t('headlineA')}<br />
              <em
                className="not-italic"
                style={{
                  fontFamily: '"Instrument Serif", Georgia, serif',
                  fontStyle: 'italic',
                  fontWeight: 400,
                  color: '#005CAB',
                  letterSpacing: '-0.01em',
                }}
              >
                {t('headlineB')}
              </em>
            </h1>

            <div className="mt-10 grid max-w-[560px] grid-cols-1 gap-x-8 gap-y-5 border-t border-[#E2DFD6] pt-6 sm:grid-cols-2">
              {(['f1', 'f2', 'f3', 'f4'] as const).map((k, i) => (
                <div key={k}>
                  <div className="mb-1.5 flex items-center gap-2.5 text-[13px] font-bold text-[#0B1620]">
                    {/* <span
                      style={{
                        fontFamily: '"Instrument Serif", Georgia, serif',
                        fontStyle: 'italic',
                        color: '#005CAB',
                        fontSize: 18,
                        lineHeight: 1,
                      }}
                    >
                      {['i.', 'ii.', 'iii.', 'iv.'][i]}
                    </span> */}
                    {t(`${k}.title`)}
                  </div>
                  <div className="text-[12.5px] leading-[1.5] text-[#6B7A88]">
                    {t(`${k}.desc`)}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Right — login card */}
          <section className="flex justify-center">
            <div
              className="relative w-full max-w-[440px] rounded-[22px] border border-[#E2DFD6] bg-white p-9"
              style={{
                boxShadow:
                  '0 1px 0 rgba(0,0,0,0.02), 0 30px 60px -30px rgba(11,22,32,0.22)',
              }}
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[12px] font-semibold tracking-[0.6px] text-[#6B7A88]">
                  {t('kicker')}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#009E73]">
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-[#009E73]"
                    style={{ boxShadow: '0 0 0 4px rgba(0,158,115,0.12)' }}
                  />
                  {t('secure')}
                </span>
              </div>

              <h2
                className="m-0 font-bold text-[#0B1620]"
                style={{ fontSize: 30, lineHeight: 1.1, letterSpacing: '-0.025em' }}
              >
                {t('cardA')}<br />
                <em
                  className="not-italic"
                  style={{
                    fontFamily: '"Instrument Serif", Georgia, serif',
                    fontStyle: 'italic',
                    fontWeight: 400,
                    color: '#005CAB',
                  }}
                >
                  {t('cardB')}
                </em>
              </h2>
              <p className="mt-3 text-[14px] leading-[1.55] text-[#6B7A88]">
                {t('description')}
              </p>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="mt-6 inline-flex h-[52px] w-full items-center justify-center gap-3 rounded-xl border-0 font-sans text-[15px] font-semibold text-white transition-all disabled:cursor-progress disabled:opacity-70"
                style={{
                  background: '#005CAB',
                  boxShadow:
                    '0 8px 22px -10px rgba(0,92,171,0.55), inset 0 1px 0 rgba(255,255,255,0.18)',
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) e.currentTarget.style.background = '#003D72'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#005CAB'
                }}
              >
                <span className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-[7px] bg-white">
                  {isLoading ? <Spinner /> : <GoogleIcon />}
                </span>
                {isLoading ? t('loading') : t('googleButton')}
              </button>

              {error && (
                <div className="mt-3.5 rounded-[10px] border border-[#f6c8c8] bg-[#fdecec] p-3 text-[12.5px] text-[#b3261e]">
                  {error}
                </div>
              )}

              {/* <div className="mt-4 flex items-start gap-2.5 rounded-[10px] bg-[#EFEBE0] px-3.5 py-3 text-[12px] leading-[1.5] text-[#6B7A88]">
                <svg className="mt-0.5 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
                </svg>
                <span>{t('ssoHint')}</span>
              </div> */}

              <p className="mt-5 text-[11px] leading-[1.6] text-[#6B7A88]">
                {t.rich('terms', {
                  termsLink: (chunks) => (
                    <button onClick={() => setModal('terms')} className="text-[#0B1620] underline underline-offset-[3px] decoration-[#E2DFD6] hover:decoration-[#0B1620] bg-transparent border-0 p-0 cursor-pointer font-[inherit] text-[11px]">{chunks}</button>
                  ),
                  privacyLink: (chunks) => (
                    <button onClick={() => setModal('privacy')} className="text-[#0B1620] underline underline-offset-[3px] decoration-[#E2DFD6] hover:decoration-[#0B1620] bg-transparent border-0 p-0 cursor-pointer font-[inherit] text-[11px]">{chunks}</button>
                  ),
                })}
              </p>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="mt-auto flex items-center justify-between border-t border-[#E2DFD6] py-5 text-[12px] text-[#6B7A88]">
          <span className="hidden sm:inline">
            {t('brand')} &nbsp;·&nbsp; {t('tagline')}
          </span>
          <span>© {new Date().getFullYear()}</span>
        </footer>
      </div>

      {/* ── Modals ─────────────────────────────────────── */}
      {modal && (
        <InfoModal
          title={t(`${modal}Title`)}
          body={t(`${modal}Body`)}
          closeLabel={t('modalClose')}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}

/* ─────────── Info modal ─────────── */

function InfoModal({ title, body, closeLabel, onClose }: {
  title: string; body: string; closeLabel: string; onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(11,22,32,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[500px] rounded-[18px] border border-[#E2DFD6] bg-white p-8"
        style={{ boxShadow: '0 24px 60px -20px rgba(11,22,32,0.28)' }}
        onClick={e => e.stopPropagation()}
      >
        <h2
          className="m-0 mb-4 font-bold text-[#0B1620]"
          style={{ fontSize: 22, letterSpacing: '-0.02em' }}
        >
          {title}
        </h2>
        <div className="text-[13.5px] leading-[1.7] text-[#4B5A68] whitespace-pre-line max-h-[60vh] overflow-y-auto">
          {body}
        </div>
        <button
          onClick={onClose}
          className="mt-6 inline-flex h-[42px] w-full items-center justify-center rounded-xl border border-[#E2DFD6] text-[13px] font-semibold text-[#0B1620] transition-colors hover:bg-[#F5F3EE] bg-transparent cursor-pointer"
        >
          {closeLabel}
        </button>
      </div>
    </div>
  )
}

/* ─────────── Marks & icons ─────────── */

function ContinuumMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" aria-hidden="true">
      <path d="M30 11 A12 12 0 1 0 30 33" stroke="#0B1620" strokeWidth="3.2" strokeLinecap="round" fill="none" />
      <circle cx="32" cy="22" r="2.6" fill="#005CAB" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908C16.658 14.382 17.64 12.075 17.64 9.2z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
      <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  )
}

function Spinner() {
  return (
    <svg className="h-3.5 w-3.5 animate-spin text-[#005CAB]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}
