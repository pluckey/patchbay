---
feature: tabbed-workspace-management
center: "Allow the user to partition their context-composition work into distinct, persistent scopes so that each scope remains legible and none is lost when attention moves to another."
center_test:
  excludes: "A minimap with zoom controls and spatial search within a single canvas — improves navigation within one scope rather than enabling partition into multiple scopes"
  boundary: "Workspace templates (pre-built empty layouts for common tasks) — scaffold hypothetical future work rather than solving the problem of an existing scope becoming illegible"
stage: whiteboard
intensity: standard
loop_iterations: 1
last_modified: 2026-04-05T00:00:00Z
---

## Center

Allow the user to partition their context-composition work into distinct, persistent scopes so that each scope remains legible and none is lost when attention moves to another.

## Center Test

**Exclusion test**: A minimap with zoom controls and spatial search within a single canvas is a good feature idea that this center *excludes*. That feature improves navigation within one scope rather than enabling partition into multiple scopes. It doesn't serve the center.

**Boundary discrimination**: Workspace templates (pre-built empty layouts for common tasks like "code review" or "writing project") *almost* qualify because they create new scopes. But the center specifies partitioning the user's actual *work* — accumulated, growing context that has outgrown a single scope. Templates scaffold hypothetical future work; they don't solve the problem of an existing scope becoming illegible. A spec serving this center should say no to templates as a core deliverable (though they could be a follow-on).

## Context

The tool has reached the point where the single-workspace model is failing under real use. This request signals that accumulated context from multiple projects or tasks has saturated one container, making it difficult to find signal in noise. The problem is accelerated by the fact that external agents can write into the workspace autonomously, increasing the rate of accumulation beyond what the user alone would produce. There is no urgency marker, but the request's arrival indicates the user has hit a practical wall — this is a "pull" request from lived experience, not a speculative "push."

Nothing in the tool currently addresses this. There is no workspace identity, no naming, no routing, no mechanism for partitioning. The entire application is built around the assumption of a single implicit workspace. The persistence layer, the state management, and the external integration surface all reflect this assumption.

## Intent

The user wants to open the tool and see a tab bar — probably along the top edge — with named labels like "Project Alpha," "Blog Post," "Code Review." They want to click a tab and have the canvas instantly switch to a different spatial arrangement of nodes. They want to click back and find everything exactly as they left it. They want to create a new tab when starting a new task and close one when a task is done.

The picture in their head is the browser tab model mapped onto the spatial canvas. It is a specific, concrete, visual expectation. The feeling they want is: clean separation between concerns, instant switching, named places they can return to, and the confidence that nothing is lost when they shift attention.

## Assumptions

1. **Workspaces are discrete.** The user assumes clean boundaries between workspaces — every node belongs in exactly one place, like documents in folders. But context composition is messier than filing. A style guide, a set of API conventions, a personality description for an AI — these might be relevant to every workspace. The filing-cabinet assumption doesn't surface the question of shared content.

2. **Switching is cheap.** In a browser, switching tabs is instant and cognitively free. But a spatial canvas stores meaning in *position* — the user builds a mental map of where things are. When switching away from a spatial layout, that mental map decays. Returning requires re-orientation. Tab-switching on a spatial canvas will feel more like walking into a different room than clicking a browser tab.

3. **The unit of organization is the workspace.** The user has already decided that "workspace" is the right granularity. But what if the natural unit is the task, the project, the conversation, or the thinking session? The user may be conflating "I need to separate my projects" with "I need tabs" when the underlying need might be served by a different unit of organization.

4. **Multiplicity won't change behavior.** The user assumes that adding workspaces simply gives them more of what they already have. But it changes the nature of the activity. With one workspace, everything goes in and composition is the primary activity. With multiple workspaces, every new piece of content forces a routing decision — "which workspace does this belong to?" The tool shifts from creative instrument to filing system. This is the deepest assumption: that partitioning is additive, not transformative.

5. **The relevant analogy is browser tabs.** Browser tabs manage flat documents. Spatial canvases manage two-dimensional arrangements with positional meaning. The analogy holds for the switching gesture but breaks for the content model. Tabs assume mutual exclusion (each tab is a separate world); spatial work often has connections that cross boundaries.

## Design Tensions

1. **Separation vs. Connection.** The entire motivation is to separate contexts, but intellectual work constantly discovers connections *between* contexts. A strict partition model walls off workspaces from each other. Users will eventually want to reference, link, or duplicate nodes across workspaces. But the moment cross-workspace references are allowed, the clean separation that motivated the feature is undermined. These goals pull in opposite directions.

2. **Organization vs. Creation.** Every minute spent managing workspaces — creating, naming, choosing which workspace receives a new node, rearranging the workspace list — is a minute not spent composing context. The management overhead must be near zero or the feature defeats its own purpose. But near-zero management means minimal structure, which means the partitioning isn't very useful. There is a direct tradeoff between organizational power and creative flow.

3. **Discoverability vs. Scalability.** With one workspace, there is nothing to discover — you open the tool and your work is there. With multiple workspaces, you need a way to find, list, search, and manage them. A tab bar works beautifully at 3 workspaces. It degrades at 15. It fails at 50. The design must serve the user with 3 workspaces and the user with 30, but those are fundamentally different interaction patterns that a single UI element struggles to accommodate.

