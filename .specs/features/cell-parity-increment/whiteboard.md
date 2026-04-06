---
feature: cell-parity-increment
center: "Close two specific parity gaps between signal-field cells and the legacy primitives: the Source cell gains PDF ingestion equivalent to the legacy PdfNode, and the Scope's Monaco editors gain type hints describing each cell's resolved inputs."
center_test:
  excludes: "Extending editor-surface input hints to the legacy composition primitive's authoring surface — same family, same force, but the center names the new primitive's editor only."
  boundary: "Showing the lineage of transformations that produced each incoming input (provenance, not shape) — analogically close to type hints but a different thing; spec should say no."
stage: whiteboard
intensity: standard
loop_iterations: 1
last_modified: 2026-04-06T00:00:00Z
status: paused
superseded_by: typed-cell-inputs
---

> **PAUSED 2026-04-06.** Three roundtable passes explored PDF-inside-Source-cell. Panel converged on "Option η" (new variant + origin seed crystal + revisit trigger on third acquisition mechanism), but the user shelved the architectural decision as too big to commit to right now. The tactical alternative — bridging the strangler-fig boundary so legacy PdfNode and MarkdownNode feed signal-field Code and AI cells directly, plus Monaco type hints synthesized from actual incoming connections — ships as `.specs/features/typed-cell-inputs/`. The deliberation below remains the reference for when the architectural conversation resumes (triggered when a third acquisition mechanism beyond filesystem and canvas-authored becomes a roadmap item).


# Roundtable: Parity Gaps in the New Source Primitive

**Panel convened (in character, credentials noted):**
- **Alfred Korzybski**, founder of general semantics; author of *Science and Sanity*; map/territory and structural differential.
- **Douglas Hofstadter**, cognitive scientist; *Gödel, Escher, Bach*; analogy as the core of cognition.
- **Heinz von Foerster**, second-order cybernetician; Biological Computer Laboratory; constructivist.
- **Marshall McLuhan**, media theorist; *Understanding Media*; figure/ground analysis.
- **Valentino Braitenberg**, synthetic psychologist; *Vehicles*; law of uphill analysis and downhill invention.
- **John Gall**, systems theorist; *Systemantics*; Gall's Law.
- **Carl Gustav Jacob Jacobi**, The Inverter; *man muss immer umkehren*; speaks last.

The panel ran seven rounds via sequential thinking. What follows is the consolidated output.

---

**Center**: Close two specific parity gaps between signal-field cells and the legacy primitives: the Source cell gains PDF ingestion equivalent to the legacy PdfNode, and the Scope's Monaco editors gain type hints describing each cell's resolved inputs.

**Center Test**

- *Exclusion test*: The center excludes a legitimately good idea — extending the "what will arrive here" editor-surface hints to the **legacy composition primitive's** authoring surface. Same family, same force, same audience; still out of scope, because the center names the new primitive's editor only. It also excludes adding further document formats beyond the one the legacy handled (audio, video, spreadsheets), and it excludes letting the new source primitive fetch content from a remote URL. Each is a reasonable "parity-adjacent" request; the center is narrow enough to refuse them.
- *Boundary discrimination*: A case where the center almost applies but the spec should say no — showing, in the editor surface, the **lineage of transformations** that produced each incoming input (not just its shape). Analogically close to type hints, but that is provenance, not shape-description. Another near-miss: auto-inferring a schema for a composition from observed runs over time. That is a learning system, not a descriptive hint. Both: say no.

**Context**

*McLuhan*: When the new primitive launched, the figure was "a unified composition model" and the ground was "we quietly dropped document ingestion and dropped visibility of what flows into the editor." The ground has risen. Authors who used the legacy system feel a regression viscerally because both systems coexist on the same surface and they switch between them.

*Von Foerster*: Why now is the right question. Early in a primitive's life, silence reads as "not built yet." Once the primitive is stable, the same silence reads as "broken." That threshold has been crossed. The related work is the prior document-as-source feature (whose force was exactly "turn a binary format into a first-class composition source") and the prior work on making inputs visible and named at the authoring surface.

**Intent**

*Korzybski*: In the user's own words — "add PDF support" and "add type hints." The picture in their head is concrete and operational: drop a document into the new source primitive and have it behave as a source; open the editor on a downstream primitive and see, at each named input, some description of what is about to arrive there. They are not asking for a research project. They are asking for two specific restorations of visibility.

*Hofstadter*: The author is also implicitly asking the system to stop forcing them to mentally re-simulate their own upstream in order to write the downstream. That is the cognitive relief they are reaching for, whether or not they would put it in those words.

**Assumptions**

*Korzybski*: The user is taking for granted that the legacy document-ingestion behavior is the right reference point — that "equivalent to" means "does the job the old one did, as the author experienced it." They are NOT (we believe) asking for feature-by-feature mimicry of every legacy gesture. That distinction must be surfaced.

*Hofstadter*: They are also assuming the author will recognize a shape-hint on sight without being taught a notation. This implies hints should feel like labels or samples, not formal type expressions.

