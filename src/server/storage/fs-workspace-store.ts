import { readFile, writeFile, mkdir, rename } from "fs/promises"
import path from "path"

const WORKSPACE_DIR = path.join(process.cwd(), ".context-canvas")
const WORKSPACE_FILE = path.join(WORKSPACE_DIR, "workspace.json")
const WORKSPACE_TMP = path.join(WORKSPACE_DIR, "workspace.json.tmp")

export async function readWorkspace(): Promise<string | null> {
  try {
    return await readFile(WORKSPACE_FILE, "utf-8")
  } catch {
    return null
  }
}

export async function writeWorkspace(json: string): Promise<void> {
  await mkdir(WORKSPACE_DIR, { recursive: true })
  await writeFile(WORKSPACE_TMP, json, "utf-8")
  await rename(WORKSPACE_TMP, WORKSPACE_FILE)
}

// In-process mutex for serializing read-modify-write operations
let lockPromise: Promise<void> = Promise.resolve()

export async function withWorkspaceLock<T>(fn: () => Promise<T>): Promise<T> {
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
