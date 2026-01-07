import { useEffect, useRef, useState } from 'react'
import type { TextEdit } from '../types/pdf'

function PDFViewer({
  file,
  currentPage,
  onTextEdit,
  textEdits,
}: {
  file: File | null
  currentPage: number
  onTextEdit: (edit: TextEdit) => void
  textEdits: TextEdit[]
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const textLayerRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const pdfjsRef = useRef<any>(null)

  const baseImageDataRef = useRef<ImageData | null>(null)

  const [scale, setScale] = useState(1)
  const [fitScale, setFitScale] = useState(1)

  const [pdfDoc, setPdfDoc] = useState<any>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [localEdit, setLocalEdit] = useState<TextEdit | null>(null)

  function drawEdits() {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    const base = baseImageDataRef.current
    if (!canvas || !ctx || !base) return

    // restore base
    ctx.putImageData(base, 0, 0)

    const edits = textEdits.filter((e) => e.page === currentPage)
    edits.forEach((e) => {
      const padX = 12
      const padY = 4

      const family = e.fontFamily && e.fontFamily.trim() ? e.fontFamily : 'sans-serif'
      const weight = e.isBold ? '700' : '400'
      const style = e.isItalic ? 'italic' : 'normal'
      ctx.font = `${style} ${weight} ${Math.max(6, e.fontSize)}px ${family}`
      ctx.textBaseline = 'alphabetic'

      // ✅ largeur de masquage "champ" (agressive) : couvre ancien ET nouveau
      const oldW = Math.ceil(ctx.measureText(e.originalText || '').width)
      const newW = Math.ceil(ctx.measureText(e.newText || '').width)
      const hideW = Math.max(e.width, oldW, newW, 260) + padX * 2 // 260 = mini champ
      const hideH = Math.max(e.height, 14) + padY * 2

      const x0 = Math.max(0, Math.floor(e.x - padX))
      const y0 = Math.max(0, Math.floor(e.y - e.height - padY))

      // Formulaire = fond blanc → masque blanc
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(x0, y0, Math.min(hideW, canvas.width - x0), Math.min(hideH, canvas.height - y0))

      ctx.fillStyle = '#000000'
      ctx.fillText(e.newText, e.x, e.y)
    })
  }

  useEffect(() => {
    if (!file) return

    const loadPDF = async () => {
      try {
        const pdfjsLib: any = await import('pdfjs-dist')
        const worker: any = await import('pdfjs-dist/build/pdf.worker?url')
        pdfjsRef.current = pdfjsLib
        pdfjsLib.GlobalWorkerOptions.workerSrc = worker.default

        const arrayBuffer = await file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        setPdfDoc(pdf)
      } catch (e) {
        console.error('Erreur chargement PDF:', e)
      }
    }

    loadPDF()
  }, [file])

  useEffect(() => {
    if (!containerRef.current) return
    const obs = new ResizeObserver(() => setFitScale((v) => v))
    obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [])

  // Render page + snapshot + build text layer + redraw edits
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current || !textLayerRef.current || !containerRef.current) return

    const render = async () => {
      try {
        const pdfjsLib = pdfjsRef.current
        if (!pdfjsLib) return

        const page = await pdfDoc.getPage(currentPage)

        const baseVp = page.getViewport({ scale: 1 })
        const containerWidth = containerRef.current!.clientWidth || baseVp.width
        const nextFitScale = Math.max(0.25, (containerWidth - 16) / baseVp.width)
        setFitScale(nextFitScale)

        const effectiveScale = nextFitScale * scale
        const vp = page.getViewport({ scale: effectiveScale })

        const canvas = canvasRef.current!
        const ctx = canvas.getContext('2d')!

        canvas.width = vp.width
        canvas.height = vp.height
        canvas.style.width = `${vp.width}px`
        canvas.style.height = `${vp.height}px`

        await page.render({ canvasContext: ctx, viewport: vp }).promise

        // snapshot base
        baseImageDataRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height)

        // build clickable text layer
        const textContent = await page.getTextContent()
        const styles = textContent.styles || {}

        const layer = textLayerRef.current!
        layer.innerHTML = ''
        layer.style.width = `${vp.width}px`
        layer.style.height = `${vp.height}px`

        textContent.items.forEach((item: any, index: number) => {
          if (!item.transform) return
          if (!item.str || !item.str.trim()) return

          const t = pdfjsLib.Util.transform(vp.transform, item.transform)
          const x = t[4]
          const y = t[5]
          const h = item.height || 12
          const w = item.width || 50

          const styleObj = styles[item.fontName] || {}
          const fontFamily = styleObj.fontFamily || ''
          const isItalic =
            /Italic|Oblique/i.test(fontFamily) || /Italic|Oblique/i.test(item.fontName || '')
          const isBold = /Bold/i.test(fontFamily) || /Bold/i.test(item.fontName || '')

          const a = typeof item.transform[0] === 'number' ? item.transform[0] : 0
          const b = typeof item.transform[1] === 'number' ? item.transform[1] : 0
          const fontSizePx = Math.max(6, Math.sqrt(a * a + b * b) * vp.scale)

          const span = document.createElement('span')
          span.textContent = item.str
          span.style.position = 'absolute'
          span.style.left = `${x}px`
          span.style.top = `${y - h}px`
          span.style.width = `${w}px`
          span.style.height = `${h}px`
          span.style.color = 'transparent'
          span.style.cursor = 'pointer'
          span.style.whiteSpace = 'pre'

          span.onclick = (ev) => {
            ev.stopPropagation()

            const edit: TextEdit = {
              id: `${currentPage}-${index}`,
              page: currentPage,
              x,
              y,
              width: w,
              height: h,
              fontSize: fontSizePx,
              uiScale: vp.scale,
              fontFamily,
              isBold,
              isItalic,
              originalText: item.str,
              newText: item.str,
            }

            setEditingId(edit.id)
            setLocalEdit(edit)
            onTextEdit(edit)
          }

          layer.appendChild(span)
        })

        // ✅ redraw live juste après render
        drawEdits()
      } catch (e) {
        console.error('Erreur rendu page:', e)
      }
    }

    render()
  }, [pdfDoc, currentPage, scale]) // volontaire : drawEdits gère textEdits

  // redraw live à chaque modif
  useEffect(() => {
    drawEdits()
  }, [textEdits, currentPage])

  const currentEdit =
    localEdit && localEdit.id === editingId
      ? localEdit
      : textEdits.find((e) => e.id === editingId) || null

  const inputStyle = (() => {
    if (!currentEdit) return null
    return {
      position: 'absolute' as const,
      left: `${currentEdit.x}px`,
      top: `${currentEdit.y - currentEdit.height}px`,
      width: `${Math.max(currentEdit.width, 120)}px`,
      height: `${currentEdit.height + 6}px`,
      fontSize: `${Math.max(10, currentEdit.fontSize)}px`,
      fontFamily: currentEdit.fontFamily && currentEdit.fontFamily.trim() ? currentEdit.fontFamily : 'sans-serif',
      zIndex: 50,
    }
  })()

  return (
    <div ref={containerRef} className="relative w-full bg-black overflow-auto">
      <div className="relative w-full">
        <canvas ref={canvasRef} />

        <div
          ref={textLayerRef}
          className={`absolute inset-0 ${editingId ? 'pointer-events-none' : 'pointer-events-auto'}`}
        />

        {currentEdit && inputStyle && (
          <input
            value={currentEdit.newText}
            autoFocus
            onMouseDown={(e) => e.stopPropagation()}
            onChange={(e) => {
              const updated = { ...currentEdit, newText: e.target.value }
              setLocalEdit(updated)
              onTextEdit(updated)
            }}
            onBlur={() => {
              setEditingId(null)
              setLocalEdit(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'Escape') {
                e.preventDefault()
                setEditingId(null)
                setLocalEdit(null)
              }
            }}
            style={inputStyle}
            className="rounded bg-white/95 text-slate-900 px-2 border-2 border-red-500 shadow-lg outline-none"
          />
        )}
      </div>

      <div className="absolute top-2 right-2 flex gap-2 z-10">
        <button
          type="button"
          onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
          className="px-2 py-1 bg-slate-800 text-xs rounded border border-slate-700 text-white"
        >
          −
        </button>
        <span className="px-2 py-1 text-xs text-slate-300">{Math.round(fitScale * scale * 100)}%</span>
        <button
          type="button"
          onClick={() => setScale((s) => Math.min(3, s + 0.1))}
          className="px-2 py-1 bg-slate-800 text-xs rounded border border-slate-700 text-white"
        >
          +
        </button>
      </div>
    </div>
  )
}

export default PDFViewer
