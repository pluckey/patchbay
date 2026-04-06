---
feature: postgres-persistence
center: "Replacing the storage foundation of a single-user workspace tool so it can survive deployment, without fragmenting the workspace's integrity as a single coherent artifact or introducing operational complexity disproportionate to its current and near-future needs."
center_test:
  excludes: "Adding real-time collaborative editing — good feature, but requires conflict resolution and concurrent-write coordination that serve multi-user needs, not single-user deployment readiness."
  boundary: "Adding per-node save granularity — almost serves the center (smaller writes, less data at risk) but fragments the workspace's coherence as a single artifact, allowing inconsistent states between nodes."
stage: whiteboard
intensity: standard
loop_iterations: 1
last_modified: 2026-04-04T00:00:00Z
---

## Center

Replacing the storage foundation of a single-user workspace tool so it can survive deployment, without fragmenting the workspace's integrity as a single coherent artifact or introducing operational complexity disproportionate to its current and near-future needs.

## Center Test

**Exclusion test:** Adding real-time collaborative editing (multiple users editing the same workspace simultaneously) is a good feature idea that this center excludes. Collaboration requires conflict resolution, operational transforms or CRDTs, and presence indicators — all of which serve multi-user needs, not the single-user deployment readiness the center addresses. If someone proposes concurrent-write handling during this migration, the center says no.

**Boundary discrimination:** Adding per-node save granularity — saving individual nodes independently rather than the whole workspace — almost serves the center but should be rejected. It sounds like it improves persistence (smaller writes, less data at risk), but it fragments the workspace's integrity as a single coherent artifact. If nodes save independently, the workspace can exist in an inconsistent state: some nodes at version N, others at N+1. The center specifically guards against this fragmentation. Per-node granularity is a performance optimization that breaks coherence; it can be reconsidered later when actual performance data demands it.

## Context

The system has reached a structural inflection point. It works — five node types, pipeline execution, AI integration, server-side persistence. This is no longer a prototype. The current storage mechanism (monolithic file writes) is adequate for local development but creates a hard ceiling: the tool cannot be deployed to any standard hosting environment because it depends on writable local filesystem access.

Three prior architectural decisions are load-bearing:

1. The port abstraction layer was designed explicitly to make storage swappable. This was intentional preparation, not accidental.
2. A versioned envelope system (currently at version 7) provides a working schema evolution mechanism. This developer has thought carefully about data shape changes over time.
3. The system has already survived one storage migration (from browser-local storage to server-side filesystem). That prior migration was successful but introduced architectural violations that required a subsequent cleanup pass. The developer has direct experience with both the possibility and the cost of storage migration.

The analogical structure is clear: this is the second storage migration. The first established patterns and revealed pitfalls. The second should learn from the first — particularly the lesson that storage migrations create structural pressure toward architectural violations, even when the developer knows the rules.

## Intent

The user wants three things, stated explicitly: (1) replace file-based storage with a relational database, (2) align that database's structure with a specific hosted platform so deployment is a connection-string change rather than a re-architecture, and (3) ensure the migration respects the established architectural principles — it should be a clean adapter swap, not an architectural violation.

The picture in the user's head is a clean, almost surgical operation: write a new adapter that implements the existing port interfaces, backed by a relational database instead of the filesystem. The port boundary insulates everything upstream — hooks, components, use cases — from the change. The workspace keeps working exactly as it does now, but the bytes land in database tables instead of a file. When deployment day comes, the managed database is already structurally compatible, so "deployment" is just a configuration change.

This is an optimistic picture. It assumes the port boundary is a perfect insulator. It assumes the relational decomposition maps cleanly onto the existing data shape. It assumes the operational surface area of a database is containable within an adapter.

## Assumptions

1. **That the port abstraction is a sufficient boundary.** The user assumes that because the storage interface defines load and save, any implementation behind those methods is equivalent. But a file write and a database transaction are not equivalent operations. They fail differently, they have different latency profiles, they have different consistency guarantees. The port hides these differences, but hiding is not eliminating.

