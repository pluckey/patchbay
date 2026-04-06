---
feature: source-kind-registry
stage: log
---

## Execution Log

- [2026-04-06] EXECUTION: started — sequential mode, 12 tasks
- [2026-04-06] t-kernel-registry: complete — pure-types contribution + registry container in src/kernel/source-kinds/, 7 unit tests pass
- [2026-04-06] t-registration-module: complete — src/client/source-kinds/index.ts with side-effect registration of markdown, pdf, derived
- [2026-04-06] t-markdown-contribution: complete — src/client/source-kinds/markdown-source-kind.ts
- [2026-04-06] t-pdf-contribution-worker-loaded: complete — src/client/source-kinds/pdf-source-kind.ts (initially with import("/pdf.min.mjs") inside the worker, see D3 amendment trail)
- [2026-04-06] D3 AMENDMENT 1 (during T4): pdfjs-dist 5.x is ESM-only, no classic-script build → upgrade cell worker from classic to module worker
- [2026-04-06] t-cell-worker-registry-driven: complete — src/client/workers/cell-worker.ts (Next.js-bundled module worker, registry-driven, no kind-specific code)
- [2026-04-06] t-cell-executor-registry-shaped-input: complete — new CellExecutorPort + cell-evaluator adapter (initially using new Worker(new URL(...)))
- [2026-04-06] t-typedef-generator-registry-driven: complete — transform-input-types.ts rewritten as registry concatenator
- [2026-04-06] t-cascade-and-resolve-registry-driven: complete — execute-cascade.ts uses registry dispatch via contribution.extractFromNode + parse, zero kind-specific branches
- [2026-04-06] t-unregistered-kind-error: complete — registry.get() throws SourceKindRegistryError naming missing kind, 9 unit tests
- [2026-04-06] t-csv-dry-run-test: complete — 5 unit tests prove the open-closed property; CSV contribution adds in one file with no consumer modifications
- [2026-04-06] D3 AMENDMENT 2 (during validation): pdf.js inside module worker tries to spawn nested worker, fails, falls back to "fake worker" mode which uses importScripts which is unavailable in module workers → cell worker thread dies silently. Conclusion: in-worker pdf.js is a dead end in this stack.
- [2026-04-06] D3 AMENDMENT 3 (final): cell execution moved to main thread. cell-evaluator runs new AsyncFunction directly, pdf.js loads via the existing main-thread import (same one pdf-renderer.ts uses for the canvas viewer). Lost: 5s terminate-on-timeout safety net (becomes a soft warning). Gained: real pdf.js Documents in cell code with no nested-worker complications.
- [2026-04-06] t-legacy-transforms-preserved: complete — verified no files in legacy Transform path were modified by tasks 1–10
- [2026-04-06] SMOKE TEST: signal-field Code cell wired to Precalculus PDF (1460 pages), code = `return precalculus_2e_web.numPages;` → output `"1460"` in 280ms total (229ms cell duration). Real pdf.js Document object accessed via .numPages property. End-to-end registry pipeline verified.
- [2026-04-06] t-helper-purge: complete — pdf-helpers.ts deleted, helper injection removed from public/transform-worker.js, in-the-wild legacy Transform node rewritten to use direct ResolvedPdfInput field access (input.x.pages.slice(...)). Static grep confirms zero helper function references in src/ or public/ outside of one comment in transform-worker.js's migration docstring.
- [2026-04-06] EXECUTION: complete — 12/12 tasks done, 48 tests pass, build clean, lint clean
