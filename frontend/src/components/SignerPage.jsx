import { useState } from 'react'
import ImageUploader from './ImageUploader'
import { signImage } from '../api/api'
import { KeyRound, Download, Loader2, AlertCircle, ShieldCheck } from 'lucide-react'

export default function SignerPage() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [deviceId, setDeviceId] = useState('CAM-001')
  const [isSigning, setIsSigning] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [success, setSuccess] = useState(false)

  function handleFileSelect(file) {
    setSelectedFile(file)
    setErrorMsg('')
    setSuccess(false)
  }

  async function handleSign() {
    if (!selectedFile) return
    setIsSigning(true)
    setErrorMsg('')
    setSuccess(false)

    try {
      const blob = await signImage(selectedFile, deviceId)
      
      // Create a download link and trigger it
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      // Add _signed to original filename
      const nameParts = selectedFile.name.split('.')
      const ext = nameParts.pop()
      a.download = `${nameParts.join('.')}_signed.${ext}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      setSuccess(true)
    } catch (err) {
      setErrorMsg(err.message || 'Failed to sign image')
    } finally {
      setIsSigning(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-blue-500" />
          Hardware Security Module Simulator
        </h2>
        <p className="text-sm text-slate-500 dark:text-zinc-500 mt-1">
          This tool simulates the cryptographic signing process that happens directly on a trusted camera sensor before the image is transferred.
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col gap-6">
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
              Select Image to Sign
            </label>
            <div className="h-48">
              <ImageUploader onFileSelect={handleFileSelect} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
              Camera Device ID
            </label>
            <input
              type="text"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="e.g. CAM-001"
            />
            <p className="text-xs text-slate-500 dark:text-zinc-500">
              The device ID must be registered in the ZTDPP backend to pass verification later.
            </p>
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-start gap-3 dark:bg-red-950/40 dark:border-red-800/50">
              <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800 dark:text-red-300">Signing Failed</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-3 dark:bg-emerald-950/40 dark:border-emerald-800/50">
              <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Image Signed Successfully</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">The C2PA-aligned cryptographic manifest has been injected into the image EXIF metadata. Check your downloads folder.</p>
              </div>
            </div>
          )}

          <button
            onClick={handleSign}
            disabled={!selectedFile || isSigning || !deviceId}
            className={`
              w-full flex items-center justify-center gap-2 py-3 rounded-xl
              font-semibold text-sm text-white transition-all shadow-lg mt-2
              ${!selectedFile || isSigning || !deviceId
                ? 'bg-blue-500/50 cursor-not-allowed dark:bg-blue-600/40'
                : 'bg-blue-600 hover:bg-blue-500 active:scale-[0.98] shadow-blue-500/20 dark:shadow-blue-500/10'}
            `}
          >
            {isSigning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing & Downloading…
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Sign & Download Image
              </>
            )}
          </button>
          
        </div>
      </div>
    </div>
  )
}
