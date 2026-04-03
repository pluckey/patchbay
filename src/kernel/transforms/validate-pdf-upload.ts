const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

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
    return { ok: false, reason: "File exceeds the 50 MB size limit." }
  }
  return { ok: true }
}
