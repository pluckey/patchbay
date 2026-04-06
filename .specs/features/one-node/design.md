---
feature: one-node
center: "The one node is a perspective — a spatial participant that observes its context on the canvas, contributes understanding shaped by what it attends to, and makes the canvas a medium for collective thinking rather than a surface for arranging content."
stage: design
intensity: focused
loop_iterations: 1
last_modified: 2026-04-05T00:00:00Z
---

## System Decomposition

| ID | Name | Type | Action | Key Attributes | Traces to ACs |
|----|------|------|--------|---------------|---------------|
| da-perspective-entity | PerspectiveNodeData | Kernel entity | Create | content, instruction, provider, model, result, inputHash | ac-blank-creation, ac-human-perspective, ac-ai-perspective, ac-mutable-character |
| da-perspective-transforms | Perspective kernel transforms | Kernel transforms | Create | createPerspectiveNode, updatePerspectiveContent, updatePerspectiveInstruction, updatePerspectiveResult, updatePerspectiveInputHash | ac-blank-creation, ac-human-perspective, ac-ai-perspective, ac-mutable-character |
| da-execute-perspective | executePerspective use-case | Client use-case | Create | Orchestrates AI call with instruction + content + inputs via AiExecutorPort | ac-ai-perspective, ac-attention-shapes-voice |
| da-perspective-handlers | use-perspective-handlers hook | Client hook | Create | Wires execute use-case to React state, manages staleness detection | ac-ai-perspective, ac-context-staleness, ac-mutable-character |
| da-perspective-mapper | Perspective flow-node mapping | Client adapter | Modify | Extend flow-node-mapper for "perspective" type: input legend, input context, staleness flag | ac-attention-shapes-voice, ac-viewpoint-legible, ac-context-staleness |
| da-perspective-component | PerspectiveNode component | Client component | Create | Three-state rendering (blank, human-voiced, AI-voiced), viewpoint header, staleness indicator | ac-blank-creation, ac-viewpoint-legible, ac-context-staleness, ac-mutable-character |
| da-workspace-integration | WorkspaceView perspective wiring | Client composition | Modify | Toolbar button, hook composition, canvas node type registration | ac-blank-creation |

## Relationship Map

```
da-perspective-entity (kernel/entities/workspace-node.ts)
  ↑ imported by
da-perspective-transforms (kernel/transforms/perspective-node.ts)
  ↑ imported by
da-execute-perspective (client/domain/use-cases/execute-perspective.ts)
  ↑ uses AiExecutorPort (client/domain/ports/)
  ↑ imported by
da-perspective-handlers (client/ui/hooks/use-perspective-handlers.ts)
  ↑ uses useAdapters() for port access
  ↑ consumed by
da-workspace-integration (src/app/ composition root + WorkspaceView)
  ↓ passes callbacks to
da-perspective-mapper (client/adapters/canvas/flow-node-mapper.ts)
  ↓ produces props for
da-perspective-component (client/ui/components/PerspectiveNode.tsx)
```

Dependency Rule verified: every arrow points inward or is mediated by dependency inversion (use-case → port ← adapter).

## Behavior Plan

### Blank creation (ac-blank-creation)
User clicks "New Perspective" in toolbar. `createPerspectiveNode` creates a node at viewport center with empty content, empty instruction, null result, null inputHash. PerspectiveNode renders blank state — an editable textarea with no voice indicator.

### Human → AI evolution (ac-mutable-character)
User has typed content. They click "Add AI viewpoint." An instruction textarea appears. They type an instruction. The node header updates to show AI voice indicator. Content is preserved. A "Run" button appears. No execution until user clicks Run.

### AI execution (ac-ai-perspective, ac-attention-shapes-voice)
User clicks Run. The `executePerspective` use-case:
1. Gathers connected input content from upstream nodes
2. Builds system prompt from the instruction: "You are [instruction]. Respond with your perspective on what follows."
3. Includes the node's own content as "Your own notes/context" (if non-empty)
4. Includes each connected input as "You are attending to [source name]: [source content]"
5. Calls AiExecutorPort.execute()
6. Stores result and computes inputHash from current inputs
7. Updates node via updatePerspectiveResult transform

