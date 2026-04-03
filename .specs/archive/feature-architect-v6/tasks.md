---
feature: feature-architect-v6
center: "Feature Architect v6 must protect deliberative depth as its primary value while reducing the wall-clock cost of translating finished, stable specs into verified code."
stage: tasks
intensity: deep
loop_iterations: 1
last_modified: 2026-04-03T00:00:00Z
---

# Tasks: Feature Architect v6

### t-formats-wave: Update formats.md with wave metadata schema, Jacobi verdict format, intensity table round-target column, and wave plan display format | file-edit
> **Center:** Establishes the single source of truth for all new v6 concepts — every downstream file references these definitions, making this the foundation that protects both deliberative depth (round targets, Jacobi verdict) and parallel execution (wave metadata, wave plan display)
> **Traces:** ac-task-wave-metadata, ac-execution-plan-visible, ac-jacobi-gate, ac-round-target
> **Depends:** (none)
> **Files:** ~/.claude/skills/feature-architect-v5/formats.md
> **Wave:** 1
> **Status:** pending

- **Implements**: da-formats-wave
- **Done when**: formats.md contains: (1) Tasks frontmatter schema with `files:` (list of paths) and `wave:` (positive integer) fields, (2) Wave Plan Display format section with parallel/sequential annotation, (3) Jacobi Gate Verdict Format replacing Destroyer Verdict Format with `kick_back: whiteboard | requirements` in the BLOCK template, (4) Intensity Table has a round-target column showing 7 for standard, 10 for deep, (5) all existing sections preserved unchanged

---

### t-jacobi-prompt: Create Jacobi gate prompt replacing the Destroyer | file-create
> **Center:** Protects deliberative depth by expanding the adversarial gate's jurisdiction to cover both whiteboard AND requirements, catching structural flaws the whiteboard-only Destroyer could not reach
> **Traces:** ac-jacobi-gate, ac-deliberation-preserved
> **Depends:** t-formats-wave
> **Files:** ~/.claude/skills/feature-architect-v5/prompts/jacobi-gate.md
> **Wave:** 2
> **Status:** pending

- **Implements**: da-jacobi-prompt
- **Done when**: prompts/jacobi-gate.md exists with: (1) Inputs requiring whiteboard-content, requirements-content, AND center, (2) Jacobi inversion framing ("invert, always invert"), (3) all 5 jurisdictional categories preserved with each referencing both artifacts, (4) verdict format with `kick_back: whiteboard | requirements` matching formats.md, (5) OBSERVATIONS section preserved. Old prompts/destroyer.md is NOT deleted.

---

### t-round-target-prompts: Update round targets in whiteboard, requirements, and design prompts | file-edit (batch)
> **Center:** Protects deliberative depth by calibrating round count to the empirically observed novelty curve, ensuring roundtables run deep enough without wasting time on diminishing returns
> **Traces:** ac-round-target
> **Depends:** t-formats-wave
> **Files:** ~/.claude/skills/feature-architect-v5/prompts/whiteboard.md, ~/.claude/skills/feature-architect-v5/prompts/requirements.md, ~/.claude/skills/feature-architect-v5/prompts/design.md
> **Wave:** 2
> **Status:** pending

- **Implements**: da-round-target-wb, da-round-target-req, da-round-target-des
- **Done when**: All three prompt files replace "AT LEAST 3 rounds" with IDENTICAL language specifying a soft target of 7 rounds (standard/3 experts) and 10 rounds (deep/4+ experts). Target framed as a target, not a cap — extension permitted for genuine novelty or unresolved disagreement. `nextThoughtNeeded: true` instruction preserved.

---

### t-tasks-prompt-waves: Update tasks prompt with round target and wave/files assignment instructions | file-edit
> **Center:** Enables parallel dispatch by instructing the tasks roundtable to produce wave and file-scope metadata that makes wave-based execution possible, while calibrating the roundtable's own depth
> **Traces:** ac-round-target, ac-task-wave-metadata
> **Depends:** t-formats-wave
> **Files:** ~/.claude/skills/feature-architect-v5/prompts/tasks.md
> **Wave:** 2
> **Status:** pending

- **Implements**: da-round-target-tasks
- **Done when**: prompts/tasks.md contains: (1) same round-target language as the other three prompts, (2) task output format includes `> **Files:** {file paths}` and `> **Wave:** {integer}`, (3) wave assignment guidance: no-dependency + no-shared-files = same wave, (4) existing embedded challenge, ordering rules, and output format preserved with new fields integrated

---

### t-lint-wave-checks: Add P10 (same-wave file overlap) and P11 (backward wave dependency) to linter | code-edit
> **Center:** Prevents parallelism from introducing interference by catching wave structure violations statically before execution — the automated guarantee that makes parallel dispatch safe
> **Traces:** ac-wave-consistency-lint
> **Depends:** t-formats-wave
> **Files:** ~/.claude/skills/feature-architect-v5/lint-spec.mjs
> **Wave:** 2
> **Status:** pending

- **Implements**: da-lint-p10, da-lint-p11
- **Done when**: lint-spec.mjs contains: (1) Parsing for `Files:` and `Wave:` fields in task elements, (2) P10 preamble: if ANY task has Wave, ALL must (FAIL otherwise, skip in express mode), (3) P10: FAIL if two same-wave tasks share a file, (4) P11: FAIL if task in wave N depends on task in wave M where M >= N, (5) both skip in express mode, (6) header comment updated. Verified against synthetic specs: same-wave overlap → FAIL, backward dep → FAIL, no waves → PASS, express with violations → PASS.

