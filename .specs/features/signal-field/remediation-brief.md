# Signal Field Remediation — DEPRECATED

> **Deprecated:** This brief's findings have been fully absorbed into the revised spec (requirements.md, design.md, tasks.md). The spec now delivers all three primitives, The Scope, health indication, and structured output in a single 44-task / 10-wave plan. Refer to the spec files for current state. This document is retained as historical context for the remediation arc: UNSOUND audit → revert → brief → brief audit (FRAGILE) → spec revision.

Close the gap between what the signal-field spec designed and what was built. The prior audit verdict was UNSOUND: Phase 1a shipped cells less capable than the legacy nodes they replace, missing one of three primitives entirely, and lacking the core interaction model (The Scope). The implementation was reverted. This remediation builds everything from scratch, informed by the original spec's design atoms.

## Predecessor

This spec remediates `.specs/features/signal-field/`. The audit identified 4 critical findings and 5 warnings. The original spec's design (design.md) is sound — entities, transforms, use cases, and persistence patterns are well-designed. The failure was in the phase boundary: Phase 1a was scoped too narrowly, producing cells that couldn't compete with legacy nodes. This remediation delivers the complete signal-field experience in a single pass.

## What's Wrong (what the reverted Phase 1a got wrong)

1. **The Scope doesn't exist.** The designed interaction model is: compact card at rest, three-column Scope on double-click (Inputs | Editor | Output). Only the card was built — with inline editors stuffed in as compensation. The card should show output preview; editing belongs in The Scope.

2. **Code cells don't exist.** The Cell union was `SourceCellData | AiCellData`. CodeCellData was designed but never built. The third primitive — deterministic transformation — is absent.

3. **AI cells are non-functional.** The legacy AiTransformNode has model selection, input preview, input legend, structured output, schema builder, and status indicators. The AI cell had a textarea and a play button.

4. **Source cells are a regression.** The legacy MarkdownNode has markdown rendering with edit/preview toggle. The Source cell was a raw textarea.

5. **CellNode was a throwaway.** It had inline editors that contradict the spec's design: cards should show output preview, not editors.

## What's Right (design to reuse)

The original spec's **design atoms** (in design.md) are sound and should be followed:

- **Kernel entities**: da-cell-entity (Cell discriminated union with CellOutput), da-connection-gate, da-execution-mode, da-cell-health
- **Kernel transforms**: da-create-source-cell, da-create-ai-cell, da-create-code-cell, da-compute-terminal-cells, da-compute-mix, da-build-execution-schedule, da-resolve-cell-inputs, da-validate-connection-signal-field, da-compute-staleness
- **Use case**: da-execute-cascade (orchestrates cascade with AiExecutorPort + TransformExecutorPort)
- **Persistence**: da-workspace-migration (client v10→v11 + server-side idempotent migration)
- **Adapters**: da-cell-flow-mapper (cellsToFlowNodes alongside legacy toFlowNodes)
- **Components**: da-cell-shell, da-cell-node-component, da-mix-panel, da-scope-view, da-cell-toolbar
- **Hooks**: da-use-cascade, da-use-mix

The callback contract from the reverted build must be **split**: card callbacks (onOpenScope, onTrigger, onDelete, onDuplicate, onResizeEnd) stay on the flow node; editing callbacks (onContentChange, onInstructionChange, onCodeChange, onModelChange, onTimeoutChange, onOutputModeChange, onSchemaChange, onSchemaModeChange) are consumed by The Scope, not the card.

## What to Build

### All Three Primitives

**Source** — `SourceCellData`: `{ type: 'source', content: string }`. Identity function: content IS output. No input port.

**Code** — `CodeCellData`: `{ type: 'code', code: string, timeoutMs: number }`. Deterministic transform. Receives inputs, runs user-written JavaScript via TransformExecutorPort (the existing js-evaluator adapter), emits result.

