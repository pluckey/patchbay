---
feature: agent-canvas-awareness
center: "This feature gives an AI coding agent ongoing structural awareness of the user's spatial workspace so that both can reason about the same evolving arrangement without the user having to manually describe it."
stage: requirements
intensity: deep
loop_iterations: 1
last_modified: 2026-04-03T00:00:00Z
---

## Expert Roundtable Summary

**Donella Meadows** -- systems dynamicist, author of *Thinking in Systems*, identifier of twelve leverage points for intervening in a system. Meadows analyzed the feature as a feedback loop problem: two systems (browser canvas, CLI agent) with a human bottleneck performing manual translation between them. She identified that the core leverage point is eliminating the information delay in this loop, and insisted that the representation must be self-describing and that new entity types must flow through to the readable representation without new plumbing.

**W. Edwards Deming** -- statistician, architect of Japan's post-war quality revolution, creator of the System of Profound Knowledge. Deming pressed for operational definitions throughout, insisting that every criterion be testable against a measurable standard. He flagged that the whiteboard was a superb problem analysis that stopped one step short of being useful as a specification input -- it identified tensions but resolved none into testable statements. He drove the distinction between what we KNOW (the user wants to avoid manual description; the agent reads files) and what we PREDICT (the right staleness tolerance; the right representation granularity).

**Steve Jobs** -- co-founder of Apple and Pixar, known for ruthless prioritization and starting from the user experience. Jobs insisted that the acceptance test is experiential: can the user say "what's wrong with this pipeline?" and get an answer that demonstrates the agent already knows what is on the canvas? He pushed to strip the criteria to essentials, merge overlapping requirements, and defer anything that does not serve the V1 experience. He identified the whiteboard's critical gap: it analyzed the system but never described the three seconds of interaction where the magic happens or doesn't.

### Panel Consensus on the Whiteboard

**Faithfulness to intent:** The whiteboard captured the informational intent accurately. Its identification of the core problem -- "the canvas is a context-composition instrument that is mute to its intended audience" -- is precise. The "critical reframe" section correctly translated user answers into a design direction. Gap: the whiteboard captured the experiential intent (pair programming, shared context) analytically rather than as a testable scenario.

**Resolved questions:** All six open questions from the whiteboard were answered by the user. Three new questions emerged from the answers: what representation format is self-describing to a general-purpose agent (answerable through evaluation), what staleness tolerance maintains conversational coherence (answerable through evaluation), and how the agent discovers the readable state (must be addressed in acceptance criteria).

**Assumption validity:** All six assumptions are accepted given the user's answers. Assumption #2 ("more data means better help") carries the most risk -- mitigated by requiring navigable structure, not just completeness.

**Over-scope:** The whiteboard over-scoped in three ways: (1) persisting on design tensions the user resolved (privacy, always-on vs. triggered), (2) extensive alternatives analysis after the user chose a direction, and (3) philosophical concerns (strange loop, panopticon effect) that are real but not actionable for V1. The whiteboard did NOT over-scope on Tension 1 (fidelity vs. comprehension) or Tension 6 (map richness vs. navigability) -- these remain active concerns addressed by the acceptance criteria below.

---

## Acceptance Criteria

### ac-external-readability: Workspace state is readable outside the browser

> **Center:** Eliminates the browser boundary that currently prevents any external process from accessing workspace state -- without crossing this boundary, the agent has zero structural awareness.

The current workspace state must be accessible to a process running outside the browser. A coding agent operating in a terminal must be able to obtain the complete workspace representation through the same mechanisms it uses to read any other project artifact. If the workspace state can only be accessed by code running inside the browser tab, this criterion fails.

### ac-structural-completeness: All canvas entities are represented

> **Center:** "Structural awareness" requires that every element the user can see and reason about is present in the representation -- any entity missing from the representation is invisible to the agent and breaks shared reasoning.

The readable representation must include every entity present on the canvas:
- Every node, with its type, user-visible label, and full content
- Every connection, with its source entity, target entity, and any labels
- Positional attributes of every node (included as entity metadata, not for spatial reasoning)
- The representation must accurately reflect edge cases: empty workspaces, nodes with no content, and connections where referenced entities exist

Testable by round-trip verification: every entity visible on the canvas must have a corresponding entry in the representation, and every entry in the representation must correspond to something on the canvas. No canvas entity is omitted; no phantom entities appear.

