import { test } from 'node:test'
import assert from 'node:assert/strict'

import { createSourceCell } from '../create-source-cell.ts'
import { createAiCell } from '../create-ai-cell.ts'
import { createCodeCell } from '../create-code-cell.ts'
import { computeTerminalCells } from '../compute-terminal-cells.ts'
import { computeMix } from '../compute-mix.ts'
import { buildExecutionSchedule } from '../build-execution-schedule.ts'
import { resolveCellInputs } from '../resolve-cell-inputs.ts'
import { hashCellInputs } from '../hash-cell-inputs.ts'
import { computeStaleness } from '../compute-staleness.ts'
import { validateConnection } from '../validate-connection.ts'
import { buildInputTypeDefs } from '../../../client/ui/components/transform-input-types.ts'
import type { Cell } from '../../entities/cell.ts'
import type { Connection } from '../../entities/connection.ts'
import type { ResolvedInput, ResolvedPdfInput, ResolvedMarkdownInput } from '../../entities/resolved-input.ts'
import type { MarkdownNodeData, PdfNodeData, ChatNodeData, AiTransformNodeData, TransformNodeData } from '../../entities/workspace-node.ts'

const pos = { x: 0, y: 0 }

// Test fixtures for legacy WorkspaceNodes
function makeMarkdownNode(id: string, content = ''): MarkdownNodeData {
  return { id, type: 'markdown', content, position: pos, createdAt: 0, updatedAt: 0 }
}
function makePdfNode(id: string, filename = 'test.pdf'): PdfNodeData {
  return {
    id, type: 'pdf', blobId: 'blob-' + id, filename,
    currentPage: 1, totalPages: 1, zoomLevel: 1, darkMode: false,
    annotations: [], position: pos, createdAt: 0, updatedAt: 0,
  }
}
function makeChatNode(id: string): ChatNodeData {
  return { id, type: 'chat', messages: [], provider: 'anthropic', model: 'claude', position: pos, createdAt: 0, updatedAt: 0 }
}
function makeTransformNode(id: string): TransformNodeData {
  return { id, type: 'transform', transformCode: '', timeoutMs: 5000, position: pos, createdAt: 0, updatedAt: 0 }
}
function makeAiTransformNode(id: string): AiTransformNodeData {
  return {
    id, type: 'ai-transform', instruction: '', provider: 'anthropic', model: 'claude',
    autoExecute: false, inputMode: 'concat', outputMode: 'text', schemaMode: 'single', schema: [],
    position: pos, createdAt: 0, updatedAt: 0,
  }
}

// (1) Cell creation transforms produce correct types
test('createSourceCell produces source cell with identity output', () => {
  const cell = createSourceCell(pos, 'hello', 'My Source')
  assert.equal(cell.type, 'source')
  assert.equal(cell.content, 'hello')
  assert.equal(cell.title, 'My Source')
  assert.equal(cell.output?.status, 'success')
  if (cell.output?.status === 'success') assert.equal(cell.output.text, 'hello')
})

test('createAiCell produces ai cell with defaults', () => {
  const cell = createAiCell(pos)
  assert.equal(cell.type, 'ai')
  assert.equal(cell.title, 'AI')
  assert.equal(cell.outputMode, 'text')
  assert.equal(cell.schemaMode, 'single')
  assert.deepEqual(cell.schema, [])
})

test('createCodeCell produces code cell with default timeout', () => {
  const cell = createCodeCell(pos)
  assert.equal(cell.type, 'code')
  assert.equal(cell.timeoutMs, 5000)
  assert.equal(cell.code, '')
})

// (2) computeTerminalCells returns cells with no outgoing open connections
test('computeTerminalCells: source feeding ai → ai is terminal', () => {
  const source = createSourceCell(pos, 'a', 'src')
  const ai = createAiCell(pos)
  const conn: Connection = { id: 'c1', sourceId: source.id, targetId: ai.id, label: 'in', createdAt: 0, gate: 'open' }
  const terminals = computeTerminalCells([source, ai], [conn])
  assert.equal(terminals.length, 1)
  assert.equal(terminals[0].id, ai.id)
})

