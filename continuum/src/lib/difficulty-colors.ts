/**
 * Difficulty colour scale — light → medium → deep blue-purple.
 * Intentionally avoids green (reserved for "Done / success" states)
 * and red (reserved for errors / destructive actions).
 */
export const DIFF_COLOR = {
  beginner:     '#7DD3FC',  // sky-300   — light, approachable
  intermediate: '#818CF8',  // indigo-400 — stepping up
  advanced:     '#7C3AED',  // violet-600 — deep, most challenging
} as const satisfies Record<string, string>

export type Difficulty = keyof typeof DIFF_COLOR
