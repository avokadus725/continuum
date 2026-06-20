// fix_topics.mjs – merges duplicate topics, then we update translations
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const env = Object.fromEntries(
  readFileSync(join(__dirname, '../.env.local'), 'utf8')
    .split('\n').filter(l => l.includes('='))
    .map(l => [l.split('=')[0].trim(), l.slice(l.indexOf('=') + 1).trim()])
)
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

// 1. Show all topics
const { data: topics } = await sb.from('topics').select('id, slug, title').order('slug')
console.log('\n── All topics ──────────────────────────')
topics.forEach(t => console.log(`  ${t.slug.padEnd(25)} ${t.title}`))

// 2. Merge pairs: (keep_slug, remove_slug)
// Old slugs: algorithms, web, math   (have existing tasks from before seed)
// New slugs: algorithms-ds, web-development, mathematics (created by seed, have new tasks)
// We keep NEW English slugs (they match seeds tasks), reassign old topics' tasks to them, delete old.

const MERGES = [
  // [keep_slug, discard_slug]  – tasks from discard → keep
  ['algorithms-ds',    'algorithms'],
  ['web-development',  'web'],
  ['mathematics',      'math'],
]

for (const [keepSlug, discardSlug] of MERGES) {
  const keep    = topics.find(t => t.slug === keepSlug)
  const discard = topics.find(t => t.slug === discardSlug)

  if (!keep)    { console.log(`\n⚠ keep topic "${keepSlug}" not found, skipping`);    continue }
  if (!discard) { console.log(`\n⚠ discard topic "${discardSlug}" not found, skipping`); continue }

  console.log(`\n── Merging "${discardSlug}" → "${keepSlug}" ──`)

  // Reassign tasks
  const { data: moved, error: te } = await sb.from('tasks')
    .update({ topic_id: keep.id })
    .eq('topic_id', discard.id)
    .select('id')
  if (te) console.error('  tasks error:', te.message)
  else    console.log(`  moved ${moved?.length ?? 0} tasks`)

  // Reassign materials
  const { data: movedM, error: me } = await sb.from('materials')
    .update({ topic_id: keep.id })
    .eq('topic_id', discard.id)
    .select('id')
  if (me) console.error('  materials error:', me.message)
  else    console.log(`  moved ${movedM?.length ?? 0} materials`)

  // Delete discard topic
  const { error: de } = await sb.from('topics').delete().eq('id', discard.id)
  if (de) console.error('  delete error:', de.message)
  else    console.log(`  deleted topic "${discardSlug}"`)
}

// 3. Final state
const { data: final } = await sb.from('topics').select('id, slug, title').order('slug')
console.log('\n── Topics after merge ──────────────────')
final.forEach(t => console.log(`  ${t.slug.padEnd(25)} ${t.title}`))
console.log('\n✓ Done. Now update translation files.')
