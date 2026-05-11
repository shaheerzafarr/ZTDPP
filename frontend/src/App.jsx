import { createContext, useContext, useEffect, useState } from 'react'
import Header from './components/Header'
import ImageUploader from './components/ImageUploader'
import InfoCard from './components/InfoCard'
import TrustScorePanel from './components/TrustScorePanel'
import VerdictBadge from './components/VerdictBadge'
import BreakdownSection from './components/BreakdownSection'
import SignerPage from './components/SignerPage'
import { verifyImage } from './api/api'
import {
  AlertCircle,
  Loader2,
  Lock,
  Download,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react'

export const ThemeContext = createContext(true)

const MESSAGE_BOX = {
  VERIFIED: {
    wrapper: 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:border-emerald-800/60 dark:text-emerald-300',
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 flex-shrink-0 mt-0.5" />,
  },
  UNVERIFIED: {
    wrapper: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/50 dark:border-amber-800/60 dark:text-amber-300',
    icon: <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />,
  },
  BLOCKED: {
    wrapper: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/50 dark:border-red-800/60 dark:text-red-300',
    icon: <XCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />,
  },
}

export default function App() {
  const [isDark, setIsDark] = useState(true)
  const [appMode, setAppMode] = useState('verification') // 'verification' or 'signer'
  const [phase, setPhase] = useState('upload')
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [result, setResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  function handleFileSelect(file, url) {
    setSelectedFile(file)
    setPreviewUrl(url)
    if (phase === 'error') setPhase('upload')
  }

  async function handleAnalyze() {
    if (!selectedFile) return
    setPhase('loading')
    setErrorMsg('')
    try {
      const data = await verifyImage(selectedFile)
      setResult(data)
      setPhase('results')
    } catch (err) {
      setErrorMsg(
        err.message ||
          'Cannot reach verification server. Make sure the backend is running on port 8000.',
      )
      setPhase('error')
    }
  }

  function handleReset() {
    setPhase('upload')
    setSelectedFile(null)
    setResult(null)
    setErrorMsg('')
    setPreviewUrl(null)
  }

  const isBlocked = result?.verdict === 'BLOCKED'
  const messageStyle = result ? (MESSAGE_BOX[result.verdict] ?? MESSAGE_BOX.UNVERIFIED) : null

  return (
    <ThemeContext.Provider value={isDark}>
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 transition-colors duration-300">
        <Header isDark={isDark} onToggle={() => setIsDark((d) => !d)} />

        <main className="max-w-5xl mx-auto px-4 py-8">
          
          {/* Tabs */}
          <div className="flex items-center justify-center mb-8">
            <div className="bg-slate-200/50 dark:bg-zinc-800/50 p-1 rounded-xl flex gap-1">
              <button
                onClick={() => setAppMode('verification')}
                className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  appMode === 'verification'
                    ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                Verification Engine
              </button>
              <button
                onClick={() => setAppMode('signer')}
                className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                  appMode === 'signer'
                    ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                <Lock className="w-4 h-4" />
                HSM Signer
              </button>
            </div>
          </div>

          {appMode === 'signer' && <SignerPage />}

          {/* ── UPLOAD / LOADING / ERROR ── */}
          {appMode === 'verification' && (phase === 'upload' || phase === 'loading' || phase === 'error') && (
            <div className="flex flex-col gap-5">
              {/* Compact page label */}
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100">
                  Verify Media Authenticity
                </h2>
                <p className="text-sm text-slate-500 dark:text-zinc-500 mt-0.5">
                  Upload an image to verify its cryptographic provenance and detect AI-generated content
                </p>
              </div>

              {/* Two-column layout: uploader left, info card right */}
              <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-5 md:items-stretch">

                {/* LEFT — uploader + actions */}
                <div className="flex flex-col gap-4 h-full">
                  <ImageUploader onFileSelect={handleFileSelect} />

                  {/* Error box */}
                  {phase === 'error' && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-start gap-3 dark:bg-red-950/40 dark:border-red-800/50">
                      <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-red-800 dark:text-red-300">Verification Failed</p>
                        <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{errorMsg}</p>
                      </div>
                    </div>
                  )}

                  {/* Analyze button */}
                  {selectedFile && (
                    <button
                      onClick={handleAnalyze}
                      disabled={phase === 'loading'}
                      className={`
                        w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                        font-semibold text-sm text-white transition-all shadow-lg
                        ${phase === 'loading'
                          ? 'bg-blue-500/50 cursor-not-allowed dark:bg-blue-600/40'
                          : 'bg-blue-600 hover:bg-blue-500 active:scale-[0.98] shadow-blue-500/20 dark:shadow-blue-500/10'}
                      `}
                    >
                      {phase === 'loading' ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Analyzing…
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          Analyze Image
                        </>
                      )}
                    </button>
                  )}

                  {/* Loading steps */}
                  {phase === 'loading' && (
                    <div className="flex flex-col gap-1.5">
                      <p className="text-xs text-slate-400 dark:text-zinc-500 animate-pulse text-center">
                        Verifying cryptographic signature and analyzing with AI…
                      </p>
                      <div className="flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-zinc-600">
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                          Uploading
                        </span>
                        <span className="text-slate-300 dark:text-zinc-700">→</span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '0.25s' }} />
                          Verifying signature
                        </span>
                        <span className="text-slate-300 dark:text-zinc-700">→</span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '0.5s' }} />
                          AI analysis
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* RIGHT — info card */}
                <InfoCard />
              </div>
            </div>
          )}

          {/* ── RESULTS ── */}
          {appMode === 'verification' && phase === 'results' && result && (
            <div className="flex flex-col gap-6">
              {/* Results header */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-100">Analysis Results</h2>
                  <p className="text-sm text-slate-400 dark:text-zinc-500 mt-0.5">{result.filename}</p>
                </div>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors text-sm font-medium"
                >
                  <RotateCcw className="w-4 h-4" />
                  Analyze Another
                </button>
              </div>

              {/* Two-column grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* LEFT — Image */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-md dark:shadow-none dark:ring-1 dark:ring-zinc-800 overflow-hidden">
                  <div className="relative">
                    {result.verdict === 'UNVERIFIED' && (
                      <div className="absolute top-0 left-0 right-0 z-10 bg-amber-400/90 dark:bg-amber-500/80 text-amber-900 dark:text-amber-950 text-sm font-semibold py-1.5 text-center">
                        ⚠ Authenticity Unconfirmed
                      </div>
                    )}
                    <img
                      src={previewUrl}
                      alt={result.filename}
                      className={`w-full h-72 object-cover transition-all ${isBlocked ? 'blur-lg' : ''}`}
                      style={{ pointerEvents: isBlocked ? 'none' : 'auto' }}
                    />
                    {isBlocked && (
                      <div className="absolute inset-0 bg-red-950/75 dark:bg-red-950/85 flex flex-col items-center justify-center gap-3 z-10">
                        <div className="bg-white/10 rounded-full p-4">
                          <Lock className="w-12 h-12 text-white" />
                        </div>
                        <span className="text-white font-bold text-xl drop-shadow">Content Blocked</span>
                      </div>
                    )}
                    <div className={`absolute left-3 z-20 ${result.verdict === 'UNVERIFIED' ? 'top-10' : 'top-3'}`}>
                      <VerdictBadge verdict={result.verdict} size="sm" />
                    </div>
                  </div>
                  <div className="px-5 py-4 border-t border-slate-100 dark:border-zinc-800">
                    <p className="font-medium text-slate-700 dark:text-zinc-300 truncate">{result.filename}</p>
                  </div>
                </div>

                {/* RIGHT — Trust score + message */}
                <div className="flex flex-col gap-4">
                  <TrustScorePanel trustScore={result.trust_score} verdict={result.verdict} />
                  <div className={`border rounded-xl p-4 flex items-start gap-3 ${messageStyle.wrapper}`}>
                    {messageStyle.icon}
                    <p className="text-sm leading-relaxed">{result.message}</p>
                  </div>
                </div>
              </div>

              <BreakdownSection crypto={result.crypto} ai={result.ai} verdict={result.verdict} />

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors shadow-lg shadow-blue-500/20 dark:shadow-blue-500/10 active:scale-95"
                >
                  <RotateCcw className="w-4 h-4" />
                  Analyze Another Image
                </button>
                <button
                  disabled
                  title={isBlocked ? 'Report unavailable for blocked content' : 'Coming soon'}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-zinc-600 font-semibold cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  Download Report
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </ThemeContext.Provider>
  )
}
