import { CheckCircle2, Upload } from 'lucide-react'

export interface SourceUploadDropzoneProps {
  /** Called with the file's text contents after a successful read. */
  onFileLoaded: (params: { filename: string; rawText: string }) => void
  /** When true, the dropzone is in a "processed" visual state. */
  hasUpload?: boolean
  /** Optional: name of the currently loaded file, shown in the success state. */
  currentFilename?: string
}

export function SourceUploadDropzone({
  onFileLoaded,
  hasUpload,
  currentFilename,
}: SourceUploadDropzoneProps) {
  const handleFile = (file: File) => {
    const reader = new FileReader()

    reader.onload = () => {
      const rawText = typeof reader.result === 'string' ? reader.result : ''
      onFileLoaded({ filename: file.name, rawText })
    }

    reader.onerror = () => {
      // Intentionally silent for this slice.
    }

    reader.readAsText(file)
  }

  return (
    <label
      className="block cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault()
        const file = event.dataTransfer.files[0]
        if (file) {
          handleFile(file)
        }
      }}
    >
      <input
        className="sr-only"
        type="file"
        accept=".md,.markdown,text/markdown,text/plain"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) {
            handleFile(file)
          }
        }}
      />

      <div className="flex flex-col items-center justify-center text-center">
        {hasUpload ? (
          <CheckCircle2 className="h-8 w-8 text-emerald-600" aria-hidden="true" />
        ) : (
          <Upload className="h-8 w-8 text-slate-400" aria-hidden="true" />
        )}
        <p className="mt-3 text-lg font-semibold tracking-tight text-slate-900">
          {hasUpload ? `File loaded: ${currentFilename ?? 'Untitled file'}` : 'Upload a markdown file'}
        </p>
        <p className="mt-1 text-[15px] leading-[1.45] text-slate-600">
          {hasUpload
            ? 'Tap to replace with a different file.'
            : 'Or paste the source content into the textarea on the left.'}
        </p>
        <p className="mt-3 text-xs text-slate-500">Markdown (.md) only for now.</p>
      </div>
    </label>
  )
}
