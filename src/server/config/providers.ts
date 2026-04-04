import type { ModelRosterEntry } from "@/kernel/entities"

// ---------------------------------------------------------------------------
// Provider configuration — server-only, never sent to client
// All providers route through Portkey AI gateway.
// ---------------------------------------------------------------------------

export type ProviderConfig = {
  adapterType: "openai-compatible"
  apiKeyEnvVar: string
  baseURL: string
  headers?: Record<string, string>
}

const PORTKEY_BASE_URL = "https://api.portkey.ai/v1"

export const PROVIDER_CONFIG: Record<string, ProviderConfig> = {
  anthropic: {
    adapterType: "openai-compatible",
    apiKeyEnvVar: "PORTKEY_API_KEY",
    baseURL: PORTKEY_BASE_URL,
    headers: { "x-portkey-provider": "anthropic" },
  },
  openai: {
    adapterType: "openai-compatible",
    apiKeyEnvVar: "PORTKEY_API_KEY",
    baseURL: PORTKEY_BASE_URL,
    headers: { "x-portkey-provider": "openai" },
  },
  xai: {
    adapterType: "openai-compatible",
    apiKeyEnvVar: "PORTKEY_API_KEY",
    baseURL: PORTKEY_BASE_URL,
    headers: { "x-portkey-provider": "x-ai" },
  },
}

// ---------------------------------------------------------------------------
// Model roster — roster entries are safe to send to client
// Model IDs use Portkey's @provider/model format for gateway routing.
// ---------------------------------------------------------------------------

export const MODEL_ROSTER: ModelRosterEntry[] = [
  { provider: "anthropic", model: "@anthropic/claude-sonnet-4-20250514", displayName: "Claude Sonnet 4" },
  { provider: "anthropic", model: "@anthropic/claude-haiku-4-5-20251001", displayName: "Claude Haiku 4.5" },
  { provider: "openai", model: "@openai/gpt-4o", displayName: "GPT-4o" },
  { provider: "openai", model: "@openai/gpt-4o-mini", displayName: "GPT-4o Mini" },
  { provider: "xai", model: "@x-ai/grok-4.20-0309-reasoning", displayName: "Grok 4.20" },
]

// ---------------------------------------------------------------------------
// Default model — first roster entry
// ---------------------------------------------------------------------------

export const DEFAULT_MODEL: ModelRosterEntry = MODEL_ROSTER[0]