*Von Foerster*: They assume the author wants **confidence**, not accuracy. An obviously-approximate hint is preferable to an authoritative hint that is occasionally wrong.

*McLuhan*: Mental model in play: "the editor surface is the author's primary cockpit for composition, and a cockpit that hides its inputs is not a cockpit." The analogy is to the legacy experience and to any familiar authoring surface that tells the author what it knows.

**Design Tensions**

*Von Foerster*: The sharpest tension is on the editor-hint side — accurate hints imply running the upstream at edit time, which has cost and latency; cheap hints imply showing stale or approximate information. The author wants cheap confidence, not expensive truth, but the line between "usefully approximate" and "misleading" is not obvious in advance.

*McLuhan*: On the document-ingestion side, the tension is viewer affordance versus surface uniformity. Document formats historically came with their own viewing gestures (page turning, position indication). The new primitive was deliberately designed around a uniform content surface. Importing format-specific viewing re-fragments that surface. Importing only extracted text loses gestures the legacy author relied on.

*Jacobi — on the bundling itself*: Does bundling these two gaps create coupling that hurts either one? Structurally, no — their wiring is independent and neither depends on the other. Venue-wise, yes — if one slips in implementation, the other risks being held hostage to the release. The panel's position: bundle the **framing** (one spec, one center, one story about restoring visibility), but keep the **tracks** independently shippable. Do not invent any shared scaffolding whose only purpose is to unify them; that scaffolding would be pure waste.

*Hofstadter*: A subtler tension — the two gaps rhyme ("restore visibility") at the observer level but diverge at the capability level (one changes what the system can do; one changes what the author can know). A spec that leans too hard on the rhyme will invent a false common abstraction. A spec that denies the rhyme will read as two unrelated tickets in a trench coat.

**Open Questions**

- *Jacobi*: Is "parity" secretly importing legacy mistakes? The legacy document experience made specific choices about page-level navigation and position indication. Are those choices still right, or were they artifacts of the old composition model? The center says "equivalent to," which must be read as need-equivalent, not gesture-equivalent. Open for the user to confirm.
- *Gall*: Should the document ingestion ship as text-extraction only, accepting the loss of any format-specific viewing gestures, in order to stay true to the uniform editor surface? Or is a viewing affordance part of what the author means by "support"?
- *Von Foerster*: What freshness guarantee do the editor hints carry? Live-recomputed on every edit, recomputed on demand, or sampled from the last successful run? Each choice changes what "describes the input" actually means.
- *Hofstadter*: What vocabulary does a hint use? A label ("text"), a shape sketch, a recent sample value, or some combination? The author's mental model suggests something concrete and immediately recognizable, but the exact register is undecided.
- *Jacobi (recorded dissent)*: Are the two gaps symptoms of a deeper "I lost trust in my composition when I switched primitives" complaint? If so, delivering them as described treats symptoms. The user locked the center, so we deliver the named gaps — but we should not pretend they cure an underlying trust issue that may still resurface.
- *Jacobi (recorded dissent)*: Is the new primitive stable enough that parity investment is the right investment at all, or is polish premature?

**Alternatives Considered**

- *Braitenberg*: Instead of shape-hints, show a **literal sample** of the most recent value that arrived at each input. Simpler wiring, arguably more trustworthy because it is observed rather than described. Center permits this reading; it is a candidate implementation of "describing the resolved inputs."
- *Gall*: Ship document ingestion as **extracted-text only**, no viewer. Simplest end-to-end thing that works; intentionally loses page-level gestures.
- *Korzybski*: Ship document ingestion with the same authorial experience the legacy offered, at the cost of re-fragmenting the uniform editor surface. Maximum perceived parity, maximum surface cost.
- *Jacobi (inverse)*: Do **nothing** — instead, document the gaps so authors set correct expectations. Cheapest option; implicitly rejected by the user having filed the request, but recorded for completeness.
- *Hofstadter*: The looser "increment toward functional parity" framing, which the user explicitly rejected in favor of two named gaps. Recorded because the rejection itself is load-bearing: the user wants a center that can refuse scope creep, not one that invites it.

Direction chosen: deliver both named gaps under one spec, as two independently shippable tracks sharing one center. This honors the user's lock while respecting Jacobi's warning against coupling.

**Non-Functional Context**

- *Audience*: Knowledge workers composing source material to feed models. Specifically: authors who used the legacy document-ingestion feature and who build multi-input compositions complex enough that "what arrives here" is not obvious from memory.
- *Scale*: Single-author, single-workspace usage; the gaps are felt per-author, not at fleet scale.
- *Timeline*: Implied near-term — the user is filing this because the regression is actively felt. No hard deadline surfaced.
- *Performance*: The editor-hint track has a latency budget implied by "feels responsive while editing." The document-ingestion track has a budget implied by "feels like dropping in a source, not running an import job." Neither is quantified; both must be kept in mind.
- *Infrastructure preference*: Reuse what the legacy system already proved for document handling rather than reinventing the ingestion pipeline (*Braitenberg*: downhill invention, not uphill analysis). For hints, reuse whatever the system already knows about resolved inputs rather than building a parallel inference path.
- *Scope discipline*: Two gaps, named, bounded. The panel confirms the center holds under stress-testing. Jacobi's dissent about bundling-as-venue is logged as an open question, not as a blocker.

