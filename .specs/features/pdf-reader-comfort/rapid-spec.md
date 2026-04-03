---
feature: pdf-reader-comfort
center: "The PDF viewer node provides the reading comfort and navigation efficiency needed to use PDF documents as working reference material, not just static thumbnails."
center_test:
  excludes: "PDF text extraction for AI context composition — about data flow out of the node, not reading comfort within it."
  boundary: "PDF annotation/highlighting — crosses from reading into editing, which is a different feature."
mode: express
analogues: [pdf-viewer-node, pdf-viewer-cleanup]
---

## Acceptance Criteria

### ac-dark-mode-toggle: Per-node dark mode inverts PDF rendering for comfortable reading
The PDF node provides a toggle that inverts the rendered PDF page colors (CSS filter inversion). The toggle is per-node — each PDF can be independently set to light or dark. The inversion applies only to the PDF canvas, not to the node chrome (search bar, nav, header). Default matches no inversion (original PDF colors).

### ac-full-document-search: Text search spans all pages with match navigation
When the user enters a search query, the viewer reports the total match count across ALL pages (not just the current page). The user can navigate between matches with next/prev controls. Navigating to a match on a different page automatically changes the current page. The current match index and total count are visible (e.g., "3 of 17").

### ac-reading-progress-bar: Visual progress indicator shows position in document
A thin progress bar indicates the user's current position in the document (currentPage / totalPages). The bar is always visible and updates on every page change. It communicates progress at a glance without requiring the user to read the page numbers.

### ac-zoom-controls: Independent zoom level per node
The PDF node provides zoom in/out controls that change the rendering scale of the PDF content within the node. Zoom is independent of node resize — resize changes the canvas footprint, zoom changes the content scale. Minimum and maximum zoom bounds prevent unusable states. The zoom level is visible to the user (e.g., percentage display).

