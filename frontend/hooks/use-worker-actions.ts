"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { patchRequest, postRequest } from "@/api-hooks/api-hooks"
import type { ApiSuccessResponse } from "@/lib/types/api"
import type {
  InspectionItem,
  MessageItem,
  RecurringMaintenanceItem,
  TicketItem,
  WorkOrderItem,
} from "@/lib/types/dashboard"

type WorkerWorkOrderPayload = {
  id: string
  status?: string
  actualCost?: number
  completionNotes?: string
  completionProof?: string[]
}

type WorkerTicketPayload = {
  id: string
  status?: string
  actualCost?: number
  completionNotes?: string
  completionProof?: string[]
}

type WorkerTicketNotePayload = {
  id: string
  content: string
}

type WorkerInspectionReportPayload = {
  id: string
  workerReport?: string
  workerReportFiles?: string[]
  damageReport?: string
  notes?: string
  actualCost?: number
  completed?: boolean
}

type WorkerRecurringReportPayload = {
  id: string
  status?: string
  note?: string
  files?: string[]
  actualCost?: number
}

type WorkerMessagePayload = {
  roomType: "direct" | "ticket"
  roomId: string
  content: string
  attachments?: string[]
}

export function useWorkerUpdateWorkOrderMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: ["worker", "update", "work-order"],
    mutationFn: async ({ id, ...payload }: WorkerWorkOrderPayload) => {
      const [data, error] = await patchRequest<ApiSuccessResponse<WorkOrderItem>, typeof payload>(
        `/work-order/${id}`,
        payload
      )
      if (error || !data) throw new Error(error?.message ?? "Work order update failed")
      return data
    },
    onSuccess: async () => {
      toast.success("Work order updated")
      await queryClient.invalidateQueries({ queryKey: ["worker", "work-orders"] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useWorkerUpdateTicketMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: ["worker", "update", "ticket"],
    mutationFn: async ({ id, ...payload }: WorkerTicketPayload) => {
      const [data, error] = await patchRequest<ApiSuccessResponse<TicketItem>, typeof payload>(
        `/ticket/${id}`,
        payload
      )
      if (error || !data) throw new Error(error?.message ?? "Ticket update failed")
      return data
    },
    onSuccess: async () => {
      toast.success("Ticket updated")
      await queryClient.invalidateQueries({ queryKey: ["worker", "tickets"] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useWorkerAddTicketNoteMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: ["worker", "ticket", "note"],
    mutationFn: async ({ id, content }: WorkerTicketNotePayload) => {
      const [data, error] = await postRequest<ApiSuccessResponse<TicketItem>, { content: string }>(
        `/ticket/${id}/internal-notes`,
        { content }
      )
      if (error || !data) throw new Error(error?.message ?? "Ticket note failed")
      return data
    },
    onSuccess: async () => {
      toast.success("Note saved")
      await queryClient.invalidateQueries({ queryKey: ["worker", "tickets"] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useWorkerSubmitInspectionReportMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: ["worker", "report", "inspection"],
    mutationFn: async ({ id, ...payload }: WorkerInspectionReportPayload) => {
      const [data, error] = await patchRequest<ApiSuccessResponse<InspectionItem>, typeof payload>(
        `/inspection/${id}/report`,
        payload
      )
      if (error || !data) throw new Error(error?.message ?? "Inspection report failed")
      return data
    },
    onSuccess: async () => {
      toast.success("Inspection report sent")
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["worker", "inspections"] }),
        queryClient.invalidateQueries({ queryKey: ["owner", "inspections"] }),
      ])
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useWorkerSubmitRecurringReportMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: ["worker", "report", "recurring"],
    mutationFn: async ({ id, ...payload }: WorkerRecurringReportPayload) => {
      const [data, error] = await patchRequest<ApiSuccessResponse<RecurringMaintenanceItem>, typeof payload>(
        `/recurring-maintenance/${id}/report`,
        payload
      )
      if (error || !data) throw new Error(error?.message ?? "Recurring report failed")
      return data
    },
    onSuccess: async () => {
      toast.success("Recurring report sent")
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["worker", "recurring-maintenances"] }),
        queryClient.invalidateQueries({ queryKey: ["owner", "recurring-maintenances"] }),
      ])
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useWorkerSendMessageMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: ["worker", "message", "send"],
    mutationFn: async (payload: WorkerMessagePayload) => {
      const [data, error] = await postRequest<ApiSuccessResponse<MessageItem>, WorkerMessagePayload>(
        "/messaging/messages",
        payload
      )
      if (error || !data) throw new Error(error?.message ?? "Message send failed")
      return data
    },
    onSuccess: async () => {
      toast.success("Message sent")
      await queryClient.invalidateQueries({ queryKey: ["worker", "messages"] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}
