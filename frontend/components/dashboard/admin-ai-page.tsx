"use client"

import { useMemo, useState } from "react"
import { Bot, Eraser, KeyRound, Plus, Send, ServerCog, ShieldCheck, Sparkles, Trash2, Wrench } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useAdminAiChatMutation, useAdminAiChatStatusQuery, useAdminAiClearSessionMutation, useCreateAiProviderConfigMutation, useAiCurrentProviderStatusQuery, useAiMcpToolsQuery, useAiProviderConfigsQuery, useDeleteAiProviderConfigMutation, useMcpToolCallMutation, useUpdateAiProviderConfigMutation } from "@/hooks/use-ai"
import { useOrganizationsQuery } from "@/hooks/use-admin-dashboard"
import type { AiToolEvent } from "@/lib/types/ai"
import type { AiProviderKind } from "@/lib/types/ai"

const providerOptions: Array<{
  value: AiProviderKind
  label: string
  modelPlaceholder: string
  baseUrlPlaceholder: string
}> = [
  { value: "openai", label: "OpenAI / ChatGPT", modelPlaceholder: "gpt-5", baseUrlPlaceholder: "https://api.openai.com" },
  { value: "anthropic", label: "Claude / Anthropic", modelPlaceholder: "claude-sonnet-4-0", baseUrlPlaceholder: "https://api.anthropic.com" },
  { value: "gemini", label: "Google Gemini", modelPlaceholder: "gemini-2.5-pro", baseUrlPlaceholder: "https://generativelanguage.googleapis.com" },
  { value: "openrouter", label: "OpenRouter", modelPlaceholder: "openai/gpt-4.1", baseUrlPlaceholder: "https://openrouter.ai/api/v1" },
  { value: "ollama", label: "Ollama", modelPlaceholder: "llama3.1", baseUrlPlaceholder: "http://localhost:11434" },
]

function parseHeaders(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, line) => {
      const [key, ...rest] = line.split(":")
      const normalizedKey = key?.trim()
      const normalizedValue = rest.join(":").trim()
      if (normalizedKey && normalizedValue) acc[normalizedKey] = normalizedValue
      return acc
    }, {})
}

