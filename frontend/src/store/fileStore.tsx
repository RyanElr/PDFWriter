import { createContext, useContext, useState } from 'react'

type FileContextType = {
  file: File | null
  setFile: (file: File | null) => void
}

const FileContext = createContext<FileContextType | null>(null)

function FileProvider({ children }: { children: React.ReactNode }) {
  const [file, setFile] = useState<File | null>(null)
  return <FileContext.Provider value={{ file, setFile }}>{children}</FileContext.Provider>
}

function useFileStore() {
  const context = useContext(FileContext)
  if (!context) throw new Error('useFileStore must be used within FileProvider')
  return context
}

export { FileProvider, useFileStore }