---

## Reconvened Panel: On Uniformity as Formats Proliferate

The user reopened Open Question 1 after the first pass, naming a trajectory: markdown (have), PDF (next), API call results (soon), remote files from SharePoint/Dropbox (later), "anything else" (future). The panel reconvened for a focused 10-round deliberation on one question: does surface uniformity survive contact with format proliferation, or must the primitive set expand one-per-format?

### The Question Restated

The panel reconvenes around a single pressure: the system must absorb an artifact type (PDFs) that does not cleanly fit the authoring surface the current Source primitive was designed around, and the user has named a trajectory — PDF next, API call results after, remote files from third-party stores later, "anything else" after that. The question is not "how do we add PDF?" but "does the consolidation principle that collapsed the legacy per-format primitives into an action-axis trio survive contact with format proliferation, and if so, where exactly does uniformity live and where does format-specific variation become legitimate?" The panel treats this as a question about the STRUCTURE of uniformity, not about PDFs specifically.

### Decomposing Uniformity

Korzybski opened by refusing the word "uniformity" as a single thing. The panel adopted a four-surface decomposition. These surfaces are independent dials; a primitive can be uniform at some and varied at others without contradiction.

**S1 — Canvas chrome.** The tile as a spatial object on the graph: silhouette, header, border, output handle, resize grip, status strip. This is what the author sees when attending to the graph as a WHOLE rather than to any single tile's contents. At this surface, uniformity is **REQUIRED**, not merely preferred. The signal-field's core move was to make the canvas the figure and the artifacts the ground; violating S1 uniformity reverses that move and fragments the gestalt of the graph. McLuhan noted the caveat: "uniform" here means CONSISTENT STRUCTURE, not literal identity — the chrome will need to telegraph kind through icons, glyphs, or a status element as kinds multiply, or the graph becomes illegible. Consistent structure with kind indicators, not literal pixel-for-pixel sameness.

**S2 — Ingestion gesture.** The one-shot act by which the artifact enters the primitive: paste, drop, pick, URL entry, authenticated form. Von Foerster named this surface **INCOHERENT** for uniformity. You cannot paste a PDF the way you paste markdown; you cannot drag-drop an OAuth'd API configuration. The gestures belong to the artifacts. Pretending otherwise is a category error. Crucially, S2 is a CONSTRUCTION RITUAL — it happens once per tile and is not part of the tile's steady-state identity. Jacobi's Round 2 inversion pushed this further: if S2 is not a property of the primitive's ongoing life, then "ingestion variation" is not really primitive proliferation at all; it is ritual proliferation, which is a different and smaller problem.

**S3 — Edit / inspection affordance.** What the author sees and does when they focus a tile to inspect or modify its contents: an editor for markdown, a page viewer for a PDF, a tree explorer for JSON, a grid for a spreadsheet. At this surface uniformity is **PREFERRED, NOT STRICT**. The author should not be jarred by radically different interaction models — focusing a tile should feel like entering a primitive's interior regardless of what's inside — but the content itself MUST be allowed to speak in its own vocabulary. McLuhan was firm: when the author is actually INSIDE the content, the medium must be allowed to show through. Forcing a markdown editor onto a PDF would be a lie about what the author is looking at.

**S4 — Downstream value contract.** The shape of the value the primitive hands to consumers in the graph. At this surface uniformity is **REQUIRED** — but the panel refined what "uniform" means here. It does not mean IDENTICAL. It means a **uniform minimum contract** (every source offers at least a text projection plus baseline metadata) layered with **optional kind-specific extras** that downstream code may or may not consult. A consumer that only wants text does not care what is upstream. A consumer that wants PDF page numbers or API response headers opts in explicitly and degrades gracefully when the upstream kind does not support the extras. This is the "graceful degradation" formulation Braitenberg offered and the rest of the panel adopted.

The shape the panel converged on: **uniformity lives at the WORLD-FACING surfaces (S1 and S4), variation lives at the AUTHOR-FACING surfaces (S2 and S3).** Hofstadter noted this asymmetry and it became the organizing principle for the rest of the deliberation: the world that touches the primitive from outside (the canvas gestalt, the consumer cells) should experience one thing; the author who touches the primitive from inside (ingesting, inspecting) should experience the medium honestly.

### Options on the Merits

#### Option A — Single primitive with an internal variant union

A single primitive type. Internally, a discriminated union over kinds (markdown, PDF, API result, remote file, future kinds). Chrome uniform. Minimum downstream contract uniform. Ingestion and inspection vary by kind, dispatched through a clear seam.

