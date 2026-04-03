---
feature: server-side-state
center: "Making the workspace a self-standing, persistent artifact — not a derivative of any single interface — so that any authorized process can access it directly."
center_test:
  excludes: "Real-time collaborative editing — good feature, but requires conflict resolution and concurrent-write coordination that don't serve independent accessibility."
  boundary: "Exporting the workspace as a static file that the agent can read — almost serves the center but fails because a static export is a derivative snapshot, not the authoritative source."
stage: whiteboard
intensity: standard
loop_iterations: 1
last_modified: 2026-04-03T00:00:00Z
---

## Center

Making the workspace a self-standing, persistent artifact — not a derivative of any single interface — so that any authorized process can access it directly.

## Center Test

**Exclusion test:** "Adding real-time collaborative editing" is a good feature that this center excludes. Collaboration requires conflict resolution, presence awareness, and concurrent-write coordination — none of which serve the goal of making the workspace independently accessible. The center is about independent existence and direct readability, not simultaneous multi-writer coordination.

**Boundary discrimination:** "Exporting the workspace as a static file that the agent can read" almost serves this center. It makes the workspace accessible to another process. But it fails the "not a derivative" clause — a static export is a snapshot, a copy, a projection. It is the same structural error as the previously rejected file-projection approach. The workspace must be the authoritative source, not a replica of it.

## Context

**Why now?** The user has a working spatial workspace for composing AI context. A CLI coding assistant needs to see what the user has composed in order to provide informed help. The current design makes this impossible: the workspace exists only inside the browser's private storage, invisible to any external process.

**What was tried?** A previous approach attempted to solve this by projecting browser state to a local file. An adversarial audit found this fragile: the projection mechanism itself was unreliable, write failures were silent, and the approach added a translation layer without solving the root cause. The insight that followed was that the projection problem dissolves entirely if the workspace simply exists somewhere the agent can already reach.

**What exists that is related?** The codebase already separates "what a workspace is" from "how it is stored" through abstract interfaces. The storage mechanism is already behind a clean boundary — the question is whether a new implementation behind that same boundary could point at a persistent, externally-readable location instead of browser-local storage.

## Intent

The user wants one thing immediately: their AI coding assistant should be able to see the workspace without the user having to manually describe it. The picture in their head is: "I arrange context on my canvas, and when I ask my coding agent for help, it already knows what I'm looking at."

Beyond that, the user sees this migration as a foundation that unlocks a class of future possibilities — accessing the workspace from different machines, potentially sharing it, potentially letting the agent write back into it. But these are listed as future capabilities, not current requirements.

The phrase "making the client strictly presentation" reveals the user's mental model: a clean separation where the workspace's truth lives in one authoritative place, and the browser is just a viewport into it.

## Assumptions

1. **The user assumes the storage boundary is the only thing that needs to change.** Because the codebase already abstracts storage behind interfaces, the user believes this is a "swap the adapter" operation. This may underestimate how deeply the current design assumes synchronous, zero-latency access to state. Moving to a remote source of truth introduces latency, failure modes, and asynchronous flows that ripple beyond the storage boundary.

2. **The user assumes "strictly presentation" is desirable.** But spatial workspaces depend on immediate, sub-frame responsiveness for dragging, connecting, and resizing. The client MUST retain local intelligence for interaction — what changes is the source of truth, not the site of interaction. "No local source of truth" is not the same as "no local state."

3. **The user assumes the workspace is a single artifact.** Currently it is: one workspace, one user, one browser. But the moment the workspace exists independently, questions emerge: Can there be more than one? Does it have an identity? A name? A lifecycle? The user may not have considered that "persistent artifact" implies "managed artifact."

4. **The user assumes the agent needs only READ access.** This is correct for the immediate problem. But the "future capabilities" list includes agent write-back, which is a fundamentally different category of access with different safety requirements.

5. **The user assumes they will remain the sole user.** This simplifies everything — no authentication, no authorization, no conflict resolution. But it means the design will be shaped by single-user assumptions that may be expensive to revisit later.

## Design Tensions

