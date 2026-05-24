"use client"

import { useQueryWrapper } from "@/api-hooks/react-query-wrapper"
import type { ApiSuccessResponse, PaginatedResult } from "@/lib/types/api"
import type { AuthUser } from "@/lib/types/auth"
import type {
  AnnouncementItem,
  DashboardMetrics,
  OccupancyStats,
  InspectionItem,
  MessageItem,
  PropertyItem,
  RecurringMaintenanceItem,
  TechnicianItem,
  TechnicianStats,
  TenantItem,
  TicketItem,
  TicketStatBucket,
  UnitItem,
  VendorItem,
  WorkOrderItem,
} from "@/lib/types/dashboard"

export function useOwnerAnalyticsQuery() {
  return useQueryWrapper<ApiSuccessResponse<DashboardMetrics>, DashboardMetrics>(
    ["owner", "analytics", "dashboard"],
    "/analytics/dashboard",
    {
      select: (response) => response?.data,
    }
  )
}

export function useOwnerTicketStatsQuery() {
  return useQueryWrapper<
    ApiSuccessResponse<{ byStatus: TicketStatBucket[]; byPriority: TicketStatBucket[] }>,
    { byStatus: TicketStatBucket[]; byPriority: TicketStatBucket[] }
  >(["owner", "analytics", "tickets"], "/analytics/tickets", {
    select: (response) => response?.data,
  })
}

export function useOwnerOccupancyStatsQuery() {
  return useQueryWrapper<ApiSuccessResponse<OccupancyStats>, OccupancyStats>(
    ["owner", "analytics", "occupancy"],
    "/analytics/occupancy",
    {
      select: (response) => response?.data,
    }
  )
}

export function useOwnerTechnicianStatsQuery() {
  return useQueryWrapper<ApiSuccessResponse<TechnicianStats>, TechnicianStats>(
    ["owner", "analytics", "technicians"],
    "/analytics/technicians",
    {
      select: (response) => response?.data,
    }
  )
}

export function useOwnerUsersQuery() {
  return useQueryWrapper<AuthUser[]>(["owner", "users"], "/user")
}

export function useOwnerUserSearchQuery(search: string, role?: AuthUser["role"]) {
  const params = new URLSearchParams()
  if (search.trim()) {
    params.set("q", search.trim())
  }
  if (role) {
    params.set("role", role)
  }

  return useQueryWrapper<AuthUser[]>(
    ["owner", "user-search", search, role],
    `/user/search?${params.toString()}`,
    {
      enabled: search.trim().length >= 2,
    }
  )
}

export function useOwnerPropertiesQuery() {
  return useQueryWrapper<
    ApiSuccessResponse<PaginatedResult<PropertyItem>>,
    PropertyItem[]
  >(["owner", "properties"], "/property", {
    select: (response) => response?.data?.data ?? [],
  })
}

export function useOwnerUnitsQuery() {
  return useQueryWrapper<ApiSuccessResponse<PaginatedResult<UnitItem>>, UnitItem[]>(
    ["owner", "units"],
    "/unit",
    {
      select: (response) => response?.data?.data ?? [],
    }
  )
}

export function useOwnerTenantsQuery(params?: {
  propertyId?: string
  tenantKind?: "renter" | "guest"
  search?: string
  paymentMonth?: string
  paidThisMonth?: boolean
}) {
  const searchParams = new URLSearchParams()
  if (params?.propertyId) searchParams.set("propertyId", params.propertyId)
  if (params?.tenantKind) searchParams.set("tenantKind", params.tenantKind)
  if (params?.search?.trim()) searchParams.set("search", params.search.trim())
  if (params?.paymentMonth) searchParams.set("paymentMonth", params.paymentMonth)
  if (typeof params?.paidThisMonth === "boolean") {
    searchParams.set("paidThisMonth", String(params.paidThisMonth))
  }

  const queryString = searchParams.toString()

  return useQueryWrapper<
    ApiSuccessResponse<PaginatedResult<TenantItem>>,
    TenantItem[]
  >(["owner", "tenants", params ?? {}], `/tenant${queryString ? `?${queryString}` : ""}`, {
    select: (response) => response?.data?.data ?? [],
  })
}

export function useOwnerTicketsQuery() {
  return useQueryWrapper<
    ApiSuccessResponse<PaginatedResult<TicketItem>>,
    TicketItem[]
  >(["owner", "tickets"], "/ticket", {
    select: (response) => response?.data?.data ?? [],
  })
}

export function useOwnerTechniciansQuery() {
  return useQueryWrapper<
    ApiSuccessResponse<PaginatedResult<TechnicianItem>>,
    TechnicianItem[]
  >(["owner", "technicians"], "/technician", {
    select: (response) => response?.data?.data ?? [],
  })
}

export function useOwnerAnnouncementsQuery() {
  return useQueryWrapper<
    ApiSuccessResponse<PaginatedResult<AnnouncementItem>>,
    AnnouncementItem[]
  >(["owner", "announcements"], "/announcement", {
    select: (response) => response?.data?.data ?? [],
  })
}

export function useOwnerWorkOrdersQuery() {
  return useQueryWrapper<
    ApiSuccessResponse<PaginatedResult<WorkOrderItem>>,
    WorkOrderItem[]
  >(["owner", "work-orders"], "/work-order", {
    select: (response) => response?.data?.data ?? [],
  })
}

export function useOwnerInspectionsQuery() {
  return useQueryWrapper<
    ApiSuccessResponse<PaginatedResult<InspectionItem>>,
    InspectionItem[]
  >(["owner", "inspections"], "/inspection", {
    select: (response) => response?.data?.data ?? [],
  })
}

export function useOwnerRecurringMaintenancesQuery() {
  return useQueryWrapper<
    ApiSuccessResponse<PaginatedResult<RecurringMaintenanceItem>>,
    RecurringMaintenanceItem[]
  >(["owner", "recurring-maintenances"], "/recurring-maintenance", {
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

export function useOwnerMessagesQuery() {
  return useQueryWrapper<
    ApiSuccessResponse<PaginatedResult<MessageItem>>,
    MessageItem[]
  >(["owner", "messages"], "/messaging/messages", {
    select: (response) => response?.data?.data ?? [],
  })
}

export function useOwnerVendorsQuery() {
  return useQueryWrapper<
    ApiSuccessResponse<PaginatedResult<VendorItem>>,
    VendorItem[]
  >(["owner", "vendors"], "/vendor", {
    select: (response) => response?.data?.data ?? [],
  })
}
