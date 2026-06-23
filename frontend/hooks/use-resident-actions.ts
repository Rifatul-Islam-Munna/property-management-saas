"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { patchRequest, postRequest } from "@/api-hooks/api-hooks"
import { useCommonMutationApi } from "@/api-hooks/use-api-mutation"
import type { ApiSuccessResponse } from "@/lib/types/api"
import type { MessageItem, TenantItem, TicketItem } from "@/lib/types/dashboard"

type ResidentTicketPayload = {
  propertyId: string
  unitId?: string
  tenantId?: string
  title: string
  description: string
  category: string
  priority?: string
  images?: string[]
}

type ResidentMessagePayload = {
  roomType: "direct" | "ticket"
  roomId: string
  content: string
  attachments?: string[]
}

type ResidentTicketCommentPayload = {
  id: string
  content: string
}

type ResidentAssignmentRequestPayload = {
  id: string
  status: "accepted" | "rejected"
}

type ResidentLeaveTenantResponse = {
  left: boolean
}

export function useResidentCreateTicketMutation() {
  const queryClient = useQueryClient()
  return useCommonMutationApi<ApiSuccessResponse<TicketItem>, ResidentTicketPayload>({
    url: "/ticket",
    method: "POST",
    mutationKey: ["resident", "create", "ticket"],
    successMessage: "Ticket created",
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["resident", "tickets"] })
    },
  })
}

export function useResidentSendMessageMutation() {
  const queryClient = useQueryClient()
  return useCommonMutationApi<ApiSuccessResponse<MessageItem>, ResidentMessagePayload>({
    url: "/messaging/messages",
    method: "POST",
    mutationKey: ["resident", "create", "message"],
    successMessage: "Message sent",
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["resident", "messages"] })
    },
  })
}

export function useResidentAddTicketCommentMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: ["resident", "comment", "ticket"],
    mutationFn: async ({ id, content }: ResidentTicketCommentPayload) => {
      const [data, error] = await postRequest<ApiSuccessResponse<TicketItem>, { content: string }>(
        `/ticket/${id}/comments`,
        { content }
      )
      if (error || !data) throw new Error(error?.message ?? "Comment failed")
      return data
    },
    onSuccess: async () => {
      toast.success("Comment sent")
      await queryClient.invalidateQueries({ queryKey: ["resident", "tickets"] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useResidentUpdateAssignmentRequestMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: ["resident", "update", "assignment-request"],
    mutationFn: async ({ id, status }: ResidentAssignmentRequestPayload) => {
      const [data, error] = await patchRequest<any, { status: "accepted" | "rejected" }>(
        `/user/assignment-requests/${id}`,
        { status }
      )
      if (error || !data) throw new Error(error?.message ?? "Request update failed")
      return data
    },
    onSuccess: async (_, variables) => {
      toast.success(variables.status === "accepted" ? "Assignment accepted" : "Assignment rejected")
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["resident", "assignment-requests"] }),
        queryClient.invalidateQueries({ queryKey: ["resident", "workspace"] }),
        queryClient.invalidateQueries({ queryKey: ["resident", "me"] }),
      ])
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useResidentLeaveTenantMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: ["resident", "leave", "tenant"],
    mutationFn: async () => {
      const [data, error] = await postRequest<ApiSuccessResponse<ResidentLeaveTenantResponse>, Record<string, never>>(
        "/tenant/leave",
        {}
      )
      if (error || !data) throw new Error(error?.message ?? "Leave failed")
      return data
    },
    onSuccess: async () => {
      toast.success("Tenant profile left")
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["resident", "workspace"] }),
        queryClient.invalidateQueries({ queryKey: ["resident", "bills"] }),
        queryClient.invalidateQueries({ queryKey: ["resident", "me"] }),
      ])
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useResidentUpdateProfileImageMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: ["resident", "update", "profile-image"],
    mutationFn: async (profileImage: string) => {
      const [data, error] = await patchRequest<ApiSuccessResponse<TenantItem>, { profileImage: string }>(
        "/tenant/me/profile-image",
        { profileImage }
      )
      if (error || !data) throw new Error(error?.message ?? "Profile image update failed")
      return data
    },
    onSuccess: async () => {
      toast.success("Profile image updated")
      await queryClient.invalidateQueries({ queryKey: ["resident", "workspace"] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}
