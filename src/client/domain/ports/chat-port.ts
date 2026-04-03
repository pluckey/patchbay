import type { Message } from "@/kernel/entities"

export type ChatRequest = {
  messages: Message[]
  systemPrompt: string
  provider: string
  model: string
}

export interface ChatPort {
  sendMessage(request: ChatRequest): AsyncIterable<string>
}