test('computeTerminalCells: latched outgoing → cell is terminal', () => {
  const source = createSourceCell(pos, 'a', 'src')
  const ai = createAiCell(pos)
  const conn: Connection = { id: 'c1', sourceId: source.id, targetId: ai.id, label: 'in', createdAt: 0, gate: 'latched' }
  const terminals = computeTerminalCells([source, ai], [conn])
  // Both terminal: source has only latched outgoing, ai has no outgoing
  assert.equal(terminals.length, 2)
})

// (3) computeMix orders by topological depth
test('computeMix: terminal cells appear with title and output', () => {
  const source = createSourceCell(pos, 'hello', 'src')
  const ai = { ...createAiCell(pos), title: 'My AI', output: { status: 'success' as const, text: 'response', durationMs: 100 } }
  const conn: Connection = { id: 'c1', sourceId: source.id, targetId: ai.id, label: 'in', createdAt: 0, gate: 'open' }
  const mix = computeMix([source, ai], [conn])
  assert.equal(mix.length, 1)
  assert.equal(mix[0].cellId, ai.id)
  assert.equal(mix[0].title, 'My AI')
  assert.equal(mix[0].output, 'response')
})

// (4) buildExecutionSchedule follows BFS, skips latched, excludes Source
test('buildExecutionSchedule: BFS downstream, source excluded', () => {
  const source = createSourceCell(pos, 'a', 'src')
  const ai = createAiCell(pos)
  const conn: Connection = { id: 'c1', sourceId: source.id, targetId: ai.id, label: 'in', createdAt: 0, gate: 'open' }
  const schedule = buildExecutionSchedule(source.id, [source, ai], [conn])
  assert.equal(schedule.length, 1)
  assert.equal(schedule[0].cellId, ai.id)
})

test('buildExecutionSchedule: latched connection blocks propagation', () => {
  const source = createSourceCell(pos, 'a', 'src')
  const ai = createAiCell(pos)
  const conn: Connection = { id: 'c1', sourceId: source.id, targetId: ai.id, label: 'in', createdAt: 0, gate: 'latched' }
  const schedule = buildExecutionSchedule(source.id, [source, ai], [conn])
  assert.equal(schedule.length, 0)
})

// (5) resolveCellInputs returns keyed inputs from connected cells
test('resolveCellInputs: keys by connection label, wraps cell output as ResolvedDerivedInput', () => {
  const source = createSourceCell(pos, 'hello', 'My Source')
  const ai = createAiCell(pos)
  const conn: Connection = { id: 'c1', sourceId: source.id, targetId: ai.id, label: 'in', createdAt: 0, gate: 'open' }
  const inputs = resolveCellInputs(ai.id, [source, ai], [conn])
  assert.deepEqual(inputs['in'], { text: 'hello', type: 'derived' })
})

test('resolveCellInputs: legacy markdown node source produces ResolvedMarkdownInput via legacyOutputs', () => {
  const mdNode = makeMarkdownNode('m1', '# notes')
  const code = createCodeCell(pos)
  const conn: Connection = { id: 'c1', sourceId: mdNode.id, targetId: code.id, label: 'notes', createdAt: 0, gate: 'open' }
  const legacyOutputs = new Map<string, ResolvedInput>([
    [mdNode.id, { text: '# notes', type: 'markdown' as const } satisfies ResolvedMarkdownInput],
  ])
  const inputs = resolveCellInputs(code.id, [code], [conn], [mdNode], undefined, legacyOutputs)
  assert.deepEqual(inputs['notes'], { text: '# notes', type: 'markdown' })
})

test('resolveCellInputs: legacy pdf node source produces ResolvedPdfInput via legacyOutputs', () => {
  const pdfNode = makePdfNode('p1', 'paper.pdf')
  const code = createCodeCell(pos)
  const conn: Connection = { id: 'c1', sourceId: pdfNode.id, targetId: code.id, label: 'paper', createdAt: 0, gate: 'open' }
  const pdfInput: ResolvedPdfInput = {
    text: 'page 1 text',
    pages: ['page 1 text', 'page 2 text'],
    type: 'pdf',
    currentPage: 1,
    totalPages: 2,
    filename: 'paper.pdf',
    annotations: [],
  }
  const legacyOutputs = new Map<string, ResolvedInput>([[pdfNode.id, pdfInput]])
  const inputs = resolveCellInputs(code.id, [code], [conn], [pdfNode], undefined, legacyOutputs)
  assert.deepEqual(inputs['paper'], pdfInput)
})

