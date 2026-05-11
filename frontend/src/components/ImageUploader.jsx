import { useRef, useState } from 'react'
import { Upload, X, ImageIcon, AlertCircle } from 'lucide-react'

export default function ImageUploader({ onFileSelect }) {
  const [dragging, setDragging] = useState(false)
  const [preview, setPreview] = useState(null)
  const [fileInfo, setFileInfo] = useState(null)
  const [validationError, setValidationError] = useState('')
  const inputRef = useRef()

  function processFile(file) {
    setValidationError('')
    if (!file) return
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setValidationError('Unsupported format. Please upload a JPEG or PNG file.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setValidationError('File exceeds the 10 MB limit.')
      return
    }
    const url = URL.createObjectURL(file)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(url)
    setFileInfo({
      name: file.name,
      size:
        file.size < 1024 * 1024
          ? `${(file.size / 1024).toFixed(1)} KB`
          : `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
    })
    onFileSelect(file, url)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    processFile(e.dataTransfer.files[0])
  }

  function handleChange(e) {
    processFile(e.target.files[0])
  }

  function handleClear() {
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setFileInfo(null)
    setValidationError('')
    if (inputRef.current) inputRef.current.value = ''
    onFileSelect(null, null)
  }

  return (
    <div className="w-full h-full flex flex-col gap-3">
      {!preview ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3
            cursor-pointer select-none transition-all duration-200 flex-1 px-6
            ${dragging
              ? 'border-blue-500 bg-blue-500/5 dark:bg-blue-500/10 scale-[1.01]'
              : 'border-slate-200 dark:border-zinc-700 hover:border-blue-400 dark:hover:border-blue-500 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800/50'}
          `}
        >
          <div className={`p-3 rounded-xl transition-colors duration-200 ${dragging ? 'bg-blue-500/10 dark:bg-blue-500/20' : 'bg-slate-100 dark:bg-zinc-800'}`}>
            <Upload className={`w-6 h-6 transition-colors duration-200 ${dragging ? 'text-blue-500' : 'text-slate-400 dark:text-zinc-500'}`} />
          </div>

          <div className="text-center">
            <p className="font-semibold text-slate-700 dark:text-zinc-300 text-sm">
              {dragging ? 'Drop to upload' : 'Drag & drop files here'}
            </p>
            <p className="text-xs text-slate-400 dark:text-zinc-600 mt-1">
              JPEG, PNG &bull; Max 10 MB
            </p>
          </div>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
            className="mt-1 px-5 py-2 rounded-lg border border-slate-300 dark:border-zinc-600 text-sm font-medium text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors"
          >
            Select File
          </button>

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={handleChange}
          />
        </div>
      ) : (
        <div className="border border-slate-200 dark:border-zinc-700 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 dark:ring-1 dark:ring-zinc-800">
          <div className="relative">
            <img
              src={preview}
              alt="Selected"
              className="w-full h-44 object-cover"
            />
            <button
              onClick={handleClear}
              className="absolute top-2 right-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur rounded-full p-1.5 shadow-md hover:bg-red-50 dark:hover:bg-red-950/60 transition-colors"
              title="Remove"
            >
              <X className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
            </button>
          </div>
          <div className="px-4 py-2.5 flex items-center gap-2 border-t border-slate-100 dark:border-zinc-800">
            <ImageIcon className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-600 flex-shrink-0" />
            <span className="text-xs font-medium text-slate-700 dark:text-zinc-300 truncate">{fileInfo.name}</span>
            <span className="text-xs text-slate-400 dark:text-zinc-600 flex-shrink-0">&bull; {fileInfo.size}</span>
          </div>
        </div>
      )}

      {validationError && (
        <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 rounded-xl px-3 py-2.5">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {validationError}
        </div>
      )}
    </div>
  )
}
