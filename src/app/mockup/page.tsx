"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/client/ui/components/ui/tabs"
import { Button } from "@/client/ui/components/ui/button"
import { GripVertical, X, Plus, CircleDot } from "lucide-react"

// ─── Mock Data ───────────────────────────────────────────────────────────────

const inputs = [
  {
    num: 1,
    label: "Research Notes",
    text: "The transformer architecture processes input tokens in parallel through self-attention layers. Each layer computes query, key, and value matrices. Attention head pruning experiments demonstrate 40% of heads can be removed with <2% performance loss.",
  },
  {
    num: 2,
    label: "Style Guide",
    text: 'Write for a technical audience. Use precise terminology. Avoid hedging language. Lead with conclusions, follow with evidence. Maximum 3 bullet points per concept.',
  },
  {
    num: 3,
    label: "Paper Abstracts",
    text: '"Scaling Laws for Neural Language Models" (Kaplan et al., 2020): Performance scales as a power law with model size, dataset size, and compute. "Attention Is All You Need" (Vaswani et al., 2017): The transformer architecture replaces recurrence with self-attention.',
  },
]

const schemaFields = [
  { name: "finding", type: "string" },
  { name: "source_paper", type: "string" },
  { name: "significance", type: "number" },
]

const tableRows = [
  { finding: "Attention heads in layers 4-8 specialize for syntactic relationships; deeper layers (20+) encode semantic similarity", source: "Research Notes (unpublished)", score: 9 },
  { finding: "40% of attention heads can be pruned with less than 2% performance degradation", source: "Research Notes (unpublished)", score: 8 },
  { finding: "Model performance scales as a power law with model size, dataset size, and compute budget", source: "Kaplan et al., 2020", score: 10 },
  { finding: "Self-attention can fully replace recurrence for sequence modeling with superior parallelization", source: "Vaswani et al., 2017", score: 10 },
]

const errorRow = { finding: null, source: "Vaswani et al., 2017", score: "high" }

// ─── Components ──────────────────────────────────────────────────────────────