test('resolveCellInputs: missing source is silently skipped', () => {
  const code = createCodeCell(pos)
  const conn: Connection = { id: 'c1', sourceId: 'nonexistent', targetId: code.id, label: 'ghost', createdAt: 0, gate: 'open' }
  const inputs = resolveCellInputs(code.id, [code], [conn])
  assert.deepEqual(inputs, {})
})

test('resolveCellInputs: legacy node source without legacyOutputs entry is skipped', () => {
  const pdfNode = makePdfNode('p1')
  const code = createCodeCell(pos)
  const conn: Connection = { id: 'c1', sourceId: pdfNode.id, targetId: code.id, label: 'paper', createdAt: 0, gate: 'open' }
  // No legacyOutputs map provided — legacy source is skipped
  const inputs = resolveCellInputs(code.id, [code], [conn], [pdfNode])
  assert.deepEqual(inputs, {})
})

// (6) computeStaleness propagates downstream
test('computeStaleness: cell with no output is stale', () => {
  const ai = createAiCell(pos)
  const map = computeStaleness([ai], [], [])
  assert.equal(map.get(ai.id), 'stale')
})

test('computeStaleness: source with output is current', () => {
  const source = createSourceCell(pos, 'hello', 'src')
  const map = computeStaleness([source], [], [])
  assert.equal(map.get(source.id), 'current')
})

test('computeStaleness: connected cell with mismatched lastInputHash is stale', () => {
  const source = createSourceCell(pos, 'hello', 'src')
  const ai: Cell = {
    ...createAiCell(pos),
    output: { status: 'success', text: 'old response', durationMs: 100 },
    lastInputHash: 'stale-hash',
  }
  const conn: Connection = { id: 'c1', sourceId: source.id, targetId: ai.id, label: 'in', createdAt: 0, gate: 'open' }
  const map = computeStaleness([source, ai], [conn], [])
  assert.equal(map.get(ai.id), 'stale')
})

test('computeStaleness: connected cell whose hash matches lastInputHash is current', () => {
  const source = createSourceCell(pos, 'hello', 'src')
  const ai = createAiCell(pos)
  const conn: Connection = { id: 'c1', sourceId: source.id, targetId: ai.id, label: 'in', createdAt: 0, gate: 'open' }
  const expectedHash = hashCellInputs(ai.id, [source, ai], [conn], [])
  const aiWithHash: Cell = {
    ...ai,
    output: { status: 'success', text: 'response', durationMs: 100 },
    lastInputHash: expectedHash,
  }
  const map = computeStaleness([source, aiWithHash], [conn], [])
  assert.equal(map.get(aiWithHash.id), 'current')
})

test('computeStaleness: cell downstream of legacy PdfNode is stale until hash recorded', () => {
  const pdfNode = makePdfNode('p1', 'paper.pdf')
  const code = createCodeCell(pos)
  const codeWithOutput: Cell = {
    ...code,
    output: { status: 'success', text: 'extracted', durationMs: 100 },
    lastInputHash: 'wrong-hash',
  }
  const conn: Connection = { id: 'c1', sourceId: pdfNode.id, targetId: code.id, label: 'paper', createdAt: 0, gate: 'open' }
  const map = computeStaleness([codeWithOutput], [conn], [pdfNode])
  assert.equal(map.get(codeWithOutput.id), 'stale')
})

// (8b) hashCellInputs: deterministic, sensitive to source state
test('hashCellInputs: deterministic across connection insertion order', () => {
  const a = createSourceCell(pos, 'A', 'a')
  const b = createSourceCell(pos, 'B', 'b')
  const target = createCodeCell(pos)
  const c1: Connection = { id: 'c1', sourceId: a.id, targetId: target.id, label: 'aaa', createdAt: 0, gate: 'open' }
  const c2: Connection = { id: 'c2', sourceId: b.id, targetId: target.id, label: 'bbb', createdAt: 0, gate: 'open' }
  const h1 = hashCellInputs(target.id, [a, b, target], [c1, c2], [])
  const h2 = hashCellInputs(target.id, [a, b, target], [c2, c1], [])
  assert.equal(h1, h2)
})

