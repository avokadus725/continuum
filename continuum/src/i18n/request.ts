import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'

const supportedLocales = ['uk', 'en'] as const
export type Locale = (typeof supportedLocales)[number]
export const defaultLocale: Locale = 'uk'

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value
  const locale: Locale = (supportedLocales as readonly string[]).includes(cookieLocale ?? '')
    ? (cookieLocale as Locale)
    : defaultLocale

  return {
    locale,
    messages: (await import(`../../public/locales/${locale}/${locale}.json`)).default,
  }
})
