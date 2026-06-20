'use client'

/* Big timer ring + thin number + optional subtitle. */

interface Props {
  /** "MM:SS" pre-formatted */
  time: string
  /** 0..1 */
  progress: number
  phase: 'work' | 'break' | 'idle'
  subtitle?: string
}

const RADIUS = 175
const C = 2 * Math.PI * RADIUS

export function TimerArc({ time, progress, phase, subtitle }: Props) {
  const color = phase === 'break' ? '#5BD4A4' : '#7AB6EE'
  const running = phase !== 'idle'
  return (
    <div className="relative" style={{ width: 380, height: 380 }}>
      {/* breathing pulse – slow, only when active */}
      <div
        className="absolute rounded-full border"
        style={{
          inset: -16,
          borderColor: color,
          opacity: running ? 0.18 : 0,
          animation: running ? 'cont-breath 5s ease-in-out infinite' : 'none',
        }}
        aria-hidden
      />

      <svg width="380" height="380" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="190" cy="190" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
        <circle
          cx="190" cy="190" r={RADIUS} fill="none"
          stroke={color} strokeWidth="2" strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - progress)}
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
        <div
          className="tabular-nums leading-none"
          style={{
            fontSize: 104, fontWeight: 200, letterSpacing: -3.5,
            color: '#FFFFFF', fontFeatureSettings: '"tnum"',
          }}
        >
          {time}
        </div>
        {subtitle && (
          <div
            className="uppercase"
            style={{ fontSize: 12, letterSpacing: 1.6, color: 'rgba(255,255,255,0.48)' }}
          >
            {subtitle}
          </div>
        )}
      </div>

      <style>{`
        @keyframes cont-breath {
          0%, 100% { transform: scale(1);    opacity: 0.18; }
          50%      { transform: scale(1.05); opacity: 0.06; }
        }
      `}</style>
    </div>
  )
}
