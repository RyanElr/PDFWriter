export type TextEdit = {
    id: string
    page: number
  
    // coords VIEWPORT (pixels)
    x: number
    y: number
    width: number
    height: number
  
    fontSize: number
    originalText: string
    newText: string
  
    // scale réel au moment du clic
    uiScale?: number
  
    // style détecté via pdf.js
    fontFamily?: string
    isBold?: boolean
    isItalic?: boolean
  }
  