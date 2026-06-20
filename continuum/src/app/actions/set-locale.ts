'use server'

/* Locale Server Action – persist the UI language choice in a cookie. */

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

const supportedLocales = ['uk', 'en'] as const

export async function setLocale(locale: string) {
  if (!(supportedLocales as readonly string[]).includes(locale)) return

  const cookieStore = await cookies()
  cookieStore.set('NEXT_LOCALE', locale, {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: '/',
    sameSite: 'lax',
  })

  revalidatePath('/', 'layout')
}