**Responsiveness vs. Authority.** The workspace must feel immediate and tactile (the user is spatially arranging thought), but the source of truth must be remote and durable. These goals pull in opposite directions. Every interaction that currently completes in microseconds (local storage write) will now involve a remote persistence step. The system needs a pattern that preserves creation-speed locally while ensuring the remote copy is authoritative and current.

**Simplicity now vs. Flexibility later.** The user is one person solving one problem (agent readability). But they've named three future capabilities that each imply very different infrastructure. Designing only for today risks a second migration later. Designing for tomorrow risks over-engineering a system that may never need collaboration or write-back. How much structural investment does a single-user tool warrant against speculative future needs?

**Private thinking space vs. Observable artifact.** Right now, the workspace is a private cognitive tool — the user arranges thoughts freely without concern for legibility. The moment an external observer (even a friendly agent) can see the workspace, the user's relationship to it changes. They may begin composing for the observer rather than for themselves. The tool shifts from thinking aid to communication medium.

**Independence vs. Coupling.** Making the workspace independent of the browser is the goal. But if the workspace becomes dependent on a server process running, then a different coupling has been introduced. A tool that worked offline in a browser now requires a running service.

## Open Questions

1. **What does the agent actually need to see?** The full workspace structure? A summary? The content of specific nodes? Understanding the agent's read pattern determines how the workspace should be exposed.

2. **How current must the agent's view be?** Real-time state (mid-edit) or eventual consistency (a few seconds old)? This determines whether persistence needs to be synchronous with every edit or can lag behind.

3. **What happens when the server is unavailable?** Currently the workspace always works because it is entirely local. If the source of truth moves to a server, what happens during downtime? Does the client degrade to local-only mode?

4. **Should the workspace have an identity?** Currently "the workspace" is an anonymous blob in browser storage. If it becomes a persistent artifact, does it get a name? An ID? Can there be multiple workspaces?

5. **What is the boundary between "the workspace" and "the rendering of the workspace"?** The current workspace includes viewport position, node dimensions, and visual layout information alongside semantic content. When the agent reads it, does it need viewport state?

6. **Is the 300ms debounce appropriate for remote persistence?** Local storage is fast and free. Remote persistence may have different cost and latency characteristics.

7. **Does "authorized process" need to be defined now?** The moment a workspace is addressable from outside the browser, the question of who can access it exists whether or not it's answered.

## Alternatives Considered

**File-based projection (previously rejected).** The browser writes workspace state to a local file that the agent reads. Rejected because: the projection mechanism is fragile, silent failures are undetectable, and the file is a derivative copy (not authoritative).

**Structured file on disk (JSON/SQLite).** The workspace persists to a local file that both browser and agent can read. But this still requires a browser-to-filesystem bridge — the same projection problem with a different target.

**Expose browser storage directly to the agent.** Give the agent a way to read localStorage or IndexedDB. Technically possible but deeply fragile, requires browser to be running, ties agent to browser internals.

**Server-side persistence with a lightweight interface.** The workspace persists to server-managed storage. The browser saves to the server instead of local storage. The agent reads from the server instead of the browser. This dissolves the projection problem: one source of truth, both parties access it through their natural channels. This is the approach the user is pursuing.

**Hybrid: local-first with server sync.** The browser remains primary store, state replicated to server in background. Preserves offline capability and local responsiveness while making state externally available. More complex than pure server-side, but avoids latency and availability concerns.

## Non-Functional Context

**Audience:** One developer, one AI coding assistant. No other users anticipated near-term.

**Scale:** Single workspace, dozens of nodes (not thousands). Text-heavy with occasional binary attachments. Under 50MB total.

**Performance:** Creation experience must remain instantaneous. Persistence latency is acceptable as long as it doesn't block interaction. Agent's read access can tolerate seconds of staleness.

**Infrastructure:** Running locally on a single machine. The "server" is a local process, not cloud deployment. Client-server distance is localhost.

**Reliability:** Current system has beforeunload flush to prevent data loss. Replacement must provide equivalent or better durability. Losing work is unacceptable.

**Complexity budget:** Sole developer. Every hour of infrastructure is an hour not spent on the workspace experience. The solution should be the simplest thing that makes the workspace readable by the agent, with clean extension points for future needs but no premature build-out.