export function AdminAiPage() {
  const providers = useAiProviderConfigsQuery()
  const organizations = useOrganizationsQuery()
  const current = useAiCurrentProviderStatusQuery("admin")
  const adminStatus = useAdminAiChatStatusQuery()
  const sendChat = useAdminAiChatMutation()
  const clearChat = useAdminAiClearSessionMutation()
  const mcpTools = useAiMcpToolsQuery("admin")
  const createProvider = useCreateAiProviderConfigMutation()
  const updateProvider = useUpdateAiProviderConfigMutation()
  const deleteProvider = useDeleteAiProviderConfigMutation()
  const callTool = useMcpToolCallMutation()
  const providerList = Array.isArray(providers.data) ? providers.data : []
  const organizationList = Array.isArray(organizations.data) ? organizations.data : []
  const [form, setForm] = useState({
    provider: "openai" as AiProviderKind,
    name: "",
    organizationId: "global",
    model: "",
    baseUrl: "",
    apiKey: "",
    systemPrompt: "Resident support AI. Keep replies short. Use tools when needed.",
    temperature: "0.2",
    enabled: true,
    isDefault: true,
    headersText: "",
  })
  const [selectedTool, setSelectedTool] = useState("")
  const [toolArgsText, setToolArgsText] = useState("{}")
  const [toolResult, setToolResult] = useState("")
  const [chatSessionId, setChatSessionId] = useState("")
  const [chatInput, setChatInput] = useState("")
  const [chatMessages, setChatMessages] = useState<Array<{
    role: "user" | "assistant"
    content: string
    toolEvents?: AiToolEvent[]
  }>>([])

  const providerMeta = useMemo(
    () => providerOptions.find((item) => item.value === form.provider) ?? providerOptions[0],
    [form.provider]
  )

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-background p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <Badge variant="outline" className="border-blue-200 text-blue-700">AI</Badge>
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <Bot className="size-5" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-950">AI providers and MCP tools</h1>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                  Add provider path, model, key, org scope. Resident chat uses enabled default provider. Chat memory stays temporary only.
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>{current.data?.configured ? "Provider ready" : "No provider"}</Badge>
            <Badge variant="secondary">{current.data?.toolCount ?? 0} MCP tools</Badge>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Add AI provider</CardTitle>
            <CardDescription>Admin can register ChatGPT, Claude, Gemini, OpenRouter, Ollama. Org scope optional.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-5"
              onSubmit={(event) => {
                event.preventDefault()
                createProvider.mutate({
                  provider: form.provider,
                  name: form.name,
                  organizationId: form.organizationId === "global" ? undefined : form.organizationId,
                  model: form.model,
                  baseUrl: form.baseUrl || undefined,
                  apiKey: form.apiKey || undefined,
                  systemPrompt: form.systemPrompt || undefined,
                  temperature: Number(form.temperature || "0.2"),
                  enabled: form.enabled,
                  isDefault: form.isDefault,
                  headers: parseHeaders(form.headersText),
                }, {
                  onSuccess: () => {
                    setForm((currentForm) => ({
                      ...currentForm,
                      name: "",
                      model: "",
                      apiKey: "",
                      headersText: "",
                    }))
                  },
                })
              }}
            >
              <FieldGroup>
                <Field>
                  <FieldLabel>Provider</FieldLabel>
                  <Select value={form.provider} onValueChange={(value) => setForm((currentForm) => ({ ...currentForm, provider: (value ?? "openai") as AiProviderKind }))}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {providerOptions.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Label</FieldLabel>
                  <Input value={form.name} onChange={(event) => setForm((currentForm) => ({ ...currentForm, name: event.target.value ?? "" }))} placeholder="Resident helper - primary" />
                </Field>
                <Field>
                  <FieldLabel>Organization scope</FieldLabel>
                  <Select value={form.organizationId} onValueChange={(value) => setForm((currentForm) => ({ ...currentForm, organizationId: value ?? "global" }))}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="global">Global fallback</SelectItem>
                        {organizationList.map((item) => <SelectItem key={item._id} value={item._id}>{item.name}</SelectItem>)}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldDescription>Org config beats global config for resident chat.</FieldDescription>
                </Field>
                <Field>
                  <FieldLabel>Model</FieldLabel>
                  <Input value={form.model} onChange={(event) => setForm((currentForm) => ({ ...currentForm, model: event.target.value ?? "" }))} placeholder={providerMeta.modelPlaceholder} />
                </Field>
                <Field>
                  <FieldLabel>Base URL / path</FieldLabel>
                  <Input value={form.baseUrl} onChange={(event) => setForm((currentForm) => ({ ...currentForm, baseUrl: event.target.value ?? "" }))} placeholder={providerMeta.baseUrlPlaceholder} />
                </Field>
                <Field>
                  <FieldLabel>API key</FieldLabel>
                  <Input type="password" value={form.apiKey} onChange={(event) => setForm((currentForm) => ({ ...currentForm, apiKey: event.target.value ?? "" }))} placeholder="Optional for local Ollama" />
                </Field>
                <Field>
                  <FieldLabel>Temperature</FieldLabel>
                  <Input value={form.temperature} onChange={(event) => setForm((currentForm) => ({ ...currentForm, temperature: event.target.value ?? "0.2" }))} />
                </Field>
                <Field>
                  <FieldLabel>System prompt</FieldLabel>
                  <Textarea value={form.systemPrompt} onChange={(event) => setForm((currentForm) => ({ ...currentForm, systemPrompt: event.target.value ?? "" }))} rows={4} />
                </Field>
                <Field>
                  <FieldLabel>Extra headers</FieldLabel>
                  <Textarea value={form.headersText} onChange={(event) => setForm((currentForm) => ({ ...currentForm, headersText: event.target.value ?? "" }))} rows={4} placeholder={"HTTP-Referer: https://your-app.com\nX-Title: Property Ops"} />
                </Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field orientation="horizontal">
                    <FieldLabel>Enabled</FieldLabel>
                    <Switch checked={form.enabled} onCheckedChange={(checked) => setForm((currentForm) => ({ ...currentForm, enabled: checked }))} />
                  </Field>
                  <Field orientation="horizontal">
                    <FieldLabel>Default</FieldLabel>
                    <Switch checked={form.isDefault} onCheckedChange={(checked) => setForm((currentForm) => ({ ...currentForm, isDefault: checked }))} />
                  </Field>
                </div>
              </FieldGroup>
              <Button type="submit" disabled={createProvider.isPending || !form.name || !form.model} className="gap-2">
                <Plus className="size-4" />
                {createProvider.isPending ? "Saving..." : "Save provider"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Current routing</CardTitle>
            <CardDescription>Resident AI resolves org-specific default first, then global default.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-700">
            <div className="rounded-xl border p-4">
              <p className="font-medium text-slate-950">Provider</p>
              <p className="mt-1">{current.data?.providerName ?? "None"}</p>
            </div>
            <div className="rounded-xl border p-4">
              <p className="font-medium text-slate-950">Model</p>
              <p className="mt-1">{current.data?.model ?? "None"}</p>
            </div>
            <div className="rounded-xl border p-4">
              <p className="font-medium text-slate-950">Session mode</p>
              <p className="mt-1">{current.data?.sessionMode ?? "ephemeral_only"}</p>
            </div>
            <div className="rounded-xl border p-4">
              <p className="font-medium text-slate-950">Tool count</p>
              <p className="mt-1">{current.data?.toolCount ?? 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.95fr]">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Saved providers</CardTitle>
            <CardDescription>Fast controls for default, enable, disable, delete.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {providerList.length ? providerList.map((item) => {
              const organizationName = item.organizationId
                ? organizationList.find((org) => org._id === item.organizationId)?.name ?? item.organizationId
                : "Global fallback"

              return (
                <div key={item.id} className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-slate-950">{item.name}</p>
                        <Badge variant="outline">{item.provider}</Badge>
                        {item.isDefault ? <Badge>default</Badge> : null}
                        {item.enabled ? <Badge variant="secondary">enabled</Badge> : <Badge variant="outline">disabled</Badge>}
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{item.model}</p>
                      <p className="mt-1 text-xs text-slate-500">{organizationName}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.baseUrl ?? "Default provider URL"}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.maskedApiKey ?? "No key stored"}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => updateProvider.mutate({ id: item.id, payload: { isDefault: true } })}>
                        <ShieldCheck className="size-4" />
                        Default
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => updateProvider.mutate({ id: item.id, payload: { enabled: !item.enabled } })}>
                        <KeyRound className="size-4" />
                        {item.enabled ? "Disable" : "Enable"}
                      </Button>
                      <Button type="button" size="sm" variant="destructive" onClick={() => deleteProvider.mutate(item.id)}>
                        <Trash2 className="size-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              )
            }) : (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon"><ServerCog /></EmptyMedia>
                  <EmptyTitle>No AI provider yet</EmptyTitle>
                  <EmptyDescription>Add first provider from top form.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>MCP tools</CardTitle>
            <CardDescription>Visible tools resident AI can call. Test same tool pipe from admin.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {(mcpTools.data?.tools ?? []).map((tool) => (
                <div key={tool.name} className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Wrench className="size-4 text-slate-500" />
                    <p className="font-medium text-slate-950">{tool.name}</p>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{tool.description}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border bg-slate-50 p-4">
              <p className="font-medium text-slate-950">Tool test</p>
              <div className="mt-4 space-y-4">
                <Field>
                  <FieldLabel>Tool</FieldLabel>
                  <Select value={selectedTool} onValueChange={(value) => setSelectedTool(value ?? "")}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Pick tool" /></SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {(mcpTools.data?.tools ?? []).map((tool) => <SelectItem key={tool.name} value={tool.name}>{tool.name}</SelectItem>)}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Arguments JSON</FieldLabel>
                  <Textarea value={toolArgsText} onChange={(event) => setToolArgsText(event.target.value ?? "{}")} rows={6} />
                </Field>
                <Button
                  type="button"
                  disabled={callTool.isPending || !selectedTool}
                  onClick={() => {
                    try {
                      const parsed = JSON.parse(toolArgsText || "{}")
                      callTool.mutate(
                        {
                          name: selectedTool,
                          arguments: parsed,
                        },
                        {
                          onSuccess: (result) => {
                            setToolResult(JSON.stringify(result?.result ?? result, null, 2))
                          },
                        }
                      )
                    } catch {
                      setToolResult("Invalid JSON")
                    }
                  }}
                >
                  {callTool.isPending ? "Running..." : "Run MCP tool"}
                </Button>
                <Field>
                  <FieldLabel>Result</FieldLabel>
                  <Textarea value={toolResult} readOnly rows={10} />
                </Field>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Admin AI chat</CardTitle>
            <CardDescription>Chat with same admin-scoped MCP powers. Temporary memory only.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-[520px] space-y-3 overflow-y-auto rounded-xl border bg-slate-50 p-4">
              {chatMessages.length ? chatMessages.map((message, index) => (
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
                    <EmptyTitle>No admin chat yet</EmptyTitle>
                    <EmptyDescription>Try: "list organizations", "create tenant owner", "show unpaid bills", "inspect tenant data".</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </div>
            <Textarea
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value ?? "")}
              rows={4}
              placeholder="Ask admin AI to manage full platform operations."
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={!adminStatus.data?.configured || sendChat.isPending || !chatInput.trim()}
                onClick={() => {
                  const outgoing = chatInput.trim()
                  setChatMessages((currentMessages) => [...currentMessages, { role: "user", content: outgoing }])
                  setChatInput("")
                  sendChat.mutate(
                    { message: outgoing, sessionId: chatSessionId || undefined },
                    {
                      onSuccess: (result) => {
                        const payload = result.data
                        setChatSessionId(payload?.sessionId ?? "")
                        setChatMessages((currentMessages) => [
                          ...currentMessages,
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
                disabled={clearChat.isPending}
                onClick={() => {
                  if (chatSessionId) clearChat.mutate(chatSessionId)
                  setChatSessionId("")
                  setChatMessages([])
                }}
                className="gap-2"
              >
                <Eraser className="size-4" />
                Clear temp memory
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Chat status</CardTitle>
            <CardDescription>Admin chat and MCP use same provider routing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-700">
            <div className="rounded-xl border p-4"><p className="font-medium text-slate-950">Provider</p><p className="mt-1">{adminStatus.data?.providerName ?? "Not configured"}</p></div>
            <div className="rounded-xl border p-4"><p className="font-medium text-slate-950">Model</p><p className="mt-1">{adminStatus.data?.model ?? "None"}</p></div>
            <div className="rounded-xl border p-4"><p className="font-medium text-slate-950">Session mode</p><p className="mt-1">{adminStatus.data?.sessionMode ?? "ephemeral_only"}</p></div>
            <div className="rounded-xl border p-4"><p className="font-medium text-slate-950">Tool count</p><p className="mt-1">{adminStatus.data?.toolCount ?? 0}</p></div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Role MCP access</CardTitle>
          <CardDescription>What each role can do through AI + MCP right now.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-xl border p-4">
            <p className="font-medium text-slate-950">Admin</p>
            <p className="mt-2 text-sm text-slate-600">Admin MCP can use `platform_api_request` across broad platform routes. Best for full platform management and future automation.</p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="font-medium text-slate-950">Tenant owner</p>
            <p className="mt-2 text-sm text-slate-600">Tenant owner MCP can use `platform_api_request` only inside owner-safe route prefixes like properties, units, tenants, tickets, workers, bills, notices, recurring, inspections.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
