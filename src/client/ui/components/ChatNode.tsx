"use client"

import { memo, useState, useRef, useEffect } from "react"
import type { NodeProps } from "@xyflow/react"
import { NodeShell } from "./NodeShell"
import type { ChatFlowNodeData } from "@/client/adapters/canvas/flow-node-mapper"

type Tab = "chat" | "details"

function ChatNodeInner({ data }: NodeProps) {
  const {
    nodeId, messages, provider, model, systemPrompt, isStreaming,
    onSendMessage, onDelete, onResizeEnd,
  } = data as unknown as ChatFlowNodeData

  const [draft, setDraft] = useState("")
  const [tab, setTab] = useState<Tab>("chat")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = () => {
    const text = draft.trim()
    if (!text || isStreaming) return
    setDraft("")
    onSendMessage(nodeId, text, systemPrompt ?? "")
  }

  // Build the full payload that would be sent to the API
  const apiPayload = {
    model,
    provider,
    systemPrompt: systemPrompt ?? "(none)",
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    totalTokensEstimate: Math.round(
      ((systemPrompt?.length ?? 0) + messages.reduce((sum, m) => sum + m.content.length, 0)) / 4
    ),
  }

  const header = (
    <div className="flex items-center gap-2 px-3 py-1.5">
      {isStreaming && (
        <span className="inline-block w-2 h-2 rounded-full bg-indicator animate-pulse shrink-0" />
      )}
      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Chat</span>
      <span className="text-[10px] text-muted-foreground">{model.split("-").slice(0, 2).join(" ")}</span>
      <div className="ml-auto flex gap-1">
        <button
          onClick={() => setTab("chat")}
          className={`text-[10px] ${tab === "chat" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          chat
        </button>
        <button
          onClick={() => setTab("details")}
          className={`text-[10px] ${tab === "details" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          details
        </button>
      </div>
    </div>
  )

  return (
    <NodeShell nodeId={nodeId} onDelete={onDelete} onResizeEnd={onResizeEnd} header={header}>
      <div className="flex flex-col h-full" style={{ minHeight: 0 }}>
        {tab === "details" ? (
          <div className="flex-1 overflow-auto px-3 py-2" style={{ minHeight: 0 }}>
            <div className="space-y-3 text-[10px] font-mono">
              <div>
                <div className="text-muted-foreground uppercase tracking-wider mb-1">Model</div>
                <div className="text-foreground">{model}</div>
              </div>
              <div>
                <div className="text-muted-foreground uppercase tracking-wider mb-1">Provider</div>
                <div className="text-foreground">{provider}</div>
              </div>
              <div>
                <div className="text-muted-foreground uppercase tracking-wider mb-1">
                  System Prompt ({systemPrompt?.length ?? 0} chars)
                </div>
                <pre className="text-foreground whitespace-pre-wrap max-h-40 overflow-auto bg-muted rounded p-2 mt-1">
                  {systemPrompt || "(none — connect a pipeline to provide context)"}
                </pre>
              </div>
              <div>
                <div className="text-muted-foreground uppercase tracking-wider mb-1">
                  Messages ({messages.length})
                </div>
                {messages.map((msg, i) => (
                  <div key={i} className="border-b border-border py-1">
                    <span className="text-muted-foreground">{msg.role}: </span>
                    <span className="text-foreground">{msg.content.substring(0, 100)}{msg.content.length > 100 ? "…" : ""}</span>
                  </div>
                ))}
                {messages.length === 0 && <div className="text-muted-foreground">(no messages yet)</div>}
              </div>
              <div>
                <div className="text-muted-foreground uppercase tracking-wider mb-1">Est. Tokens</div>
                <div className="text-foreground">~{apiPayload.totalTokensEstimate.toLocaleString()}</div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-auto px-3 py-2 space-y-2" style={{ minHeight: 0 }}>
              {messages.length === 0 && !isStreaming && (
                <div className="text-xs text-muted-foreground italic">
                  {systemPrompt ? "Context loaded. Type a message to start." : "Connect a pipeline to provide context, then chat."}
                </div>
              )}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`text-xs ${
                    msg.role === "user"
                      ? "text-foreground bg-muted rounded px-2 py-1.5 ml-8"
                      : "text-foreground pr-8"
                  }`}
                >
                  <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                </div>
              ))}
              {isStreaming && (
                <div className="text-xs text-muted-foreground animate-pulse">...</div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border px-3 py-2 shrink-0">
              <div className="flex gap-1">
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    e.stopPropagation()
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  placeholder={isStreaming ? "Waiting..." : "Type a message..."}
                  disabled={isStreaming}
                  className="flex-1 text-xs bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground nodrag"
                />
                <button
                  onClick={handleSend}
                  disabled={isStreaming || !draft.trim()}
                  className="text-[10px] text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  send
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </NodeShell>
  )
}

export const ChatNode = memo(ChatNodeInner)