### ac-automatic-currency: State stays current without user action

> **Center:** "Ongoing awareness" and "evolving arrangement" require that the representation tracks changes automatically -- if the user must manually trigger synchronization, they are back to describing state, just through a different mechanism.

After any user action that changes workspace state (adding a node, editing content, creating a connection, moving a node, deleting an element), the readable representation must reflect that change within a bounded interval. The user performs zero manual steps to make the updated state available -- no export action, no sync button, no save-and-share workflow. The state becomes available as a natural consequence of the user's normal work in the canvas.

The maximum acceptable delay between a canvas change and its appearance in the readable representation is a single-digit number of seconds -- consistent with the natural pause between performing an action in the browser and switching to a terminal to ask about it. The exact threshold is **(E)** evaluate-and-iterate: it passes if the delay is short enough that the agent's responses do not reference stale state during normal conversational rhythm.

### ac-stable-identity: Entities have persistent identifiers across reads

> **Center:** "Reason about the same arrangement" across conversational turns requires that the agent can refer to an entity in one response and the user (or agent) can reference the same entity later -- without stable identity, each read is a disconnected snapshot and sustained reasoning is impossible.

Every entity in the representation must have an identifier that remains the same across successive reads, provided the entity has not been deleted. If the agent reads the state, the user makes unrelated changes, and the agent reads again, any entity that existed in both reads must have the same identifier. Identifiers must be deterministic, not regenerated on each serialization.

### ac-self-describing-representation: Interpretable without prior knowledge of the data model

> **Center:** "Without the user having to manually describe it" applies to the data model itself -- if the agent needs a separate schema explanation to interpret the representation, the user (or developer) is still serving as translator, just at a different level of abstraction.

The representation must be interpretable by a general-purpose coding agent that has no prior knowledge of the application's data model or internal architecture. Entity types, relationship semantics, and content formats must be inferable from the representation itself. The representation must not contain internal framework state, rendering internals, or implementation artifacts that would confuse an uninstructed reader.

Testable: provide the representation to a fresh agent session with no context about the application. If the agent can accurately describe the workspace structure (how many nodes, what types, how they are connected, what content they contain), the representation is self-describing. If it cannot, or if it misinterprets framework internals as user content, there is a legibility defect.

### ac-discoverable-location: Agent finds the state through normal exploration

> **Center:** "Without the user having to manually describe it" extends to the location of the state itself -- if the user must tell the agent where to find the workspace representation, that is a description step the feature exists to eliminate.

The readable representation must reside in a location that a coding agent would encounter through its normal file-exploration behavior within the project. The location must follow a predictable convention. If the agent must be told where to look, be given a special path, or consult configuration to find the workspace state, this criterion fails.

Testable: a coding agent exploring the project directory structure for the first time should be able to locate the workspace state without being directed to it. The filename and path should make the artifact's purpose self-evident.

### ac-navigable-structure: Representation is organized for selective reading **(E)**

> **Center:** "Reason about" requires that the agent can locate relevant information within the representation efficiently -- an unstructured dump forces the agent to scan everything, degrading its ability to focus on what the user is asking about.

The representation must be organized so that an agent seeking information about a specific entity, a specific relationship, or a specific type of content can locate it without processing the entire state. The structure should group related information and separate distinct concerns (e.g., node inventory vs. connection topology vs. individual node content).

This criterion is **(E)** evaluate-and-iterate: it passes if the representation demonstrates a coherent organizational principle that an agent can navigate. The exact structure will be refined based on how effectively agents reason about real workspace states.

---

## Scope

### IN (building for V1)

- A readable representation of the complete workspace state, accessible outside the browser
- Automatic synchronization from canvas state to the readable representation
- Stable entity identifiers enabling cross-turn conversational reference
- Self-describing format requiring no external schema documentation
- Discoverable location within the project directory

### OUT (explicitly not building)