function InputPanel() {
  return (
    <div className="flex flex-col border-r border-border bg-muted/30">
      <div className="px-5 py-3 border-b border-border">
        <span className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground">
          Inputs ({inputs.length})
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {inputs.map((input) => (
          <div
            key={input.num}
            className="rounded-md border border-border bg-background p-3 text-xs leading-relaxed text-muted-foreground cursor-grab"
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <GripVertical className="size-3 text-muted-foreground/50" />
              <span className="size-4 rounded-full bg-muted text-[9px] font-semibold flex items-center justify-center text-muted-foreground">
                {input.num}
              </span>
              <span className="text-[9px] font-medium tracking-wider uppercase text-muted-foreground/70">
                {input.label}
              </span>
            </div>
            <p className="line-clamp-3">{input.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-medium tracking-wider text-indicator">
      <span className="size-1.5 rounded-full bg-indicator animate-pulse" />
      LIVE
    </span>
  )
}

function OutputPanel({ mode }: { mode: string }) {
  const [view, setView] = useState<"table" | "json">("table")

  if (mode === "passthrough") {
    return (
      <div className="flex flex-col bg-muted/30">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <span className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground">
            Output
          </span>
          <LiveBadge />
        </div>
        <div className="flex-1 overflow-y-auto p-5 text-sm leading-relaxed text-foreground">
          <p className="mb-4">
            The transformer architecture processes input tokens in parallel through self-attention
            layers. Each layer computes query, key, and value matrices. Attention head pruning
            experiments demonstrate 40% of heads can be removed with &lt;2% performance loss.
          </p>
          <p className="mb-4">
            Write for a technical audience. Use precise terminology. Avoid hedging language. Lead
            with conclusions, follow with evidence. Maximum 3 bullet points per concept.
          </p>
          <p>
            &quot;Scaling Laws for Neural Language Models&quot; (Kaplan et al., 2020): Performance scales as a
            power law with model size, dataset size, and compute. &quot;Attention Is All You Need&quot;
            (Vaswani et al., 2017): The transformer architecture replaces recurrence with
            self-attention.
          </p>
        </div>
      </div>
    )
  }

  if (mode === "code") {
    return (
      <div className="flex flex-col bg-muted/30">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <span className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground">
            Output
          </span>
          <LiveBadge />
        </div>
        <div className="flex-1 overflow-y-auto p-5 text-sm leading-relaxed text-foreground">
          <ul className="list-disc pl-4 space-y-1.5">
            <li>Attention heads in layers 4-8 specialize for syntactic relationships</li>
            <li>Deeper layers (20+) encode semantic similarity</li>
            <li>40% of heads can be pruned with &lt;2% performance loss</li>
          </ul>
        </div>
      </div>
    )
  }

  // AI mode
  return (
    <div className="flex flex-col bg-muted/30">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <span className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground">
          Output
        </span>
        <div className="flex items-center gap-3">
          <div className="flex rounded-md border border-border overflow-hidden">
            <button
              onClick={() => setView("table")}
              className={`px-2.5 py-1 text-[10px] font-medium transition-colors ${
                view === "table"
                  ? "bg-foreground text-background"
                  : "bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setView("json")}
              className={`px-2.5 py-1 text-[10px] font-medium transition-colors ${
                view === "json"
                  ? "bg-foreground text-background"
                  : "bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              JSON
            </button>
          </div>
          <LiveBadge />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        {view === "table" ? (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                  <span className="text-[10px] uppercase tracking-wider">finding</span>
                  <span className="ml-1.5 px-1.5 py-0.5 rounded bg-muted text-[9px] font-mono text-muted-foreground/70">
                    string
                  </span>
                </th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                  <span className="text-[10px] uppercase tracking-wider">source_paper</span>
                  <span className="ml-1.5 px-1.5 py-0.5 rounded bg-muted text-[9px] font-mono text-muted-foreground/70">
                    string
                  </span>
                </th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                  <span className="text-[10px] uppercase tracking-wider">significance</span>
                  <span className="ml-1.5 px-1.5 py-0.5 rounded bg-muted text-[9px] font-mono text-muted-foreground/70">
                    number
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-2.5 px-3 text-foreground">{row.finding}</td>
                  <td className="py-2.5 px-3 font-mono text-muted-foreground">{row.source}</td>
                  <td className="py-2.5 px-3 font-mono text-indicator-foreground font-medium">{row.score}</td>
                </tr>
              ))}
              {/* Error row */}
              <tr className="border-b border-border/50">
                <td className="py-2.5 px-3 bg-destructive/5 text-destructive">
                  <span>[null]</span>
                  <span className="ml-2 inline-flex items-center gap-1 text-[10px]">
                    <CircleDot className="size-2.5" />
                    missing required
                  </span>
                </td>
                <td className="py-2.5 px-3 font-mono text-muted-foreground">{errorRow.source}</td>
                <td className="py-2.5 px-3 bg-destructive/5 text-destructive font-mono">
                  <span>&quot;{errorRow.score}&quot;</span>
                  <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-sans">
                    <CircleDot className="size-2.5" />
                    expected number
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        ) : (
          <pre className="text-xs font-mono leading-relaxed text-foreground">
            <span className="text-muted-foreground">[</span>{"\n"}
            {"  "}<span className="text-muted-foreground">{"{"}</span>{"\n"}
            {"    "}<span className="font-medium">&quot;finding&quot;</span>: <span className="text-indicator-foreground">&quot;Attention heads in layers 4-8 specialize...&quot;</span>,{"\n"}
            {"    "}<span className="font-medium">&quot;source_paper&quot;</span>: <span className="text-indicator-foreground">&quot;Research Notes (unpublished)&quot;</span>,{"\n"}
            {"    "}<span className="font-medium">&quot;significance&quot;</span>: <span className="text-indicator-foreground">9</span>{"\n"}
            {"  "}<span className="text-muted-foreground">{"}"}</span>,{"\n"}
            {"  "}<span className="text-muted-foreground">{"{"}</span>{"\n"}
            {"    "}<span className="font-medium">&quot;finding&quot;</span>: <span className="text-indicator-foreground">&quot;40% of attention heads can be pruned...&quot;</span>,{"\n"}
            {"    "}<span className="font-medium">&quot;source_paper&quot;</span>: <span className="text-indicator-foreground">&quot;Research Notes (unpublished)&quot;</span>,{"\n"}
            {"    "}<span className="font-medium">&quot;significance&quot;</span>: <span className="text-indicator-foreground">8</span>{"\n"}
            {"  "}<span className="text-muted-foreground">{"}"}</span>,{"\n"}
            {"  "}<span className="text-muted-foreground">{"{"}</span>{"\n"}
            {"    "}<span className="font-medium">&quot;finding&quot;</span>: <span className="text-destructive">null</span>,{"  "}<span className="text-destructive text-[10px]">← missing required field</span>{"\n"}
            {"    "}<span className="font-medium">&quot;source_paper&quot;</span>: <span className="text-indicator-foreground">&quot;Vaswani et al., 2017&quot;</span>,{"\n"}
            {"    "}<span className="font-medium">&quot;significance&quot;</span>: <span className="text-destructive">&quot;high&quot;</span>{"  "}<span className="text-destructive text-[10px]">← expected number</span>{"\n"}
            {"  "}<span className="text-muted-foreground">{"}"}</span>{"\n"}
            <span className="text-muted-foreground">]</span>
          </pre>
        )}
      </div>
    </div>
  )
}

// ─── Transform Panels ────────────────────────────────────────────────────────

function PassthroughPanel() {
  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-5">
      <div>
        <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
          Order
        </label>
        <div className="space-y-1.5">
          {inputs.map((input) => (
            <div
              key={input.num}
              className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground cursor-grab"
            >
              <GripVertical className="size-3 text-muted-foreground/50" />
              <span className="text-muted-foreground">Input {input.num}</span>
              <span className="text-muted-foreground/50">—</span>
              <span className="truncate">{input.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
          Separator
        </label>
        <input
          type="text"
          defaultValue="\n\n"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-mono text-foreground outline-none focus:border-foreground transition-colors"
        />
      </div>
    </div>
  )
}

function CodePanel() {
  return (
    <div className="flex-1 overflow-y-auto p-5">
      <pre className="font-mono text-sm leading-relaxed text-foreground whitespace-pre-wrap">
        <span className="text-muted-foreground">function</span>(inputs) {"{"}{"\n"}
        {"  "}<span className="text-muted-foreground">const</span> notes = inputs[0];{"\n"}
        {"  "}<span className="text-muted-foreground">const</span> style = inputs[1];{"\n"}
        {"\n"}
        {"  "}<span className="text-muted-foreground">return</span> notes{"\n"}
        {"    "}.split(<span className="text-indicator-foreground">&apos;\n&apos;</span>){"\n"}
        {"    "}.filter(Boolean){"\n"}
        {"    "}.map(line =&gt;{"\n"}
        {"      "}<span className="text-indicator-foreground">`- ${"${"}line.trim(){"}"}`</span>{"\n"}
        {"    "}){"\n"}
        {"    "}.join(<span className="text-indicator-foreground">&apos;\n&apos;</span>);{"\n"}
        {"}"}
      </pre>
    </div>
  )
}

function AiPanel() {
  const [schemaOpen, setSchemaOpen] = useState(true)

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Model */}
      <div className="px-5 pt-5 pb-4">
        <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
          Model
        </label>
        <select className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-mono text-foreground outline-none focus:border-foreground transition-colors cursor-pointer">
          <option>claude-sonnet-4-6</option>
          <option>claude-opus-4-6</option>
          <option>claude-haiku-4-5</option>
          <option>gpt-4o</option>
        </select>
      </div>

      {/* Instruction */}
      <div className="px-5 pb-4 flex-1">
        <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
          Instruction
        </label>
        <textarea
          defaultValue={`Extract the key research findings from both inputs. For each finding, identify the paper it comes from and rate its significance for understanding transformer efficiency.\n\nReturn as a collection of findings.`}
          className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm leading-relaxed text-foreground outline-none focus:border-foreground transition-colors resize-none min-h-[140px]"
        />
      </div>

      {/* Schema */}
      <div className="px-5 pb-5 border-t border-border pt-4">
        <button
          onClick={() => setSchemaOpen(!schemaOpen)}
          className="flex items-center justify-between w-full group"
        >
          <span className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground">
            Schema ({schemaFields.length} fields)
          </span>
          <span className={`text-xs text-muted-foreground/50 transition-transform ${schemaOpen ? "rotate-180" : ""}`}>
            ▾
          </span>
        </button>
        {schemaOpen && (
          <div className="mt-3 space-y-1.5">
            {schemaFields.map((field, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <input
                  type="text"
                  defaultValue={field.name}
                  className="flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-mono text-foreground outline-none focus:border-foreground transition-colors"
                />
                <select className="rounded-md border border-border bg-background px-2 py-1.5 text-[11px] font-mono text-muted-foreground outline-none focus:border-foreground transition-colors cursor-pointer">
                  <option selected={field.type === "string"}>string</option>
                  <option selected={field.type === "number"}>number</option>
                  <option>boolean</option>
                </select>
                <Button variant="ghost" size="icon-xs" className="text-muted-foreground/50 hover:text-destructive">
                  <X className="size-3" />
                </Button>
              </div>
            ))}
            <button className="w-full mt-2 rounded-md border border-dashed border-border py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
              <Plus className="size-3 inline mr-1" />
              add field
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function MockupPage() {
  const [activeTab, setActiveTab] = useState("ai")

  return (
    <div className="min-h-screen bg-background p-8 flex flex-col gap-6">
      <div>
        <h1 className="text-sm font-medium text-foreground">TE Cell — Scope View</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Three-column layout: Input | Transform | Output. Transform pane tabs between Passthrough, Code, and AI.
        </p>
      </div>

      {/* The Scope */}
      <div className="flex-1 rounded-xl border border-border bg-background shadow-lg overflow-hidden grid grid-cols-[280px_1fr_1fr] min-h-[600px]">
        {/* Left: Inputs */}
        <InputPanel />

        {/* Center: Transform */}
        <div className="flex flex-col border-r border-border">
          <div className="px-5 py-3 border-b border-border">
            <span className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground">
              Transform
            </span>
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 gap-0">
            <div className="px-5 border-b border-border">
              <TabsList variant="line" className="h-9">
                <TabsTrigger value="passthrough" className="text-xs">Passthrough</TabsTrigger>
                <TabsTrigger value="code" className="text-xs">Code</TabsTrigger>
                <TabsTrigger value="ai" className="text-xs">AI</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="passthrough" className="flex-1 flex flex-col">
              <PassthroughPanel />
            </TabsContent>
            <TabsContent value="code" className="flex-1 flex flex-col">
              <CodePanel />
            </TabsContent>
            <TabsContent value="ai" className="flex-1 flex flex-col">
              <AiPanel />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: Output */}
        <OutputPanel mode={activeTab} />
      </div>
    </div>
  )
}
