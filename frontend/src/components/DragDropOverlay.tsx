import { useState } from 'react'

function DragDropOverlay({
  isOpen,
  onClose,
  onDropFile,
}: {
  isOpen: boolean
  onClose: () => void
  onDropFile: (file: File) => void
}) {
  const [isDragOverOverlay, setIsDragOverOverlay] = useState(false)

  if (!isOpen) return null

  return (
    <div
      className={[
        'fixed inset-0 z-[9999] flex items-center justify-center',
        'bg-black/70 backdrop-blur-md',
        'transition-all duration-300',
        isDragOverOverlay ? 'bg-black/60' : 'bg-black/70',
      ].join(' ')}
      onDragEnter={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragOverOverlay(true)
      }}
      onDragOver={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragOverOverlay(true)
      }}
      onDragLeave={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragOverOverlay(false)
      }}
      onDrop={(e) => {
        e.preventDefault()
        e.stopPropagation()

        setIsDragOverOverlay(false)

        const f = e.dataTransfer.files?.[0]
        if (f) onDropFile(f)
        onClose()
      }}
      onClick={() => {
        setIsDragOverOverlay(false)
        onClose()
      }}
    >
      <div
        className={[
          'absolute inset-0 pointer-events-none',
          'opacity-70',
          isDragOverOverlay ? 'scale-105 opacity-90' : 'scale-100 opacity-70',
          'transition-all duration-300',
        ].join(' ')}
      >
        <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-red-500/25 to-purple-500/25 blur-3xl animate-pulse-slow" />
        <div className="absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-red-500/20 to-purple-500/20 blur-2xl animate-pulse-slow-delayed" />
      </div>

      <div
        className={[
          'relative w-[min(560px,92vw)] rounded-3xl border border-white/10 bg-white/5 shadow-2xl',
          'px-8 py-10 text-center transition-all duration-300 animate-overlay-in',
          isDragOverOverlay ? 'scale-[1.03] border-white/20 bg-white/10' : 'scale-100',
        ].join(' ')}
      >
        <div
          className={[
            'absolute inset-3 rounded-2xl border-2 border-dashed transition-colors duration-300',
            isDragOverOverlay ? 'border-red-400/70' : 'border-white/15',
          ].join(' ')}
        />

        <div className="relative mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-red-500 to-purple-500 shadow-xl">
          <div className={['text-5xl', isDragOverOverlay ? 'animate-bounce-once' : 'animate-float'].join(' ')}>
            📄
          </div>
          <span className="absolute -inset-2 rounded-[28px] bg-gradient-to-br from-red-500/25 to-purple-500/25 blur-md animate-ping-soft" />
        </div>

        <h3 className="text-2xl font-black tracking-tight text-white">Dépose ton PDF</h3>
        <p className="mt-2 text-sm text-slate-200/80">Relâche pour importer et ouvrir l’éditeur</p>

        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs text-slate-100/90">
          <span className="inline-block h-2 w-2 rounded-full bg-red-400 animate-pulse" />
          Drag & drop partout sur l’écran
        </div>
      </div>

      <style>{`
        @keyframes overlayIn {
          0% { opacity: 0; transform: translateY(10px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-overlay-in { animation: overlayIn 220ms ease-out both; }

        @keyframes float {
          0% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
          100% { transform: translateY(0); }
        }
        .animate-float { animation: float 1.6s ease-in-out infinite; }

        @keyframes bounceOnce {
          0% { transform: translateY(0) scale(1); }
          30% { transform: translateY(-10px) scale(1.03); }
          60% { transform: translateY(0) scale(1); }
          100% { transform: translateY(0) scale(1); }
        }
        .animate-bounce-once { animation: bounceOnce 420ms ease-out both; }

        @keyframes pingSoft {
          0% { opacity: 0.35; transform: scale(0.92); }
          70% { opacity: 0.08; transform: scale(1.18); }
          100% { opacity: 0; transform: scale(1.22); }
        }
        .animate-ping-soft { animation: pingSoft 1.25s ease-out infinite; }

        @keyframes pulseSlow {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: .75; }
          50% { transform: translate(-50%, -50%) scale(1.06); opacity: 1; }
        }
        .animate-pulse-slow { animation: pulseSlow 1.6s ease-in-out infinite; }

        @keyframes pulseSlowDelayed {
          0%, 100% { transform: translate(-50%, -50%) scale(1.02); opacity: .65; }
          50% { transform: translate(-50%, -50%) scale(1.10); opacity: .95; }
        }
        .animate-pulse-slow-delayed { animation: pulseSlowDelayed 1.9s ease-in-out infinite; }
      `}</style>
    </div>
  )
}

export default DragDropOverlay