- **What it buys:** S1 and S4 uniformity, honest variation at S2 and S3, preservation of the action-axis architecture, a single chrome to maintain and a single contract to enforce.
- **What it costs:** a dispatch mechanism that must be disciplined or it rots; an implicit extension of the word "Source" to cover more than text, which subtly shifts the author's mental model without warning.
- **Failure mode at format #5:** if the dispatch logic has scattered into ad hoc conditionals rather than a clean registration seam, format #5 lands in a tangle. The primitive becomes a switch statement with branches nobody remembers the invariants of.
- **Favored by:** Hofstadter (preserves the real rhyme of "named artifact producing text downstream" without forcing a false one), Von Foerster (observer-coherent for all three observer classes), Braitenberg (lowest aggregate maintenance cost, provided the separation discipline holds), Korzybski with reservations (semantically honest only if the panel is willing to admit the primitive has changed from its original design).
- **Rejected by:** nobody outright, but McLuhan notes that S1's uniform chrome starts to carry more weight than it was designed for as kinds multiply, and Jacobi flags that Option A may be a rhetorical device for refusing to rename.

#### Option B — One primitive per format

Fragmentation along the legacy lines: a markdown primitive, a PDF primitive, an API primitive, a remote-file primitive, one per artifact kind. Each with its own chrome, its own ingestion, its own inspection, its own value contract (unless a uniform minimum is bolted on externally).

- **What it buys:** honesty about differences (no false unity), format-specific chrome that lets the medium show through at S1, simplest per-primitive implementation.
- **What it costs:** linear per-format tax on the author (must learn N taxonomies), linear per-format tax on the consumer (must know N shapes unless S4 is unified by convention), inevitable drift across primitives as common behaviors change at different rates, fragmentation of the canvas gestalt.
- **Failure mode at format #5:** the canvas is now five distinct tile types with inconsistent chrome, inconsistent keyboard handling, and inconsistent status indication. Two of the five lag behind updates to the others. The author's mental model for "what is a source on this canvas" is five independent maps.
- **Favored by:** nobody strongly, but McLuhan gave it the fairest reading — "the medium is the message, and Option B is honest about it." Jacobi steelmanned it in Round 4 as "the action-axis consolidation was right but the content-axis collapse went too far."
- **Rejected by:** Hofstadter (denies a real structural rhyme), Von Foerster (observer-hostile to the author — forces taxonomy before intent), Korzybski (scales the cost linearly on everyone except the designer), Braitenberg (aggregate cost worse than per-primitive cost suggests), Gall (the signal-field already tried this in the legacy system and rejected it).

#### Option C — Source stays text-only, add a Loader primitive family

Preserve Source as a pure text primitive. Introduce a new role — Loader — for primitives that cross the boundary from the world outside the graph into the graph's interior. PdfLoader, ApiLoader, RemoteFileLoader, etc. Each Loader produces text (and optionally structured helpers) that downstream cells read.