**AI** — `AiCellData`: `{ type: 'ai', instruction: string, provider: string, model: string, outputMode: 'text' | 'structured', schemaMode: 'single' | 'collection', schema: SchemaField[] }`. Stochastic transform. Receives inputs, sends instruction + inputs to LLM via AiExecutorPort, emits generated output. Structured output support included — makes AI→Code composition reliable without fragile text parsing.

`Cell = SourceCellData | AiCellData | CodeCellData`

### The Scope (core interaction model)

A **bottom panel** that opens when the user double-clicks a cell. Three columns: Inputs, Editor, Output.

**Layout:**

```
+-----------------------------------------------------------------------+
|  [+ Source] [+ AI] [+ Code]  [Legacy v]                              |
+---------------------------------------------------+-------------------+
|                                                   |                   |
|                    CANVAS                         |    THE MIX        |
|                                                   |                   |
|   +--------+         +--------+                   |   Terminal cell   |
|   | Source  |-------->|   AI   |                   |   outputs         |
|   +--------+         +--------+                   |                   |
|                                                   |                   |
+---------------------------------------------------+-------------------+
|  INPUTS          |  EDITOR              |  OUTPUT                     |
|                  |                      |                              |
|  source_1: ...   |  [type-specific]     |  Current output (full)      |
|  source_2: ...   |                      |  [▶ Run]                    |
|  (click to nav)  |                      |  Health: current | 1.2s     |
|                  |                      |                              |
+---------------------------------------------------+-------------------+
```

- Bottom panel, default ~40% of canvas height, resizable via drag handle
- Collapsible: ESC or close button collapses, double-click or Enter on selected node opens
- Canvas remains visible and interactive above The Scope
- MixPanel stays on the right, spanning full height
- One Scope open at a time

**Opening The Scope:**
- Single click on a cell selects it (xyflow default behavior preserved)
- Double-click opens The Scope for that cell
- Enter key opens The Scope for the currently selected cell
- ESC or close button closes The Scope

**Inputs column (left):**
- Shows each incoming connection: source cell title + current output text
- Each input is clickable — closes current Scope, selects the source cell on canvas, centers view on it
- Empty for Source cells (no input port)
- Ordering is display-only (no drag-reorder in this remediation)

**Editor column (center) — type-specific:**
- **Source**: markdown editor with edit/preview toggle (reuse MarkdownContent patterns — ReactMarkdown rendering, draft state)
- **Code**: code editor (reuse TransformCodeEditor — lazy-loaded CodeMirror) + input legend (label → sourceName mapping) + timeout selector dropdown
- **AI**: instruction textarea with placeholder hints + model selector (Popover with grouped roster) + output mode toggle (text/structured) + schema builder when structured (reuse SchemaBuilder component) + schema mode toggle (single/collection)

**Output column (right):**
- Trigger/run button at top (AI and Code cells only) — the edit→run→inspect cycle is completable entirely within The Scope
- Current output with full text (not truncated), scrollable
- Health indicator (current/stale/error) with color-coded dot
- Execution duration display
- Error display with full message
- Structured output: StructuredOutputDisplay component (already exists)

**Data flow:**
- The Scope reads from cells/connections React state (reactive, not snapshot) — updates live when cascades finish or connections change
- A `useScopeData(cellId, cells, connections)` hook resolves inputs for the focused cell using the `resolveCellInputs` transform
- ScopeView lives inside WorkspaceView as a sibling to Canvas + MixPanel
- A `useScopeState` hook manages open/close state and focused cell ID

### CellNode Rewrite (compact card with creation shortcut)

The card at rest shows:
- Title (in CellShell header)
- Health dot (current/stale/error color)
- Output preview (truncated, ~3 lines) — for Source cells this is the content, for Code/AI this is the last output
- Trigger button on hover (AI and Code cells only)

**Creation state machine:** Newly created empty cells show an inline editor in the card (Source: textarea, AI: instruction textarea, Code: code textarea). This satisfies ac-cell-creation-simple — the user types immediately without opening The Scope. Once the cell has content or output, the card transitions to output-preview-only mode. Further editing happens in The Scope.

