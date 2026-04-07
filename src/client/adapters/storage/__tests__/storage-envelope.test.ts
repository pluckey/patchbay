import { test } from 'node:test'
import assert from 'node:assert/strict'

import { migrate, CURRENT_VERSION, type StorageEnvelope } from '../storage-envelope.ts'
import type { Connection } from '../../../../kernel/entities/connection.ts'

const baseViewport = { x: 0, y: 0, zoom: 1 }

// Build a minimal v11 envelope. The connection shape is hand-authored as a
// Record so we can plant the legacy `sourceHandle`/`targetHandle` keys without
// fighting the current Connection type (which only knows the v12 names).
function v11Envelope(connections: Record<string, unknown>[]): StorageEnvelope {
  return {
    version: 11,
    id: 'ws-test',
    name: 'Test',
    nodes: [],
    connections: connections as unknown as Connection[],
    viewport: baseViewport,
    cells: [],
    executionMode: 'manual',
  }
}

test('v11 → v12 rewrites sourceHandle/targetHandle to sourcePort/targetPort', () => {
  const envelope = v11Envelope([
    {
      id: 'c1',
      sourceId: 's',
      targetId: 't',
      label: 'input',
      createdAt: 0,
      gate: 'open',
      sourceHandle: 'out-right',
      targetHandle: 'in-left',
    },
  ])

  const out = migrate(envelope)

  assert.equal(out.version, CURRENT_VERSION)
  assert.equal(out.connections.length, 1)
  const [conn] = out.connections as unknown as Record<string, unknown>[]
  assert.equal(conn.sourcePort, 'out-right')
  assert.equal(conn.targetPort, 'in-left')
  assert.equal(conn.sourceHandle, undefined, 'old sourceHandle key must be deleted')
  assert.equal(conn.targetHandle, undefined, 'old targetHandle key must be deleted')
})

test('v11 → v12 leaves connections without legacy handle keys untouched', () => {
  const envelope = v11Envelope([
    {
      id: 'c1',
      sourceId: 's',
      targetId: 't',
      label: 'input',
      createdAt: 0,
      gate: 'open',
    },
  ])

  const out = migrate(envelope)

  assert.equal(out.version, CURRENT_VERSION)
  const [conn] = out.connections as unknown as Record<string, unknown>[]
  assert.equal(conn.sourcePort, undefined)
  assert.equal(conn.targetPort, undefined)
  assert.equal(conn.id, 'c1')
})

test('v11 → v12 rewrites only the affected connections in a mixed batch', () => {
  const envelope = v11Envelope([
    {
      id: 'with-handles',
      sourceId: 's1',
      targetId: 't1',
      label: 'a',
      createdAt: 0,
      gate: 'open',
      sourceHandle: 'out-bottom',
      targetHandle: 'in-top',
    },
    {
      id: 'without-handles',
      sourceId: 's2',
      targetId: 't2',
      label: 'b',
      createdAt: 0,
      gate: 'open',
    },
    {
      id: 'source-only',
      sourceId: 's3',
      targetId: 't3',
      label: 'c',
      createdAt: 0,
      gate: 'open',
      sourceHandle: 'out-right',
    },
  ])

  const out = migrate(envelope)
  const conns = out.connections as unknown as Record<string, unknown>[]

  assert.equal(out.version, CURRENT_VERSION)
  assert.equal(conns.length, 3)

  // First: both keys rewritten
  assert.equal(conns[0].sourcePort, 'out-bottom')
  assert.equal(conns[0].targetPort, 'in-top')
  assert.equal(conns[0].sourceHandle, undefined)
  assert.equal(conns[0].targetHandle, undefined)

  // Second: untouched
  assert.equal(conns[1].sourcePort, undefined)
  assert.equal(conns[1].targetPort, undefined)

  // Third: only sourcePort populated; targetPort stays absent
  assert.equal(conns[2].sourcePort, 'out-right')
  assert.equal(conns[2].targetPort, undefined)
  assert.equal(conns[2].sourceHandle, undefined)
})

test('v10 envelope walks all migrations through to CURRENT_VERSION', () => {
  // v10 envelope: predates cells, executionMode, gate, and the sourceHandle
  // rename. The connection has no gate field — v10→v11 should add it — and no
  // handle keys, so v11→v12 should be a no-op for it.
  const envelope: StorageEnvelope = {
    version: 10,
    id: 'ws-old',
    name: 'Old',
    nodes: [],
    connections: [
      {
        id: 'c1',
        sourceId: 's',
        targetId: 't',
        label: 'input',
        createdAt: 0,
      } as unknown as Connection,
    ],
    viewport: baseViewport,
  }

  const out = migrate(envelope)

  assert.equal(out.version, CURRENT_VERSION)
  assert.deepEqual(out.cells, [])
  assert.equal(out.executionMode, 'manual')
  const [conn] = out.connections as unknown as Record<string, unknown>[]
  assert.equal(conn.gate, 'open', 'v10→v11 should stamp gate')
  assert.equal(conn.sourcePort, undefined)
  assert.equal(conn.targetPort, undefined)
})
