/* Unit tests for the recommendation scoring algorithm (src/lib/recommendations.ts).
   Covers the pure functions described in thesis Section 5.2:
   topic urgency, difficulty match, task/material scoring and the aggregation helpers. */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  buildTopicStats,
  buildCompletedSet,
  topicUrgency,
  difficultyMatch,
  scoreTask,
  scoreMaterial,
  type ProgressRow,
  type TopicStat,
} from './recommendations'

// Helper: build a progress row quickly.
const row = (
  task_id: string,
  topic_id: string | null,
  is_correct: boolean,
  completed_at = '2026-01-01T00:00:00.000Z',
): ProgressRow => ({
  task_id,
  is_correct,
  completed_at,
  tasks: topic_id ? { topic_id } : null,
})

describe('buildTopicStats', () => {
  it('returns an empty map for no rows', () => {
    expect(buildTopicStats([]).size).toBe(0)
  })

  it('aggregates total and wrong counts per topic', () => {
    const stats = buildTopicStats([
      row('t1', 'algo', true),
      row('t2', 'algo', false),
      row('t3', 'algo', false),
      row('t4', 'db', true),
    ])
    expect(stats.get('algo')).toMatchObject({ totalCount: 3, wrongCount: 2 })
    expect(stats.get('db')).toMatchObject({ totalCount: 1, wrongCount: 0 })
  })

  it('ignores rows whose task has no topic', () => {
    const stats = buildTopicStats([row('t1', null, false)])
    expect(stats.size).toBe(0)
  })

  it('tracks the most recent wrong attempt timestamp', () => {
    const stats = buildTopicStats([
      row('t1', 'algo', false, '2026-01-01T00:00:00.000Z'),
      row('t2', 'algo', false, '2026-03-10T00:00:00.000Z'),
      row('t3', 'algo', false, '2026-02-01T00:00:00.000Z'),
    ])
    expect(stats.get('algo')?.lastWrongAt).toBe('2026-03-10T00:00:00.000Z')
  })

  it('leaves lastWrongAt null when every attempt is correct', () => {
    const stats = buildTopicStats([row('t1', 'algo', true), row('t2', 'algo', true)])
    expect(stats.get('algo')?.lastWrongAt).toBeNull()
  })
})

describe('buildCompletedSet', () => {
  it('contains only task ids answered correctly', () => {
    const set = buildCompletedSet([
      { task_id: 't1', is_correct: true },
      { task_id: 't2', is_correct: false },
      { task_id: 't3', is_correct: true },
    ])
    expect(set.has('t1')).toBe(true)
    expect(set.has('t2')).toBe(false)
    expect(set.has('t3')).toBe(true)
    expect(set.size).toBe(2)
  })

  it('de-duplicates repeated correct answers', () => {
    const set = buildCompletedSet([
      { task_id: 't1', is_correct: true },
      { task_id: 't1', is_correct: true },
    ])
    expect(set.size).toBe(1)
  })
})

describe('topicUrgency', () => {
  // Fix "now" so the recency-decay term is deterministic.
  const NOW = new Date('2026-06-01T00:00:00.000Z')
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  const daysAgo = (n: number) =>
    new Date(NOW.getTime() - n * 86_400_000).toISOString()

  it('returns 0 for an undefined stat', () => {
    expect(topicUrgency(undefined)).toBe(0)
  })

  it('returns 0 when there are no attempts', () => {
    const stat: TopicStat = { wrongCount: 0, totalCount: 0, lastWrongAt: null }
    expect(topicUrgency(stat)).toBe(0)
  })

  it('returns 0 when no answers were wrong', () => {
    const stat: TopicStat = { wrongCount: 0, totalCount: 10, lastWrongAt: null }
    expect(topicUrgency(stat)).toBe(0)
  })

  it('returns ~80 when all answers are wrong and the error is today', () => {
    // wrongRatio 1.0 → 60 pts; decay factor e^0 = 1 → +20 pts; total 80.
    const stat: TopicStat = { wrongCount: 10, totalCount: 10, lastWrongAt: daysAgo(0) }
    expect(topicUrgency(stat)).toBeCloseTo(80, 5)
  })

  it('approaches the wrong-ratio component (~60) when the error is long past', () => {
    // 140 days → e^(-10) ≈ 0, so only the 60-pt ratio component remains.
    const stat: TopicStat = { wrongCount: 10, totalCount: 10, lastWrongAt: daysAgo(140) }
    expect(topicUrgency(stat)).toBeCloseTo(60, 1)
  })

  it('scales with the wrong ratio', () => {
    // 5/10 wrong → 30 pts ratio; error today → +20 pts; total 50.
    const stat: TopicStat = { wrongCount: 5, totalCount: 10, lastWrongAt: daysAgo(0) }
    expect(topicUrgency(stat)).toBeCloseTo(50, 5)
  })

  it('decays the recency bonus monotonically over time', () => {
    const mk = (d: number): TopicStat => ({ wrongCount: 10, totalCount: 10, lastWrongAt: daysAgo(d) })
    const fresh = topicUrgency(mk(0))
    const week = topicUrgency(mk(7))
    const month = topicUrgency(mk(30))
    expect(fresh).toBeGreaterThan(week)
    expect(week).toBeGreaterThan(month)
  })
})

