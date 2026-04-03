---
feature: feature-architect-v6
center: "Feature Architect v6 must protect deliberative depth as its primary value while reducing the wall-clock cost of translating finished, stable specs into verified code."
stage: design
intensity: deep
loop_iterations: 1
last_modified: 2026-04-03T00:00:00Z
---

# Design: Feature Architect v6

## System Decomposition

| ID | Name | Type | Action | Key Attributes | Traces to ACs |
|----|------|------|--------|----------------|---------------|
| da-jacobi-prompt | Jacobi Gate Prompt | prompt-template | Create (replace destroyer.md) | Inputs: whiteboard + requirements + center. Same 5 jurisdictional categories. Verdict can kick back either artifact. | ac-jacobi-gate, ac-deliberation-preserved |
| da-intent-reorder | Intent Phase Gate Reorder | phase-protocol | Modify | Move gate from Step 4 (before requirements) to after requirements roundtable (new Step 6). Reference prompts/jacobi-gate.md. | ac-jacobi-gate |
| da-round-target-wb | Whiteboard Prompt Round Target | prompt-template | Modify | Replace "AT LEAST 3 rounds" with soft target of 7 (standard) / 10 (deep). | ac-round-target |
| da-round-target-req | Requirements Prompt Round Target | prompt-template | Modify | Same one-line change. | ac-round-target |
| da-round-target-des | Design Prompt Round Target | prompt-template | Modify | Same one-line change. | ac-round-target |
| da-round-target-tasks | Tasks Prompt Round Target + Wave Instructions | prompt-template | Modify | Round target change + instruct panel to assign Files and Wave to each task. | ac-round-target, ac-task-wave-metadata |
| da-formats-wave | Wave Metadata Schema + Display Format | format-spec | Modify | New task fields: Files (list), Wave (integer). Wave Plan Display format. Jacobi gate verdict format. Intensity table round-target column. | ac-task-wave-metadata, ac-execution-plan-visible, ac-jacobi-gate, ac-round-target |
| da-execution-waves | Execution Phase Wave Protocol | phase-protocol | Modify (major) | Three sections: (1) Wave Planning — present execution plan, (2) Wave Execution — build-self-verify per task, (3) Wave Boundary Gate — verification + wwubd + attribution. | ac-parallel-self-verification, ac-wave-boundary-gate, ac-execution-plan-visible, ac-sequential-equivalence, ac-gate-failure-attribution |
| da-lint-p10 | Linter P10: Same-Wave File Overlap | lint-check | Create | FAIL if two tasks in same wave share a file. Preamble: if ANY task has Wave, ALL must. Skip in express mode. | ac-wave-consistency-lint |
| da-lint-p11 | Linter P11: Backward Wave Dependency | lint-check | Create | FAIL if task in wave N depends on task in wave M where M >= N. Skip in express mode. | ac-wave-consistency-lint |
| da-mechanism-wave-note | Mechanism Phase Wave Note | phase-protocol | Modify (minimal) | One sentence: tasks roundtable assigns Wave and Files for parallel execution planning. | ac-task-wave-metadata |
| da-skill-version | Skill Identity Update | protocol-identity | Modify | Version bump, protocol files table: destroyer.md -> jacobi-gate.md. | ac-jacobi-gate |

### Preserved (unchanged)

| ID | Name | Type | Action | Reason |
|----|------|------|--------|--------|
| da-preserve-spec-model | spec-model.md | spec-model | Preserve | Wave/Files are operational metadata, not structural elements |
| da-preserve-archive | archive-protocol.md | archive-protocol | Preserve | Archiving process unchanged |
| da-preserve-context | context-interface.md | context-interface | Preserve | Backward compatibility constraint |
| da-preserve-observations | OBSERVATIONS.md | observations | Preserve | Append-only by design |

## Relationship Map

```
INTENT PHASE (phases/intent.md) [da-intent-reorder]
  Step 1: Archive Search (unchanged)
  Step 2: Whiteboard Roundtable ──uses──> prompts/whiteboard.md [da-round-target-wb]
  Step 3: Whiteboard Checkpoint (unchanged)
  Step 4: Requirements Roundtable ──uses──> prompts/requirements.md [da-round-target-req]
       (moved from Step 5 — swapped with gate)
  Step 5: Lint + Self-Check (renumbered)
  Step 6: Jacobi Gate ──uses──> prompts/jacobi-gate.md [da-jacobi-prompt]
       (moved from Step 4, expanded jurisdiction)
       Can kick back to: Step 2 (whiteboard) OR Step 4 (requirements)
  Step 7: Checkpoint 1 (renumbered)

MECHANISM PHASE (phases/mechanism.md) [da-mechanism-wave-note]
  Step 1: Design Roundtable ──uses──> prompts/design.md [da-round-target-des]
  Step 2: Tasks Roundtable ──uses──> prompts/tasks.md [da-round-target-tasks]
       Produces tasks WITH Wave + Files metadata
  Step 3: Lint + Self-Check (now runs P10/P11) ──uses──> lint-spec.mjs [da-lint-p10, da-lint-p11]
  Step 4: Checkpoint 2 — includes Wave Plan Display [da-formats-wave]

EXECUTION PHASE (phases/execution.md) [da-execution-waves]
  Section 1: WAVE PLANNING
       Parse Wave assignments from tasks.md
       Display execution plan to user
       User confirms before execution begins
       Single-task waves → v5 sequential behavior

  Section 2: WAVE EXECUTION (per wave)
       For each task in wave (parallel if multi-task):
         Build (unchanged from v5)
         Self-Verify (isolated errors only)
         Mark complete

  Section 3: WAVE BOUNDARY GATE (after each multi-task wave)
       Run context module verification patterns
       Invoke /wwubd on files modified in wave
       Attribute violations to tasks via Files metadata
       Classify: isolated (one task's files) vs. emergent (spans tasks)
       Isolated → fix in place, continue
       Emergent → present to user with attribution

LINTER (lint-spec.mjs) [da-lint-p10, da-lint-p11]
  P1-P9: unchanged
  F1-F6: unchanged
  P10: same-wave file overlap (FAIL)
       Preamble: if any task has Wave, all must
       Skip: express mode OR no Wave fields
  P11: backward wave dependency (FAIL)
       Skip: express mode OR no Wave fields
```

