"use client"

import { useQueryWrapper } from "@/api-hooks/react-query-wrapper"
import type { ApiSuccessResponse, PaginatedResult } from "@/lib/types/api"
import type {
  InspectionItem,
  MessageItem,
  RecurringMaintenanceItem,
  TicketItem,
  WorkOrderItem,
} from "@/lib/types/dashboard"

export function useWorkerTicketsQuery() {
  return useQueryWrapper<
    ApiSuccessResponse<PaginatedResult<TicketItem>>,
    TicketItem[]
  >(["worker", "tickets"], "/ticket", {
    select: (response) => response?.data?.data ?? [],
  })
}

export function useWorkerWorkOrdersQuery() {
  return useQueryWrapper<
    ApiSuccessResponse<PaginatedResult<WorkOrderItem>>,
    WorkOrderItem[]
  >(["worker", "work-orders"], "/work-order", {
    select: (response) => response?.data?.data ?? [],
  })
}

export function useWorkerInspectionsQuery() {
  return useQueryWrapper<
    ApiSuccessResponse<PaginatedResult<InspectionItem>>,
    InspectionItem[]
  >(["worker", "inspections"], "/inspection", {
    select: (response) => response?.data?.data ?? [],
  })
}

export function useWorkerRecurringMaintenancesQuery() {
  return useQueryWrapper<
    ApiSuccessResponse<PaginatedResult<RecurringMaintenanceItem>>,
    RecurringMaintenanceItem[]
  >(["worker", "recurring-maintenances"], "/recurring-maintenance", {
    select: (response) => response?.data?.data ?? [],
  })
}

export function useWorkerMessagesQuery() {
  return useQueryWrapper<
    ApiSuccessResponse<PaginatedResult<MessageItem>>,
    MessageItem[]
  >(["worker", "messages"], "/messaging/messages", {
    select: (response) => response?.data?.data ?? [],
  })
}
