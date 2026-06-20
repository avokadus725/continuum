/**
 * Recommendation scoring utilities.
 * Pure functions – no Supabase imports, works in any server component.
 */

export type ProgressRow = {
  task_id: string
  is_correct: boolean
  completed_at: string
  tasks: { topic_id: string | null } | null
}

export type TopicStat = {
  wrongCount: number
  totalCount: number
  /** ISO timestamp of the most recent wrong attempt */
  lastWrongAt: string | null
}

/** Aggregate per-topic stats from raw progress rows. */
export function buildTopicStats(rows: ProgressRow[]): Map<string, TopicStat> {
  const map = new Map<string, TopicStat>()
  for (const r of rows) {
    const topicId = r.tasks?.topic_id
    if (!topicId) continue
    const s = map.get(topicId) ?? { wrongCount: 0, totalCount: 0, lastWrongAt: null }
    s.totalCount++
    if (!r.is_correct) {
      s.wrongCount++
      if (!s.lastWrongAt || r.completed_at > s.lastWrongAt) {
        s.lastWrongAt = r.completed_at
      }
    }
    map.set(topicId, s)
  }
  return map
}

/** IDs of tasks the user answered correctly at least once. */
export function buildCompletedSet(rows: Pick<ProgressRow, 'task_id' | 'is_correct'>[]): Set<string> {
  return new Set(rows.filter(r => r.is_correct).map(r => r.task_id))
}

/**
 * Topic urgency score [0–80].
 *
 * - Wrong ratio: up to 60 pts
 * - Recency decay: up to 20 pts (half-life ≈ 10 days)
 */
export function topicUrgency(stat: TopicStat | undefined): number {
  if (!stat || stat.totalCount === 0) return 0
  const wrongRatio = stat.wrongCount / stat.totalCount
  let s = wrongRatio * 60
  if (stat.lastWrongAt) {
    const days = (Date.now() - new Date(stat.lastWrongAt).getTime()) / 86_400_000
    s += Math.exp(-days / 14) * 20
  }
  return s
}

/**
 * Difficulty match score [0/10/25].
 *
 * Tiers: level 1–2 → beginner, 3–6 → intermediate, 7+ → advanced.
 * Exact match = 25, adjacent = 10, two steps away = 0.
 */
export function difficultyMatch(difficulty: string, userLevel: number): number {
  const tier = userLevel <= 2 ? 'beginner' : userLevel <= 6 ? 'intermediate' : 'advanced'
  const order = ['beginner', 'intermediate', 'advanced']
  const dist = Math.abs(order.indexOf(difficulty) - order.indexOf(tier))
  return dist === 0 ? 25 : dist === 1 ? 10 : 0
}

/**
 * Score a task for recommendation [0–115].
 *
 * topic urgency [0–80] + difficulty match [0–25] + novelty bonus [0–10]
 */
export function scoreTask(
  task: { topic_id: string | null; difficulty: string },
  topicStats: Map<string, TopicStat>,
  userLevel: number,
): number {
  const stat = task.topic_id ? topicStats.get(task.topic_id) : undefined
  return (
    topicUrgency(stat) +
    difficultyMatch(task.difficulty, userLevel) +
    (stat === undefined ? 10 : 0) // novelty: topic never attempted
  )
}

/**
 * Score a material for recommendation [0–50].
 *
 * Proportional to wrong ratio of its topic.
 */
export function scoreMaterial(
  material: { topic_id: string | null },
  topicStats: Map<string, TopicStat>,
): number {
  const stat = material.topic_id ? topicStats.get(material.topic_id) : undefined
  if (!stat || stat.totalCount === 0) return 0
  return (stat.wrongCount / stat.totalCount) * 50
}