## Behavior Plan

### Jacobi Gate Holistic Evaluation (ac-jacobi-gate)

The gate evaluates whiteboard and requirements as a PAIR. The 5 jurisdictional categories apply with richer evidence:

- **Center Incoherence**: checked against both artifacts
- **Missing Precondition**: does any AC assume something not established in the whiteboard?
- **Inverted Causality**: did requirements reverse a causal chain from the whiteboard?
- **Scope Impossibility**: checked against requirements (more concrete than whiteboard alone)
- **Self-Defeating Logic**: does any requirement, if implemented, undermine a whiteboard insight?

Verdict extended: `BLOCK` includes `kick_back: whiteboard | requirements`.

### Wave Boundary Gate Procedure (ac-wave-boundary-gate, ac-gate-failure-attribution)

At each multi-task wave boundary:

1. Run all verification patterns from context module
2. Invoke `/wwubd` on files modified in this wave
3. Collect all errors/violations
4. For each error, identify containing file(s)
5. Map files to tasks using Files metadata from tasks.md
6. Classify each error:
   - **Isolated**: contained within one task's file set
   - **Emergent**: spans files from multiple tasks
7. Isolated errors: fix immediately, log, continue
8. Emergent errors: present to user with full attribution

### Wave Plan Display (ac-execution-plan-visible)

Before executing any task, display the wave plan:

```
EXECUTION PLAN:
Wave 1 (parallel): t-entity-types, t-pure-transforms
  Files: src/kernel/entities/foo.ts, src/kernel/transforms/bar.ts
Wave 2 (sequential): t-port-definition
  Files: src/client/domain/ports/foo-port.ts
Wave 3 (parallel): t-storage-adapter, t-canvas-adapter
  Files: src/client/adapters/storage/foo.ts, src/client/adapters/canvas/bar.ts
```

User confirms before execution begins.

### Single-Task Wave Equivalence (ac-sequential-equivalence)

When a wave contains exactly one task: v5 behavior exactly. No wave boundary gate (nothing to check for cross-task coherence). wwubd runs only after multi-task waves.

### Express Mode Exclusion (ac-sequential-equivalence)

Express specs never receive wave metadata. P10/P11 skip in express mode.

## Verification Strategy

| AC | Method | Notes |
|----|--------|-------|
| ac-deliberation-preserved | Manual review | Verify intent.md and mechanism.md enforce sequential execution. Run a Standard spec through v6. |
| ac-jacobi-gate | Lint + manual | Test with deliberate whiteboard-requirements mismatch. Verify kick-back verdict. |
| ac-round-target | Prompt inspection | Verify 4 prompt files contain round target. Check formats.md intensity table. |
| ac-task-wave-metadata | Lint (P10 preamble) | Tasks with and without Wave/Files fields. |
| ac-wave-consistency-lint | Lint test cases | (1) Same-wave file overlap → P10 FAIL. (2) Backward dep → P11 FAIL. (3) No wave fields → pass. (4) Express → skip. (5) Mixed → P10 preamble FAIL. |
| ac-parallel-self-verification | Manual execution | Multi-task wave; verify self-verify before wave boundary. |
| ac-wave-boundary-gate | Manual execution | Multi-task wave; verify wwubd invoked; verify attribution. |
| ac-execution-plan-visible | Manual execution | Verify plan displayed before any task executes. |
| ac-sequential-equivalence | Manual + lint | All-sequential spec; verify v5 behavior. Express spec; verify no wave metadata. |
| ac-gate-failure-attribution | Simulated failure | Introduce error in multi-task wave; verify attribution and classification. |

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| R1: Jacobi gate false rejections | Low | Medium | 5 categories unchanged; more evidence helps precision |
| R2: Undeclared cross-wave dependencies | Medium | Medium | Wave boundary gate catches empirically — defense in depth |
| R3: Tasks prompt cognitive overload | Low | Low | Files/Wave simpler than existing Traces/Depends |
| R4: Cross-file reference inconsistency | Medium | High | Explicit consistency verification task after all edits |
| R5: Jacobi gate timing (wasted requirements when whiteboard is flawed) | Low | Low | Whiteboard checkpoint already catches fatal issues |
