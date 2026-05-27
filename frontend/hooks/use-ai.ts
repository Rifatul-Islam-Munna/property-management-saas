"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { deleteRequest, patchRequest, postRequest } from "@/api-hooks/api-hooks"
import { useQueryWrapper } from "@/api-hooks/react-query-wrapper"
import { useCommonMutationApi } from "@/api-hooks/use-api-mutation"
import type { ApiSuccessResponse } from "@/lib/types/api"
import type {
  AiMcpToolCatalog,
  AiProviderConfigItem,
  AiProviderKind,
  AiProviderStatus,
  AiResidentChatResponse,
} from "@/lib/types/ai"

type AiProviderPayload = {
  provider: AiProviderKind
  name: string
  organizationId?: string
  model: string
  baseUrl?: string
  apiKey?: string
  systemPrompt?: string
  temperature?: number
  enabled?: boolean
  isDefault?: boolean
  headers?: Record<string, string>
  metadata?: Record<string, unknown>
}

type UpdateAiProviderPayload = {
  id: string
  payload: Partial<AiProviderPayload>
}

type ResidentAiChatPayload = {
  message: string
  sessionId?: string
}

type McpCallPayload = {
  name: string
  arguments?: Record<string, unknown>
}

export function useAiProviderConfigsQuery(params?: {
  provider?: AiProviderKind
  organizationId?: string
  enabled?: boolean
}) {
  const searchParams = new URLSearchParams()
  if (params?.provider) searchParams.set("provider", params.provider)
  if (params?.organizationId) searchParams.set("organizationId", params.organizationId)
  if (typeof params?.enabled === "boolean") searchParams.set("enabled", String(params.enabled))
  const queryString = searchParams.toString()

  return useQueryWrapper<ApiSuccessResponse<AiProviderConfigItem[]>, AiProviderConfigItem[]>(
    ["admin", "ai", "providers", params ?? {}],
    `/ai/providers${queryString ? `?${queryString}` : ""}`,
    {
      select: (response) => response?.data ?? [],
    }
  )
}

export function useAiCurrentProviderStatusQuery(queryKeyPrefix: "admin" | "resident") {
  return useQueryWrapper<ApiSuccessResponse<AiProviderStatus>, AiProviderStatus>(
    [queryKeyPrefix, "ai", "current-provider"],
    "/ai/providers/current",
    {
      select: (response) => response?.data,
    }
  )
}

export function useAiMcpToolsQuery(queryKeyPrefix: "admin" | "resident") {
  return useQueryWrapper<ApiSuccessResponse<AiMcpToolCatalog>, AiMcpToolCatalog>(
    [queryKeyPrefix, "ai", "mcp-tools"],
    "/ai/mcp/tools",
    {
      select: (response) => response?.data,
    }
  )
}

export function useCreateAiProviderConfigMutation() {
  const queryClient = useQueryClient()
  return useCommonMutationApi<ApiSuccessResponse<AiProviderConfigItem>, AiProviderPayload>({
    url: "/ai/providers",
    method: "POST",
    mutationKey: ["admin", "ai", "create-provider"],
    successMessage: "AI provider saved",
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "ai", "providers"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "ai", "current-provider"] }),
      ])
    },
  })
}

export function useUpdateAiProviderConfigMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: ["admin", "ai", "update-provider"],
    mutationFn: async ({ id, payload }: UpdateAiProviderPayload) => {
      const [data, error] = await patchRequest<ApiSuccessResponse<AiProviderConfigItem>, Partial<AiProviderPayload>>(
        `/ai/providers/${id}`,
        payload
      )
      if (error || !data) throw new Error(error?.message ?? "AI provider update failed")
      return data
    },
    onSuccess: async () => {
      toast.success("AI provider updated")
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "ai", "providers"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "ai", "current-provider"] }),
      ])
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteAiProviderConfigMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: ["admin", "ai", "delete-provider"],
    mutationFn: async (id: string) => {
      const [data, error] = await deleteRequest<ApiSuccessResponse<{ deleted: boolean }>>(`/ai/providers/${id}`)
      if (error || !data) throw new Error(error?.message ?? "AI provider delete failed")
      return data
    },
    onSuccess: async () => {
      toast.success("AI provider deleted")
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "ai", "providers"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "ai", "current-provider"] }),
      ])
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useResidentAiChatStatusQuery() {
  return useQueryWrapper<ApiSuccessResponse<AiProviderStatus>, AiProviderStatus>(
    ["resident", "ai", "status"],
    "/ai/chat/resident/status",
    {
      select: (response) => response?.data,
    }
  )
}

