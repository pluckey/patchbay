import type { AiExecutorPort, AiExecuteRequest } from "@/client/domain/ports/ai-executor-port"

export const aiExecutorAdapter: AiExecutorPort = {
  async execute(request: AiExecuteRequest): Promise<string> {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: request.userMessage }],
        systemPrompt: request.instruction,
        model: request.model,
        provider: request.provider,
        ...(request.schema ? { schema: request.schema, schemaMode: request.schemaMode } : {}),
      }),
      signal: request.signal,
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "")
      throw new Error(`AI Transform API error: ${response.status} ${response.statusText}${errorBody ? ` — ${errorBody}` : ""}`)
    }

    return await response.text()
  },
}
