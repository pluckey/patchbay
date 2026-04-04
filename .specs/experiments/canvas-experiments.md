# Canvas Experiments

A series of exercises designed to push Context Canvas to its limits and reveal emergent capabilities. Each experiment uses only existing node types — no code changes required. They escalate from accessible to mind-bending.

Designed by a roundtable of Korzybski, Hofstadter, von Foerster, and McLuhan.

---

## Prerequisites

You need a workspace with at least one source of rich text content (a PDF or a few markdown nodes with substantive material). The exercises reference *The Systems Bible* by John Gall as example source material, but any dense non-fiction text works.

**Node types you'll use:**
- **Markdown** — free-form text you write
- **PDF** — uploaded documents
- **Transform** — JavaScript code that processes inputs
- **Chat** — multi-turn AI conversation
- **AI Transform** — single-instruction LLM processing (text or structured mode)

---

## Experiment 1: The Abstraction Ladder

**Principle tested:** Every abstraction discards detail. How much survives a round trip? (Korzybski)

**Build this pipeline (7 nodes, vertical chain):**

1. **PDF node** — a chapter from your source text
2. **AI Transform** (structured, collection) — *Instruction:* "Extract every concrete example from this text." *Schema:* `example_text` (string), `page` (number)
3. **AI Transform** (structured, collection) — *Instruction:* "For each example, identify the underlying principle it illustrates." *Schema:* `principle` (string), `example_count` (number)
4. **AI Transform** (structured, collection) — *Instruction:* "Group these principles into higher-order categories." *Schema:* `category` (string), `principles` (string[])
5. **AI Transform** (structured, single) — *Instruction:* "Derive one meta-principle that unifies all these categories." *Schema:* `meta_principle` (string), `confidence` (number)
6. **AI Transform** (text mode) — *Instruction:* "Express this meta-principle as a single memorable maxim."
7. **AI Transform** (text mode) — *Instruction:* "Given ONLY this maxim and nothing else, generate a concrete real-world example that illustrates it."

**Arrange** the nodes in a literal vertical ladder on the canvas. Connect each to the next.

**Observe:**
- Compare node 7's generated example to node 2's extracted examples. Is it in the same domain? Has it drifted?
- Scan the ladder top-to-bottom. Watch the text get shorter and more abstract. The information loss is *visible*.
- Try different source texts. Which ones survive the round trip? Which are destroyed by abstraction?

---

## Experiment 2: The Ambiguity Triangulator

**Principle tested:** Three AI providers are three nervous systems. Their disagreement is a measurement instrument for semantic ambiguity. (Korzybski)

**Build this pipeline (5+ nodes, fan-out pattern):**

1. **Markdown node** — write genuinely ambiguous text (a legal clause, a poem, a diplomatic statement, a philosophical aphorism)
2. **AI Transform A** (structured, collection, Provider: Anthropic) — *Instruction:* "Analyze the claims in this text." *Schema:* `claim` (string), `confidence` (number), `interpretation` (string), `assumed_context` (string)
3. **AI Transform B** (same schema, Provider: OpenAI) — same instruction
4. **AI Transform C** (same schema, Provider: xAI) — same instruction
5. **Transform node** (JavaScript) — receives all three outputs. Parse the JSON arrays and compare: which claims appear in all three? Which only in one? Write code that computes a divergence score.
6. **AI Transform** (text mode) — *Instruction:* "Three independent AI systems diverged on these specific points. What does this reveal about the inherent ambiguity of the source text?"

**Connect** node 1 to nodes 2, 3, 4 (fan out). Connect 2, 3, 4 to node 5 (fan in). Connect 5 to 6.

**Observe:**
- Which kinds of text produce consensus? Which produce wild divergence?
- Try progressively more ambiguous texts and watch the divergence scores climb
- The structured schema makes disagreement *quantifiable*, not just narratively noted

---

## Experiment 3: The Negative Space Thesis

**Principle tested:** Every figure creates a ground. The ground is where the real action is. (McLuhan)

**Build this layout (7-9 nodes, ring pattern):**

1. Create 6-8 **Markdown nodes** and arrange them in a **ring** around an empty center. Each contains one position, perspective, or stakeholder voice on a contested topic (e.g., "the future of work," "consciousness," "educational reform"). Make them diverse and contradictory.
2. Place one **AI Transform** (text mode) at the center of the ring. Connect all peripheral nodes to it. *Instruction:* "You are receiving multiple perspectives. Your task is NOT to summarize them. Instead, articulate what is ABSENT — what none of these perspectives mention, what they collectively avoid, what the empty center implies. What is the unsaid thesis?"

**Observe:**
- Does the AI identify genuine blind spots?
- Now rearrange the same nodes into a straight line. Re-run. Does your *experience* of the result change even though the AI's input is identical? (The AI only sees concatenated text — the spatial arrangement is for you, not it.)
- What does this tell you about the canvas as a thinking medium?

---

## Experiment 4: The Analogy Machine

**Principle tested:** Analogy is the core of cognition — perceiving shared structure across different surfaces. (Hofstadter)