- Agent writing back to the canvas (modifying nodes, connections, or layout)
- Real-time streaming or push-based notification to the agent (the agent reads when it chooses)
- Any agent-side UI, dashboard, or visualization of workspace state
- Multi-user or multi-agent concurrent access
- Authentication, access control, or sharing permissions
- Any change to the canvas UI or user-facing workflow (this feature is invisible to the user's canvas experience)

### DEFERRED (future, strengthens the center, not V1)

- Attention signals: which node the user is currently editing or has selected
- Change tracking: what changed since the agent's last read
- Summarization or abstraction layers over the raw state (e.g., "pipeline summary" vs. full state)
- Multi-workspace awareness (observing more than one workspace)
- Historical state or workspace versioning
- Agent-initiated queries against workspace state (beyond reading the full representation)
- Optimized representation for very large workspaces (100+ nodes)

---

## Dependencies

These are existing capabilities this feature requires but does not itself build:

1. **Workspace state model**: The kernel already defines entities (WorkspaceNode, Connection, Position, Viewport) and the workspace structure. The feature depends on this model being complete and accurate.

2. **Persistence layer**: The current localStorage persistence writes workspace state on every mutation (with debounce). The feature depends on a persistence pathway that writes to a location accessible outside the browser. This may require extending or replacing the current StoragePort implementation.

3. **Stable entity identity in the kernel**: Nodes and connections must already have stable IDs assigned at creation time. If IDs are currently regenerated on serialization or are framework-internal (e.g., xyflow-assigned), this must be resolved.

4. **Canvas state as source of truth**: The domain state (managed by hooks and use cases) must be the authoritative representation of what is on the canvas. If xyflow maintains shadow state that diverges from domain state, the readable representation may not match what the user sees.

---

## User Scenarios

### Scenario 1: Debugging a broken pipeline

The user is building a context pipeline. They have a PDF node labeled "Research Paper" connected to a transform node labeled "Extract Key Points," which connects to a markdown node labeled "Summary Output." The transform runs but the summary output is empty.

The user switches to their terminal and says to the coding agent: "The transform connected to my PDF isn't producing output -- what's wrong?"

The coding agent, without being told anything about the canvas layout, reads the workspace state and sees the three nodes, their connections, and the transform's code. It identifies that the transform references an input field name that does not match what the PDF node produces. It responds by naming the specific nodes and the specific field mismatch.

The user did not describe their canvas. They did not export anything. They did not click "share." They pointed at a problem, and the agent already knew the territory. **(ac-external-readability, ac-structural-completeness, ac-automatic-currency, ac-self-describing-representation, ac-discoverable-location)**

### Scenario 2: Asking for design feedback on workspace organization

The user has been arranging a workspace with a dozen nodes in several clusters. They are unsure whether the structure makes sense. They switch to the terminal and ask: "Look at my current workspace -- does this pipeline structure make sense, or am I overcomplicating it?"

The coding agent reads the workspace state and sees all twelve nodes, their types, their connections, and how they form subgraphs. It provides feedback on the topology: "You have two separate pipelines that both feed into the same output node. The first pipeline has three transform stages, which could potentially be consolidated. The second pipeline has a node labeled 'Draft Ideas' that isn't connected to anything."

The user receives feedback that references specific nodes by their labels and describes the workspace's actual structure. The agent's response demonstrates that it is reasoning about the same arrangement the user is looking at. **(ac-structural-completeness, ac-stable-identity, ac-self-describing-representation, ac-navigable-structure)**

### Scenario 3: Iterative editing with ongoing conversation

The user is working on a pipeline and talking to the coding agent across multiple turns. In the first turn, the agent references a transform node by name. The user then edits that transform's code in the canvas, adds a new connection, and returns to the terminal: "OK, I updated the transform and connected it to a new source node. Does this look right now?"

The agent reads the updated state. It recognizes the same transform node (same identifier, updated content) and sees the new connection. It responds by describing what changed and evaluating the new configuration, without the user having to re-describe the entire workspace.

The conversation maintains continuity across turns because entity identifiers are stable. The user iterates rapidly because each turn starts from shared understanding, not from re-establishing context. **(ac-automatic-currency, ac-stable-identity, ac-structural-completeness)**

### Scenario 4: Agent discovers workspace state without being directed

A user opens a fresh terminal session with a coding agent in their project directory. They have not previously told the agent about the canvas or the workspace state feature. They ask: "Can you look at my canvas workspace and tell me what's on it?"

The agent explores the project directory, finds the workspace state file in a predictable location with a self-evident name, reads it, and describes the workspace contents: "Your workspace has four nodes -- two markdown nodes, one PDF, and one transform -- with three connections forming a linear pipeline."

The user did not provide a file path. The agent found the state through the same exploration behavior it uses to understand any project. **(ac-discoverable-location, ac-self-describing-representation)**
