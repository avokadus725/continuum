/* Hashtag utilities – normalise user input, build slugs. */

const NON_TAG_CHAR = /[^\p{L}\p{N}-]+/gu

/** Convert a free-form string into a tag slug.
 *  "Deep Work"  → "deep-work"
 *  "#help me!"  → "help-me"
 *  Unicode letters are preserved, so Cyrillic input is supported. */
export function slugifyTag(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/^#/, '')
    .replace(/\s+/g, '-')
    .replace(NON_TAG_CHAR, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
}

/** Extract #hashtags from free-form text.
 *  Returns slugs (lowercased, kebab-cased). */
export function extractHashtags(text: string): string[] {
  const tags = new Set<string>()
  const re = /#([\p{L}\p{N}-]+)/gu
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    const slug = slugifyTag(m[1])
    if (slug) tags.add(slug)
  }
  return [...tags]
}

/** Suggested tags by post kind – shown above the composer footer. */
export const SUGGESTED_TAGS: Record<'discussion' | 'question' | 'share', string[]> = {
  question:   ['допомога', 'питання'],
  share:      ['ресурси', 'корисне'],
  discussion: ['обговорення', 'думки'],
}
