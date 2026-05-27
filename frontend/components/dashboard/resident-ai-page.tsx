"use client"

import { useState } from "react"
import { Bot, Eraser, Send, Sparkles, Wrench } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Textarea } from "@/components/ui/textarea"
import { useResidentAiChatMutation, useResidentAiChatStatusQuery, useResidentAiClearSessionMutation } from "@/hooks/use-ai"
import type { AiToolEvent } from "@/lib/types/ai"

type LocalMessage = {
  role: "user" | "assistant"
  content: string
  toolEvents?: AiToolEvent[]
}

export function ResidentAiPage() {
  const status = useResidentAiChatStatusQuery()
  const sendChat = useResidentAiChatMutation()
  const clearSession = useResidentAiClearSessionMutation()
  const [sessionId, setSessionId] = useState("")
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<LocalMessage[]>([])

  const configured = Boolean(status.data?.configured)

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-background p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <Badge variant="outline" className="border-blue-200 text-blue-700">AI Assistant</Badge>
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <Bot className="size-5" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Resident AI help</h1>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                  Ask for billing, notices, open tickets, or ask AI to create support ticket. No permanent chat save.
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>{configured ? (status.data?.providerName ?? "Provider ready") : "AI not configured"}</Badge>
            <Badge variant="secondary">{status.data?.toolCount ?? 0} tools</Badge>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Chat</CardTitle>
            <CardDescription>UI memory stays on page only. Backend session auto-expires.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-[560px] space-y-3 overflow-y-auto rounded-xl border bg-slate-50 p-4">
              {messages.length ? messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`rounded-2xl p-4 ${message.role === "user" ? "ml-auto max-w-[88%] bg-slate-950 text-white" : "mr-auto max-w-[92%] border bg-white text-slate-900"}`}
                >
                  <p className="text-xs uppercase tracking-[0.2em] opacity-70">{message.role}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                  {message.toolEvents?.length ? (
                    <div className="mt-4 space-y-2">
                      {message.toolEvents.map((event, eventIndex) => (
                        <div key={`${event.name}-${eventIndex}`} className="rounded-xl border bg-slate-50 p-3 text-slate-700">
                          <div className="flex flex-wrap items-center gap-2">
                            <Wrench className="size-4" />
                            <p className="text-xs font-medium uppercase tracking-wide">{event.name}</p>
                            {event.isError ? <Badge variant="destructive">error</Badge> : <Badge variant="secondary">done</Badge>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              )) : (
                <Empty className="border-0 bg-transparent">
                  <EmptyHeader>
                    <EmptyMedia variant="icon"><Sparkles /></EmptyMedia>
                    <EmptyTitle>No chat yet</EmptyTitle>
                    <EmptyDescription>Try: "show my unpaid bills" or "create plumbing ticket for kitchen sink leak".</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </div>

            <div className="space-y-3">
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value ?? "")}
                rows={5}
                placeholder="Ask AI to check your bills, notices, open tickets, or create a support ticket."
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  disabled={!configured || sendChat.isPending || !input.trim()}
                  onClick={() => {
                    const outgoing = input.trim()
                    setMessages((current) => [...current, { role: "user", content: outgoing }])
                    setInput("")
                    sendChat.mutate(
                      {
                        message: outgoing,
                        sessionId: sessionId || undefined,
                      },
                      {
                        onSuccess: (result) => {
                          const payload = result.data
                          setSessionId(payload?.sessionId ?? "")
                          setMessages((current) => [
                            ...current,
                            {
                              role: "assistant",
                              content: payload?.reply ?? "No reply",
                              toolEvents: payload?.toolEvents ?? [],
                            },
                          ])
                        },
                      }
                    )
                  }}
                  className="gap-2"
                >
                  <Send className="size-4" />
                  {sendChat.isPending ? "Sending..." : "Send"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={clearSession.isPending}
                  onClick={() => {
                    if (sessionId) {
                      clearSession.mutate(sessionId)
                    }
                    setSessionId("")
                    setMessages([])
                  }}
                  className="gap-2"
                >
                  <Eraser className="size-4" />
                  Clear temp memory
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Current AI route</CardTitle>
              <CardDescription>Provider config comes from admin AI page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-700">
              <div className="rounded-xl border p-4">
                <p className="font-medium text-slate-950">Provider</p>
                <p className="mt-1">{status.data?.providerName ?? "Not configured"}</p>
              </div>
              <div className="rounded-xl border p-4">
                <p className="font-medium text-slate-950">Model</p>
                <p className="mt-1">{status.data?.model ?? "None"}</p>
              </div>
              <div className="rounded-xl border p-4">
                <p className="font-medium text-slate-950">Memory policy</p>
                <p className="mt-1">{status.data?.sessionMode ?? "ephemeral_only"}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Good asks</CardTitle>
              <CardDescription>Short prompts work best.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-700">
              <div className="rounded-xl border p-4">Show my unpaid bills.</div>
              <div className="rounded-xl border p-4">List my open maintenance tickets.</div>
              <div className="rounded-xl border p-4">Any building notices for me?</div>
              <div className="rounded-xl border p-4">Create emergency plumbing ticket for bathroom leak.</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