**Build two parallel pipelines, side by side on the canvas:**

**Pipeline A (left):**
1. **Markdown** — a passage about biological immune systems
2. **AI Transform** (structured, collection) — *Schema:* `mechanism_name` (string), `function` (string), `trigger` (string), `failure_mode` (string)
3. **AI Transform** (structured, collection) — *Instruction:* "Identify relationships between mechanisms." *Schema:* `relationship` (string), `mechanism_a` (string), `mechanism_b` (string), `type` (string)

**Pipeline B (right):** identical structure, identical schemas, but the source is about organizational crisis response.

**Cross-connections (middle):**
4. **AI Transform** (structured, collection) — receives one node from A and one from B at the same level. *Instruction:* "Identify structural correspondences between these two domains." *Schema:* `domain_a_element` (string), `domain_b_element` (string), `structural_similarity` (string), `strength` (number)

**Final node:**
5. **AI Transform** (text mode) — receives all cross-mappings. *Instruction:* "Based on these structural correspondences, generate one novel prediction — something known to be true in the biological domain that, by analogy, should be true in the organizational domain but has not been stated."

**Observe:**
- Does the parallel spatial arrangement help you *see* the analogy?
- Does the forced schema alignment produce better analogical mappings than a single prompt asking "compare these two things"?
- Does the novel prediction actually make sense?

---

## Experiment 5: The McLuhan Tetrad (Self-Reflexive)

**Principle tested:** Every medium enhances, obsolesces, retrieves, and reverses. What does Context Canvas do to thought? (McLuhan)

**Build this layout (9+ nodes, concentric squares):**

1. **Markdown** (center) — "Context Canvas — a spatial workspace for composing AI context with connected nodes."
2. Four **Markdown nodes** arranged in a square around center, labeled: "ENHANCES: ___", "OBSOLESCES: ___", "RETRIEVES: ___", "REVERSES INTO: ___". Leave them blank for now.
3. **AI Transform** (structured, single) — connect center to it. *Instruction:* "Apply McLuhan's tetrad of media effects to this medium." *Schema:* `enhances` (string), `obsolesces` (string), `retrieves` (string), `reverses_into` (string)
4. Read the AI's answers. Now fill in the four Markdown nodes with **your own** answers. Disagree where you see fit.
5. Connect both the AI output and your four nodes to a final **AI Transform** (text mode) — *Instruction:* "The AI and the human have produced different tetrad analyses of the same tool. Where they disagree, who has a better understanding of the medium, and why?"

**Observe:**
- Where do you disagree with the AI's self-analysis of the tool?
- Does the spatial tetrad (an actual square) produce different thinking than a bulleted list would?
- The tool analyzing itself is a figure/ground inversion. How does it feel?

---

## Experiment 6: The Eigenbehavior Generator

**Principle tested:** Recursive operations converge to fixed points — stable forms that reproduce themselves. (von Foerster)

**Build this chain (4 nodes, all auto-execute):**

1. **Markdown** — a single concept word: "emergence"
2. **AI Transform** (auto-execute, text) — *Instruction:* "Define this concept in exactly three sentences. Be precise."
3. **AI Transform** (auto-execute, text) — *Instruction:* "Identify the single most important hidden ASSUMPTION in this definition. State it in one sentence."
4. **AI Transform** (auto-execute, text) — *Instruction:* "Redefine the original concept, this time explicitly incorporating and addressing the hidden assumption. Three sentences."

**The loop (manual):**
- Read node 4's output
- Copy it and paste into node 1, replacing the original word
- Watch nodes 2-3-4 cascade and re-execute
- Read node 4 again. Repeat.

**Observe:**
- Does the concept converge to a fixed point where define → question → redefine produces the same text?
- How many cycles does it take?
- Duplicate the entire 4-node chain side-by-side for different seed words — "justice," "consciousness," "love," "algorithm" — and compare convergence rates on the same canvas
- Some concepts stabilize quickly. Others oscillate forever. What does this tell you about the concept?

---

## Experiment 7: The Ethical Choice Tree

