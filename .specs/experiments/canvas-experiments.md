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

## Experiment 11: The Hermeneutic Accumulator

**Principle tested:** Understanding is circular — parts are understood through the whole, and the whole through the parts. Each pass through the circle changes both. (Gadamer)

**Build this layout (10-12 nodes, two columns with a growing bridge):**

**Left column — the reading increments (you build these one at a time):**

1. **Markdown** ("Section 1") — paste the first section of a text you haven't read before. A chapter, an essay, a paper — anything dense enough to reward re-reading. Do NOT paste the whole text. Only the first section.

**Right column — the processing chain (build this once, it processes every increment):**

2. **Markdown** ("Running Understanding") — start with a single sentence: "I have not yet read this text." This node is *yours*. You will rewrite it by hand after each cycle.
3. **AI Transform** (text, named mode) — *Instruction:* "You are receiving a new section of a text and the reader's current understanding of the text so far. Do three things: (1) Identify what in this new section CONFIRMS the current understanding. (2) Identify what SURPRISES — contradicts, complicates, or extends the current understanding. (3) Generate three questions this section raises that only later sections could answer." Connect "Section 1" labeled `new_section`. Connect "Running Understanding" labeled `understanding`.
4. **AI Transform** (structured, single) — *Instruction:* "Given this analysis, produce a revised model of the text's argument so far." *Schema:* `thesis` (string), `key_claims` (string), `open_questions` (string), `confidence` (number), `revision_count` (number)
5. **Chat** — connect node 4 as system prompt. This is your conversation with the evolving model. Ask it: "What would change your confidence score the most?" or "What are you most wrong about?"

**Arrange** the left column as a vertical stack growing downward — each new section below the last. The right column sits to the right, fixed in place. Connections reach horizontally from left to right. The spatial shape is a *timeline* — the left side grows, the right side deepens.

**The loop (this is the experiment — repeat for each section of the text):**
- Read the AI analysis (node 3). Read the structured model (node 4). Chat with it (node 5).
- Now rewrite "Running Understanding" (node 2) *in your own words*. Do not copy the AI's output. Write what *you* now understand. Include what you think is coming next.
- Add a new **Markdown** node ("Section 2") below Section 1 in the left column. Paste the next section of the text.
- Disconnect the previous section from node 3. Connect the new section node to node 3 labeled `new_section`. (The `understanding` connection stays.)
- Run node 3. Watch the analysis update against your revised understanding. Run node 4. Chat in node 5.
- Repeat. Section 3, Section 4, onward.

**Observe:**
- Watch the `confidence` score in node 4 across iterations. Does it climb steadily, or does it drop when a new section overturns assumptions? The shape of the curve *is* the reading experience.
- Compare your handwritten "Running Understanding" to the AI's structured model. Where do they diverge? You are the hermeneutic circle's engine — the AI is only a mirror. When the mirror disagrees with you, who is right?
- By the final section, your left column is a visible *chronology* of the reading. The spatial layout encodes something a chat transcript never could: the order in which understanding was constructed. Try reading the left column bottom-to-top. Does the text mean something different backward?

---

## Experiment 12: The Distractor Factory

**Principle tested:** The observer contaminates the observation. A test question written "forward" — correct answer first, distractors after — leaks the author's certainty into the surface form of the options. Only by inverting the sequence can the instrument become invisible. (von Foerster)

**Build this pipeline (10 nodes, diamond fan-out):**

**Row 1 — source and extraction (left to right):**

1. **Markdown** — paste a dense paragraph from your source text. Choose something with at least 3-4 important concepts. This is the territory the question will test.
2. **AI Transform** (structured, collection) — *Instruction:* "Extract the key concepts from this text that would be worth testing a learner on. For each, identify what a learner must understand versus what they might misunderstand." *Schema:* `concept` (string), `understanding` (string), `common_misunderstanding` (string)

**Row 2 — MCQ generation (the core technique):**