4. **Instant Feel vs. Growing Data.** Switching between workspaces must feel instant — that is the core promise. But each workspace may contain substantial data (many nodes, connections, spatial state). As the number and size of workspaces grows, maintaining the feeling of instant switching becomes an engineering challenge that presses against the reality of data volume.

## Open Questions

1. **What is the default experience?** When a new user opens the tool for the first time, what do they see? One default workspace? A workspace chooser? This determines whether the feature is "opt-in partitioning" or a fundamental reorganization of the product's first-run experience. The panel did not reach consensus — Von Foerster argues the one-workspace experience should be preserved until the user explicitly creates a second, while Korzybski argues that the workspace concept should be visible from the start to set expectations.

2. **What happens to existing accumulated work?** Migration from one-workspace to many-workspaces is not a technical detail — it is a design decision. Does the existing work become "Workspace 1"? Is the user prompted to split it? Is it silently migrated? The transition moment is the most dangerous point in this feature's lifecycle because it disrupts the user's existing spatial memory.

3. **Can external processes target specific workspaces?** The system already allows external agents to write into the workspace. When there are multiple workspaces, must an external process specify which one it's writing to? This introduces workspace identity into the external integration surface, which has implications for addressability and shareability.

4. **What is the lifecycle of a workspace?** Workspaces are created, used, and then what? Archived? Deleted? Left to accumulate like browser tabs? Without a lifecycle model, the feature risks trading one form of clutter (too many nodes in one workspace) for another (too many stale workspaces in the tab bar).

5. **How is spatial memory preserved across switches?** Each workspace has its own spatial layout. Does the viewport position persist per workspace? If the user is zoomed into the bottom-right corner of one workspace and switches to another, where are they? Center? Last position? Getting this wrong makes switching feel disorienting rather than fluid.

6. **PANEL DISSENT — Emergent vs. declared boundaries.** Von Foerster argues that the ideal system would detect clusters of related nodes and *suggest* workspace splits, letting boundaries emerge from usage patterns. Korzybski counters that this is a research project, not a shipping feature — users need predictable, explicit control first. This disagreement is unresolved and affects how "workspace creation" is designed.

7. **PANEL DISSENT — Cross-workspace reference scope.** McLuhan insists cross-workspace references are a later problem and including them now contaminates the clean separation. Hofstadter insists the underlying data model must not make cross-workspace references impossible, even if no user-facing feature is built. The disagreement is about whether the *internal model* should be designed for isolation or for future porosity.

8. **PANEL DISSENT — Naming obligation.** Korzybski: names are essential handles without which workspaces are unnavigable. McLuhan: naming is a tax on the user that should be deferred. Hofstadter: auto-generate names from content, let users override. No consensus reached.

## Alternatives Considered

1. **Saved viewport bookmarks within one canvas.** Instead of separate workspaces, let users bookmark named viewport positions within a single infinite canvas. "Switching workspaces" is really jumping to a different spatial region. *Rejected as primary approach* because it provides no real isolation — nodes from one project visually bleed into another, and the single canvas still grows without bound. Could complement real workspaces as an intra-workspace navigation aid.

2. **Collapsible node groups on canvas.** Let users group nodes into named, collapsible clusters within one canvas. *Rejected as primary approach* because it doesn't scale — at dozens of groups, the canvas remains a single overwhelming field — and grouping is organizational overhead that competes with composition time. Could serve as a within-workspace organization feature.

3. **Separate browser tabs / URL-based routing.** Let each workspace be a different URL, using the browser's own tab management. *Rejected* because the tool loses awareness of its own multiplicity. There's no unified overview, no ability to build cross-workspace features later, and the application state management is duplicated across instances. Strategically limiting even if architecturally tempting.

4. **In-app tabbed workspaces (the proposed direction).** A tab bar within the application, each tab being a fully separate workspace with its own canvas state. *Selected* because it matches the user's expressed mental model, solves the immediate saturation problem, is a well-understood pattern requiring no user education, and can be extended toward more sophisticated models without being discarded.

## Non-Functional Context

**Audience.** The user is likely a solo practitioner or small-team member composing AI context for their own work. This is not a team-management feature. Optimize for single-user, multi-project workflows. Collaboration and sharing are not in immediate scope but should not be precluded.

**Scale.** Realistic range: 2-15 workspaces per user. The tab metaphor works well in this range. If targeting hundreds of workspaces, a different navigation paradigm would be needed, but that is not this user's situation.

**Performance.** Switching between workspaces must feel instant — sub-second or the feature fails its core promise. Inactive workspaces do not need to be held in memory, but the switch must not produce a visible loading state. Viewport position, zoom level, and scroll position must be restored exactly on return.

**Timeline.** Not stated, but the request's focused scope suggests the user expects a bounded feature, not a platform rearchitecture. The minimal version — named workspaces with tab switching — should be achievable as a concentrated effort. The persistence evolution (from single to multi-workspace storage) is the heaviest structural change.

**Infrastructure.** The persistence layer must evolve from one implicit scope to multiple named scopes. External integration endpoints must become workspace-aware. The polling and merge-on-save patterns must be scoped per workspace. These are consequential changes to the existing patterns but follow naturally from them.