- **What it buys:** Source's original S1/S2/S3/S4 uniformity is preserved completely. The new role — Loader — has a clean semantic definition ("crosses the boundary from outside to inside").
- **What it costs:** the proliferation problem is RELOCATED, not solved. The Loader family will acquire the same proliferation pressure unless it is itself a single primitive with a variant union (which is Option A wearing Option C's clothes). The author is asked to classify every dropped artifact as "inside" or "outside" the graph, which is a system concept, not a user concept. Von Foerster flagged this as observer-hostile.
- **Failure mode at format #5:** the Loader family now has five entries (PdfLoader, ApiLoader, RemoteFileLoader, SpreadsheetLoader, fifth), each with its own chrome and gestures, and Option C has become Option B with an extra word.
- **Favored by:** Gall in a narrow sense — it touches Source least and is most conservative about what is already working. McLuhan appreciated the naming clarity ("immediate content versus remediated content").
- **Rejected by:** Von Foerster (author asked to classify against a system category rather than their own intent), Braitenberg (discrimination tax at every drop), Jacobi (collapses into A or B depending on how many Loader primitives there end up being — not a distinct third position).

#### Option D — Source becomes Resource: opaque artifact + text projection + helpers

The primitive is renamed and reconceived. It holds the original bytes (or a reference to them), computes a canonical text projection, and exposes a registry-dispatched helper API to downstream code. The tile shows metadata in its chrome. Focusing the tile opens a kind-registered inspector. Format-specific code lives entirely behind registration points.

- **What it buys:** complete honesty about what the primitive actually IS (it holds artifacts, not text with a kind tag). Korzybski's map/territory distinction is respected cleanly: the bytes are the territory, the text projection is an explicit map, and both are available. McLuhan noted Option D is the most semiotically faithful. The registration point cleanly answers Braitenberg's concern about dispatch discipline.
- **What it costs:** byte storage where there was text storage. A rename — "Source" to "Resource" or similar — which propagates through user vocabulary, documentation, and muscle memory. Up-front commitment to a registration framework before there is data about what should be registered.
- **Failure mode at format #5:** if the registration point was designed around the wrong axis (say, around kind when it should have been around liveness), every subsequent format is registered through the wrong joint and the architecture fights the problem it was meant to solve.
- **Favored by:** Hofstadter on naming-honesty grounds (the primitive's job has changed, call it what it is), McLuhan on figure/ground grounds (the artifact is the figure, the text projection is the map), Von Foerster after Round 6 as the naming argument landed, Braitenberg as the right long-term destination.
- **Rejected by:** Gall (builds the complex system directly rather than evolving from the simple one — Gall's Law violation), Jacobi in a weaker form (Options A and D may be functionally the same at the four surfaces; if so, D's extra cost buys only naming honesty, and naming honesty may be deferrable).

### Distinctions the Panel Refused to Blur

**The static-vs-dynamic artifact split.** Korzybski named this in Round 7 and the panel accepted it as a second, orthogonal axis. A PDF dropped once and never changed is a STATIC artifact; its bytes are the same every time you look. An API result is a DYNAMIC artifact; it is the recorded output of a process that may produce different results on different runs. A remote file edited by a third party is a third thing — dynamic but in a different way. The panel refused to lump these. Kinds (markdown, PDF, API, remote file) live on one axis; liveness (static, dynamic, third-party-mutable) lives on an orthogonal axis. Hofstadter argued for splitting the primitive along the LIVENESS axis but not along the KIND axis, on the grounds that liveness changes the graph's semantics (cache invalidation, freshness) while kind is mostly invisible to downstream consumers. McLuhan and Braitenberg pushed back: liveness is often discovered after the fact, so splitting primitives by liveness over-commits the author early; liveness as a PROPERTY on a unified primitive is cheaper and more forgiving. The panel did not fully resolve this — it deferred the decision to the moment the first dynamic artifact (API results) actually lands, with the explicit understanding that that moment is a REAL architectural decision and should not be papered over with ad hoc property flags.

**The uniformity-as-principle stress test.** Jacobi pressed: is uniformity a false goal, an aesthetic preference being rationalized as an architectural principle? The panel answered: uniformity is a real goal, but ONLY at the world-facing surfaces (S1 and S4). Uniformity at the author-facing surfaces (S2 and S3) is either incoherent (S2) or harmful (S3 — it would force the author to interact with a PDF through a markdown editor). The original consolidation from five legacy primitives to three action-axis primitives captured a real insight (the action axis is the right primary axis), but it over-reached at the content level by assuming all "source" content was textual. The correction is not to undo the action-axis consolidation; it is to admit that the content dimension is RICHER than the original design assumed, and to absorb the richness at the right surfaces without fragmenting the action axis.

**The naming trap.** "Source" is both a generic word ("any upstream thing in the graph") and a specific primitive (one of the three cells). The panel flagged that as the primitive starts holding PDFs and API results, the word "Source" becomes a fuzzy term that means slightly different things to different observers — and fuzzy terms compound over time. McLuhan and Hofstadter argued for renaming now (to "Resource" or similar). Gall and Jacobi argued the rename is expensive and should be deferred unless the new meaning has actually stabilized. The panel did not resolve the rename but agreed: if the primitive's identity continues to drift as formats are added, the rename will become forced, and the team should be watching for the moment it becomes unavoidable.

### Jacobi's Inversions

**Inversion 1: Was the original consolidation the right consolidation?** Yes on the action axis (source/code/ai is a real and clean collapse), partly no on the content axis (assuming all source content was text was an over-reach that is now being paid for). The correction is to preserve the action-axis consolidation and absorb the content richness at the right surfaces — not to undo the consolidation.

**Inversion 2: Is surface uniformity itself a false goal?** It is real but narrower than originally scoped. REQUIRED at S1 and S4, INCOHERENT at S2, PREFERRED-not-strict at S3. The mistake was treating uniformity as one undifferentiated goal rather than four independently-tuned dials.

**Inversion 3: Is this whole deliberation outside the user's locked center?** Yes IF the recommendation commits to a full architectural scheme. No IF the recommendation is delivered as a provisional extension of the existing primitive for the specific artifact type at hand, with an explicit deferral of the full architectural question to a later moment. The panel chose the latter framing to keep the recommendation inside the center, and made the deferral loud so the user cannot miss that it is a deferral.

**Inversion 4: Will the deferral actually be honored?** Residual concern: if the user reads the recommendation as a resolution rather than a deferral, the team will add the NEXT format (API results) as another ad hoc variant, Option A will calcify, and format #5 will land in a mess. The only defense is to make the revisit trigger EXPLICIT and RECORDED — a visible mark in the spec and in the code that says "when the first non-static artifact is added, the primitive architecture is reopened."

### The Recommendation

**Option A in its refactor-ready provisional form**, with one critical constraint: kind-specific code MUST be separated from kind-agnostic code behind a clear internal seam from the moment of first implementation. The seam does not need to be a full registration framework yet, but it must be structurally clean enough that a future conversion to a registration framework is additive rather than destructive.

**Where uniformity lives and where variation is legitimate:**
- **S1 (canvas chrome): REQUIRED uniform** — consistent structure with kind indicators (icon/glyph), never format-specific silhouettes.
- **S4 (downstream contract): REQUIRED uniform minimum** — every source offers at least a canonical text projection and baseline metadata, with optional kind-specific extras that consumers opt into and degrade gracefully when absent.
- **S2 (ingestion gesture): VARIATION LEGITIMATE** — each kind brings its own one-shot ritual (paste, drop, pick, URL, form).
- **S3 (edit/inspection affordance): VARIATION LEGITIMATE BUT BOUNDED** — each kind brings its own inspector, but the seam between uniform chrome and kind-specific inspector is itself a first-class architectural element.

**What the NEXT format (API results) looks like under this recommendation:** the team is NOT free to simply add another variant and ship. API results are the first DYNAMIC artifact and they force the liveness axis to become visible. The panel deliberately routes the architectural reopening to this moment. When API results are next scheduled, the primitive's design MUST be revisited: liveness representation, possible rename, possible formalization of the registration point. This is recorded as a **named revisit trigger** that lives in the spec and should also live as a marker in code.

**Whether this fits inside the user's locked center:** Yes, for THIS increment. The center is "close two specific parity gaps," and adding PDF to the Source primitive as a refactor-ready provisional variant is a parity-gap closure, not a primitive redesign. The recommendation deliberately refuses to architecturally commit beyond what this increment demands.

**The deferred amendment:** The center does NOT require amendment for the PDF increment. It WILL require amendment when API results become a roadmap item — the primitive's liveness model will be reopened, the primitive may be renamed, the registration point may become formal, and that work is scoped into the API-results increment rather than being shipped as another ad hoc variant. Writing this obligation down now is the minimum honesty tax the recommendation charges.

### Dissent and Residual Disagreement

**McLuhan (partial):** "I accept the recommendation as operationally right, but the panel has deferred a figure/ground question that will return. Each new non-text format will challenge the 'canvas is the message' answer again. At some point the author will notice the chrome is smuggling kind indicators and the inspectors are diverging. When that moment arrives, the team must be ready to answer it with conviction rather than with more provisional patches. I mark the question as pending, not resolved."

**Jacobi (conditional):** "The recommendation is honest only if the deferral is loud. If the user reads it as a resolution — if the spec uses the words 'architectural decision' or 'settled' anywhere near this recommendation — then the panel has failed. I endorse on the condition that this framing is preserved in every downstream document. If the framing erodes, the recommendation becomes a trap."

**Braitenberg (discipline warning):** "The recommendation is as good as the separation between kind-specific and kind-agnostic code. If that separation is casual, the recommendation rots. The architecture depends on a code-structure discipline that is not enforced by the type system. The user should know this is fragile before accepting."

**Hofstadter, Von Foerster, Gall, Korzybski:** endorse with the caveats above (semantic honesty, explicit provisionality, named revisit trigger).

### Consequences for the Remaining Open Questions from Pass 1

- **Hint vocabulary:** NOT affected. Still open.
- **Hint freshness:** NOT directly affected, but the liveness axis named here is the same axis hint freshness will eventually depend on. Still open; the connection is noted.
- **PDF helper parity:** DIRECTLY affected. Reframed: helpers are OPTIONAL EXTRAS behind graceful degradation. The question is now "which helpers should this increment expose, which deferred?" Helpers that cannot be implemented in "refactor-ready provisional" form without tangling kind-specific code into kind-agnostic code should be deferred until the architectural reopening.
- **Jacobi's premature-polish dissent:** DIRECTLY affected. The recommendation depends on a code-structure discipline that is not enforced by any automated check. The user may need to decide how strict the "refactor-ready" discipline should be for this increment, understanding that strictness now reduces cost at the API-results reopening.

---

## Reconvened Panel (Pass 3): The Trenchcoat Test

The user pushed back on the executor's Pass-2 follow-up recommendation (single primitive with internal `(source, resource)` structure), raising the "multiple primitives in a trenchcoat" worry and releasing the constraint that everything must fit into three buckets. The panel reconvened to stress-test the source/resource decomposition against the possibility of an expanded primitive set.

### The Question Restated

The prior pass recommended packing acquisition and content into a single primitive with an internal `{source, resource}` structure. The user's trenchcoat intuition flagged this as potentially hiding two concerns inside one tile, and explicitly released the constraint that everything must collapse into a fixed small bucket count. The panel's job this round is to decide, on the merits and without loyalty to prior recommendations, the smallest primitive set that honestly handles the trajectory — markdown, PDF, API results, remote files, and formats beyond — without any primitive doing more than one coherent job and without forcing the author to perform ceremony that serves the system rather than the author's intent.

### Minimal Composition vs. Minimal Primitive Count

**Korzybski:** These are not the same thing and conflating them is a category error. Minimal *composition* means the author's common gesture — "drop a PDF" — requires the fewest actions. Minimal *primitive count* means the type system lists the fewest distinct kinds of tile. A system can be minimal on one axis and pathological on the other. A spreadsheet has one primitive (the cell) and near-minimal composition. A Roman numeral system has seven primitives and poor composition. Which cost matters more depends on what the author is actually doing.

**Hofstadter:** The relevant analogy is the spreadsheet cell. A cell can hold a literal or a formula. Nobody calls this a trenchcoat because the formula has no separate identity — it is *how this cell got its value*, not a peer of other cells. Contrast this with a build system, where a rule is a peer node with its own identity, and two primitives are appropriate. The canvas for this project is closer to a spreadsheet than to a build system: the author is composing, not pipelining.

**Gall:** There is a third cost the panel should name explicitly: **cost of commitment**. Every named concept locks terminology and structure that later becomes expensive to rename. Minimal primitive count usually minimizes commitment. The expensive middle ground is "many structured fields within one primitive" — that is where commitment bloats without visible payoff.

**Jacobi:** Invert. If minimal composition and minimal primitive count can conflict, which one is the user actually asking for? The pushback said "minimal composition." The user is saying: I care about what it *feels like to compose*. Therefore, weight minimal composition higher when these conflict — but do not use that as license to proliferate types.

### The Five Options (and Two Additional)

#### Option α — One primitive, internal (source, resource) structure
The executor's prior recommendation. **Trenchcoat test:** product type, technically coherent, but user felt the weight. **Ceremony test:** non-zero mental model paid on every tile even the simplest. **Verdict:** Structurally honest, pays upfront commitment for future needs.

#### Option β — Two primitives, explicitly composed
Source tile wires into Resource tile. **Trenchcoat test:** Zero trenchcoats. **Ceremony test:** Fails — every gesture produces two tiles; canvas-editor case needs a special rule for its most common case. **Verdict:** Rejected.

#### Option γ — Many primitives along natural joints
Separate types per resource kind: MarkdownTile, PdfTile, JsonTile, ImageTile. Source is implementation detail inside each type. **Trenchcoat test:** Zero — each type has one coherent job. **Ceremony test:** Zero for author, mild for code reader. **Hybrid test:** PdfTile naturally holds bytes + overlays. Clean. **Idiom cost:** Breaks the existing discriminated-union-variant idiom. **Verdict:** Strong on honesty, weak on iterative compatibility.

#### Option δ — Source as configuration, not a primitive
Essentially α with a different label. **Verdict:** Honestly cosmetic difference from α.

#### Option ε — Primitives as verbs (author intent)
Editor primitive, file primitive, feed primitive, etc. **Trenchcoat test:** Verbs trenchcoat badly because intent mutates. A tile created with one intent acquires new intents later. **Verdict:** Rejected — verbs are the wrong axis.

#### Option ζ (new) — Content primitive with a provenance blob
Free-form `provenance` blob with no imposed structure. **Verdict:** Softer version of δ. Reasonable but gives up the seed-crystal benefit.

#### Option η (the one the panel converged on) — Add a new variant; structured origin as seed crystal; defer everything else

Keep the existing primitive. Keep its name. Add a new variant for PDF. Inside the PDF variant's data, store a structured `origin` field from day one: `{ kind: 'filesystem', path: string }`. Do not touch the markdown variant. Do not rename anything. Do not introduce a top-level source/resource abstraction. Document the decomposition as a latent structure that will be lifted when a third acquisition mechanism arrives.

**Gestures.**
- A (type markdown): unchanged. Zero friction.
- B (drop PDF): one tile, PDF variant, origin filled by the ingestion gesture. Zero friction.
- C (annotate PDF region): overlays stored inside the PDF variant alongside content and origin. Zero friction.
- D (API returns JSON): **out of scope** for this increment. Deferred explicitly; will trigger a panel reconvene at its arrival.
- E (API returns PDF bytes): **out of scope**. Same deferral.
- F (re-point at different file): edit origin.path, variant re-ingests. Zero friction.
- G (one PDF → two consumers): standard wiring. Zero friction.

**Trenchcoat test.** The PDF variant holds `{content, annotations, origin}`. One job: *represent this document on the canvas with enough metadata to refresh and mark up*. The legacy PDF primitive already did content + annotations and was accepted as coherent; adding a structured origin is a small honesty gain, not a trenchcoat.

**Ceremony test.** Zero for the author. Near-zero for the reader: one new variant, one new field, no rename, no new abstraction.

**Hybrid test.** Annotations live natively inside the variant. Same as legacy.

**Extensibility.** Each new format added before the revisit trigger is one variant. When the third acquisition mechanism arrives, origin is lifted to a cross-variant concept and the panel reconvenes to name it properly.

**Verdict.** This is the Gall's Law path. It commits to the least, buys the most information before naming things, and preserves reversibility. The structured `origin` seed crystal means the future lift is cheap. The loud revisit trigger means the deferral is honest.

### Concrete Gesture Traces

| Gesture | α (one primitive, source+resource) | β (two tiles) | γ (per-kind types) | η (variant + origin seed) |
|---|---|---|---|---|
| A: type markdown | 1 tile, source=canvas-editor (degenerate) | 2 tiles (source suppressed — special case) | 1 MarkdownTile | 1 tile, existing variant, **unchanged** |
| B: drop PDF | 1 tile, source=filesystem | 2 tiles auto-wired | 1 PdfTile | 1 tile, new PDF variant, origin={fs, path} |
| C: annotate PDF | Inside resource variant | On resource tile | Inside PdfTile | Inside PDF variant alongside content+origin |
| D: API → JSON | 1 tile, source=api, resource=json | 2 tiles | 1 JsonTile or breaks γ | **out of scope; triggers reconvene** |
| F: re-point file | Edit source config | Replace source tile | Edit origin inside PdfTile | Edit origin.path on the variant |
| Commitment cost (now) | High (rename + structure) | Very high (two primitives) | High (idiom break) | **Low (one variant, one field)** |
| Info gained before naming | None — names picked now | None | None | **API case observed, then named** |

### Jacobi's Inversions

**Inversion 1: The panel rubber-stamping the user's reframe?** The decomposition *is* right as a model of the territory. The user was not wrong about the decomposition being real. They were right that *surfacing it as first-class structure right now* adds weight the author has not yet earned. Both claims compatible: store origin as structured data from day one (seed crystal), don't lift it until three examples make the lift obvious.

**Inversion 2: Is the right answer something the menu hadn't named?** Yes — η emerged during deliberation and beats all original five. The inversion surfaced it.

**Inversion 3: Is three buckets still right and the user over-designing?** In spirit, yes. Existing primitive stays. Name stays. Idiom stays. New variant joins. The only concession to the longer trajectory is the structured `origin` field — a one-field commitment, not a reframe.

**Inversion 4: Author-definable primitives?** Runaway generalization. Rejected unanimously.

### The Recommendation

**Adopt Option η.**

**(a) The chosen primitive set.** The existing single primitive, unchanged in name and structure, gaining one new variant for PDF. No new primitive types. The primitive set stays the size it is today, plus one variant.

**(b) Where natural joints are cut.** The joint between "how content was acquired" and "what shape the content is" is *acknowledged as real* and *not yet surfaced as structure*. It lives inside the PDF variant's data as a structured `origin` field (`{ kind: 'filesystem', path: string }`). The markdown variant is not touched — it has no origin field, because it does not yet need one.

**(c) What this means for the PDF increment specifically.**

1. Add a new variant for PDF to the existing primitive.
2. The variant's data contains: content (bytes or handle), annotations/overlays (matching legacy hybrid), and a structured `origin` field initially of shape `{ kind: 'filesystem', path: string }`.
3. Canvas chrome: PDF tile uses the same tile chrome as others.
4. Ingestion gesture: drop-to-create populates the tile atomically.
5. Downstream contract: PDF variant exposes content in a shape consistent with legacy behavior (text extraction, page access).
6. Author-editor type hints proceed independently.

**(d) What this means for the trajectory.**
- Markdown from a file: add a markdown-variant origin field when requested. Consistency earned per variant.
- API results: out of scope. Arrival triggers panel reconvene.
- Remote files: new origin kinds inside the lifted `origin` structure.
- Future formats: each is a new variant, OR at lift-time the panel may decide γ's per-kind cut is warranted — with real data, not speculatively.

**(e) Center survival.** The user's locked center survives unchanged. The panel's Pass-2 recommendation (single primitive with internal source+resource structure, rename to Resource) is **WITHDRAWN**. The rename debate and the liveness deferral are preserved and now specifically triggered by "a third acquisition mechanism," not vaguely "at API time."

**Explicit revisit trigger:** Reopen this question the moment a third acquisition mechanism is proposed (that is, anything beyond filesystem and canvas-authored).

### Dissent and Residual Disagreement

**Hofstadter:** Hard naming preference — the seed-crystal field must be named `origin` (not any form of "source"), reserving "source" for the eventual top-level lift. Adopted.

**Korzybski:** Revisit trigger must be in the spec in prose, not as implicit assumption, and phrased as a concrete signal ("a third acquisition mechanism") not vague time ("when API arrives"). Adopted.

**von Foerster:** Post-ship validation check — ask the author what they feel they just made when they drop a PDF. If "a PDF" (resource shape), η vindicated. If "a file" (acquisition shape), lift sooner.

**Gall, Braitenberg, McLuhan, Jacobi:** Fully aligned. Panel converged.

### What the Executor Should Do Next

1. **Keep the existing primitive's name and idiom.** No rename. Prior Pass-2 recommendation of `ResourceCellData` with explicit source/resource fields is **WITHDRAWN**.
2. **Add a PDF variant to the existing primitive.** Follow existing variant pattern exactly. Variant data: content, annotations/overlays, structured `origin` field of type `{ kind: 'filesystem', path: string }`.
3. **Do not touch the markdown variant.** It has no `origin` field yet.
4. **Ingestion gesture: drop-to-create.** File picker / drop target populates content and origin atomically.
5. **Annotations land in the PDF variant.** No separate primitive for annotations.
6. **Implement type hints in the author's editor for resolved inputs.** Independent of this structural question. Proceed.
7. **Write the "decomposition latent structure" note into the spec.** Must include: observation that acquisition and content are real separate concerns; decision to keep acquisition as in-variant `origin` for now; explicit revisit trigger ("the moment a third acquisition mechanism is proposed"); explicit out-of-scope markers (API results, remote files, liveness); rename debate deferred to same reconvene.
8. **Do not generalize the origin field across variants yet.** Cross-variant uniformity is earned, not pre-built.
