"use client"

import { memo, useState, useRef, useEffect, useCallback } from "react"
import type { NodeProps } from "@xyflow/react"
import ReactMarkdown from "react-markdown"
import { NodeShell } from "./NodeShell"
import type { ChatFlowNodeData } from "@/client/adapters/canvas/flow-node-mapper"

type Tab = "chat" | "details"

function ChatNodeInner({ data }: NodeProps) {
  const {
    nodeId, messages, provider, model, systemPrompt, isStreaming,
    onSendMessage, onResetChat, onDelete, onResizeEnd,
  } = data as unknown as ChatFlowNodeData

  const [draft, setDraft] = useState("")
  const [tab, setTab] = useState<Tab>("chat")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Auto-resize textarea
  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "0"
    el.style.height = Math.min(el.scrollHeight, 80) + "px"
  }, [])

  useEffect(() => {
    resizeTextarea()
  }, [draft, resizeTextarea])

  const handleSend = () => {
    const text = draft.trim()
    if (!text || isStreaming) return
    setDraft("")
    onSendMessage(nodeId, text, systemPrompt ?? "")
  }

  const modelShort = model.split("-").slice(0, 2).join(" ")

  const header = (
    <div className="flex items-center gap-2 px-3 py-1.5">
      <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${isStreaming ? "bg-indicator animate-pulse" : systemPrompt ? "bg-primary" : "bg-muted-foreground"}`} />
      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Chat</span>
      <span className="text-[10px] text-muted-foreground">{modelShort}</span>
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
        {messages.length > 0 && (
          <button
            onClick={() => onResetChat(nodeId)}
            className="text-[10px] text-muted-foreground hover:text-foreground disabled:opacity-50"
            disabled={isStreaming}
          >
            reset
          </button>
        )}
      </div>
    </div>
  )

  return (
    <NodeShell nodeId={nodeId} onDelete={onDelete} onResizeEnd={onResizeEnd} header={header}>
      <div className="flex flex-col h-full" style={{ minHeight: 0 }}>
        {tab === "details" ? (
          <DetailsTab
            model={model}
            provider={provider}
            systemPrompt={systemPrompt}
          />
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-auto px-3 py-2 space-y-3" style={{ minHeight: 0 }}>
              {messages.length === 0 && !isStreaming && (
                <div className="text-xs text-muted-foreground italic py-4 text-center">
                  {systemPrompt ? "Context loaded. Type a message to start." : "Connect a pipeline to provide context, then chat."}
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i}>
                  <div className="text-[9px] text-muted-foreground mb-0.5">
                    {msg.role === "user" ? "you" : modelShort}
                  </div>
                  <div className={
                    msg.role === "user"
                      ? "text-xs text-foreground bg-muted rounded-lg px-3 py-2"
                      : "text-xs text-foreground"
                  }>
                    {msg.role === "assistant" ? (
                      <div className="prose dark:prose-invert prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-pre:my-1 prose-blockquote:my-1">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap m-0">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex items-center gap-1.5 py-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-indicator animate-pulse" />
                  <span className="text-[10px] text-muted-foreground">thinking...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border px-3 py-2 shrink-0">
              <div className="flex items-end gap-1">
                <textarea
                  ref={textareaRef}
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
                  placeholder={isStreaming ? "Waiting..." : "Message..."}
                  disabled={isStreaming}
                  rows={1}
                  className="flex-1 text-xs bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground nodrag resize-none overflow-hidden"
                  style={{ minHeight: "20px" }}
                />
                <button
                  onClick={handleSend}
                  disabled={isStreaming || !draft.trim()}
                  className="text-[10px] text-muted-foreground hover:text-foreground disabled:opacity-30 shrink-0 pb-0.5"
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

function DetailsTab({ model, provider, systemPrompt }: {
  model: string
  provider: string
  systemPrompt?: string
}) {
  const totalChars = systemPrompt?.length ?? 0

  return (
    <div className="flex-1 overflow-auto px-3 py-2" style={{ minHeight: 0 }}>
      <div className="space-y-3 text-[10px] font-mono">
        <div>
          <div className="text-muted-foreground uppercase tracking-wider mb-1">Est. Tokens</div>
          <div className="text-foreground">~{Math.round(totalChars / 4).toLocaleString()}</div>
        </div>
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
      </div>
    </div>
  )
}

export const ChatNode = memo(ChatNodeInner)
