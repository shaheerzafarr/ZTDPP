import { useState } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp, Cpu, Lock } from 'lucide-react'

const COLORS = {
  VERIFIED: '#10b981',
  UNVERIFIED: '#f59e0b',
  BLOCKED: '#ef4444',
}

function StatusIcon({ status }) {
  if (status === 'pass') return <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
  if (status === 'warn') return <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
  return <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
}

function DetailRow({ pass, label, value }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {pass
        ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
        : <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
      <span className="text-slate-500 dark:text-zinc-500">{label}</span>
      <span className={`font-medium ${pass ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
        {value}
      </span>
    </div>
  )
}

function AiProgressBar({ probability, color }) {
  const pct = Math.round(probability * 100)
  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-slate-400 dark:text-zinc-500 mb-1.5">
        <span>{pct}% Real</span>
        <span>{100 - pct}% Synthetic</span>
      </div>
      <div
        className="h-2.5 rounded-full overflow-hidden"
        style={{ backgroundColor: 'var(--ai-bar-bg)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

export default function BreakdownSection({ crypto, ai, verdict }) {
  const [cryptoOpen, setCryptoOpen] = useState(true)
  const [aiOpen, setAiOpen] = useState(true)

  const color = COLORS[verdict] ?? '#6b7280'
  const cryptoStatus = crypto.valid ? 'pass' : 'fail'

  let aiStatus = 'pass'
  if (ai.artifacts_detected) {
    aiStatus = verdict === 'BLOCKED' ? 'fail' : 'warn'
  }

  const aiLabel =
    aiStatus === 'pass'
      ? 'No synthetic artifacts detected'
      : aiStatus === 'warn'
      ? 'Low confidence — borderline detection'
      : 'High probability of synthetic generation'

  const artifacts = ai.artifacts_detected
    ? ['Upsampling artifacts detected', 'Synthetic noise pattern', 'Edge blending anomalies']
    : []

  const cardCls = 'bg-white dark:bg-zinc-900 rounded-2xl shadow-md dark:shadow-none dark:ring-1 dark:ring-zinc-800 p-6 space-y-4 transition-colors duration-300'
  const rowCls = 'border border-slate-100 dark:border-zinc-800 rounded-xl overflow-hidden'
  const rowBtnCls = 'w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-colors'
  const expandedCls = 'px-5 pb-4 bg-slate-50 dark:bg-zinc-800/40 border-t border-slate-100 dark:border-zinc-800 pt-3 space-y-2'

  return (
    <div className={cardCls}>
      <h3 className="text-lg font-semibold text-slate-800 dark:text-zinc-200">Verification Details</h3>

      {/* Crypto row */}
      <div className={rowCls}>
        <button onClick={() => setCryptoOpen(!cryptoOpen)} className={rowBtnCls}>
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-slate-400 dark:text-zinc-600 flex-shrink-0" />
            <StatusIcon status={cryptoStatus} />
            <div className="text-left">
              <p className="font-medium text-slate-800 dark:text-zinc-200">Cryptographic Signature</p>
              <p className={`text-sm ${crypto.valid ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                {crypto.valid ? 'Valid' : 'Invalid or Missing'}
              </p>
            </div>
          </div>
          {cryptoOpen
            ? <ChevronUp className="w-4 h-4 text-slate-400 dark:text-zinc-600" />
            : <ChevronDown className="w-4 h-4 text-slate-400 dark:text-zinc-600" />}
        </button>

        {cryptoOpen && (
          <div className={expandedCls}>
            <DetailRow pass={crypto.hash_match} label="Hash Match:" value={crypto.hash_match ? 'Verified ✓' : 'Failed ✗'} />
            <DetailRow pass={crypto.sig_valid} label="Signature:" value={crypto.sig_valid ? 'Valid ✓' : 'Invalid ✗'} />
            {crypto.device_id ? (
              <div className="flex items-center gap-2 text-sm">
                <span className="w-4 flex-shrink-0" />
                <span className="text-slate-500 dark:text-zinc-500">Device ID:</span>
                <span className="font-mono text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded text-xs">
                  {crypto.device_id}
                </span>
              </div>
            ) : (
              <p className="text-sm text-slate-400 dark:text-zinc-600 italic pl-6">No EXIF metadata found</p>
            )}
          </div>
        )}
      </div>

      {/* AI row */}
      <div className={rowCls}>
        <button onClick={() => setAiOpen(!aiOpen)} className={rowBtnCls}>
          <div className="flex items-center gap-3">
            <Cpu className="w-5 h-5 text-slate-400 dark:text-zinc-600 flex-shrink-0" />
            <StatusIcon status={aiStatus} />
            <div className="text-left">
              <p className="font-medium text-slate-800 dark:text-zinc-200">AI Analysis</p>
              <p className={`text-sm ${aiStatus === 'pass' ? 'text-emerald-600 dark:text-emerald-400' : aiStatus === 'warn' ? 'text-amber-500 dark:text-amber-400' : 'text-red-500 dark:text-red-400'}`}>
                {aiLabel}
              </p>
            </div>
          </div>
          {aiOpen
            ? <ChevronUp className="w-4 h-4 text-slate-400 dark:text-zinc-600" />
            : <ChevronDown className="w-4 h-4 text-slate-400 dark:text-zinc-600" />}
        </button>

        {aiOpen && (
          <div className={`${expandedCls} space-y-0`}>
            <AiProgressBar probability={ai.probability_real} color={color} />
            {artifacts.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {artifacts.map((a) => (
                  <li key={a} className="flex items-center gap-2 text-sm text-red-500 dark:text-red-400">
                    <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    {a}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
