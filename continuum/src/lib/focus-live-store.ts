/* Focus live-session store backed by localStorage.
   Lets the floating timer on other pages read the active session state,
   and lets the focus room restore a minimized session on re-mount. */

export const FOCUS_LIVE_KEY = 'cl_focus_live'

export interface FocusLive {
  phase: 'work' | 'break'
  secondsLeft: number
  /** Date.now() at the time of last write — used to interpolate elapsed time. */
  updatedAt: number
  isRunning: boolean
  /** true = user deliberately minimized (browsed away); session should be restorable. */
  isMinimized: boolean
  pomodorosCompleted: number
  targetSessions: number
  workMin: number
  breakMin: number
  intention: string
  focusSeconds: number
  breakSeconds: number
  sessionStartMs: number
}

export function writeFocusLive(d: FocusLive): void {
  try { localStorage.setItem(FOCUS_LIVE_KEY, JSON.stringify(d)) } catch {}
}

export function clearFocusLive(): void {
  try { localStorage.removeItem(FOCUS_LIVE_KEY) } catch {}
}

export function readFocusLive(): FocusLive | null {
  try {
    const raw = localStorage.getItem(FOCUS_LIVE_KEY)
    return raw ? (JSON.parse(raw) as FocusLive) : null
  } catch { return null }
}

/** Returns secondsLeft adjusted for real elapsed time since the last write.
 *  Only meaningful for running sessions; paused sessions use stored value. */
export function computeSecondsLeft(live: FocusLive): number {
  if (!live.isRunning) return live.secondsLeft
  const elapsed = Math.floor((Date.now() - live.updatedAt) / 1000)
  return Math.max(0, live.secondsLeft - elapsed)
}
