import { ShieldCheck, Info, X, Sun, Moon } from 'lucide-react'
import { useState } from 'react'

export default function Header({ isDark, onToggle }) {
  const [open, setOpen] = useState(false)

  return (
    <header className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 shadow-sm dark:shadow-none sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Logo + Name */}
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 dark:bg-blue-500 p-2 rounded-xl shadow-md shadow-blue-500/20">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-100 leading-none tracking-tight">
              ZTDPP
            </h1>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5 tracking-wide">
              Zero Trust Digital Provenance Platform
            </p>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            <Info className="w-4 h-4" />
            How it works
          </button>

          {/* Theme toggle — icon + pill */}
          <div className="flex items-center gap-2">
            <Sun className={`w-4 h-4 transition-colors duration-300 ${isDark ? 'text-zinc-600' : 'text-amber-400'}`} />
            <button
              onClick={onToggle}
              aria-label="Toggle theme"
              className={`
                relative w-12 h-6 rounded-full transition-colors duration-300
                focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
                focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900
                ${isDark ? 'bg-zinc-600' : 'bg-slate-300'}
              `}
            >
              {/* Thumb — w-5(20px) inside w-12(48px), left-0.5(2px) anchor */}
              {/* light: translate-x-0 → occupies 2–22px */}
              {/* dark:  translate-x-6(24px) → occupies 26–46px  ≤ 48px ✓ */}
              <span
                className={`
                  absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md
                  transition-transform duration-300
                  ${isDark ? 'translate-x-6' : 'translate-x-0'}
                `}
              />
            </button>
            <Moon className={`w-4 h-4 transition-colors duration-300 ${isDark ? 'text-blue-400' : 'text-slate-400'}`} />
          </div>
        </div>
      </div>

      {/* How it works panel */}
      {open && (
        <div className="border-t border-blue-100 dark:border-zinc-800 bg-blue-50 dark:bg-zinc-800/60 transition-colors">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                How ZTDPP Verifies Your Media
              </p>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800 dark:text-zinc-300">
                <li>Upload a JPEG or PNG image (max 10 MB)</li>
                <li>Cryptographic signature is extracted &amp; validated from EXIF metadata</li>
                <li>AI analysis scans for synthetic artifacts and manipulation patterns</li>
                <li>
                  Trust score computed:{' '}
                  <span className="font-mono text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-zinc-700 px-1.5 py-0.5 rounded text-xs">
                    score = 0.6×crypto + 0.4×ai
                  </span>
                </li>
                <li>
                  Verdict:{' '}
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">VERIFIED</span> (&gt;0.8) ·{' '}
                  <span className="font-semibold text-amber-600 dark:text-amber-400">UNVERIFIED</span> (0.4–0.8) ·{' '}
                  <span className="font-semibold text-red-600 dark:text-red-400">BLOCKED</span> (&lt;0.4)
                </li>
              </ol>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-blue-300 dark:text-zinc-500 hover:text-blue-500 dark:hover:text-zinc-300 flex-shrink-0 mt-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
