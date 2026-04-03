---
feature: feature-architect-v6
center: "Feature Architect v6 must protect deliberative depth as its primary value while reducing the wall-clock cost of translating finished, stable specs into verified code."
center_test:
  excludes: "Parallelizing the design and requirements roundtables — good optimization idea, but sacrifices the deliberative depth that IS the value"
  boundary: "Fugal entry where the tasks roundtable begins once design atoms are established but before design verification completes — serves speed but breaks when the destroyer/gate invalidates the foundation"
archetypes: [quality-gate, pipeline-decomposition]
stage: whiteboard
intensity: deep
loop_iterations: 1
last_modified: 2026-04-03T00:00:00Z
---

# Whiteboard: Feature Architect v6

## Panel

- **Alfred Korzybski** — General semantics, map-territory distinction
- **Douglas Hofstadter** — Strange loops, self-reference, emergent complexity
- **Heinz von Foerster** — Second-order cybernetics, eigenform theory
- **Marshall McLuhan** — Media theory, "the medium is the message"

## Strongest Consensus

All four experts, from radically different intellectual frameworks, converged on a sharp asymmetry: **deliberation phases (Intent, Mechanism) must stay strictly sequential; execution (Phase 3) is the parallelism opportunity.** Cross-phase parallelism was unanimously rejected — not as impractical, but as fundamentally at odds with what makes the protocol valuable. The deliberation IS the value; you cannot safely parallelize the thing that produces the value.

The quality gate question resolved similarly: gates belong in execution, not in deliberation. Deliberation already has its own convergence mechanisms (roundtables, destroyer, checkpoints). Adding wwubd to deliberation phases would be redundant ceremony.

## Key Reframes

### 1. Semantic Dependency > Data Dependency (Korzybski)

The naive analysis asks "does Phase B consume Phase A's output?" But the real question is: **"If Agent A discovers something surprising, would Agent B need to know?"** Whiteboard discoveries routinely reframe requirements. Design decisions routinely invalidate task ordering. These semantic dependencies cannot be detected from data flow alone. They are the reason deliberation must remain sequential.

Test for parallelizability: "Would a surprise in one agent invalidate another's work?" If yes → sequential. If no → parallelizable.

### 2. Eigenform Certification (Von Foerster)

An artifact is ready for parallel consumption only when it has reached an **eigenform** — a stable fixed point where further iteration wouldn't change it. In v5, the checkpoint is the eigenform certification. User approval says "this is stable; proceed." Quality gates during execution serve the same function at a different scale: they certify that a task's output has converged and is safe for dependent tasks to consume.

This reframes quality gates not as "quality checks" but as **stability certificates**.

### 3. Parallelism as Diagnostic (Von Foerster)

When parallel agents produce inconsistent results, that's not a failure of parallelism — it's a signal that the spec was underspecified. The deliberation didn't converge deeply enough. Parallel execution **surfaces** hidden deliberation compression rather than causing it.

Implication: post-wave reconciliation isn't just error correction — it's a diagnostic tool for spec quality.

### 4. Book vs. Newspaper (McLuhan)

Sequential deliberation is like reading a book — each chapter builds on the prior. Understanding is cumulative and historically coherent. Parallel execution is like reading a newspaper — independent columns, consumed in any order, unified by a shared headline (the center).

This analogy gives precise guidance: deliberation must be book-like (sequential, building). Execution can be newspaper-like (parallel, independent columns). But newspapers have editors who ensure coherence — **wave boundaries are the editorial function** that re-sequences parallel work into a coherent narrative.

### 5. Fugal Entry: Proposed and Retracted (Hofstadter)

Hofstadter proposed "fugal entry" — starting the tasks roundtable as soon as design atoms stabilize, before design verification completes. Like voices entering a fugue at staggered intervals, each building on the theme but not waiting for prior voices to finish.

He then retracted it: the destroyer/gate can invalidate the entire design foundation. Unlike a musical fugue where the theme is fixed, spec phases can retroactively invalidate prior work. This is the most intellectually honest moment in the deliberation — the most elegant parallelism proposal was rejected by its own proponent because the premises don't hold.

**This simplifies the redesign**: deliberation parallelism is near-zero. The redesign focuses entirely on execution.