3. **AI Transform** (structured, single, named mode) — *Instruction:* "You are a psychometrician. Using {{concepts}}, write ONE multiple-choice question. CRITICAL: you MUST write the three WRONG answers FIRST, then the correct answer LAST. This is not arbitrary — writing distractors first prevents the correct answer from being conspicuously polished. For each distractor: name the specific misconception a real learner would hold that makes this wrong answer tempting. The misconception must be plausible, not absurd. All four options (3 distractors + 1 correct) must be similar in: length (within 20%), level of detail, linguistic sophistication, and specificity. The correct answer must NOT be longer, more hedged, or more precise than the distractors." *Schema:* `question` (string), `distractor_a` (string), `misconception_a` (string), `distractor_b` (string), `misconception_b` (string), `distractor_c` (string), `misconception_c` (string), `correct_answer` (string), `correct_rationale` (string)

**Row 3 — quality analysts (fan-out, all four in parallel):**

4. **Transform** (JavaScript) — *"Option Isolator."* Strips the question stem and misconceptions, outputs ONLY the four options with letter labels in shuffled order. This is the input for blind analysis.
```js
const mcq = JSON.parse(input.mcq.text)
const opts = [
  { text: mcq.correct_answer, key: 'correct' },
  { text: mcq.distractor_a, key: 'distractor' },
  { text: mcq.distractor_b, key: 'distractor' },
  { text: mcq.distractor_c, key: 'distractor' }
]
for (let i = opts.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [opts[i], opts[j]] = [opts[j], opts[i]]
}
const letters = ['A', 'B', 'C', 'D']
const display = opts.map((o, i) => `${letters[i]}. ${o.text}`).join('\n')
const answer = letters[opts.findIndex(o => o.key === 'correct')]
return `OPTIONS ONLY (question stem withheld):\n${display}\n\n[answer key: ${answer}]`
```

5. **AI Transform** (text, named mode) — *"BAS: Blind Answer Selection."* *Instruction:* "You are seeing ONLY the answer options for a multiple-choice question. The question stem has been deliberately withheld. Your task: guess which option is the correct answer based ONLY on how the options read. Which one sounds most 'textbook-correct,' most carefully hedged, most comprehensive? State your guess and explain what surface cues led you to it. {{options}}" Connect node 4 labeled `options`.

6. **AI Transform** (text, named mode) — *"DHI: Distractor Homogeneity."* *Instruction:* "Examine this multiple-choice question. For each of the three distractors, answer: Is this distractor genuinely on-topic with the question, or is it from a different sub-domain? A distractor that is obviously off-topic is a giveaway. Rate each distractor's topical relevance to the question stem on a 1-5 scale and explain. {{mcq}}" Connect node 3 labeled `mcq`.

7. **Transform** (JavaScript) — *"Length and Lexical Analysis."* Deterministic checks for two common MCQ flaws.
```js
const mcq = JSON.parse(input.mcq.text)
const opts = [mcq.distractor_a, mcq.distractor_b, mcq.distractor_c, mcq.correct_answer]
const lens = opts.map(o => o.length)
const mean = lens.reduce((a, b) => a + b, 0) / lens.length
const correctLen = mcq.correct_answer.length
const lengthRatio = correctLen / mean
const lengthFlag = lengthRatio > 1.2 || lengthRatio < 0.8

const stem = mcq.question.toLowerCase().split(/\W+/).filter(w => w.length > 3)
const overlap = opts.map(o => {
  const words = o.toLowerCase().split(/\W+/).filter(w => w.length > 3)
  return words.filter(w => stem.includes(w)).length
})
const meanOverlap = overlap.reduce((a, b) => a + b, 0) / overlap.length
const correctOverlap = overlap[3]
const overlapRatio = meanOverlap > 0 ? correctOverlap / meanOverlap : 0
const overlapFlag = overlapRatio > 1.5

return `LENGTH ANALYSIS:
Correct answer: ${correctLen} chars | Mean: ${mean.toFixed(0)} chars | Ratio: ${lengthRatio.toFixed(2)}x
Flag: ${lengthFlag ? 'YES — correct answer is conspicuously ' + (lengthRatio > 1 ? 'longer' : 'shorter') : 'No — lengths are balanced'}