---

### t-intent-reorder: Reorder intent phase — move gate after requirements, reference Jacobi gate | file-edit
> **Center:** Protects deliberative depth by positioning the adversarial gate after both whiteboard AND requirements are complete, giving it richer evidence to evaluate structural soundness
> **Traces:** ac-jacobi-gate, ac-deliberation-preserved
> **Depends:** t-jacobi-prompt, t-formats-wave
> **Files:** ~/.claude/skills/feature-architect-v5/phases/intent.md
> **Wave:** 3
> **Status:** pending

- **Implements**: da-intent-reorder
- **Done when**: phases/intent.md step order is: Step 0 (Research), Step 1 (Archive), Step 2 (Whiteboard Roundtable), Step 3 (Whiteboard Checkpoint), Step 4 (Requirements Roundtable), Step 5 (Lint + Self-Check), Step 6 (Jacobi Gate — references prompts/jacobi-gate.md, can kick back to Step 2 or Step 4), Step 7 (Checkpoint 1). Express Flow unchanged. All cross-references use correct step numbers.

---

### t-execution-waves: Rewrite execution phase with wave planning, wave execution, and wave boundary gates | file-edit
> **Center:** Reduces wall-clock cost of translating finished specs into verified code by restructuring execution around wave-based parallel dispatch while preserving build-verify-amend discipline
> **Traces:** ac-parallel-self-verification, ac-wave-boundary-gate, ac-execution-plan-visible, ac-sequential-equivalence, ac-gate-failure-attribution
> **Depends:** t-formats-wave
> **Files:** ~/.claude/skills/feature-architect-v5/phases/execution.md
> **Wave:** 3
> **Status:** pending

- **Implements**: da-execution-waves
- **Done when**: phases/execution.md contains: (1) **Wave Planning** — parse waves, display plan, user confirms, single-task = sequential, (2) **Wave Execution** — per wave: build + self-verify + mark complete, (3) **Wave Boundary Gate** — after multi-task waves: verification + /wwubd + attribution (isolated vs emergent), (4) single-task waves = v5 behavior exactly, (5) express exclusion noted, (6) PRESERVED UNCHANGED: Story Sync, Agent Test Gate, Backward Reference, Completion, Archive Protocol, Reflection Protocol

---

### t-mechanism-wave-note: Add wave/files assignment note to mechanism phase | file-edit
> **Center:** Connects mechanism phase to execution parallelism by making explicit that tasks carry wave and file metadata
> **Traces:** ac-task-wave-metadata
> **Depends:** t-formats-wave
> **Files:** ~/.claude/skills/feature-architect-v5/phases/mechanism.md
> **Wave:** 3
> **Status:** pending

- **Implements**: da-mechanism-wave-note
- **Done when**: phases/mechanism.md Step 2 contains one additional sentence about Wave and Files metadata. No other changes.

---

### t-cross-reference-verify: Verify cross-file consistency, terminology, and linter correctness on synthetic specs | verification
> **Center:** Ensures the protocol maintains conceptual integrity — all modified files must speak with one voice about waves, Jacobi gates, and round targets
> **Traces:** ac-deliberation-preserved, ac-sequential-equivalence, ac-wave-consistency-lint
> **Depends:** t-intent-reorder, t-execution-waves, t-mechanism-wave-note, t-lint-wave-checks, t-jacobi-prompt, t-round-target-prompts, t-tasks-prompt-waves, t-formats-wave
> **Files:** all modified files (read-only verification)
> **Wave:** 4
> **Status:** pending

- **Implements**: verification strategy from design
- **Done when**: (1) Every `→ Load` and `→ Consult` reference resolves to existing file + heading, (2) terminology consistent: "kick_back", "wave", "wave boundary gate", (3) round-target numbers match across all 4 prompts and intensity table, (4) Jacobi verdict format matches between prompt and formats.md, (5) Wave/Files format matches between tasks prompt and formats.md, (6) linter PASS on synthetic spec with wave metadata, (7) linter PASS on spec WITHOUT wave metadata, (8) linter PASS on express spec with wave violations (skip), (9) no "destroyer" references in phase files or skill.md

---

### t-skill-version: Update skill.md with version bump and protocol files table | file-edit
> **Center:** Stamps the completed protocol with its v6 identity
> **Traces:** ac-jacobi-gate
> **Depends:** t-cross-reference-verify
> **Files:** ~/.claude/skills/feature-architect-v5/skill.md
> **Wave:** 5
> **Status:** pending

- **Implements**: da-skill-version
- **Done when**: skill.md contains: (1) version identifier updated to v6, (2) protocol files table: destroyer.md → jacobi-gate.md, (3) lint-spec.mjs description includes P10-P11, (4) all other content preserved

---

## Execution Waves

| Wave | Tasks | Depends on waves | Shared file risks |
|------|-------|-------------------|-------------------|
| 1 | t-formats-wave | (none) | None — single task, single file |
| 2 | t-jacobi-prompt, t-round-target-prompts, t-tasks-prompt-waves, t-lint-wave-checks | Wave 1 | None — 4 tasks, 7 unique files, no overlaps |
| 3 | t-intent-reorder, t-execution-waves, t-mechanism-wave-note | Waves 1, 2 | None — 3 tasks, 3 unique files, no overlaps |
| 4 | t-cross-reference-verify | Wave 3 | None — read-only verification |
| 5 | t-skill-version | Wave 4 | None — single task, single file |
