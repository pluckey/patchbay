---
feature: template-node
center: "The template node composes multiple named inputs into a single text output using {{placeholder}} substitution, giving users a visual, editable composition surface that doesn't require writing code."
center_test:
  excludes: "Add JS helper functions to transforms — improves code-based composition, not a visual code-free surface"
  boundary: "A markdown node with special syntax — lacks named input slots and automatic pipeline substitution"
mode: express
analogues: []
---

## Design Decision: Gall's Law

The template node is a new node type with a textarea body containing `{{placeholders}}`. Each placeholder maps to an incoming connection. Connections are matched to placeholders by order of creation — first connection fills the first `{{placeholder}}` found in the template text. The node's output (the composed text with substitutions applied) is available to downstream nodes via the pipeline.

The template node is treated like a transform node for validation purposes (allows multiple incoming connections) and pipeline execution (has incoming + outgoing, produces a result).

## Acceptance Criteria

### ac-template-node-type: Template is a new node type on the canvas
A TemplateNodeData entity with `templateText: string`. Created from toolbar ("+ Template"). Resizable, deletable, same NodeShell chrome.

### ac-placeholder-syntax: Template text supports {{name}} placeholder syntax
Placeholders in the template text are identified by `{{name}}` syntax. The names are extracted and displayed as labeled input slots.

### ac-multiple-inputs: Template node accepts multiple incoming connections
Each incoming connection maps to a placeholder by connection order. The template node header shows which connections map to which placeholders.

### ac-substitution-output: Template node produces composed text with all placeholders replaced
When all placeholders have connected inputs, the pipeline resolves each input's content and substitutes it into the template. The output is available to downstream nodes (including chat nodes).

### ac-live-preview: Template node shows a preview of the composed output
A collapsible preview section shows the template with substitutions applied, updating live as inputs change.

### ac-editable-inline: Template text is editable directly in the node
The user types the template directly in the node body — no separate editor mode needed. Placeholders are visually highlighted.

## Tasks

### t-template-entity: Add TemplateNodeData to kernel entities
> **Traces:** ac-template-node-type
> **Status:** pending

- Add `TemplateNodeData` to WorkspaceNode union: `{ type: "template", templateText: string }`
- Add `createTemplateNode` kernel transform
- Update barrel exports

### t-template-pipeline: Template node participates in pipeline execution
> **Traces:** ac-substitution-output, ac-multiple-inputs
> **Status:** pending

- Update `validateConnection` to allow multiple incoming on template nodes (same as transform)
- Add template execution to `usePipelineExecution`: find template nodes with incoming + outgoing, resolve each incoming connection's source content, extract `{{placeholders}}` from templateText, substitute by connection order, produce TransformResult
- Template resolution is synchronous (string replacement) — no Web Worker needed

### t-template-node-component: Create TemplateNode component
> **Traces:** ac-template-node-type, ac-editable-inline, ac-placeholder-syntax, ac-live-preview, ac-multiple-inputs
> **Status:** pending

- `src/client/ui/components/TemplateNode.tsx`
- Body: textarea with template text, placeholders highlighted
- Header: "Template" label, shows placeholder → connection mapping
- Footer: collapsible output preview (composed text)
- Register in Canvas.tsx nodeTypes + flow-node-mapper
- Thread `onTemplateTextChange` through mapper, binding, workspace

### t-template-workspace-wiring: Wire template CRUD into workspace
> **Traces:** ac-template-node-type, ac-editable-inline
> **Status:** pending

- Add `handleAddTemplateNode`, `handleTemplateTextChange` to useWorkspace
- Add `updateTemplateText` kernel transform
- Toolbar gets "+ Template" button
- Canvas binding handles template → content node connections (no auto-transform)

### t-verify: Build + smoke test
> **Traces:** ac-template-node-type, ac-placeholder-syntax, ac-multiple-inputs, ac-substitution-output, ac-live-preview, ac-editable-inline
> **Status:** pending

- `npx tsc --noEmit` and `npm run build` pass
- Manual: create template node with `Hello {{name}}, here is {{context}}`, connect two source nodes, verify substitution, connect output to chat node, verify system prompt is composed text
