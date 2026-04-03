---
feature: canvas-markdown-node
center: "A workspace where a person spatially arranges source material to compose the context an AI operates within."
stage: requirements
intensity: standard
loop_iterations: 1
last_modified: 2026-04-02T00:00:00Z
---

# Requirements: Canvas Markdown Node

## Acceptance Criteria

### ac-canvas-workspace: Spatial workspace is present on application load
> **Center:** Provides the surface on which source material is arranged — without the canvas, there is no space in which spatial composition can occur.

When the user opens the application, they see a workspace that accepts the creation and spatial placement of nodes.

### ac-node-creation: User can add a markdown text node to the canvas
> **Center:** Populates the workspace with source material — the inflow of context sources into the composition space.

The user can perform an action that places a new markdown text node on the canvas. The node appears at a location on the canvas and is immediately available for editing.

### ac-node-content-editing: User can write and modify markdown within a node
> **Center:** Content authoring is how source material enters the workspace — without editable text, the canvas holds empty shells.

The user can enter text into a node using markdown syntax. Previously entered content can be modified. Changes are retained within the session.

### ac-rendered-markdown: Node displays formatted markdown output
> **Center:** Lets the user perceive structured content as it will eventually be consumed — composition decisions require seeing material as meaningful text, not raw syntax.

Markdown content within a node is rendered as formatted text. At minimum: headings, bold, italic, lists, and code blocks are visually distinguished from plain text.

### ac-spatial-arrangement: User can freely reposition nodes on the canvas
> **Center:** Spatial arrangement is the primary composition mechanism — the user expresses context relationships by placing material in space.

The user can move any node to any position on the canvas through direct manipulation. The node remains at the position where the user placed it. Multiple nodes can be arranged in any spatial configuration.

### ac-node-removal: User can delete a node from the canvas
> **Center:** Context curation requires exclusion — the user must be able to remove material that does not belong in the composed context.

The user can remove a node from the canvas. Once gone, the node no longer appears on the canvas and is not restored on subsequent sessions.

### ac-workspace-persistence: Workspace state survives application close and reopen
> **Center:** Context composition happens across sessions — if arrangement is lost, composition work must be rebuilt from memory, defeating the purpose of a persistent workspace.

When the user closes and reopens the application, the workspace is restored to its prior state. This includes: the set of nodes present, the content of each node, and the position of each node on the canvas. Deletions also persist.

### ac-canvas-navigability: User can access all created nodes
> **Center:** The workspace must not artificially cap the scope of composable context — a ceiling on reachable nodes is a ceiling on composition.

Regardless of how many nodes have been created, the user can navigate the canvas to reach and view any node. A workspace with 20 nodes must remain fully navigable.

### ac-first-use-discoverability: New user can begin composing without instruction (E)
> **Center:** A visible creation affordance is the entry point to spatial composition — if the user cannot discover how to add material, the workspace is inert.

**(E)** A user encountering the application for the first time can create a node and begin writing content without external documentation or instruction. The mechanism for creating a node is visible, not hidden behind undiscoverable interactions.

### ac-editing-in-context: Editing a node preserves awareness of the canvas (E)
> **Center:** Context composition is about relationships between pieces — editing that occludes the spatial arrangement severs the feedback loop between content authoring and arrangement thinking.

**(E)** While the user is actively editing the content of one node, other nodes on the canvas remain visible. The user does not need to exit editing to see the spatial arrangement of their workspace.

### ac-no-silent-data-loss: No user action silently destroys content or arrangement
> **Center:** Trust in the workspace is a precondition for using it as a composition tool — silent data loss undermines confidence that the composed context is intact.

No action within the application causes content or positional data to be lost without the user's awareness. If a destructive action occurs (such as deletion), it is the direct result of a user-initiated action.

## Scope

**IN (building):**
- Spatial canvas workspace
- Markdown text nodes: create, edit, render, move, delete
- Workspace persistence across sessions
- Canvas navigation for non-trivial node counts
- First-use discoverability
- In-context editing (other nodes visible while editing)

**OUT (explicitly not building):**
- Real-time collaboration or multi-user support
- Sharing or publishing workspaces
- Version history or change tracking
- User accounts or authentication

**DEFERRED (future iterations):**
- AI integration (the center's ultimate purpose, but not day 1)
- Additional source types (PDF, URL, imported files)
- Node-to-node connections or links
- Node resizing
- Multiple canvases or workspaces
- Undo/redo
- Import/export
- Search and filter across nodes
- Node grouping or labeling
- Templates or starter content

## Dependencies

- A web application accessible via a modern browser
- A persistence mechanism capable of storing structured data (node identity, content, and canvas position)

## User Scenarios

**Scenario 1: First encounter.** A user opens the application for the first time. They see an empty workspace. Without reading any documentation, they notice a visible affordance for adding a node and use it. A new node appears on the canvas. They click into it and type a paragraph of markdown. They see their text rendered with formatting. They create two more nodes, type content into each, and drag all three into a triangle arrangement. They close the browser tab. *Exercises: ac-canvas-workspace, ac-first-use-discoverability, ac-node-creation, ac-node-content-editing, ac-rendered-markdown, ac-spatial-arrangement.*

**Scenario 2: Building context over multiple sessions.** A user has been working on a context layout for an AI coding assistant. Over three sessions, they have created 12 nodes — some containing system prompts, some containing code examples, some containing constraint descriptions. Each time they return, the workspace is exactly as they left it: same nodes, same content, same positions. They add three more nodes today and rearrange the cluster on the left side of the canvas. *Exercises: ac-workspace-persistence, ac-node-creation, ac-spatial-arrangement, ac-canvas-navigability.*

**Scenario 3: Curating by exclusion.** A user has 8 nodes on their canvas. They realize two of them contain context that would confuse the AI they're eventually composing for. They discard both nodes. The canvas now shows 6 nodes. They rearrange the remaining nodes to close the gaps. They close and reopen — 6 nodes, correct positions, discarded nodes gone. *Exercises: ac-node-removal, ac-no-silent-data-loss, ac-workspace-persistence, ac-spatial-arrangement.*

**Scenario 4: Editing while seeing the whole.** A user has 5 nodes arranged in a specific layout that represents their mental model of an AI's context. They click into one node to revise its content. While typing, they glance at the adjacent nodes to ensure the content they're writing complements what's already there. They do not need to close the editor to see the canvas. *Exercises: ac-editing-in-context, ac-node-content-editing, ac-rendered-markdown.*