LEXICAL OVERLAP:
Stem words shared with correct: ${correctOverlap} | Mean across all: ${meanOverlap.toFixed(1)} | Ratio: ${overlapRatio.toFixed(2)}x
Flag: ${overlapFlag ? 'YES — correct answer echoes the question stem more than distractors' : 'No — overlap is balanced'}`
```

**Row 4 — convergence and human review:**

8. **AI Transform** (text, named mode) — *"Quality Verdict."* *Instruction:* "You are a test quality reviewer. You have received four independent analyses of a multiple-choice question: (1) BLIND ANSWER SELECTION — could the correct answer be identified without seeing the question? {{bas}} (2) DISTRACTOR HOMOGENEITY — are all options genuinely on-topic? {{dhi}} (3) STATISTICAL METRICS — length and lexical overlap checks {{metrics}} Original question: {{mcq}} Synthesize a quality verdict. For each analyst that found a problem, explain how the question should be revised. If no analyst found a problem, say so — but also say what that implies about the distractors-first writing technique." Connect node 5 labeled `bas`, node 6 labeled `dhi`, node 7 labeled `metrics`, node 3 labeled `mcq`.

9. **Markdown** ("Your Verdict") — read the quality verdict. Now write your OWN assessment: do you agree? Try answering the question yourself WITHOUT looking at the correct answer. Were you tempted by any distractor? Which one, and why?

10. **AI Transform** (structured, single, named mode) — *"Final Assembly."* *Instruction:* "Given the original MCQ data in {{mcq}} and the human reviewer's notes in {{review}}, produce the final assembled question. Place the correct answer in a random position (A, B, C, or D). Do NOT always put it in position B." *Schema:* `final_question` (string), `option_a` (string), `option_b` (string), `option_c` (string), `option_d` (string), `correct_letter` (string), `quality_notes` (string). Connect node 3 labeled `mcq`, node 9 labeled `review`.

**Arrange** as a diamond. Nodes 1-2 across the top left. Node 3 at the top right. Nodes 4-7 fan out vertically in the middle column, spaced evenly. Node 8 at the bottom center. Nodes 9-10 at the bottom right. The shape makes quality pressure visible: one question enters the top, four lenses examine it in the middle, one verdict emerges below.

**Connect** node 1 → 2. Node 2 → 3 (labeled `concepts`). Node 3 → 4 (labeled `mcq`), → 6 (labeled `mcq`), and → 7 (labeled `mcq`). Node 4 → 5 (labeled `options`). Nodes 5 → 8 (labeled `bas`), 6 → 8 (labeled `dhi`), 7 → 8 (labeled `metrics`). Node 3 → 8 (labeled `mcq`). Node 3 → 10 (labeled `mcq`). Node 9 → 10 (labeled `review`).

**Observe:**
- Run the pipeline. Did the BAS analyst guess the correct answer? If it did, the distractors-first technique failed for this question — the correct answer is still conspicuously "right-sounding." Rewrite node 3's instruction to be stricter and re-run.
- Check the length and lexical analyses. Conventional question-writing almost always produces a correct answer that is longer and shares more words with the stem. Did the distractors-first instruction prevent this?
- Look at the diamond shape on your canvas. The single question at the top fans into four parallel judgments in the middle. This is what peer review looks like when it is spatial rather than sequential. Each analyst is independent — they cannot see each other's output.
- Try deliberately writing a BAD question: remove the distractors-first instruction from node 3 ("Write a question with a correct answer and three wrong answers"). Run the quality analysts again. Watch the flags light up. The difference makes the technique's value visible.

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