**Principle tested:** "Act always so as to increase the number of choices." (von Foerster's ethical imperative)

**Build this tree (6+ nodes, branching layout):**

1. **Markdown** (top center) — describe a real, genuinely ambiguous ethical dilemma you face
2. **AI Transform** (structured, collection, auto-execute) — *Instruction:* "Extract every possible course of action." *Schema:* `action` (string), `immediate_consequence` (string), `who_benefits` (string[]), `who_is_harmed` (string[])
3. For each action identified (create these as branches): **AI Transform** (structured, single) — *Instruction:* "If this action is taken, what new choices does it open and what choices does it foreclose?" *Schema:* `choices_opened` (string[]), `choices_foreclosed` (string[]), `net_choice_delta` (number)
4. **Transform** (JavaScript) — receives all branch nodes. Parse the JSON, sum `net_choice_delta`, rank actions by which maximizes future optionality.
5. **AI Transform** (text mode) — *Instruction:* "Given this choice-space analysis, what does the SHAPE of the decision tree reveal? Which action creates the most expansive future?"

**Arrange** as an actual branching tree on the canvas — dilemma at root, actions as branches, consequences as leaves.

**Observe:**
- Does spatializing the decision change your intuition?
- Does "maximize future choices" produce different recommendations than "maximize benefit" or "minimize harm"?
- Does the branching *shape* carry information the numbers alone don't?

---

## Experiment 8: The Exquisite Corpse Pipeline

**Principle tested:** The medium transmits more than the content. A graph carries paralanguage. (McLuhan)

**Requires two people and a shared workspace file.**

**Person A:**
1. Build the left half of a pipeline: 2-3 source nodes, 1-2 AI Transform nodes that begin processing
2. Add a **Markdown** labeled "INTENT" explaining what you hope the complete pipeline will produce
3. Stop building mid-pipeline. Save the workspace file.

**Person B:**
1. Open the workspace. See everything Person A built.
2. Build the right half — connect to Person A's nodes however you see fit
3. Add a **Markdown** labeled "INTERPRETATION" explaining what you understood Person A's intent to be

**Person A reopens.** Compare INTENT to INTERPRETATION. Add a final **Markdown** labeled "SURPRISE" — what did Person B build that you didn't expect?

**Observe:**
- Did the spatial arrangement communicate intent that the INTENT node didn't say explicitly?
- Did Person B's completion feel coherent or alien?
- What does this tell you about spatial layout as a communication medium?

---

## Experiment 9: The Self-Modeling Canvas

**Principle tested:** A system that contains its own description is a strange loop. (Hofstadter)

**Build this recursive structure:**

1. **Markdown** ("Blueprint") — write a complete natural-language description of every node in the workspace, their types, connections, and purposes. **Include this node itself** — it describes itself describing the workspace.
2. **AI Transform** (structured, collection, auto-execute) — *Instruction:* "Parse this workspace description into a formal inventory." *Schema:* `node_name` (string), `node_type` (string), `purpose` (string), `exists` (boolean)
3. **Transform** (JavaScript) — parse the structured output. Check for inconsistencies: nodes described but missing, connections that reference non-existent nodes. Output a discrepancy report.
4. **Markdown** ("Discrepancies") — review the report. Note whether each discrepancy is a *bug* (description is wrong) or a *feature request* (description prescribes something that should exist but doesn't yet).

**The loop:**
- Build the nodes that the Blueprint describes but don't exist yet
- Update the Blueprint to include the new nodes
- Re-run. Repeat until the discrepancy report is empty.

**Observe:**
- Can the workspace bootstrap itself from its own description?
- Every time you add a node, you must update the Blueprint, which may trigger new discrepancies. Can it converge?
- The moment the Blueprint becomes fully accurate — map matches territory — is the eigenbehavior. But is it stable?

---

## Experiment 10: The Recursive Research Engine

**Principle tested:** The book about systems analyzing the system analyzing the book. All four panelists at once.

**This is the capstone. It's designed for The Systems Bible but adapts to any text about systems, complexity, or epistemology.**

**Build this pipeline:**

1. **PDF node** — a chapter of *The Systems Bible*
2. **AI Transform** (structured, collection) — *Instruction:* "Extract every systems principle stated or implied in this text." *Schema:* `principle_name` (string), `principle_statement` (string), `page` (number)
3. **AI Transform** (structured, collection, auto-execute) — *Instruction:* "For each principle, ask: does this principle apply to Context Canvas itself — the tool being used to extract it? How specifically?" *Schema:* `applies` (boolean), `application` (string), `prediction` (string), `testable` (boolean)

**For each principle where `applies: true` and `testable: true`:**
4. Create a branch — a **Markdown** node that designs a concrete experiment testing that principle *within Context Canvas itself*
5. **Build and run the experiment** as a sub-pipeline on the same canvas, next to the analysis pipeline

**Example:** If the extracted principle is "Le Chatelier's Principle: complex systems tend to oppose their own proper function," your experiment might be: build a pipeline with 6+ chained AI Transforms with auto-execute. Edit the first node. Does the cascade degrade quality downstream?

**Observe:**
- A book about systems being used to analyze the system analyzing the book
- The moment a principle extracted from the text accurately predicts a limitation you then hit in the canvas — that's the strange loop closing
- The canvas is simultaneously the researcher, the subject, and the lab notebook

---

## Reflection Questions

After running several experiments, consider:

1. Which experiments revealed something about the tool that surprised you?
2. Which revealed something about your own thinking that surprised you?
3. Where did the spatial arrangement of nodes carry meaning beyond the text?
4. What did the tool make easy that would be hard in a chat interface? What did it make hard that would be easy?
5. What capability is missing that would unlock the next level of experiments?

---

*"The tool's deepest capability isn't any single node type. It's that structure is visible. A pipeline in code is invisible. A pipeline on a canvas is a diagram you can point at. Making structure visible is the first step to making structure thinkable." — Korzybski*