2. **That relational decomposition is the natural next step.** The user assumes "production database" means "relational tables with a normalized schema." But the data is a document — a workspace with embedded nodes and connections. A document-oriented approach (even within a relational database, using its document-storage capabilities) might preserve the workspace's coherent-artifact nature more faithfully than normalization. The assumption that relational equals production is a cultural inheritance from enterprise computing, not a structural necessity of this problem.

3. **That platform alignment is a stable target.** The user assumes that designing for a specific platform's current patterns will pay off at deployment time. But platforms evolve. The stronger bet is keeping the storage abstraction clean rather than optimizing for one platform's current shape.

4. **That operational complexity stays behind the adapter.** Connection management, migration tooling, schema versioning, backup strategies, index tuning — none of these exist in the current system. The user may assume these are adapter concerns. They are system concerns that reshape development workflow, deployment processes, and failure modes.

5. **That the prior migration is a reliable guide.** The first migration was successful but introduced violations. The user may assume greater care will prevent this. But the violations were not carelessness — they were structural pressures inherent in the migration itself. A database migration will create different but equally strong pressures.

**Governing analogy**: Moving from a notebook to a filing cabinet. A notebook keeps everything together — you flip pages, everything is in order, nothing is lost separately. A filing cabinet lets you organize by category, but now you must maintain the filing system, and a document can be in only one drawer. The question is whether the workspace needs to become a filing cabinet or just needs a notebook that can travel.

## Design Tensions

1. **Coherence vs. Decomposition.** The workspace is a single coherent artifact — nodes, connections, viewport are structurally bound. A relational database's fundamental operation is decomposition into independent tables. These goals are in tension. Every normalization choice creates a new way for the artifact to become incoherent. The tension is not resolvable; it must be managed through deliberate choices about where to decompose and where to preserve unity.

2. **Present Simplicity vs. Future Capability.** The system currently needs: load one workspace, save one workspace, store some blobs. This is almost trivially simple. The user wants a foundation that supports future needs (multi-workspace, possibly multi-user, production reliability). But every capability added for the future is complexity paid for in the present. The more "production-ready" the foundation, the more it resembles a system that needs a team to operate — but the whole point is that one person builds and uses it.

3. **Platform Alignment vs. Platform Independence.** The user wants to align with a specific hosted platform to smooth deployment. But alignment with one platform is misalignment with all others. The established architectural principle says "depend on abstractions, not concretions." Aligning with a specific platform's patterns is the opposite of deferring decisions. The resolution likely involves choosing a LEVEL of alignment — compatible but not coupled.

4. **Visibility vs. Abstraction.** The current system is transparent — you can read the stored data directly, debug by inspection. A database is opaque — you need specialized tools, the data is spread across structures, the abstraction layers obscure what is stored. The established design principles promote abstraction (ports, adapters). But debugging, developing, and understanding a system requires visibility. For a single developer who is also the operator, this tension is acute.

