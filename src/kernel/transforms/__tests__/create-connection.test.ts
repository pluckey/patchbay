import { test } from 'node:test'
import assert from 'node:assert/strict'

import { createConnection } from '../create-connection.ts'
import { createSourceCell } from '../create-source-cell.ts'
import { createAiCell } from '../create-ai-cell.ts'
import type { Connection } from '../../entities/connection.ts'
import type { MarkdownNodeData, PdfNodeData } from '../../entities/workspace-node.ts'

const pos = { x: 0, y: 0 }

function makeMarkdownNode(id: string): MarkdownNodeData {
  return { id, type: 'markdown', content: '', position: pos, createdAt: 0, updatedAt: 0 }
}
function makePdfNode(id: string, filename: string): PdfNodeData {
  return {
    id, type: 'pdf', blobId: 'blob-' + id, filename,
    currentPage: 1, totalPages: 1, zoomLevel: 1, darkMode: false,
    annotations: [], position: pos, createdAt: 0, updatedAt: 0,
  }
}

test('createConnection: node→node uses graph.nodes and generates a label from source type', () => {
  const a = makeMarkdownNode('a')
  const b = makeMarkdownNode('b')
  const conn = createConnection(a.id, b.id, { nodes: [a, b], existingConnections: [] })

  assert.equal(conn.sourceId, a.id)
  assert.equal(conn.targetId, b.id)
  assert.equal(conn.label, 'markdown')
  assert.equal(conn.gate, 'open')
  assert.equal(conn.sourcePort, undefined, 'no port options → key absent')
  assert.equal(conn.targetPort, undefined, 'no port options → key absent')
})

test('createConnection: cell→cell uses graph.cells when source is a cell', () => {
  const source = createSourceCell(pos, 'hello', 'My Source')
  const ai = createAiCell(pos)
  const conn = createConnection(
    source.id,
    ai.id,
    { nodes: [], existingConnections: [], cells: [source, ai] },
  )

  assert.equal(conn.sourceId, source.id)
  assert.equal(conn.targetId, ai.id)
  // generateLabel for a cell uses the cell's type as the base label
  assert.equal(conn.label, 'source')
})

test('createConnection: options.sourcePort/targetPort populate the port keys', () => {
  const a = makeMarkdownNode('a')
  const b = makeMarkdownNode('b')
  const conn = createConnection(
    a.id,
    b.id,
    { nodes: [a, b], existingConnections: [] },
    { sourcePort: 'out-bottom', targetPort: 'in-top' },
  )

  assert.equal(conn.sourcePort, 'out-bottom')
  assert.equal(conn.targetPort, 'in-top')
})

test('createConnection: only one of sourcePort/targetPort populates only that key', () => {
  const a = makeMarkdownNode('a')
  const b = makeMarkdownNode('b')
  const conn = createConnection(
    a.id,
    b.id,
    { nodes: [a, b], existingConnections: [] },
    { sourcePort: 'out-right' },
  )

  assert.equal(conn.sourcePort, 'out-right')
  assert.equal(conn.targetPort, undefined)
})

test('createConnection: label collisions are resolved with a numeric suffix', () => {
  const a = makeMarkdownNode('a')
  const b = makeMarkdownNode('b')
  const c = makeMarkdownNode('c')
  const existing: Connection[] = [
    { id: 'e1', sourceId: a.id, targetId: b.id, label: 'markdown', createdAt: 0, gate: 'open' },
  ]
  const conn = createConnection(a.id, c.id, { nodes: [a, b, c], existingConnections: existing })

  // First markdown→x is "markdown"; second collision becomes "markdown_2"
  assert.equal(conn.label, 'markdown_2')
})

test('createConnection: pdf source labels itself from the sanitized filename', () => {
  const pdf = makePdfNode('p', 'My File.pdf')
  const target = makeMarkdownNode('t')
  const conn = createConnection(pdf.id, target.id, { nodes: [pdf, target], existingConnections: [] })

  assert.equal(conn.label, 'my_file')
})
