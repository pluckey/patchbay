---
feature: external-write-durability
center: "External processes can add nodes and connections to a live workspace without the browser's save cycle erasing them."
center_test:
  excludes: "Real-time collaborative editing between two browser users — good feature, but this is about CLI/API to browser sync, not browser to browser"
  boundary: "An external process reading the workspace state — already solved by server-side-state; this center requires the external write to survive"
stage: requirements
intensity: focused
loop_iterations: 1
last_modified: 2026-04-05
---

## Acceptance Criteria

### ac-external-write-durability: Externally-written items are never removed except by explicit user deletion
> **Center:** Once an external process writes a node or connection and receives acknowledgment, no browser operation — save, poll, detection, reload, or tab close — can erase it. Only the user can.

An external node or connection, once written to the shared store, must persist through: any number of browser saves (regardless of timing or frequency), detection cycles, user edits to other nodes, page reloads, and browser tab close/reopen. The only way an externally-written item disappears is explicit user deletion through the same mechanism used to delete any other item. This guarantee is structural, not probabilistic — the system must be incapable of the erasure, not merely unlikely to produce it.

### ac-deletion-survives: User-initiated deletions are not reversed by the system
> **Center:** The system remembers what the user deleted so that the save cycle does not resurrect it, even across sessions.

When a user deletes a node or connection, the deletion persists through save cycles and across browser sessions. The system must maintain enough information to distinguish "item the browser has never seen" from "item the user explicitly deleted." An item that was deleted and then re-written by an external process with the same ID is treated as a new write (the external process wins).

### ac-external-visibility: Externally-added items appear in the browser without user action
> **Center:** The browser detects and renders externally-added items within a bounded time, completing the write-to-display loop.

When an external process adds a node or connection, that item must appear in the browser's rendered workspace within 5 seconds. No user action is required — no refresh, no click, no tab switch. The item appears at the position specified by the external process.

### ac-no-duplicate-absorption: Repeated detection produces no duplicate items
> **Center:** Detection is idempotent — absorbing the same external item across multiple cycles does not multiply it.

When the browser detects externally-added items, it must not create duplicates regardless of how many detection cycles occur. An item whose ID matches one already in the browser's state is silently ignored.

### ac-detection-responsiveness: Detection latency feels live **(E)**
> **Center:** The time between external write and browser appearance supports a "shared surface" mental model, not periodic batch sync.

Evaluate whether the achieved detection latency feels natural in the primary workflow: a user working with a CLI tool that adds nodes, then glancing at or switching to the browser. The 5-second bound in ac-external-visibility is the functional maximum; this criterion evaluates whether the actual latency is deliberate and documented.

## Scope

**IN:**
- Externally-added nodes and connections persist through browser save cycles
- Browser automatically detects and renders externally-added items
- User deletions are not reversed by save/detection cycles
- Existing browser save behavior is unchanged for browser-originated nodes
- Duplicate-ID writes from external processes are silently ignored

**OUT:**
- External modification of existing node content (requires conflict resolution)
- External deletion of nodes (requires deletion-propagation protocol)
- Browser-to-browser collaborative editing
- Offline or server-unreachable operation
- Concurrent external writers (multiple CLI sessions simultaneously)
- New external-facing API (the existing merge endpoint is the interface)

**DEFERRED:**
- Visual indication of newly-arrived external nodes
- Performance optimization for large workspaces
- Conflict resolution for concurrent edits to the same node

## Dependencies

- Merge API endpoint (POST /api/workspace/merge) — the existing entry point for external writes
- Server workspace file storage — the shared artifact both browser saves and external writes target
- Storage port interface and adapter — the browser's save mechanism
- Workspace persistence hook — manages debounced save, detection, and browser-close handling

## User Scenarios

**sc-cli-adds-context:** A developer uses a CLI tool to write three nodes through the merge API. The developer switches to the browser. Within seconds, three new nodes appear. The developer drags one, types in another, connects two. Throughout — each action triggering saves — the CLI-added nodes remain. (ac-external-write-durability, ac-external-visibility)

**sc-rapid-sequential-writes:** A CLI tool writes a source node, a processing node, then a connection, each a second apart. Nodes appear in sequence. No duplicates. (ac-no-duplicate-absorption, ac-external-visibility)

**sc-delete-and-reopen:** The developer deletes a CLI-added node, then closes and reopens the browser. The deleted node stays deleted — it is not resurrected. (ac-deletion-survives)

**sc-write-during-edit:** The developer is typing in a node when the CLI writes a new node. Typing is not interrupted. The save triggered by the keystroke does not erase the CLI-added node. (ac-external-write-durability, ac-external-visibility)

**sc-delete-then-new-write:** The developer deletes node X. Later, the CLI writes a new node Y. Node X stays deleted. Node Y appears and persists. (ac-deletion-survives, ac-external-write-durability)
