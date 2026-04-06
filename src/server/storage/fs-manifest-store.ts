import { readFile, writeFile, mkdir, rename } from "fs/promises"
import path from "path"
import type { WorkspaceRef } from "@/kernel/entities"

export type Manifest = {
  workspaces: WorkspaceRef[]
  activeId: string
}

const WORKSPACE_DIR = path.join(process.cwd(), ".context-canvas")
const MANIFEST_FILE = path.join(WORKSPACE_DIR, "manifest.json")
const MANIFEST_TMP = path.join(WORKSPACE_DIR, "manifest.json.tmp")

export async function readManifest(): Promise<Manifest | null> {
  try {
    const raw = await readFile(MANIFEST_FILE, "utf-8")
    return JSON.parse(raw) as Manifest
  } catch {
    return null
  }
}

export async function writeManifest(manifest: Manifest): Promise<void> {
  await mkdir(WORKSPACE_DIR, { recursive: true })
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