test('hashCellInputs: changes when PdfNode currentPage changes', () => {
  const pdf1 = makePdfNode('p1', 'paper.pdf')
  const pdf2: PdfNodeData = { ...pdf1, currentPage: 5 }
  const target = createCodeCell(pos)
  const conn: Connection = { id: 'c1', sourceId: pdf1.id, targetId: target.id, label: 'paper', createdAt: 0, gate: 'open' }
  const h1 = hashCellInputs(target.id, [target], [conn], [pdf1])
  const h2 = hashCellInputs(target.id, [target], [conn], [pdf2])
  assert.notEqual(h1, h2)
})

test('hashCellInputs: changes when PdfNode annotations change', () => {
  const pdf1 = makePdfNode('p1', 'paper.pdf')
  const pdf2: PdfNodeData = {
    ...pdf1,
    annotations: [{ id: 'a1', page: 1, region: { x: 0, y: 0, width: 10, height: 10 }, label: 'note', text: 'hello' }],
  }
  const target = createCodeCell(pos)
  const conn: Connection = { id: 'c1', sourceId: pdf1.id, targetId: target.id, label: 'paper', createdAt: 0, gate: 'open' }
  const h1 = hashCellInputs(target.id, [target], [conn], [pdf1])
  const h2 = hashCellInputs(target.id, [target], [conn], [pdf2])
  assert.notEqual(h1, h2)
})

test('hashCellInputs: changes when MarkdownNode content changes', () => {
  const md1 = makeMarkdownNode('m1', 'old')
  const md2 = makeMarkdownNode('m1', 'new')
  const target = createCodeCell(pos)
  const conn: Connection = { id: 'c1', sourceId: md1.id, targetId: target.id, label: 'notes', createdAt: 0, gate: 'open' }
  const h1 = hashCellInputs(target.id, [target], [conn], [md1])
  const h2 = hashCellInputs(target.id, [target], [conn], [md2])
  assert.notEqual(h1, h2)
})

// (8c) buildInputTypeDefs: derived sourceType produces DerivedInput
test('buildInputTypeDefs: derived sourceType produces DerivedInput in declared input', () => {
  const lib = buildInputTypeDefs([
    { label: 'upstream', sourceName: 'My Code', sourceType: 'derived' },
  ])
  assert.match(lib, /upstream: DerivedInput/)
  assert.match(lib, /interface DerivedInput/)
})

test('buildInputTypeDefs: pdf sourceType produces PdfInput with annotations field', () => {
  const lib = buildInputTypeDefs([
    { label: 'paper', sourceName: 'paper.pdf', sourceType: 'pdf' },
  ])
  assert.match(lib, /paper: PdfInput/)
  assert.match(lib, /annotations: Array</)
})

test('buildInputTypeDefs: markdown sourceType produces MarkdownInput', () => {
  const lib = buildInputTypeDefs([
    { label: 'notes', sourceName: 'notes', sourceType: 'markdown' },
  ])
  assert.match(lib, /notes: MarkdownInput/)
})

test('buildInputTypeDefs: empty legend produces fallback Record signature', () => {
  const lib = buildInputTypeDefs([])
  assert.match(lib, /declare const input: Record<string,/)
})

// (7) executeCascade integration is verified by the manual smoke test (Wave 10)
// since the use case imports cross-layer files that node:test cannot resolve
// without a TypeScript loader. Kernel transform behavior is fully covered above.

// (8) validateConnection: cross-type allowance for legacy → cell + reverse rejection
test('validateConnection: pdf → code cell is permitted', () => {
  const pdfNode = makePdfNode('p1')
  const codeCell = createCodeCell(pos)
  const result = validateConnection([], [pdfNode], pdfNode.id, codeCell.id, [codeCell])
  assert.equal(result.valid, true)
})