### 6. Gates Change Writing, Not Just Filtering (McLuhan + Hofstadter)

The anticipatory effect of knowing wwubd will review your code changes HOW you write code, not just whether it passes. This is McLuhan's observation that the medium reshapes the message. Hofstadter adds the strange loop: the gate is part of the system it evaluates — agents that know they'll be reviewed write differently.

Implication: wwubd gates have value even before they fire. Their presence in the protocol changes code quality upstream.

### 7. The Medium Pushes Effort Upstream (McLuhan)

Parallel execution demands more precise task specifications. If two agents will run simultaneously, their file scopes must be disjoint, their interfaces must be pre-agreed, their done-when criteria must be unambiguous. This precision costs time during mechanism.

Net savings is real but smaller than naive analysis suggests. The protocol must acknowledge this tradeoff honestly.

### 8. Abstraction Gradient (Korzybski)

Parallelism cost scales inversely with concreteness. High-abstraction phases (whiteboard, requirements) are maximally sensitive to surprises — parallelism there is maximally dangerous. Low-abstraction phases (execution of well-specified tasks) are minimally sensitive — parallelism there is minimally dangerous.

Rule: **never parallelize above the concreteness threshold.** The threshold is the point where artifacts become concrete enough that surprises in one agent won't invalidate another's work.

## Where Parallelism Lives

| Phase | Parallelizable? | Why |
|-------|-----------------|-----|
| Intent: Whiteboard | No | High abstraction, surprise-sensitive |
| Intent: Destroyer | No | Must consume finalized whiteboard |
| Intent: Requirements | No | Must consume whiteboard + destroyer output |
| Mechanism: Design | No | Must consume locked requirements |
| Mechanism: Tasks | No | Must consume finalized design |
| Execution: Wave dispatch | **Yes** | Tasks are concrete, file-scoped, independently verifiable |

The entire parallelism opportunity is in Phase 3.

## Where Quality Gates Live

| Gate | When | What It Certifies |
|------|------|--------------------|
| wwubd post-wave | After each parallel wave completes | Architectural integrity of combined wave output |
| wwubd pre-archive | After all execution, before archiving | Full-feature architectural review |
| Spec lint | Unchanged from v5 | Structural spec integrity |
| Destroyer | Unchanged from v5 | Intent-level structural soundness |

Post-task wwubd was rejected as excessive ceremony — individual tasks are too granular for architectural review. Post-wave is the right unit: enough code to have architectural implications, few enough checks to not dominate wall-clock time.

## Open Questions

1. **Concrete threshold**: Is there a testable criterion for when artifacts are "concrete enough" to parallelize, or is it always a per-feature judgment? The tasks roundtable could assess this, but is that circular?
2. **Reconciliation cost**: How expensive is deliberative wave-level reconciliation (reading all agent outputs, checking for inconsistencies, running wwubd)? Could it negate the time savings of parallel execution?
3. **Optimal wave size**: Is there a formula (function of task count, file overlap, dependency depth) or should this be empirical?
4. **Gate failure handling**: When wwubd flags a violation after a wave, which task gets reworked? The violation might span multiple tasks in the wave.
5. **Self-correction accumulation**: Can the retrospective/reflection loop collect enough parallel execution data to improve wave assignment over time?
6. **Files field overhead**: Does requiring explicit file declarations per task add friction to the tasks roundtable that outweighs the parallelism benefit?

## Assumptions Challenged

1. **"Cross-phase parallelism is an opportunity"** — Unanimously rejected. All four panelists, from different frameworks, concluded that deliberation phases have semantic dependencies that make parallelism fundamentally unsafe. The redesign is narrower than initially framed.

2. **"Quality gates slow things down"** — Reframed. Gates change upstream behavior (anticipatory effect). They also serve as stability certificates for wave boundaries. Their cost is partially offset by preventing rework.

3. **"Parallelism is always faster"** — Challenged. The medium pushes effort upstream (more precise task specs needed). Net savings is real but smaller than naive analysis. Some waves may be single-task, gaining nothing from parallel infrastructure.

4. **"The protocol needs fundamental restructuring"** — Rejected. The sequential deliberation core is the protocol's strength. The redesign adds a parallel execution mode to Phase 3 and quality gates. Phases 1 and 2 are untouched.
