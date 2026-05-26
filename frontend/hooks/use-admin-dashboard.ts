"use client"

import { useQueryWrapper } from "@/api-hooks/react-query-wrapper"
import type { ApiSuccessResponse, PaginatedResult } from "@/lib/types/api"
import type {
  BillItem,
  DashboardMetrics,
  OccupancyStats,
  OrganizationItem,
  PlanItem,
  PropertyItem,
  TechnicianItem,
  TechnicianStats,
  TenantItem,
  TicketItem,
  TicketStatBucket,
  UnitItem,
} from "@/lib/types/dashboard"
import type { AuthUser } from "@/lib/types/auth"

export function useAdminAnalyticsQuery() {
  return useQueryWrapper<ApiSuccessResponse<DashboardMetrics>, DashboardMetrics>(
    ["admin", "analytics", "dashboard"],
    "/analytics/dashboard",
    {
      select: (response) => response.data,
    }
  )
}

export function useTicketStatsQuery() {
  return useQueryWrapper<
    ApiSuccessResponse<{ byStatus: TicketStatBucket[]; byPriority: TicketStatBucket[] }>,
    { byStatus: TicketStatBucket[]; byPriority: TicketStatBucket[] }
  >(["admin", "analytics", "tickets"], "/analytics/tickets", {
    select: (response) => response.data,
  })
}

export function useOccupancyStatsQuery() {
  return useQueryWrapper<ApiSuccessResponse<OccupancyStats>, OccupancyStats>(
    ["admin", "analytics", "occupancy"],
    "/analytics/occupancy",
    {
      select: (response) => response.data,
    }
  )
}

export function useTechnicianStatsQuery() {
  return useQueryWrapper<ApiSuccessResponse<TechnicianStats>, TechnicianStats>(
    ["admin", "analytics", "technicians"],
    "/analytics/technicians",
    {
      select: (response) => response.data,
    }
  )
}

export function useUsersQuery() {
  return useQueryWrapper<AuthUser[]>(["admin", "users"], "/user")
}

export function useOrganizationsQuery() {
  return useQueryWrapper<PaginatedResult<OrganizationItem>, OrganizationItem[]>(
    ["admin", "organizations"],
    "/organization",
    {
      select: (response) => response?.data ?? [],
    }
  )
}

export function usePropertiesQuery() {
  return useQueryWrapper<
    ApiSuccessResponse<PaginatedResult<PropertyItem>>,
    PropertyItem[]
  >(
    ["admin", "properties"],
    "/property",
    {
      select: (response) => response?.data?.data ?? [],
    }
  )
}

export function useUnitsQuery() {
  return useQueryWrapper<ApiSuccessResponse<PaginatedResult<UnitItem>>, UnitItem[]>(
    ["admin", "units"],
    "/unit",
    {
      select: (response) => response?.data?.data ?? [],
    }
  )
}

export function useTenantsQuery() {
  return useQueryWrapper<
    ApiSuccessResponse<PaginatedResult<TenantItem>>,
    TenantItem[]
  >(
    ["admin", "tenants"],
    "/tenant",
    {
      select: (response) => response?.data?.data ?? [],
    }
  )
}

export function useTicketsQuery() {
  return useQueryWrapper<
    ApiSuccessResponse<PaginatedResult<TicketItem>>,
    TicketItem[]
  >(
    ["admin", "tickets"],
    "/ticket",
    {
      select: (response) => response?.data?.data ?? [],
    }
  )
}

export function useTechniciansQuery() {
  return useQueryWrapper<
    ApiSuccessResponse<PaginatedResult<TechnicianItem>>,
    TechnicianItem[]
  >(
    ["admin", "technicians"],
    "/technician",
    {
      select: (response) => response?.data?.data ?? [],
    }
  )
}

export function usePlansQuery() {
  return useQueryWrapper<ApiSuccessResponse<PaginatedResult<PlanItem>>, PlanItem[]>(
    ["admin", "plans"],
    "/subscription/plans",
    {
      select: (response) => response?.data?.data ?? [],
    }
  )
}

export function useAdminBillsQuery(params?: { tenantId?: string; propertyId?: string; status?: string }) {
  const searchParams = new URLSearchParams()
  if (params?.tenantId) searchParams.set("tenantId", params.tenantId)
  if (params?.propertyId) searchParams.set("propertyId", params.propertyId)
  if (params?.status) searchParams.set("status", params.status)
  const queryString = searchParams.toString()

  return useQueryWrapper<ApiSuccessResponse<PaginatedResult<BillItem>>, BillItem[]>(
    ["admin", "bills", params ?? {}],
    `/bill${queryString ? `?${queryString}` : ""}`,
    {
      select: (response) => response?.data?.data ?? [],
    }
  )
}
