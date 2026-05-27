"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { patchRequest, postRequest } from "@/api-hooks/api-hooks"
import { useQueryWrapper } from "@/api-hooks/react-query-wrapper"
import type { ApiSuccessResponse } from "@/lib/types/api"
import { getRefreshToken, getStoredUser, saveAuthSession } from "@/lib/auth-storage"
import type { AuthResponse, AuthUser } from "@/lib/types/auth"

type WorkerAssignmentRequestPayload = {
  id: string
  status: "accepted" | "rejected"
}

type WorkerLeavePayload = {
  ownerUserId?: string
}

type WorkerLeaveResponse = {
  left: boolean
  user: AuthUser
}

export function useWorkerAssignmentRequestsQuery() {
  return useQueryWrapper<any[]>(["worker", "assignment-requests"], "/user/assignment-requests")
}

async function refreshWorkerSession() {
  const storedUser = getStoredUser()
  const refreshToken = getRefreshToken()

  if (!storedUser?.id || !refreshToken) return null

  const [data, error] = await postRequest<AuthResponse, { userId: string; refreshToken: string }>(
    "/user/refresh",
    {
      userId: storedUser.id,
      refreshToken,
    }
  )

  if (error || !data) return null

  saveAuthSession({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    user: data.user,
  })

  return data.user
}

export function useWorkerUpdateAssignmentRequestMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: ["worker", "update", "assignment-request"],
    mutationFn: async ({ id, status }: WorkerAssignmentRequestPayload) => {
      const [data, error] = await patchRequest<any, { status: "accepted" | "rejected" }>(
        `/user/assignment-requests/${id}`,
        { status }
      )
      if (error || !data) throw new Error(error?.message ?? "Request update failed")
      return data
    },
    onSuccess: async (_, variables) => {
      const nextUser = await refreshWorkerSession()
      if (nextUser) {
        queryClient.setQueryData(["auth", "me"], nextUser)
      }
      toast.success(variables.status === "accepted" ? "Worker request accepted" : "Worker request rejected")
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["worker", "assignment-requests"] }),
        queryClient.invalidateQueries({ queryKey: ["worker", "messages"] }),
        queryClient.invalidateQueries({ queryKey: ["worker", "tickets"] }),
        queryClient.invalidateQueries({ queryKey: ["worker", "work-orders"] }),
        queryClient.invalidateQueries({ queryKey: ["worker", "inspections"] }),
        queryClient.invalidateQueries({ queryKey: ["worker", "recurring-maintenances"] }),
        queryClient.invalidateQueries({ queryKey: ["auth", "me"] }),
      ])
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useWorkerLeaveAssignmentMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: ["worker", "leave", "assignment"],
    mutationFn: async (payload: WorkerLeavePayload) => {
      const [data, error] = await postRequest<ApiSuccessResponse<WorkerLeaveResponse>, WorkerLeavePayload>(
        "/user/worker/leave",
        payload
      )
      if (error || !data) throw new Error(error?.message ?? "Leave failed")
      return data
    },
    onSuccess: async () => {
      const nextUser = await refreshWorkerSession()
      if (nextUser) {
        queryClient.setQueryData(["auth", "me"], nextUser)
      }
      toast.success("Worker assignment left")
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["worker", "assignment-requests"] }),
        queryClient.invalidateQueries({ queryKey: ["worker", "messages"] }),
        queryClient.invalidateQueries({ queryKey: ["worker", "tickets"] }),
        queryClient.invalidateQueries({ queryKey: ["worker", "work-orders"] }),
        queryClient.invalidateQueries({ queryKey: ["worker", "inspections"] }),
        queryClient.invalidateQueries({ queryKey: ["worker", "recurring-maintenances"] }),
        queryClient.invalidateQueries({ queryKey: ["auth", "me"] }),
      ])
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}