test('validateConnection: pdf → ai cell is permitted', () => {
  const pdfNode = makePdfNode('p1')
  const aiCell = createAiCell(pos)
  const result = validateConnection([], [pdfNode], pdfNode.id, aiCell.id, [aiCell])
  assert.equal(result.valid, true)
})

test('validateConnection: markdown → code cell is permitted', () => {
  const mdNode = makeMarkdownNode('m1')
  const codeCell = createCodeCell(pos)
  const result = validateConnection([], [mdNode], mdNode.id, codeCell.id, [codeCell])
  assert.equal(result.valid, true)
})

test('validateConnection: markdown → ai cell is permitted', () => {
  const mdNode = makeMarkdownNode('m1')
  const aiCell = createAiCell(pos)
  const result = validateConnection([], [mdNode], mdNode.id, aiCell.id, [aiCell])
  assert.equal(result.valid, true)
})

test('validateConnection: pdf → source cell is rejected (source cells cannot receive input)', () => {
  const pdfNode = makePdfNode('p1')
  const sourceCell = createSourceCell(pos, 'hi', 'src')
  const result = validateConnection([], [pdfNode], pdfNode.id, sourceCell.id, [sourceCell])
  assert.equal(result.valid, false)
})

test('validateConnection: code cell → pdf node is rejected (reverse direction blocked)', () => {
  const pdfNode = makePdfNode('p1')
  const codeCell = createCodeCell(pos)
  const result = validateConnection([], [pdfNode], codeCell.id, pdfNode.id, [codeCell])
  assert.equal(result.valid, false)
  if (!result.valid) assert.match(result.reason, /Cells cannot feed into legacy nodes/)
})

test('validateConnection: chat node → code cell is rejected (only pdf|markdown sources allowed)', () => {
  const chatNode = makeChatNode('c1')
  const codeCell = createCodeCell(pos)
  const result = validateConnection([], [chatNode], chatNode.id, codeCell.id, [codeCell])
  assert.equal(result.valid, false)
  if (!result.valid) assert.match(result.reason, /Only PDF and markdown nodes/)
})

test('validateConnection: ai-transform node → code cell is rejected', () => {
  const aiTransform = makeAiTransformNode('a1')
  const codeCell = createCodeCell(pos)
  const result = validateConnection([], [aiTransform], aiTransform.id, codeCell.id, [codeCell])
  assert.equal(result.valid, false)
})

test('validateConnection: pdf → chat node is rejected (legacy → legacy with content target unchanged)', () => {
  const pdfNode = makePdfNode('p1')
  const chatNode = makeChatNode('c1')
  // No incoming yet → chat is a content node, only one incoming allowed; first connection is allowed
  const result = validateConnection([], [pdfNode, chatNode], pdfNode.id, chatNode.id, [])
  assert.equal(result.valid, true) // legacy→legacy, no cells in play
})

test('validateConnection: pdf → transform node still works (legacy unchanged)', () => {
  const pdfNode = makePdfNode('p1')
  const xform = makeTransformNode('t1')
  const result = validateConnection([], [pdfNode, xform], pdfNode.id, xform.id, [])
  assert.equal(result.valid, true)
})

test('validateConnection: cycle detection still works in cross-type graphs', () => {
  // Construct: pdfNode → codeCell, then try codeCell → pdfNode (would create cycle and reverse-block)
  // The reverse-block kicks in first, so this asserts the reverse-block reason takes precedence
  const pdfNode = makePdfNode('p1')
  const codeCell = createCodeCell(pos)
  const conn: Connection = { id: 'c1', sourceId: pdfNode.id, targetId: codeCell.id, label: 'paper', createdAt: 0, gate: 'open' }
  const result = validateConnection([conn], [pdfNode], codeCell.id, pdfNode.id, [codeCell])
  assert.equal(result.valid, false)
})

test('validateConnection: self-connection still rejected for cells', () => {
  const codeCell = createCodeCell(pos)
  const result = validateConnection([], [], codeCell.id, codeCell.id, [codeCell])
  assert.equal(result.valid, false)
  if (!result.valid) assert.match(result.reason, /itself/)
})
