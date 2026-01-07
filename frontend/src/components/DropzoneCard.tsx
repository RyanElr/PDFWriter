function DropzoneCard({
    isDragging,
    fileName,
    onDrop,
    onPick,
    onDragOver,
    onDragLeave,
  }: {
    isDragging: boolean
    fileName?: string
    onDrop: (e: React.DragEvent<HTMLDivElement>) => void
    onPick: () => void
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => void
    onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void
  }) {
    return (
      <div
        className={[
          'relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/60 shadow-2xl cursor-pointer transition-colors',
          'min-h-[320px] sm:min-h-[380px]',
          'flex items-center justify-center',
          isDragging ? 'border-red-500 bg-red-950/40' : '',
        ].join(' ')}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={onPick}
      >
        <div className="flex flex-col items-center gap-4 text-center p-8">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-purple-500 text-4xl shadow-xl">
            📄
          </div>
          <div className="space-y-1">
            <p className="text-base font-medium">Glisse & dépose ton PDF ici</p>
            <p className="text-xs text-slate-400">ou clique pour sélectionner un fichier</p>
          </div>
          {fileName ? (
            <p className="mt-2 text-xs text-slate-300">
              Fichier prêt : <span className="font-medium text-red-300">{fileName}</span>
            </p>
          ) : null}
        </div>
      </div>
    )
  }
  
  export default DropzoneCard
  