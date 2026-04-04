export type PdfRegion = {
  x: number // PDF points, origin bottom-left
  y: number
  width: number
  height: number
}

export type PdfAnnotation = {
  id: string
  page: number
  region: PdfRegion
  label: string
  text: string // best-effort extracted text
}

export type PdfTextItem = {
  str: string
  x: number // PDF points
  y: number
  width: number
  height: number
}