describe('difficultyMatch', () => {
  it('rewards an exact tier match with 25 points', () => {
    expect(difficultyMatch('beginner', 1)).toBe(25)     // level 1–2 → beginner
    expect(difficultyMatch('intermediate', 4)).toBe(25) // level 3–6 → intermediate
    expect(difficultyMatch('advanced', 8)).toBe(25)     // level 7+  → advanced
  })

  it('rewards an adjacent tier with 10 points', () => {
    expect(difficultyMatch('intermediate', 1)).toBe(10) // beginner tier, one step up
    expect(difficultyMatch('beginner', 4)).toBe(10)     // intermediate tier, one step down
    expect(difficultyMatch('advanced', 4)).toBe(10)     // intermediate tier, one step up
  })

  it('gives 0 points when two tiers apart', () => {
    expect(difficultyMatch('advanced', 1)).toBe(0)      // beginner tier vs advanced
    expect(difficultyMatch('beginner', 8)).toBe(0)      // advanced tier vs beginner
  })
})

describe('scoreTask', () => {
  it('adds a +10 novelty bonus for a topic never attempted', () => {
    const stats = new Map<string, TopicStat>() // no stats at all
    // beginner task, level 1 → difficultyMatch 25; urgency 0; novelty +10 → 35
    const score = scoreTask({ topic_id: 'new', difficulty: 'beginner' }, stats, 1)
    expect(score).toBe(35)
  })

  it('omits the novelty bonus once the topic has stats', () => {
    const stats = new Map<string, TopicStat>([
      ['algo', { wrongCount: 0, totalCount: 5, lastWrongAt: null }],
    ])
    // urgency 0 (no wrong) + difficulty 25 + novelty 0 → 25
    const score = scoreTask({ topic_id: 'algo', difficulty: 'beginner' }, stats, 1)
    expect(score).toBe(25)
  })

  it('treats a task with no topic as novel (bonus applied)', () => {
    const score = scoreTask({ topic_id: null, difficulty: 'beginner' }, new Map(), 1)
    expect(score).toBe(35) // 25 difficulty + 10 novelty
  })

  it('sums urgency, difficulty and novelty', () => {
    const stats = new Map<string, TopicStat>([
      ['algo', { wrongCount: 10, totalCount: 10, lastWrongAt: null }],
    ])
    // urgency: ratio 1.0 → 60 (no lastWrongAt, no recency term); difficulty 25; novelty 0
    const score = scoreTask({ topic_id: 'algo', difficulty: 'beginner' }, stats, 1)
    expect(score).toBe(85)
  })
})

describe('scoreMaterial', () => {
  it('returns 0 for a topic with no stats', () => {
    expect(scoreMaterial({ topic_id: 'unknown' }, new Map())).toBe(0)
  })

  it('returns 0 for a material with no topic', () => {
    expect(scoreMaterial({ topic_id: null }, new Map())).toBe(0)
  })

  it('is proportional to the wrong ratio (max 50)', () => {
    const stats = new Map<string, TopicStat>([
      ['algo', { wrongCount: 10, totalCount: 10, lastWrongAt: null }], // ratio 1.0
      ['db', { wrongCount: 3, totalCount: 6, lastWrongAt: null }],     // ratio 0.5
    ])
    expect(scoreMaterial({ topic_id: 'algo' }, stats)).toBe(50)
    expect(scoreMaterial({ topic_id: 'db' }, stats)).toBe(25)
  })
})
