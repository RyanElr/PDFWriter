import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFileStore } from '../store/fileStore'
import type { TextEdit } from '../types/pdf'
import PDFViewer from '../components/PDFViewer'

function EditPage() {
  const navigate = useNavigate()
  const { file, setFile } = useFileStore()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [pageCount, setPageCount] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [textEdits, setTextEdits] = useState<TextEdit[]>([])

  useEffect(() => {
    if (!file) navigate('/')
  }, [file, navigate])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  useEffect(() => {
    if (!file) return
    const loadMeta = async () => {
      try {
        const pdfjsLib: any = await import('pdfjs-dist')
        const worker: any = await import('pdfjs-dist/build/pdf.worker?url')
        pdfjsLib.GlobalWorkerOptions.workerSrc = worker.default
        const arrayBuffer = await file.arrayBuffer()
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
        const pdf = await loadingTask.promise
        setPageCount(pdf.numPages)
      } catch (e) {
        console.error('Erreur chargement meta PDF:', e)
      }
    }
    loadMeta()
  }, [file])

  const handleTextEdit = (edit: TextEdit) => {
    setTextEdits((prev) => {
      const existing = prev.find((e) => e.id === edit.id)
      if (existing) return prev.map((e) => (e.id === edit.id ? edit : e))
      return [...prev, edit]
    })
  }

  const handleProcess = async () => {
    if (!file) {
      setError('Ajoute d’abord un PDF.')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const formData = new FormData()
      formData.append('file', file)

      // ✅ IMPORTANT: on envoie yTop (comme affiché à l'écran)
      const instructions = textEdits.map((edit) => {
        const s = typeof edit.uiScale === 'number' && edit.uiScale > 0 ? edit.uiScale : 1

        return {
          type: 'text' as const,
          page: edit.page,
          x: edit.x / s,
          y: (edit.y - edit.height) / s, // ✅ yTop
          text: edit.newText,
          fontSize: edit.fontSize / s,
          color: { r: 0, g: 0, b: 0 },
          hideOriginal: true,
          originalWidth: edit.width / s,
          originalHeight: edit.height / s,
        }
      })

      formData.append('instructions', JSON.stringify(instructions))

      const res = await fetch('http://localhost:4000/api/pdf/annotate', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Erreur serveur.')
      }

      const blob = await res.blob()
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      const url = URL.createObjectURL(blob)
      setPreviewUrl(url)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erreur inconnue pendant le traitement.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    if (!previewUrl) return
    const link = document.createElement('a')
    link.href = previewUrl
    link.download = 'modified.pdf'
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  if (!file) return null

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:px-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Modifier ton PDF</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Clique sur le texte, modifie, et tu vois le rendu direct. Ensuite tu génères le PDF final.
          </p>
          <p className="mt-2 text-xs text-slate-300">
            Fichier sélectionné: <span className="font-medium text-red-300">{file.name}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setFile(null)
            navigate('/')
          }}
          className="self-start rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800/60"
        >
          Changer de fichier
        </button>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,2.3fr)]">
        <div className="space-y-4">
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3">
            <p className="text-sm font-medium">Navigation</p>
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="rounded-full border border-slate-700 px-3 py-1 hover:bg-slate-800/70"
                disabled={currentPage <= 1}
              >
                ◀
              </button>
              <span>
                Page <span className="font-semibold">{currentPage}</span>
                {pageCount ? (
                  <>
                    {' '}
                    / <span>{pageCount}</span>
                  </>
                ) : null}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => (pageCount ? Math.min(pageCount, p + 1) : p + 1))}
                className="rounded-full border border-slate-700 px-3 py-1 hover:bg-slate-800/70"
                disabled={pageCount !== null && currentPage >= pageCount}
              >
                ▶
              </button>
            </div>

            <button
              type="button"
              onClick={handleProcess}
              disabled={isLoading || textEdits.length === 0}
              className="mt-4 w-full inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-xs sm:text-sm font-medium text-white shadow-lg shadow-red-600/30 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-500 transition-colors"
            >
              {isLoading ? 'Traitement en cours…' : 'Générer le PDF final'}
            </button>
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-950/50 border border-red-900 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <div className="rounded-xl bg-black border border-white/10 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 text-[11px] text-slate-300 bg-gradient-to-r from-slate-900 to-slate-950">
            <span>Éditeur PDF — rendu live</span>
            {previewUrl && (
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-1 rounded-full border border-slate-700 px-3 py-1 hover:bg-slate-800"
              >
                <span className="text-xs">⬇</span>
                <span>Télécharger</span>
              </button>
            )}
          </div>

          <div className="flex-1 bg-slate-950/80 p-2 overflow-auto">
            <PDFViewer file={file} currentPage={currentPage} onTextEdit={handleTextEdit} textEdits={textEdits} />
          </div>
        </div>
      </section>
    </div>
  )
}

export default EditPage