### ac-zoom-presets: Fit-to-width and fit-to-page preset buttons
Two zoom preset buttons are available: fit-to-width (scales PDF to fill the node's width) and fit-to-page (scales to show the full page within the node bounds). These recalculate dynamically if the node is resized.

### ac-jump-to-page: Direct page number input for random access
The user can click the page indicator (or a dedicated input) and type a target page number to jump directly to it. Pressing Enter or blurring confirms. Invalid input (out of range, non-numeric) is rejected gracefully without changing the page.

### ac-keyboard-navigation: Keyboard shortcuts for page navigation when node is focused
When the PDF node has focus, arrow keys (Left/Right or Up/Down) and PgUp/PgDn navigate between pages. Keyboard navigation does not conflict with the canvas pan/zoom or with text input in the search bar.

### ac-persist-viewer-settings: Zoom, dark mode, and page survive reload
Each PDF node's viewer settings (zoom level, dark mode state, current page) persist across page reload. This requires storing these settings as part of the node's persisted data. A storage migration handles existing nodes that lack these fields (defaults: zoom = 1.0, darkMode = false, page = existing currentPage).

## Tasks

### t-entity-viewer-settings: Add viewer settings fields to PdfNodeData
> **Traces:** ac-persist-viewer-settings, ac-dark-mode-toggle, ac-zoom-controls
> **Status:** pending

- Add `zoomLevel: number` (default 1.0) and `darkMode: boolean` (default false) to `PdfNodeData` in `src/kernel/entities/workspace-node.ts`
- Update `PdfFlowNodeData` in `flow-node-mapper.ts` to pass these through, plus callbacks: `onZoomChange`, `onDarkModeToggle`
- Add callbacks to `FlowCallbacks` and wire in `toFlowNodes`
- **Done when**: PdfNodeData type includes zoomLevel and darkMode, flow mapper passes them to node components

### t-storage-migration-v5: Migrate persisted data to include viewer settings
> **Traces:** ac-persist-viewer-settings
> **Status:** pending

- Add v4 -> v5 migration in `local-storage-adapter.ts`: stamp `zoomLevel: 1.0` and `darkMode: false` on PDF nodes missing those fields
- Bump `CURRENT_VERSION` to 5
- Migration is idempotent
- **Done when**: Existing v4 workspaces load without error, PDF nodes get default viewer settings

### t-workspace-hooks-viewer-settings: Add zoom and dark mode handlers to useWorkspace
> **Traces:** ac-zoom-controls, ac-dark-mode-toggle, ac-persist-viewer-settings
> **Status:** pending

- Add kernel transforms: `updatePdfZoom(nodes, nodeId, zoomLevel) => WorkspaceNode[]` and `togglePdfDarkMode(nodes, nodeId) => WorkspaceNode[]`
- Add `handleZoomChange` and `handleDarkModeToggle` callbacks in `useWorkspace`, following same pattern as `handleNavigatePage`
- Wire through to flow mapper callbacks
- **Done when**: Changing zoom or dark mode updates domain state and triggers persistence

### t-zoom-controls-ui: Zoom in/out buttons and level display in PdfContent
> **Traces:** ac-zoom-controls, ac-zoom-presets
> **Status:** pending

- Add a zoom toolbar row to `PdfContent` (or a new `PdfZoomBar` sub-component): zoom-in (+), zoom-out (-), fit-to-width, fit-to-page buttons, and current zoom percentage display
- Zoom in/out step by ~25% increments, clamped to [0.25, 4.0]
- Fit-to-width: calculate scale from containerWidth / page intrinsic width (612pt default)
- Fit-to-page: calculate scale from both container dimensions / page dimensions, take the smaller
- Zoom level changes call `onZoomChange` callback (persists to domain)
- Update `renderPage` call to use the node's `zoomLevel` instead of the auto-calculated scale
- Update page cache key to include zoom level
- **Done when**: Zoom buttons change PDF rendering scale, fit presets calculate correct scale, zoom persists

### t-dark-mode-toggle-ui: Dark mode toggle on the PDF node
> **Traces:** ac-dark-mode-toggle
> **Status:** pending

- Add a toggle (shadcn Switch or icon button) in the PDF node toolbar area
- When active, apply `filter: invert(1) hue-rotate(180deg)` to the canvas host div only (not the node chrome)
- Toggle calls `onDarkModeToggle` callback
- **Done when**: Toggle inverts PDF page colors, does not affect search bar / nav / header, state persists

### t-full-document-search: Expand search to all pages with match navigation
> **Traces:** ac-full-document-search
> **Status:** pending

- Add `searchAllPages(doc, query) => Promise<Array<{ page: number, count: number }>>` to `PdfRendererPort` and implement in `pdf-renderer.ts` using `getPageText` per page
- Run search progressively (don't block on all pages at once) — update count as pages are searched
- In `PdfContent`, replace single-page search effect with full-document search
- Add current match index tracking and next/prev match buttons to `PdfSearchBar`
- Next/prev match navigates between pages when current page matches are exhausted
- Display "N of M" format in search bar
- **Done when**: Search reports total matches across all pages, next/prev navigates across pages

### t-reading-progress-bar: Thin progress bar showing reading position
> **Traces:** ac-reading-progress-bar
> **Status:** pending

- Add a thin (2-3px) horizontal progress bar at the top or bottom of the PDF content area
- Width = (currentPage / totalPages) * 100%
- Use `bg-primary` for the filled portion
- No interaction needed — purely visual indicator
- **Done when**: Progress bar reflects current page position, updates on navigation

### t-jump-to-page: Clickable page indicator with direct input
> **Traces:** ac-jump-to-page
> **Status:** pending

- Modify `PdfPageNav`: make the page number display clickable, switching to an inline `<input type="number">` on click
- On Enter or blur: validate (1 <= value <= totalPages), call `onNavigate` if valid, revert to display mode
- On Escape: cancel and revert to display mode
- Stop event propagation on the input (same pattern as search bar)
- **Done when**: User can click page number, type a target, and jump directly to it

### t-keyboard-navigation: Arrow key and PgUp/PgDn page navigation
> **Traces:** ac-keyboard-navigation
> **Status:** pending

- Add `onKeyDown` handler to the PDF node's root container (or PdfContent wrapper)
- Make the container focusable (`tabIndex={0}`)
- ArrowLeft/ArrowUp/PgUp → previous page; ArrowRight/ArrowDown/PgDn → next page
- Guard: only handle when the active element is NOT an input/textarea (prevents conflict with search bar and jump-to-page input)
- Do not call `e.preventDefault()` when unhandled to avoid breaking canvas keyboard shortcuts
- **Done when**: Focused PDF node responds to arrow keys for page navigation, no conflict with search input or canvas
