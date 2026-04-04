import type {
  PdfRendererPort,
  PdfDocument,
  PdfOutlineItem,
  PdfTextItem,
} from "@/client/domain/ports/pdf-renderer-port"

// pdf.js types — only used inside this adapter
type PdfJsDocument = {
  numPages: number
  getPage(pageNum: number): Promise<PdfJsPage>
  getOutline(): Promise<PdfJsOutlineNode[] | null>
  getPageIndex(ref: unknown): Promise<number>
  destroy(): Promise<void>
}

type PdfJsTextItem = {
  str: string
  transform: number[]
  width: number
  height: number
}

type PdfJsPage = {
  getViewport(params: { scale: number }): { width: number; height: number }
  render(params: { canvasContext: CanvasRenderingContext2D; viewport: { width: number; height: number } }): { promise: Promise<void> }
  getTextContent(): Promise<{ items: Array<PdfJsTextItem | { str?: undefined }> }>
}

type PdfJsOutlineNode = {
  title: string
  dest: string | unknown[] | null
  items?: PdfJsOutlineNode[]
}

// Lazy singleton — pdf.js only loads on first use
let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null

async function getPdfJs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"
      return pdfjs
    })
  }
  return pdfjsPromise
}

// Maps PdfDocument wrappers back to underlying pdfjs proxies
// so renderPage/searchText can access getPage() without leaking pdfjs types through the port
const proxyMap = new WeakMap<PdfDocument, PdfJsDocument>()

function wrapDocument(doc: PdfJsDocument): PdfDocument {
  const wrapper: PdfDocument = {
    numPages: doc.numPages,
    async getOutline(): Promise<PdfOutlineItem[] | null> {
      const outline = await doc.getOutline()
      if (!outline) return null

      async function mapItems(items: PdfJsOutlineNode[]): Promise<PdfOutlineItem[]> {
        const result: PdfOutlineItem[] = []
        for (const item of items) {
          let pageNumber = 1
          if (Array.isArray(item.dest) && item.dest.length > 0) {
            try {
              const idx = await doc.getPageIndex(item.dest[0])
              pageNumber = idx + 1
            } catch {
              // keep default
            }
          }
          result.push({
            title: item.title,
            pageNumber,
            children: item.items?.length ? await mapItems(item.items) : undefined,
          })
        }
        return result
      }

      return mapItems(outline)
    },
    async destroy() {
      await doc.destroy()
      proxyMap.delete(wrapper)
    },
  }

  proxyMap.set(wrapper, doc)
  return wrapper
}

function getProxy(doc: PdfDocument): PdfJsDocument {
  const proxy = proxyMap.get(doc)
  if (!proxy) throw new Error("PDF document proxy not found — document may have been destroyed")
  return proxy
}

export const pdfRenderer: PdfRendererPort = {
  async loadDocument(blob: Blob): Promise<PdfDocument> {
    const pdfjs = await getPdfJs()
    const arrayBuffer = await blob.arrayBuffer()
    const doc = await pdfjs.getDocument({ data: arrayBuffer }).promise
    return wrapDocument(doc as unknown as PdfJsDocument)
  },

  async renderPage(
    doc: PdfDocument,
    pageNum: number,
    scale: number
  ): Promise<HTMLCanvasElement> {
    const proxy = getProxy(doc)
    const page = await proxy.getPage(pageNum)
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1
    const viewport = page.getViewport({ scale: scale * dpr })

    const canvas = document.createElement("canvas")
    canvas.width = viewport.width
    canvas.height = viewport.height
    // CSS dimensions at the logical (non-DPR) size so the browser downscales
    const logicalViewport = page.getViewport({ scale })
    canvas.style.width = `${logicalViewport.width}px`
    canvas.style.height = `${logicalViewport.height}px`
    const ctx = canvas.getContext("2d")!
    await page.render({ canvasContext: ctx, viewport }).promise

    return canvas
  },

  async getPageText(
    doc: PdfDocument,
    pageNum: number
  ): Promise<string> {
    const proxy = getProxy(doc)
    const page = await proxy.getPage(pageNum)
    const textContent = await page.getTextContent()
    return textContent.items
      .filter((item): item is PdfJsTextItem => item.str !== undefined)
      .map((item) => item.str)
      .join(" ")
  },

  async getPageTextItems(
    doc: PdfDocument,
    pageNum: number
  ): Promise<PdfTextItem[]> {
    const proxy = getProxy(doc)
    const page = await proxy.getPage(pageNum)
    const textContent = await page.getTextContent()
    return textContent.items
      .filter((item): item is PdfJsTextItem => item.str !== undefined && item.str !== "")
      .map((item) => ({
        str: item.str,
        x: item.transform[4],
        y: item.transform[5],
        height: Math.sqrt(item.transform[0] ** 2 + item.transform[1] ** 2),
        width: item.width,
      }))
  },

  async getPageDimensions(
    doc: PdfDocument,
    pageNum: number
  ): Promise<{ width: number; height: number }> {
    const proxy = getProxy(doc)
    const page = await proxy.getPage(pageNum)
    const viewport = page.getViewport({ scale: 1 })
    return { width: viewport.width, height: viewport.height }
  },
}
