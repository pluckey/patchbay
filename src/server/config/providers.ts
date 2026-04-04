import type { ModelRosterEntry } from "@/kernel/entities"

// ---------------------------------------------------------------------------
// Provider configuration — server-only, never sent to client
// Direct provider APIs. No gateway.
// ---------------------------------------------------------------------------

export type ProviderConfig = {
  adapterType: "anthropic-native" | "openai-compatible"
  apiKeyEnvVar: string
  baseURL?: string
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
  xai: {
    adapterType: "openai-compatible",
    apiKeyEnvVar: "XAI_API_KEY",
    baseURL: "https://api.x.ai/v1",
  },
  google: {
    adapterType: "openai-compatible",
    apiKeyEnvVar: "GOOGLE_API_KEY",
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
  },
}

// ---------------------------------------------------------------------------
// Model roster — roster entries are safe to send to client
// Plain model IDs — no gateway prefixes.
// ---------------------------------------------------------------------------

export const MODEL_ROSTER: ModelRosterEntry[] = [
  { provider: "anthropic", model: "claude-sonnet-4-20250514", displayName: "Claude Sonnet 4" },
  { provider: "anthropic", model: "claude-haiku-4-5-20251001", displayName: "Claude Haiku 4.5" },
  { provider: "openai", model: "gpt-4o", displayName: "GPT-4o" },
  { provider: "openai", model: "gpt-4o-mini", displayName: "GPT-4o Mini" },
  { provider: "xai", model: "grok-4.20-0309-reasoning", displayName: "Grok 4.20" },
]

// ---------------------------------------------------------------------------
// Default model — first roster entry
// ---------------------------------------------------------------------------

export const DEFAULT_MODEL: ModelRosterEntry = MODEL_ROSTER[0]
