---
feature: one-node
center: "The one node is a perspective — a spatial participant that observes its context on the canvas, contributes understanding shaped by what it attends to, and makes the canvas a medium for collective thinking rather than a surface for arranging content."
stage: tasks
intensity: focused
execution_mode: parallel
loop_iterations: 1
last_modified: 2026-04-05T00:00:00Z
---

## Tasks

### t-perspective-kernel: Kernel entity and pure transforms
> **Center:** The perspective primitive starts as a data type — immutable, framework-free, the foundation everything else builds on
> **Traces:** ac-blank-creation, ac-human-perspective, ac-ai-perspective, ac-mutable-character
> **Depends:** (none)
> **Files:** src/kernel/entities/workspace-node.ts, src/kernel/transforms/perspective-node.ts, src/kernel/transforms/index.ts
> **Wave:** 1
> **Status:** pending

- **Implements**: da-perspective-entity, da-perspective-transforms
- **Done when**:
  - PerspectiveNodeData added to WorkspaceNode discriminated union with fields: content (string, default ""), instruction (string, default ""), provider (string), model (string), result (string | null), inputHash (string | null)
  - createPerspectiveNode returns a new perspective node with empty content, empty instruction, null result, null inputHash
  - updatePerspectiveContent, updatePerspectiveInstruction, updatePerspectiveResult, updatePerspectiveInputHash each return new node arrays with the updated field (immutable)
  - duplicateNode handles type "perspective"
  - All transforms exported from kernel/transforms barrel
  - Zero framework imports in any kernel file

### t-execute-perspective: Execution use-case
> **Center:** The use-case builds the prompt that makes attention structural — instruction + content + inputs compose into a perspective-shaped AI call
> **Traces:** ac-ai-perspective, ac-attention-shapes-voice
> **Depends:** t-perspective-kernel
> **Files:** src/client/domain/use-cases/execute-perspective.ts
> **Wave:** 2
> **Status:** pending

- **Implements**: da-execute-perspective
- **Done when**:
  - Function accepts: instruction, content, inputs (array of {name, content}), provider, model, AiExecutorPort
  - Builds system prompt from instruction with clear role framing ("You are [instruction]. Respond with your perspective.")
  - Includes node content as "your own notes/context" section when non-empty
  - Includes each input as "attending to [name]: [content]" section
  - Uses XML-style delimiters to separate prompt sections
  - Returns { result: string, inputHash: string }
  - inputHash computed from content-normalized inputs (trim + collapse whitespace)
  - No React, xyflow, or framework imports

### t-perspective-mapper: Flow-node-mapper extension
> **Center:** The mapper makes attention visible — it gathers what the perspective attends to and computes whether the perspective is stale
> **Traces:** ac-attention-shapes-voice, ac-viewpoint-legible, ac-context-staleness
> **Depends:** t-perspective-kernel
> **Files:** src/client/adapters/canvas/flow-node-mapper.ts
> **Wave:** 2
> **Status:** pending

- **Implements**: da-perspective-mapper
- **Done when**:
  - toFlowNodes handles type "perspective"
  - Builds inputLegend from connected upstream nodes
  - Builds inputContext array of {name, content} for connected inputs
  - Computes current inputHash from inputContext
  - Passes isStale boolean (stored inputHash !== computed inputHash) to component data
  - Passes callbacks: onContentChange, onInstructionChange, onExecute, onModelChange, onProviderChange
  - Perspective node renders on canvas with correct position and dimensions

### t-perspective-handlers: React hook for perspective state management
> **Center:** The hook is the conductor's baton — it translates user actions into perspective state changes while keeping the user in control
> **Traces:** ac-ai-perspective, ac-context-staleness, ac-mutable-character
> **Depends:** t-perspective-kernel
> **Files:** src/client/ui/hooks/use-perspective-handlers.ts
> **Wave:** 2
> **Status:** pending

- **Implements**: da-perspective-handlers
- **Done when**:
  - Hook provides: handlePerspectiveContentChange, handlePerspectiveInstructionChange, handlePerspectiveExecute, handlePerspectiveModelChange
  - handlePerspectiveExecute calls executePerspective use-case via useAdapters().aiExecutor
  - handlePerspectiveExecute manages running state, stores result and inputHash on completion
  - All handlers update nodes immutably via setNodes pattern
  - Hook receives setNodes and nodes from parent (does not own state)
  - Uses useAdapters() for port access — no direct adapter imports

### t-perspective-component: PerspectiveNode UI component
> **Center:** The component makes the perspective legible — voice, viewpoint, attention, and staleness are all visible on the canvas without opening panels
> **Traces:** ac-blank-creation, ac-viewpoint-legible, ac-context-staleness, ac-mutable-character
> **Depends:** t-perspective-mapper, t-perspective-handlers
> **Files:** src/client/ui/components/PerspectiveNode.tsx
> **Wave:** 3
> **Status:** pending

- **Implements**: da-perspective-component
- **Done when**:
  - Uses NodeShell for resize, drag, duplicate, delete
  - Blank state: editable textarea, no voice indicator
  - Human-voiced state (content present, instruction empty): human voice indicator in header, editable content textarea, "Add AI viewpoint" affordance, first line of content visible as node title
  - AI-voiced state (instruction non-empty): AI voice indicator, model picker, Run button, instruction textarea always visible, collapsible content section if content exists, input legend, output display, staleness indicator
  - Staleness indicator is subtle (dot or glow on Run button, not a badge or toast)
  - Voice indicator distinguishes human vs. AI at a glance from canvas zoom level
  - All data via props, all mutations via callback props
  - 'use client' directive present
  - Only semantic color tokens used (bg-background, text-foreground, etc.)

### t-workspace-wiring: WorkspaceView integration and persistence
> **Center:** The wiring makes the perspective available — creation button, state management, persistence, all connected in the composition root
> **Traces:** ac-blank-creation
> **Depends:** t-perspective-component
> **Files:** src/client/ui/components/WorkspaceView.tsx, src/client/adapters/canvas/use-canvas-binding.ts, src/client/adapters/storage/local-storage-adapter.ts
> **Wave:** 4
> **Status:** pending

- **Implements**: da-workspace-integration
- **Done when**:
  - Toolbar has "New Perspective" button (consistent with existing button style)
  - use-perspective-handlers hook composed in WorkspaceView
  - Perspective callbacks passed through canvas binding to mapper
  - "perspective" registered as valid node type in canvas binding (maps to PerspectiveNode component)
  - Workspace version bumped to 5
  - Version 4 workspaces load without error
  - Version 5 workspaces with perspective nodes save and reload correctly
  - End-to-end: perspective node can be created, edited (content + instruction), connected, executed, duplicated, and deleted

## Execution Waves

| Wave | Tasks | Depends on waves | Shared file risks |
|------|-------|-------------------|-------------------|
| 1 | t-perspective-kernel | (none) | (none) |
| 2 | t-execute-perspective, t-perspective-mapper, t-perspective-handlers | 1 | (none) |
| 3 | t-perspective-component | 2 | (none) |
| 4 | t-workspace-wiring | 3 | (none) |