export function useResidentAiChatMutation() {
  return useMutation({
    mutationKey: ["resident", "ai", "chat"],
    mutationFn: async (payload: ResidentAiChatPayload) => {
      const [data, error] = await postRequest<ApiSuccessResponse<AiResidentChatResponse>, ResidentAiChatPayload>(
        "/ai/chat/resident",
        payload
      )
      if (error || !data) throw new Error(error?.message ?? "AI chat failed")
      return data
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useResidentAiClearSessionMutation() {
  return useMutation({
    mutationKey: ["resident", "ai", "clear-session"],
    mutationFn: async (sessionId: string) => {
      const [data, error] = await deleteRequest<ApiSuccessResponse<{ cleared: boolean }>>(
        `/ai/chat/resident/session/${sessionId}`
      )
      if (error || !data) throw new Error(error?.message ?? "Session clear failed")
      return data
    },
    onSuccess: () => {
      toast.success("Temporary AI memory cleared")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useOwnerAiChatStatusQuery() {
  return useQueryWrapper<ApiSuccessResponse<AiProviderStatus>, AiProviderStatus>(
    ["owner", "ai", "status"],
    "/ai/chat/owner/status",
    {
      select: (response) => response?.data,
    }
  )
}

export function useOwnerAiChatMutation() {
  return useMutation({
    mutationKey: ["owner", "ai", "chat"],
    mutationFn: async (payload: ResidentAiChatPayload) => {
      const [data, error] = await postRequest<ApiSuccessResponse<AiResidentChatResponse>, ResidentAiChatPayload>(
        "/ai/chat/owner",
        payload
      )
      if (error || !data) throw new Error(error?.message ?? "Owner AI chat failed")
      return data
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useOwnerAiClearSessionMutation() {
  return useMutation({
    mutationKey: ["owner", "ai", "clear-session"],
    mutationFn: async (sessionId: string) => {
      const [data, error] = await deleteRequest<ApiSuccessResponse<{ cleared: boolean }>>(
        `/ai/chat/owner/session/${sessionId}`
      )
      if (error || !data) throw new Error(error?.message ?? "Owner session clear failed")
      return data
    },
    onSuccess: () => {
      toast.success("Temporary AI memory cleared")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useAdminAiChatStatusQuery() {
  return useQueryWrapper<ApiSuccessResponse<AiProviderStatus>, AiProviderStatus>(
    ["admin", "ai", "status"],
    "/ai/chat/admin/status",
    {
      select: (response) => response?.data,
    }
  )
}

export function useAdminAiChatMutation() {
  return useMutation({
    mutationKey: ["admin", "ai", "chat"],
    mutationFn: async (payload: ResidentAiChatPayload) => {
      const [data, error] = await postRequest<ApiSuccessResponse<AiResidentChatResponse>, ResidentAiChatPayload>(
        "/ai/chat/admin",
        payload
      )
      if (error || !data) throw new Error(error?.message ?? "Admin AI chat failed")
      return data
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useAdminAiClearSessionMutation() {
  return useMutation({
    mutationKey: ["admin", "ai", "clear-session"],
    mutationFn: async (sessionId: string) => {
      const [data, error] = await deleteRequest<ApiSuccessResponse<{ cleared: boolean }>>(
        `/ai/chat/admin/session/${sessionId}`
      )
      if (error || !data) throw new Error(error?.message ?? "Admin session clear failed")
      return data
    },
    onSuccess: () => {
      toast.success("Temporary AI memory cleared")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useMcpToolCallMutation() {
  return useMutation({
    mutationKey: ["admin", "ai", "mcp-call"],
    mutationFn: async (payload: McpCallPayload) => {
      const [data, error] = await postRequest<any, any>("/ai/mcp/rpc", {
        jsonrpc: "2.0",
        id: "frontend",
        method: "tools/call",
        params: payload,
      })
      if (error || !data) throw new Error(error?.message ?? "MCP tool call failed")
      return data
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}
