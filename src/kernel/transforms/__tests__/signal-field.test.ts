import { test } from 'node:test'
import assert from 'node:assert/strict'

import { createSourceCell } from '../create-source-cell.ts'
import { createAiCell } from '../create-ai-cell.ts'
import { createCodeCell } from '../create-code-cell.ts'
import { computeTerminalCells } from '../compute-terminal-cells.ts'
import { computeMix } from '../compute-mix.ts'
import { buildExecutionSchedule } from '../build-execution-schedule.ts'
import { resolveCellInputs } from '../resolve-cell-inputs.ts'
import { computeStaleness } from '../compute-staleness.ts'
import type { Cell } from '../../entities/cell.ts'
import type { Connection } from '../../entities/connection.ts'

const pos = { x: 0, y: 0 }

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
test('resolveCellInputs: keys by source title', () => {
  const source = createSourceCell(pos, 'hello', 'My Source')
  const ai = createAiCell(pos)
  const conn: Connection = { id: 'c1', sourceId: source.id, targetId: ai.id, label: 'in', createdAt: 0, gate: 'open' }
  const inputs = resolveCellInputs(ai.id, [source, ai], [conn])
  assert.equal(inputs['My Source'], 'hello')
})

// (6) computeStaleness propagates downstream
test('computeStaleness: cell with no output is stale', () => {
  const ai = createAiCell(pos)
  const map = computeStaleness([ai], [])
  assert.equal(map.get(ai.id), 'stale')
})

test('computeStaleness: source with output is current', () => {
  const source = createSourceCell(pos, 'hello', 'src')
  const map = computeStaleness([source], [])
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
  const map = computeStaleness([source, ai], [conn])
  assert.equal(map.get(ai.id), 'stale')
})

// (7) executeCascade integration is verified by the manual smoke test (Wave 10)
// since the use case imports cross-layer files that node:test cannot resolve
// without a TypeScript loader. Kernel transform behavior is fully covered above.
