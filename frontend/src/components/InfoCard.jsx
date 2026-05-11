import { useEffect, useState } from 'react'
import { ShieldCheck, Cpu, Activity } from 'lucide-react'
import { checkHealth } from '../api/api'

export default function InfoCard() {
  const [status, setStatus] = useState({ online: null, latency: '—' })

  useEffect(() => {
    async function ping() {
      const t0 = performance.now()
      try {
        await checkHealth()
        const ms = (performance.now() - t0).toFixed(0)
        setStatus({ online: true, latency: `${ms}ms` })
      } catch {
        setStatus({ online: false, latency: '—' })
      }
    }
    ping()
  }, [])

  return (
    <div className="
      bg-white dark:bg-zinc-900
      border border-slate-200 dark:border-zinc-700/50
      rounded-2xl shadow-sm dark:shadow-none dark:ring-1 dark:ring-zinc-800
      flex flex-col gap-0 overflow-hidden h-fit
    ">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex items-center gap-2.5">
        <div className="bg-emerald-500/10 dark:bg-emerald-500/15 p-1.5 rounded-lg flex-shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
        </div>
        <h3 className="font-semibold text-slate-900 dark:text-zinc-100 text-sm">About ZTDPP</h3>
      </div>

      {/* Description */}
      <div className="px-5 pb-5 border-b border-slate-100 dark:border-zinc-800">
        <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
          The Zero Trust Digital Provenance Platform (ZTDPP) is an AI-powered forensic media
          verification engine. It uses cryptographic hashing and multi-modal neural networks to
          detect synthetic manipulation, deepfakes, and metadata inconsistencies with high accuracy.
        </p>
      </div>

      {/* Status rows */}
      <div className="divide-y divide-slate-100 dark:divide-zinc-800">
        {/* Engine Status */}
        <div className="px-5 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-600 flex-shrink-0" />
            <span className="text-xs font-semibold tracking-widest uppercase text-slate-400 dark:text-zinc-500">
              Engine Status
            </span>
          </div>
          <span className={`
            inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0
            ${status.online === null
              ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500'
              : status.online
              ? 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
              : 'bg-red-500/10 dark:bg-red-500/15 text-red-600 dark:text-red-400'}
          `}>
            <span className={`
              w-1.5 h-1.5 rounded-full flex-shrink-0
              ${status.online === null
                ? 'bg-zinc-400 dark:bg-zinc-600'
                : status.online
                ? 'bg-emerald-500 animate-pulse'
                : 'bg-red-500'}
            `} />
            {status.online === null ? 'Checking…' : status.online ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* Analysis Queue */}
        <div className="px-5 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-600 flex-shrink-0" />
            <span className="text-xs font-semibold tracking-widest uppercase text-slate-400 dark:text-zinc-500">
              Analysis Queue
            </span>
          </div>
          <span className="text-xs font-mono font-medium text-slate-600 dark:text-zinc-300 flex-shrink-0">
            {status.online && status.latency !== '—' ? `${status.latency} Latency` : '—'}
          </span>
        </div>
      </div>

      {/* Trust model footnote */}
      <div className="px-5 py-3.5 bg-slate-50 dark:bg-zinc-800/40 border-t border-slate-100 dark:border-zinc-800">
        <p className="text-xs text-slate-400 dark:text-zinc-600 leading-relaxed">
          Trust score = <span className="font-mono text-blue-500 dark:text-blue-400">0.6 × crypto</span>
          {' '}+{' '}
          <span className="font-mono text-blue-500 dark:text-blue-400">0.4 × ai</span>
        </p>
      </div>
    </div>
  )
}
