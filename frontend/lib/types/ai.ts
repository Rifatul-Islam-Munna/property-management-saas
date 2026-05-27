export type AiProviderKind =
  | "openai"
  | "anthropic"
  | "gemini"
  | "openrouter"
  | "ollama"

export type AiProviderConfigItem = {
  id: string
  provider: AiProviderKind
  name: string
  organizationId?: string | null
  model: string
  baseUrl?: string | null
  hasApiKey: boolean
  maskedApiKey?: string | null
  systemPrompt?: string | null
  temperature?: number | null
  enabled: boolean
  isDefault: boolean
  headers?: Record<string, string>
  metadata?: Record<string, unknown>
  createdAt?: string | null
  updatedAt?: string | null
}

export type AiProviderStatus = {
  configured: boolean
  provider?: AiProviderKind | null
  providerName?: string | null
  model?: string | null
  organizationId?: string | null
  sessionMode?: string | null
  toolCount: number
}

export type AiMcpTool = {
  name: string
  description: string
  inputSchema: Record<string, unknown>
}

export type AiMcpToolCatalog = {
  capabilities?: {
    tools?: {
      listChanged?: boolean
    }
  }
  tools: AiMcpTool[]
}

export type AiToolEvent = {
  name: string
  arguments: Record<string, unknown>
  result: unknown
  isError: boolean
}

export type AiResidentChatResponse = {
  sessionId: string
  reply: string
  provider: {
    id: string
    name: string
    provider: AiProviderKind
    model: string
  }
  toolEvents: AiToolEvent[]
  memoryPolicy: string
}