The prompt structure ensures attention-shaped output: different inputs produce different analytical character because the AI is told it is "attending to" specific named sources.

### Staleness detection (ac-context-staleness)
The mapper computes current input hash at mapping time. Compares to stored inputHash on the node. If different, passes `isStale: true` to PerspectiveNode. The component shows a subtle indicator (small dot or gentle border glow). User can click Run to refresh or ignore. No auto-execution.

### Downstream contribution
- Human-voiced (no instruction): content flows downstream as context
- AI-voiced with result: result flows downstream
- AI-voiced without result: instruction + content flows downstream (perspective intent visible before execution)

## UI Plan

### PerspectiveNode component — three visual states

**State 1: Blank (just created)**
- NodeShell with editable textarea, no header icons
- Undifferentiated — user's first action determines character

**State 2: Human-voiced (content present, no instruction)**
- Header: human voice indicator (icon/label), first line of content as perspective title
- Body: editable textarea with authored content
- Footer: subtle "Add AI viewpoint" affordance
- Input legend: shows connections (if any)

**State 3: AI-voiced (instruction present, with or without content)**
- Header: AI voice indicator, model picker, Run button (with staleness dot when stale)
- Instruction section: textarea with viewpoint instruction (always visible for legibility)
- Content section (collapsible): authored notes if present
- Input legend: shows what the node attends to
- Output section: AI result (or "Run to generate" prompt, or error state)

### Viewpoint legibility (ac-viewpoint-legible)
Visible at canvas zoom level without clicking:
1. **Voice**: Human icon vs. AI icon in header
2. **Viewpoint**: First line of instruction (AI) or first line of content (human) as node title
3. **Attention**: Input legend showing connection sources

## Data Plan

### Entity shape
```
PerspectiveNodeData {
  type: "perspective"
  content: string              // defaults to "" (empty, not null)
  instruction: string          // defaults to "" (empty = human-voiced)
  provider: string             // AI provider
  model: string                // AI model
  result: string | null        // AI output (null = never executed)
  inputHash: string | null     // hash of inputs at last execution
}
```

Mode is derived: `instruction.length > 0` means AI-voiced. No explicit mode field.

### Persistence
- Workspace version bumps from 4 to 5 (additive — no existing data changes)
- PerspectiveNodeData serializes as JSON alongside existing node types
- Version 4 workspaces load without modification (no perspective nodes to parse)

### Input hash
- Computed from connected input content (JSON.stringify of sorted source contents)
- Content-normalized (trim, collapse whitespace) to reduce false positives
- Not cryptographic — just change detection

## Verification Strategy

| AC | Method | Notes |
|----|--------|-------|
| ac-blank-creation | Manual | Create node, verify no type selector, verify differentiation on first interaction |
| ac-human-perspective | Manual | Type prose, verify renders and flows downstream to connected nodes |
| ac-ai-perspective | Manual | Add instruction, connect inputs, run, verify output has analytical character matching instruction |
| ac-attention-shapes-voice (E) | Manual | Same instruction, different inputs, compare output character qualitatively |
| ac-viewpoint-legible | Manual | Zoom out, verify voice/viewpoint/attention visible without clicking into node |
| ac-mutable-character | Manual | Start with content, add instruction, verify content preserved, verify output reflects both |
| ac-context-staleness | Manual | Run AI perspective, change upstream content, verify staleness indicator appears |

All verification is manual for v1. Automated tests verify plumbing (entity creation, transform purity, use-case orchestration). Perspective quality requires human judgment.

## Key Tradeoffs

1. **Add vs. replace**: Adding a 6th node type (Strangler Fig) rather than replacing all 5. Safer, allows coexistence during transition. Cost: temporary duplication of some patterns.
2. **No auto-execute**: Unlike AI Transform's autoExecute toggle, perspective nodes only execute on user action. Simpler, respects "user as conductor."
3. **No input extraction**: Duplicating input-gathering logic from AI Transform mapper rather than extracting a shared utility. Perspective may eventually subsume AI Transform, at which point duplication resolves by deletion.
4. **Derived mode**: Using `instruction.length > 0` as the mode signal rather than an explicit mode field. Simpler entity, one less thing to keep in sync.
