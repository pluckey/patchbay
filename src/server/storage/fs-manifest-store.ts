import { readFile, writeFile, mkdir, rename } from "fs/promises"
import path from "path"
import type { WorkspaceRef } from "@/kernel/entities"
import { STORAGE_ROOT } from "./storage-root"
import { DEMO_WORKSPACE } from "./demo-seed"

export type Manifest = {
  workspaces: WorkspaceRef[]
  activeId: string
}

const WORKSPACE_DIR = STORAGE_ROOT
const MANIFEST_FILE = path.join(WORKSPACE_DIR, "manifest.json")
const MANIFEST_TMP = path.join(WORKSPACE_DIR, "manifest.json.tmp")
const WORKSPACES_SUBDIR = path.join(WORKSPACE_DIR, "workspaces")

// On Vercel serverless, each cold-start instance has empty /tmp. Seed the
// demo workspace on first read so visitors always land on a populated canvas.
//
// Also re-seed when the bundled DEMO_WORKSPACE.id has changed since the last
// time this instance seeded — that's how a deploy with a new seed picks up
// without waiting for the instance to cold-start.
let seedAttempted = false
async function seedDemoIfMissing(): Promise<void> {
  if (seedAttempted) return
  seedAttempted = true

  let existing: Manifest | null = null
  try {
    existing = JSON.parse(await readFile(MANIFEST_FILE, "utf-8")) as Manifest
  } catch {}

  const hasCurrentDemo = existing?.workspaces.some((w) => w.id === DEMO_WORKSPACE.id) ?? false
  if (existing && hasCurrentDemo) return

  await mkdir(WORKSPACES_SUBDIR, { recursive: true })
  const wsPath = path.join(WORKSPACES_SUBDIR, `${DEMO_WORKSPACE.id}.json`)
  await writeFile(wsPath, JSON.stringify(DEMO_WORKSPACE, null, 2), "utf-8")
  const now = Date.now()
  const manifest: Manifest = {
    workspaces: [
      { id: DEMO_WORKSPACE.id, name: DEMO_WORKSPACE.name, createdAt: now, updatedAt: now },
    ],
    activeId: DEMO_WORKSPACE.id,
  }
  await writeFile(MANIFEST_FILE, JSON.stringify(manifest, null, 2), "utf-8")
}

export async function readManifest(): Promise<Manifest | null> {
  await seedDemoIfMissing()
  try {
    const raw = await readFile(MANIFEST_FILE, "utf-8")
    return JSON.parse(raw) as Manifest
  } catch {
    return null
  }
}

export async function writeManifest(manifest: Manifest): Promise<void> {
  await mkdir(WORKSPACES_SUBDIR, { recursive: true })
  await writeFile(MANIFEST_TMP, JSON.stringify(manifest, null, 2), "utf-8")
  await rename(MANIFEST_TMP, MANIFEST_FILE)
}

// Independent in-process mutex (does NOT share lock with fs-workspace-store)
let lockPromise: Promise<void> = Promise.resolve()

export async function withManifestLock<T>(fn: () => Promise<T>): Promise<T> {
  let resolve: () => void
  const nextLock = new Promise<void>((r) => { resolve = r })
  const prevLock = lockPromise
  lockPromise = nextLock
  await prevLock
  try {
    return await fn()
  } finally {
    resolve!()
  }
}