```
[empty] → inline editor in card → [has content] → output preview only → double-click → Scope
```

Double-click opens The Scope. No editing happens in the card once it has content.

### Health Indication

Add health computation: `computeStaleness(cells, connections) -> Map<cellId, 'current' | 'stale' | 'error'>`. When a cell's upstream output changes, downstream cells become stale. Triggering a stale cell and completing execution transitions to current. Error on failure. Health dot rendered in CellShell header. Visible at canvas level without opening The Scope.

### Cascade Extension for Code Cells

Extend `executeCascade` ports to `{ aiExecutor: AiExecutorPort, transformExecutor: TransformExecutorPort }`. Add Code cell execution branch: resolve inputs via `resolveCellInputs` → construct input object → execute via TransformExecutorPort. The `useCascade` hook gains TransformExecutorPort from `useAdapters()`.

### Legacy Button Retirement

After this remediation ships, the toolbar shows:
- **Primary**: `[+ Source] [+ AI] [+ Code]` — always visible
- **Legacy**: collapsible section containing `[+ Markdown] [+ Transform] [+ Chat] [+ AI Transform] [+ PDF]`

Source/AI/Code are the only primary-visible creation options. Legacy buttons are accessible but demoted.

## What NOT to Build

- Chat overlay (Phase 2 — separate concern)
- Automatic execution mode (Phase 2)
- Connection gates UI toggle (Phase 3)
- Cycles (Phase 3)
- Drag-from-port cell creation (ergonomic, not structural — defer)
- Connection feedback / anticipatory change (defer)
- Fan-in drag-reorder in Scope inputs column (defer — show inputs, don't reorder them)
- Auto-execute toggle on AI cells (Phase 2 — execution mode)
- Input mode toggle concat/named on AI cells (defer — can add to Scope later)

## Design Principle

The original audit's core finding: the spec confused type reduction with capability reduction. Fewer types is good. Fewer features per type is destructive. This remediation delivers minimum viable editing for all three primitives within The Scope, while keeping the cards compact and uniform. The Scope is where editing capability lives — the cards are signal indicators, not editing surfaces (except during creation).

This remediation is primarily about configuration capability — but it serves the composition center. Without functioning primitives, composition cannot be primary. The Scope is designed to reinforce compositional thinking: the Inputs column shows topological context, input navigation pulls the user back to the canvas, and I/O visual weight dominates the editor.

## Existing Patterns to Reuse

| Need | Existing Pattern | Location |
|------|-----------------|----------|
| Model selector | Popover with grouped roster | AiTransformNode.tsx lines 71-106 |
| Code editor | Lazy-loaded CodeMirror | TransformCodeEditor.tsx |
| Input legend | label → sourceName display | TransformNode.tsx lines 87-97 |
| Input preview | Collapsible input text | AiTransformNode.tsx lines 156-176 |
| Markdown rendering | ReactMarkdown with edit toggle | MarkdownContent.tsx |
| Status indicator | Color-coded dot | AiTransformNode.tsx line 61 |
| Structured output display | JSON display component | StructuredOutputDisplay.tsx |
| Schema builder | Field editor with types | SchemaBuilder.tsx |
| Timeout selector | Dropdown with presets | TransformNode.tsx lines 56-65 |

These components are reused as-is in The Scope (pragmatic approach). The xyflow-specific constraints in these components (nodrag classes, stopPropagation) are harmless outside the ReactFlow tree. Clean extraction into shared editing components is deferred.

## Verification

1. **Unit tests** for new kernel transforms: createCodeCell, computeStaleness
2. **Integration test** for executeCascade with all three cell types (Source→Code→AI chain)
3. **Manual smoke test**: create Source cell (verify inline edit on creation), type content, create Code cell, write extraction logic, create AI cell, select model in Scope, write instruction with structured output schema, wire Source→Code→AI, trigger from Code cell's Scope, verify cascade executes all three, verify Mix shows terminal output, verify health dots update
