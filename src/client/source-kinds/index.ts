/**
 * Shared source kind registration entrypoint.
 *
 * This module is imported by both the main thread (for the cell executor,
 * cascade, and type-def generator) and the cell worker (for parsing and
 * binding setup at execution time). On import, it registers every source
 * kind contribution into the shared kernel registry.
 *
 * **Adding a new source kind**:
 * 1. Create a new file under `src/client/source-kinds/<kind>-source-kind.ts`
 *    that exports a `SourceKindContribution` instance.
 * 2. Import it here.
 * 3. Add one `sourceKindRegistry.register(contribution)` call below.
 *
 * That's it. No other file in the codebase should be modified — not the
 * cell worker, not the cell executor, not the type-def generator, not the
 * cascade.
 *
 * Idempotency: `register` is a no-op for re-registration of the same
 * contribution object, so importing this module twice (e.g., once on the
 * main thread and once in the worker) does not throw.
 */

import { sourceKindRegistry } from "@/kernel/source-kinds"
import { markdownSourceKind } from "./markdown-source-kind.ts"
import { pdfSourceKind } from "./pdf-source-kind.ts"
import { derivedSourceKind } from "./derived-source-kind.ts"

sourceKindRegistry.register(markdownSourceKind)
sourceKindRegistry.register(pdfSourceKind)
sourceKindRegistry.register(derivedSourceKind)

export { sourceKindRegistry }
