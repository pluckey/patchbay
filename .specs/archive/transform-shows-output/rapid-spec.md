---
feature: transform-shows-output
center: "The transform node shows its own output directly — no separate derived node needed."
center_test:
  excludes: "Make derived nodes editable — improves derived nodes rather than eliminating them"
  boundary: "Auto-hide derived nodes — hides the symptom, doesn't simplify the topology"
archetypes: [surface-redesign]
mode: express
analogues: []
---

## Design Decision

The transform node already has a collapsible "show output" section. This becomes the primary output display — always visible, not hidden behind a toggle. The pipeline stores results keyed by the transform node's own ID (for display) in addition to downstream target IDs. Downstream nodes (chat, other transforms) connect directly from the transform node.

The derived markdown node concept (`isDerived`, `derivedContent`, `derivedError` on MarkdownFlowNodeData) becomes dead code and is removed.

## Acceptance Criteria

### ac-transform-shows-output: Transform node displays its output directly in its body
The transform node body shows: code editor (or code preview) on top, output below. No toggle — output is always visible when available. Error state shown inline.

### ac-no-derived-node: Pipeline no longer creates intermediate derived nodes
Dragging from a content node to another content node creates Source → Transform → Target with a direct edge, no derived markdown node in between. The auto-create pipeline behavior produces 2 edges and 1 transform node.

### ac-direct-downstream: Downstream nodes connect directly to transform output
Chat nodes and other transforms can connect from a transform node and receive its output. The pipeline resolves transform output for downstream consumers.

### ac-derived-mode-removed: MarkdownNode derived mode is removed
`isDerived`, `derivedContent`, `derivedError` removed from MarkdownFlowNodeData. MarkdownNode only shows user-authored content.

## Tasks

### t-transform-output-always-visible: Show output in transform node body, remove toggle
> **Traces:** ac-transform-shows-output
> **Status:** pending

- TransformNode.tsx: output section always visible (not behind "show output" button), shows full output with scroll, error inline
- Remove collapsible toggle logic

### t-pipeline-results-keyed-by-transform: Store pipeline results for transform node ID
> **Traces:** ac-transform-shows-output, ac-direct-downstream
> **Status:** pending

- In execute-pipeline-graph.ts and use-pipeline-execution.ts: store results keyed by BOTH transform node ID (for display) and downstream target IDs
- Transform node reads its own result from pipelineResults via its own ID
- Chat system prompt resolution checks if source is a transform node and reads its result

### t-remove-derived-mode: Remove isDerived/derivedContent from MarkdownFlowNodeData
> **Traces:** ac-derived-mode-removed
> **Status:** pending

- Remove isDerived, derivedContent, derivedError from MarkdownFlowNodeData
- Remove derived mode rendering from MarkdownNode.tsx (only show user content)
- Remove derived injection from toFlowNodes in flow-node-mapper.ts
- Clean up any references in use-canvas-binding.ts

### t-simplify-auto-pipeline: Auto-create pipeline produces Source → Transform → Target directly
> **Traces:** ac-no-derived-node
> **Status:** pending

- handleCreatePipeline in use-workspace.ts: create transform node + 2 edges (source → transform, transform → target)
- No intermediate derived markdown node created
- This is already the current behavior (it was changed during the transform-as-node refactor) — verify and confirm

### t-verify: Build + smoke test
> **Traces:** ac-transform-shows-output, ac-no-derived-node, ac-direct-downstream, ac-derived-mode-removed
> **Status:** pending

- `npx tsc --noEmit` and `npm run build` pass
- Manual: create pipeline, verify output shows in transform node, connect transform to chat, verify chat receives output, verify no derived mode on markdown nodes
