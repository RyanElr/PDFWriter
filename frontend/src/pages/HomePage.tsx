import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFileStore } from '../store/fileStore'
import DragDropOverlay from '../components/DragDropOverlay'
import DropzoneCard from '../components/DropzoneCard'

function HomePage() {
  const navigate = useNavigate()
  const { file, setFile } = useFileStore()

  const [isDragging, setIsDragging] = useState(false)
  const [isDraggingOverlay, setIsDraggingOverlay] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = useCallback(
    (f: File | null) => {
      if (!f) return
      if (f.type !== 'application/pdf') {
        setError('Merci de déposer uniquement un fichier PDF.')
        setFile(null)
        return
      }
      setError(null)
      setFile(f)
      navigate('/edit')
    },
    [setFile, navigate],
  )

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      setIsDraggingOverlay(false)

      if (!e.dataTransfer.files?.length) return
      handleFile(e.dataTransfer.files[0])
    },
    [handleFile],
  )

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    handleFile(f)
  }

  useEffect(() => {
    const onDragEnter = (e: DragEvent) => {
      if (!e.dataTransfer) return
      if (Array.from(e.dataTransfer.types).includes('Files')) {
        setIsDraggingOverlay(true)
      }
    }

    const onDragOver = (e: DragEvent) => {
      if (!e.dataTransfer) return
      if (Array.from(e.dataTransfer.types).includes('Files')) {
        e.preventDefault()
        setIsDraggingOverlay(true)
      }
    }

    const onDragLeave = (e: DragEvent) => {
      if ((e as any).relatedTarget === null) {
        setIsDraggingOverlay(false)
      }
    }

    const onDropWindow = () => {
      setIsDraggingOverlay(false)
    }

    window.addEventListener('dragenter', onDragEnter)
    window.addEventListener('dragover', onDragOver)
    window.addEventListener('dragleave', onDragLeave)
    window.addEventListener('drop', onDropWindow)

    return () => {
      window.removeEventListener('dragenter', onDragEnter)
      window.removeEventListener('dragover', onDragOver)
      window.removeEventListener('dragleave', onDragLeave)
      window.removeEventListener('drop', onDropWindow)
    }
  }, [])

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 sm:px-8">
      <DragDropOverlay
        isOpen={isDraggingOverlay}
        onClose={() => setIsDraggingOverlay(false)}
        onDropFile={(f) => handleFile(f)}
      />

      <section className="grid gap-10 pt-6 sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] sm:items-center">
        <div className="space-y-5">
          <p className="inline-flex items-center gap-2 rounded-full bg-red-600/10 px-3 py-1 text-xs font-medium text-red-300 ring-1 ring-inset ring-red-500/40">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
            Studio de retouche PDF
          </p>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Modifie tes PDF
            <br />
            avec une interface digne d'un film.
          </h1>

          <p className="max-w-xl text-sm sm:text-base text-slate-300">
            Glisse ton document, ajoute des modifications, télécharge la version parfaite
            pour ton client, ton école ou ton business.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                const input = document.getElementById('home-file-input')
                if (input instanceof HTMLInputElement) input.click()
              }}
              className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-red-600/40 hover:bg-red-500 transition-colors"
            >
              Commencer maintenant
              <span className="text-lg">▶</span>
            </button>

            <p className="text-xs text-slate-400">Aucun compte nécessaire.</p>
          </div>
        </div>

        <div className="relative">
          <input
            id="home-file-input"
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={onInputChange}
          />

          <DropzoneCard
            isDragging={isDragging}
            fileName={file?.name}
            onDrop={onDrop}
            onPick={() => {
              const input = document.getElementById('home-file-input')
              if (input instanceof HTMLInputElement) input.click()
            }}
            onDragOver={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setIsDragging(true)
            }}
            onDragLeave={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setIsDragging(false)
            }}
          />
        </div>
      </section>

      {error && (
        <p className="text-xs text-red-400 bg-red-950/50 border border-red-900 rounded-lg px-3 py-2 max-w-md">
          {error}
        </p>
      )}
    </div>
  )
}

export default HomePage
