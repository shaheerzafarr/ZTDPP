import { useContext } from 'react'
import { ThemeContext } from '../App'
import VerdictBadge from './VerdictBadge'

const COLORS = {
  VERIFIED: '#10b981',
  UNVERIFIED: '#f59e0b',
  BLOCKED: '#ef4444',
}

export default function TrustScorePanel({ trustScore, verdict }) {
  const isDark = useContext(ThemeContext)
  const pct = Math.round(trustScore * 100)
  const color = COLORS[verdict] ?? '#6b7280'

  const SIZE = 160
  const STROKE = 14
  const r = (SIZE - STROKE) / 2
  const circumference = 2 * Math.PI * r
  const dashOffset = circumference - (pct / 100) * circumference

  // Glow effect color for dark mode
  const glowStyle = isDark
    ? { filter: `drop-shadow(0 0 8px ${color}55)` }
    : {}

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-md dark:shadow-none dark:ring-1 dark:ring-zinc-800 p-6 flex flex-col items-center gap-5 transition-colors duration-300">
      {/* Circular ring */}
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          style={{ transform: 'rotate(-90deg)', ...glowStyle }}
        >
          {/* Track */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={r}
            fill="none"
            stroke="var(--ring-track)"
            strokeWidth={STROKE}
          />
          {/* Progress arc */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(.4,0,.2,1)' }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-extrabold leading-none" style={{ color }}>
            {pct}
          </span>
          <span className="text-xs text-slate-400 dark:text-zinc-500 mt-1 font-medium tracking-widest uppercase">
            Trust Score
          </span>
        </div>
      </div>

      <VerdictBadge verdict={verdict} size="lg" />
    </div>
  )
}