5. **Schema Evolution Strategy Conflict.** The current system uses a versioned envelope with read-time migration (load old data, detect version, transform to current shape). Relational databases use a fundamentally different evolution model: write-time migration via schema changes. The user must either maintain both evolution strategies (creating two sources of truth about the data's shape) or abandon the proven envelope system. Neither option is clean.

## Open Questions

1. **How far should the relational decomposition go?** The workspace could be stored as a single document column (minimal decomposition), as fully normalized tables (maximal decomposition), or somewhere in between. The answer depends on what queries the system needs to perform. If the only operations are "load the whole workspace" and "save the whole workspace," full normalization buys nothing and costs coherence. If future features need to query individual nodes, normalization becomes useful — but those features are speculative. **The panel did not reach consensus.** Hofstadter, Korzybski, and von Foerster favor minimal decomposition (document-in-a-column) as coherence-preserving and extensible. McLuhan warns that using a relational database to store documents is "the worst of both worlds — the operational overhead of a database with the querying limitations of a document" and that if you resist the relational medium's nature, you should question whether you need it at all.

2. **What happens to the versioned envelope pattern?** This is a working schema evolution system. Does it get replaced by database migration scripts, wrapped so it operates on top of them, or maintained in parallel? Korzybski argues the envelope should be preserved as the "semantic migration" layer while database migrations handle structural changes. McLuhan argues that maintaining two migration systems invites them to disagree, and one authoritative strategy must be chosen.

3. **What is the actual deployment timeline?** "Anticipating production" is not a timeline. If deployment is months away, urgency is low and the system should optimize for development velocity now. If deployment is weeks away, urgency is real and shortcuts become rational. The right design depends on the answer.

4. **What does operations look like after migration?** Currently there is no operations burden. After migration, there is a database to manage — backups, monitoring, connection limits, disk usage. Does the target hosted platform absorb all of this, or only some? For a single developer, new operational responsibilities directly compete with feature development time.

5. **Should the filesystem adapter remain operational as a fallback?** The panel unanimously recommends keeping both storage adapters functional. The port interface makes this architecturally clean. Having a fallback prevents the migration from being a one-way door.

## Alternatives Considered

1. **Stay on filesystem, use platform-provided persistent volumes.** Some deployment platforms offer persistent storage. Zero code changes required. Rejected because: persistent volumes are unreliable on many hosting platforms, don't survive certain container lifecycle events, and the user has explicitly chosen to move to a relational database. However, this option's simplicity makes it worth acknowledging.

2. **Use a document database instead of relational.** The data IS a document. A document store would preserve coherence naturally. Rejected because: the user wants alignment with a specific hosted platform that is relational. Also, a document database introduces its own operational complexity and ecosystem.

3. **Skip the local database step — go directly to the hosted platform's cloud storage.** Eliminate the intermediate step entirely. Rejected because: this eliminates local development independence. The user would need network access to develop and would be coupled to the platform immediately.

4. **Document-in-relational as a stepping stone.** Store the workspace as a document column now, normalize later only if specific queries demand it. Favored by three of four panelists as coherence-preserving, minimally complex, and extensible. McLuhan's dissent is recorded above.

5. **Do nothing — keep the file, solve deployment differently.** Use a container with a mounted volume or a deploy-time synchronization step. The panel acknowledges this is a legitimate option the user may not have fully considered. It has a lower ceiling for production robustness but a dramatically lower floor for present-day complexity.

## Non-Functional Context

**Timeline**: Preparation, not emergency. The language "anticipating production" suggests forward planning rather than imminent deployment. The design should favor thoroughness and reversibility over speed.

**Audience**: One developer, one user, same person. No team, no external users today. This means: no need for migration tooling others must understand, no need for documentation beyond personal notes, no concurrent access patterns, no role-based considerations. But it also means: every hour spent on infrastructure is an hour not spent on features, and there is no one else to share the operational burden.

**Scale**: Trivially small. One workspace, likely dozens of nodes (not thousands), connections proportional to nodes, binary content measured in single-digit megabytes. Any persistence solution that handles a few megabytes of structured data and tens of megabytes of binary content is adequate. Performance is not a meaningful constraint at this scale.

**Infrastructure**: The target hosted platform provides a managed relational database, which outsources operational burden (backups, monitoring, uptime) in production. For local development, the user will need a local database instance — a new development dependency but a manageable one, especially if the platform provides tooling for local development.

**Developer experience**: The most important non-functional consideration. Every new concept (migration files, connection configuration, schema definition language, query builders) is cognitive load competing with feature development. The migration should minimize new concepts introduced. The ideal: a storage interaction that feels as direct as reading and writing a file, even though the medium has changed.
