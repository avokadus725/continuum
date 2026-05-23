/* Personalized recommendations — small list of suggested next things. */

import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export interface RecItem {
  id: string
  tag: string
  title: string
  meta: string         // e.g. "read" / "watch"
  href: string
}

interface Props {
  items: RecItem[]
}

export async function RecommendationsCard({ items }: Props) {
  const t = await getTranslations('dashboard')
  if (items.length === 0) return null

  return (
    <section
      className="rounded-xl border p-4"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      <header className="flex items-center justify-between">
        <h3 className="m-0 text-[13px] font-semibold tracking-[-0.1px]" style={{ color: 'var(--foreground)' }}>
          {t('recsTitle')}
        </h3>
        <Link href="/recommendations" className="text-[11.5px] no-underline" style={{ color: 'var(--primary)' }}>
          {t('recsMore')}
        </Link>
      </header>
      <ul className="mt-2.5">
        {items.map((r, i) => (
          <li
            key={r.id}
            style={{
              borderTop: i ? '1px solid color-mix(in srgb, var(--border) 70%, transparent)' : 'none',
            }}
          >
            <Link href={r.href} className="block py-2.5 no-underline">
              <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'color-mix(in srgb, var(--muted-foreground) 70%, transparent)' }}>
                <span
                  className="text-[13px]"
                  style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: 'italic', color: 'var(--primary)' }}
                >
                  {r.tag}
                </span>
                <span>·</span>
                <span>{r.meta}</span>
              </div>
              <div
                className="mt-0.5 text-[13px] font-semibold tracking-[-0.1px]"
                style={{ color: 'var(--foreground)' }}
              >
                {r.title}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
