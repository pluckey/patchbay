const DELETED_IDS_KEY = "context-canvas:deletedIds"

export function loadManifest(): string[] {
  try {
    const raw = localStorage.getItem(DELETED_IDS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveManifest(ids: string[]): void {
  try {
    if (ids.length > 0) {
      localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(ids))
    } else {
      localStorage.removeItem(DELETED_IDS_KEY)
    }
  } catch { /* ignore */ }
}
