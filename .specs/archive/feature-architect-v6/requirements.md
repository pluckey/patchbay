---
feature: feature-architect-v6
center: "Feature Architect v6 must protect deliberative depth as its primary value while reducing the wall-clock cost of translating finished, stable specs into verified code."
stage: requirements
intensity: deep
loop_iterations: 1
last_modified: 2026-04-03T00:00:00Z
---

# Requirements: Feature Architect v6

## Acceptance Criteria

### ac-deliberation-preserved: Deliberation process unchanged except for evidence-based refinements
> **Center:** Protects deliberative depth by preserving sequential deliberation while allowing targeted improvements backed by empirical data from 481 roundtable sequences

The Intent phase (whiteboard, Jacobi gate, requirements) and the Mechanism phase (design, tasks) remain sequential. Roundtable artifacts, user interactions, and phase ordering are unchanged from v5. Two evidence-based refinements are permitted: (1) the Destroyer is refactored into a Jacobi inversion gate with expanded jurisdiction, and (2) roundtable prompts adopt a data-informed round target. No other deliberation steps are added, removed, or reordered.

FAILS when: v6 changes the phase order. v6 removes any deliberation step. v6 adds deliberation steps beyond the Jacobi gate expansion. v6 changes which artifacts are produced.

---

### ac-jacobi-gate: Jacobi inversion gate replaces the Destroyer with expanded jurisdiction
> **Center:** Protects deliberative depth by applying inversion thinking ("what would make this fail?") at both intent-level checkpoints, catching structural flaws in requirements that the whiteboard-only Destroyer could not reach

The Destroyer gate is refactored as a Jacobi inversion gate. The adversarial persona applies Carl Gustav Jacob Jacobi's principle — "invert, always invert" — to find the fatal assumption that kills the feature. The five jurisdictional categories (center-incoherence, missing-precondition, inverted-causality, scope-impossibility, self-defeating-logic) are preserved. The gate's jurisdiction expands: it evaluates the whiteboard (as before) AND the requirements. If the gate finds a structural flaw in either artifact, it can kick back the affected artifact for revision before proceeding.

FAILS when: The adversarial gate evaluates only the whiteboard and not the requirements. The gate cannot reject requirements that contain structural flaws. The five jurisdictional categories are removed or weakened.

---

### ac-round-target: Roundtable prompts use an empirically-derived soft target of 7 rounds
> **Center:** Protects deliberative depth by calibrating round count to the empirically observed novelty curve — rounds 1-7 produce 75%+ novel content, rounds 8+ are primarily synthesis — ensuring deliberation is deep enough without wasting time on convergence

Roundtable prompts specify a soft target of 7 rounds for standard deliberations (3-expert panels). For deep deliberations (4+ experts), the target extends to 10 rounds. These are targets, not caps — deliberation may extend beyond the target if a genuine reframe or unresolved disagreement emerges, but the default expectation is convergence by the target. The current "AT LEAST 3 rounds" floor is replaced.

FAILS when: Roundtable prompts specify fewer than 7 rounds as the target. The target is treated as a hard cap that prevents extension when genuine novelty is still emerging. The target is ignored and roundtables routinely run 15+ rounds without justification.

---

### ac-task-wave-metadata: Tasks declare file scope and wave assignment
> **Center:** Enables parallel dispatch by giving each task an explicit, lintable scope boundary — without this metadata, wave-based parallelism has no foundation

Every task in tasks.md declares two additional fields: (1) the files it will create or modify, and (2) the wave it belongs to. The wave is a positive integer indicating execution order. The files list is a contract: the task commits to modifying only the declared files.

FAILS when: A task in tasks.md lacks a Files field or a Wave field. A task's Files field is empty.

---

### ac-wave-consistency-lint: Linter validates wave structure against the dependency graph
> **Center:** Prevents parallelism from introducing interference by catching structural violations before execution begins — this is the static guarantee that makes parallel dispatch safe

The spec linter rejects any spec where: (a) two tasks in the same wave declare one or more overlapping files, or (b) a task depends on another task in the same or later wave. These are structural failures, not flags — they block execution.

FAILS when: The linter accepts a spec where same-wave tasks share a declared file. The linter accepts a spec where a task's dependency is assigned to the same wave or a later wave.

---

### ac-parallel-self-verification: Parallel tasks resolve their own isolated errors before the wave boundary
> **Center:** Reduces wall-clock cost of error correction by catching cheap, common errors at the shortest possible feedback loop — without this, trivially broken code delays detection until the expensive wave boundary gate

Each task executing in parallel must detect and fix errors that are identifiable without reference to other tasks' work before submitting its output to the wave boundary. Code with errors detectable in isolation (syntax errors, type errors, broken imports) does not reach the wave boundary gate.

FAILS when: The wave boundary gate receives code from a parallel task that fails to compile or contains errors that the task could have detected independently.

---

### ac-wave-boundary-gate: Cumulative verification runs at every wave boundary
> **Center:** Ensures verified code by detecting emergent violations — issues that arise from combining parallel work — at the earliest point where they become visible, before dependent waves consume the output

After all tasks in a wave complete, verification runs against the full cumulative codebase state (not just the wave's changes in isolation). For waves containing multiple tasks, this verification includes an architectural review assessing whether the combined changes maintain structural integrity. The next wave does not begin until the current wave's gate passes.

FAILS when: A wave completes and the next wave begins without cumulative verification running. A multi-task wave completes without architectural review. A gate failure is ignored and subsequent waves proceed.

---

### ac-execution-plan-visible: Wave assignments are shown to the user before execution begins
> **Center:** Protects deliberative depth by extending human oversight to the execution plan — the wave assignment is a claim about task independence, and human review catches false independence claims that formal validation misses

The user sees task wave assignments before execution begins. This allows the user to identify wave groupings that look wrong (tasks that should not run in parallel, tasks that seem to have hidden dependencies). The user does not need to formally approve waves, but must have seen them.

FAILS when: Execution begins and the user has not been shown which tasks belong to which waves.

---

### ac-sequential-equivalence: Fully dependent task lists execute identically to v5
> **Center:** Protects deliberative depth as an unconditional guarantee — the parallelism optimization must be additive, never regressive, so features that cannot parallelize pay no penalty

When every wave contains exactly one task (all tasks are fully dependent), execution follows v5's build-verify-amend loop with no behavioral difference. No new gates, no new overhead, no new interactions. The protocol degrades gracefully to its predecessor when parallelism offers no benefit.

FAILS when: A feature with all-sequential tasks takes longer in v6 than v5 due to new overhead. A single-task wave introduces steps not present in v5 execution.

---

### ac-gate-failure-attribution: Wave boundary failures identify responsible tasks and failure type
> **Center:** Reduces wall-clock cost of rework by enabling targeted correction — attributing failures to specific tasks avoids the expensive alternative of re-executing the entire wave

When a wave boundary gate detects a violation, the failure report identifies: (a) which specific task or tasks caused the violation, and (b) whether the violation was isolated to one task's output or emergent from the combination of multiple tasks' outputs. This attribution determines the correction path: rework the specific task, re-sequence conflicting tasks into separate waves, or escalate as a spec-level issue.

FAILS when: A wave boundary gate reports a violation without identifying which task(s) are responsible. A gate failure provides no classification of whether the issue is isolated or emergent.
