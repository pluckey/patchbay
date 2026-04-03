import type { ModelRosterEntry } from "@/kernel/entities"

// ---------------------------------------------------------------------------
// Provider configuration — server-only, never sent to client
// ---------------------------------------------------------------------------

export type ProviderConfig = {
  adapterType: "anthropic-native" | "openai-compatible"
  apiKeyEnvVar: string
  baseURL?: string
  headers?: Record<string, string>
}

export const PROVIDER_CONFIG: Record<string, ProviderConfig> = {
  anthropic: {
    adapterType: "anthropic-native",
    apiKeyEnvVar: "ANTHROPIC_API_KEY",
  },
  openai: {
    adapterType: "openai-compatible",
    apiKeyEnvVar: "OPENAI_API_KEY",
    baseURL: "https://api.openai.com/v1",
  },
}

// ---------------------------------------------------------------------------
// Model roster — roster entries are safe to send to client
// ---------------------------------------------------------------------------

export const MODEL_ROSTER: ModelRosterEntry[] = [
  { provider: "anthropic", model: "claude-sonnet-4-20250514", displayName: "Claude Sonnet 4" },
  { provider: "anthropic", model: "claude-haiku-4-5-20251001", displayName: "Claude Haiku 4.5" },
  { provider: "openai", model: "gpt-4o", displayName: "GPT-4o" },
  { provider: "openai", model: "gpt-4o-mini", displayName: "GPT-4o Mini" },
]

// ---------------------------------------------------------------------------
// Default model — first roster entry
// ---------------------------------------------------------------------------

export const DEFAULT_MODEL: ModelRosterEntry = MODEL_ROSTER[0]
