"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { deleteRequest, patchRequest } from "@/api-hooks/api-hooks"
import { useCommonMutationApi } from "@/api-hooks/use-api-mutation"
import { useQueryWrapper } from "@/api-hooks/react-query-wrapper"
import type { ApiSuccessResponse, PaginatedResult } from "@/lib/types/api"
import type {
  PlanEditorDocument,
  PlanEditorShare,
  PlanShareCandidate,
} from "@/lib/types/dashboard"

type PlanPayload = {
  title: string
  description?: string
  nodes?: PlanEditorDocument["nodes"]
  edges?: PlanEditorDocument["edges"]
  viewport?: PlanEditorDocument["viewport"]
}

export function usePlansQuery(search?: string) {
  const params = new URLSearchParams()
  if (search?.trim()) params.set("search", search.trim())
  const suffix = params.toString()

  return useQueryWrapper<
    ApiSuccessResponse<PaginatedResult<PlanEditorDocument>>,
    PlanEditorDocument[]
  >(["plan-doc", "list", search ?? ""], `/plan-doc${suffix ? `?${suffix}` : ""}`, {
    select: (response) => response?.data?.data ?? [],
  })
}

export function usePlanQuery(id?: string | null) {
  return useQueryWrapper<ApiSuccessResponse<PlanEditorDocument>, PlanEditorDocument>(
    ["plan-doc", "detail", id ?? ""],
    `/plan-doc/${id}`,
    {
      enabled: Boolean(id),
      select: (response) => response?.data,
    }
  )
}

export function usePlanShareCandidatesQuery(search: string, enabled: boolean) {
  const params = new URLSearchParams()
  if (search.trim()) params.set("search", search.trim())
  const suffix = params.toString()

  return useQueryWrapper<ApiSuccessResponse<PlanShareCandidate[]>, PlanShareCandidate[]>(
    ["plan-doc", "share-candidates", search],
    `/plan-doc/share-candidates${suffix ? `?${suffix}` : ""}`,
    {
      enabled,
      select: (response) => response?.data ?? [],
    }
  )
}

export function useCreatePlanMutation() {
  const queryClient = useQueryClient()

  return useCommonMutationApi<ApiSuccessResponse<PlanEditorDocument>, PlanPayload>({
    url: "/plan-doc",
    method: "POST",
    mutationKey: ["plan-doc", "create"],
    successMessage: "Plan created",
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["plan-doc", "list"] })
    },
  })
}

export function useUpdatePlanMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ["plan-doc", "update"],
    mutationFn: async ({ id, payload }: { id: string; payload: PlanPayload }) => {
      const [data, error] = await patchRequest<ApiSuccessResponse<PlanEditorDocument>, PlanPayload>(
        `/plan-doc/${id}`,
        payload
      )
      if (error || !data) throw new Error(error?.message ?? "Plan update failed")
      return data
    },
    onSuccess: async (_, variables) => {
      toast.success("Plan saved")
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["plan-doc", "list"] }),
        queryClient.invalidateQueries({ queryKey: ["plan-doc", "detail", variables.id] }),
      ])
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdatePlanShareMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ["plan-doc", "share"],
    mutationFn: async ({ id, sharedWith }: { id: string; sharedWith: PlanEditorShare[] }) => {
      const [data, error] = await patchRequest<
        ApiSuccessResponse<PlanEditorDocument>,
        { sharedWith: PlanEditorShare[] }
      >(`/plan-doc/${id}/share`, {
        sharedWith,
      })
      if (error || !data) throw new Error(error?.message ?? "Plan share update failed")
      return data
    },
    onSuccess: async (_, variables) => {
      toast.success("Share updated")
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["plan-doc", "list"] }),
        queryClient.invalidateQueries({ queryKey: ["plan-doc", "detail", variables.id] }),
      ])
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useDeletePlanMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ["plan-doc", "delete"],
    mutationFn: async (id: string) => {
      const [data, error] = await deleteRequest<ApiSuccessResponse<{ deleted: boolean }>>(`/plan-doc/${id}`)
      if (error || !data) throw new Error(error?.message ?? "Plan delete failed")
      return data
    },
    onSuccess: async () => {
      toast.success("Plan deleted")
      await queryClient.invalidateQueries({ queryKey: ["plan-doc", "list"] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}
