import path from "path"

// On Vercel serverless functions, the working directory is read-only.
// /tmp is the only writable location (ephemeral per instance).
// Locally, persist to the conventional .context-canvas folder under cwd.
export const STORAGE_ROOT = process.env.VERCEL
  ? "/tmp/.context-canvas"
  : path.join(process.cwd(), ".context-canvas")
