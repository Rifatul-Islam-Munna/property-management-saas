"use client"

import { useQueryWrapper } from "@/api-hooks/react-query-wrapper"
import type { ApiSuccessResponse, PaginatedResult } from "@/lib/types/api"
import type { AuthUser } from "@/lib/types/auth"
import type {
  AnnouncementItem,
  BillItem,
  MessageItem,
  ResidentWorkspace,
  TicketItem,
} from "@/lib/types/dashboard"

export function useResidentWorkspaceQuery() {
  return useQueryWrapper<ApiSuccessResponse<ResidentWorkspace>, ResidentWorkspace>(
    ["resident", "workspace"],
    "/tenant/me",
    {
      select: (response) => response?.data,
    }
  )
}

export function useResidentAnnouncementsQuery() {
  return useQueryWrapper<
    ApiSuccessResponse<PaginatedResult<AnnouncementItem>>,
    AnnouncementItem[]
  >(["resident", "announcements"], "/announcement", {
    select: (response) => response?.data?.data ?? [],
  })
}

export function useResidentMessagesQuery(params?: { roomId?: string; roomType?: string }) {
  const searchParams = new URLSearchParams()
  if (params?.roomId) searchParams.set("roomId", params.roomId)
  if (params?.roomType) searchParams.set("roomType", params.roomType)
  const queryString = searchParams.toString()

  return useQueryWrapper<ApiSuccessResponse<PaginatedResult<MessageItem>>, MessageItem[]>(
    ["resident", "messages", params ?? {}],
    `/messaging/messages${queryString ? `?${queryString}` : ""}`,
    {
      select: (response) => response?.data?.data ?? [],
    }
  )
}

export function useResidentTicketsQuery() {
  return useQueryWrapper<ApiSuccessResponse<PaginatedResult<TicketItem>>, TicketItem[]>(
    ["resident", "tickets"],
    "/ticket",
    {
      select: (response) => response?.data?.data ?? [],
    }
  )
}

export function useResidentAssignmentRequestsQuery() {
  return useQueryWrapper<any[]>(["resident", "assignment-requests"], "/user/assignment-requests")
}

export function useResidentMeQuery() {
  return useQueryWrapper<AuthUser>(["resident", "me"], "/user/me")
}

export function useResidentBillsQuery() {
  return useQueryWrapper<ApiSuccessResponse<PaginatedResult<BillItem>>, BillItem[]>(
    ["resident", "bills"],
    "/bill/my",
    {
      select: (response) => response?.data?.data ?? [],
    }
  )
}
