import { readFile, writeFile, mkdir, rename, unlink } from "fs/promises"
import path from "path"
import { STORAGE_ROOT } from "./storage-root"

const WORKSPACE_DIR = STORAGE_ROOT
const WORKSPACE_FILE = path.join(WORKSPACE_DIR, "workspace.json")
const WORKSPACE_TMP = path.join(WORKSPACE_DIR, "workspace.json.tmp")
const WORKSPACES_DIR = path.join(WORKSPACE_DIR, "workspaces")

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

function validateWorkspaceId(id: string): void {
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    throw new Error(`Invalid workspace ID: ${id}`)
  }
}

export async function readWorkspaceById(id: string): Promise<string | null> {
  validateWorkspaceId(id)
  try {
    return await readFile(path.join(WORKSPACES_DIR, `${id}.json`), "utf-8")
  } catch {
    return null
  }
}

export async function writeWorkspaceById(id: string, json: string): Promise<void> {
  validateWorkspaceId(id)
  await mkdir(WORKSPACES_DIR, { recursive: true })
  const filePath = path.join(WORKSPACES_DIR, `${id}.json`)
  const tmpPath = path.join(WORKSPACES_DIR, `${id}.json.tmp`)
  await writeFile(tmpPath, json, "utf-8")
  await rename(tmpPath, filePath)
}

export async function deleteWorkspaceFile(id: string): Promise<void> {
  validateWorkspaceId(id)
  try {
    await unlink(path.join(WORKSPACES_DIR, `${id}.json`))
  } catch {
    // Silently ignore file-not-found errors
  }
}
