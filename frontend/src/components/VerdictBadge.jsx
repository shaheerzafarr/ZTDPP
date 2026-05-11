import { CheckCircle2, AlertTriangle, ShieldX } from 'lucide-react'

const CONFIG = {
  VERIFIED: {
    label: 'VERIFIED',
    Icon: CheckCircle2,
    cls: 'bg-emerald-500 dark:bg-emerald-500/90 text-white shadow-emerald-500/30',
  },
  UNVERIFIED: {
    label: 'UNVERIFIED',
    Icon: AlertTriangle,
    cls: 'bg-amber-400 dark:bg-amber-500/90 text-amber-950 shadow-amber-500/30',
  },
  BLOCKED: {
    label: 'BLOCKED',
    Icon: ShieldX,
    cls: 'bg-red-500 dark:bg-red-500/90 text-white shadow-red-500/30',
  },
}

export default function VerdictBadge({ verdict, size = 'md' }) {
  const { label, Icon, cls } = CONFIG[verdict] ?? CONFIG.UNVERIFIED

  const padding =
    size === 'lg'
      ? 'px-6 py-3 text-lg gap-3'
      : size === 'sm'
      ? 'px-3 py-1.5 text-xs gap-1.5'
      : 'px-4 py-2 text-sm gap-2'

  const iconSize =
    size === 'lg' ? 'w-6 h-6' : size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'

  return (
    <span
      className={`inline-flex items-center rounded-full font-bold shadow-md ${padding} ${cls}`}
    >
      <Icon className={iconSize} />
      {label}
    </span>
  )
}
