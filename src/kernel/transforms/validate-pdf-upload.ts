/**
 * 200 MB is the business rule: PDF cells accept files up to this size.
 *
 * IMPORTANT: Vercel serverless functions cap request bodies at 4.5 MB. Uploads
 * larger than 4.5 MB will 413 in production when POSTed through `/api/blobs`.
 * To support large PDFs on Vercel, route them through direct-to-storage uploads
 * (Vercel Blob client uploads, presigned S3/R2 URLs) instead of the API route.
 * See `CLAUDE.md` "Known traps" for the full context.
 */
const MAX_FILE_SIZE = 200 * 1024 * 1024 // 200 MB

type ValidationResult =
  | { ok: true }
  | { ok: false; reason: string }

export function validatePdfUpload(file: { size: number; type: string }): ValidationResult {
  if (file.type !== "application/pdf") {
    return { ok: false, reason: "Only PDF files are supported." }
  }
  if (file.size === 0) {
    return { ok: false, reason: "File is empty." }
  }
  if (file.size > MAX_FILE_SIZE) {
    return { ok: false, reason: "File exceeds the 200 MB size limit." }
  }
  return { ok: true }
}
