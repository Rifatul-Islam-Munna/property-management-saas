"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  deleteRequest,
  patchRequest,
} from "@/api-hooks/api-hooks"
import { useCommonMutationApi } from "@/api-hooks/use-api-mutation"
import { useQueryWrapper } from "@/api-hooks/react-query-wrapper"
import type { ApiSuccessResponse } from "@/lib/types/api"
import type { AuthResponse } from "@/lib/types/auth"
import type {
  OrganizationItem,
  PlanItem,
  PropertyItem,
  SubscriptionItem,
  TechnicianItem,
  TenantItem,
} from "@/lib/types/dashboard"

type ManagedUserPayload = {
  fullName: string
  email: string
  phoneNumber: string
  password: string
  organizationId?: string
  jobTitle?: string
  role: "tetentwoner"
}

type OrganizationPayload = {
  name: string
  slug: string
  email?: string
  phone?: string
  address?: string
  description?: string
  subscriptionStatus?: "active" | "trial" | "expired" | "cancelled"
  subscriptionPlan?: "starter" | "growth" | "enterprise"
  maxProperties?: number
  maxUsers?: number
  isActive?: boolean
}

type PropertyPayload = {
  name: string
  type:
    | "apartment"
    | "hotel"
    | "villa"
    | "office"
    | "coworking_space"
    | "vacation_rental"
  description?: string
  totalUnits?: number
  totalFloors?: number
  contactPhone?: string
  contactEmail?: string
  amenities?: string[]
  images?: string[]
  documents?: string[]
  address?: {
    street?: string
    city?: string
    state?: string
    country?: string
    zipCode?: string
  }
  isActive?: boolean
}

type TenantPayload = {
  tenantKind?: "renter" | "guest"
  propertyId: string
  unitId?: string
  fullName: string
  email: string
  phone: string
  address?: string
  monthlyRent?: number
  securityDeposit?: number
  oneTimeGuestFee?: number
  notes?: string
  isActive?: boolean
}

type TechnicianPayload = {
  userId?: string
  name: string
  email: string
  phone: string
  skills?: string[]
  availability?: "available" | "busy" | "on_leave" | "off_duty"
  assignedProperties?: string[]
  hourlyRate?: number
  notes?: string
  isActive?: boolean
}

type PlanPayload = {
  name: string
  description?: string
  monthlyPrice: number
  yearlyPrice: number
  maxProperties?: number
  maxUsers?: number
  features?: string[]
  isActive?: boolean
}

type SubscriptionPayload = {
  organizationId: string
  planId: string
  billingInterval: "monthly" | "yearly"
  ownerUserId?: string
  status?: "pending" | "active" | "cancelled" | "expired"
  currentPeriodStart?: string
  currentPeriodEnd?: string
}

type ToggleEntityVariables = {
  id: string
  payload: Record<string, unknown>
}

function useDeleteEntityMutation(
  mutationKey: string[],
  queryKeys: string[][],
  urlFactory: (id: string) => string
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey,
    mutationFn: async (id: string) => {
      const [data, error] = await deleteRequest(urlFactory(id))

      if (error || !data) {
        throw new Error(error?.message ?? "Delete failed")
      }

      return data
    },
    onSuccess: async () => {
      toast.success("Deleted")
      await Promise.all(
        queryKeys.map((queryKey) =>
          queryClient.invalidateQueries({ queryKey })
        )
      )
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

function usePatchEntityMutation<TData>(
  mutationKey: string[],
  queryKeys: string[][],
  urlFactory: (id: string) => string
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey,
    mutationFn: async ({ id, payload }: ToggleEntityVariables) => {
      const [data, error] = await patchRequest<TData, Record<string, unknown>>(
        urlFactory(id),
        payload
      )

      if (error || !data) {
        throw new Error(error?.message ?? "Update failed")
      }

      return data
    },
    onSuccess: async () => {
      toast.success("Updated")
      await Promise.all(
        queryKeys.map((queryKey) =>
          queryClient.invalidateQueries({ queryKey })
        )
      )
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useCreateTenantOwnerMutation() {
  const queryClient = useQueryClient()

  return useCommonMutationApi<AuthResponse, ManagedUserPayload>({
    url: "/user/create",
    method: "POST",
    mutationKey: ["admin", "create", "tenant-owner"],
    successMessage: "Tenant owner created",
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
    },
  })
}

export function useCreateOrganizationMutation() {
  const queryClient = useQueryClient()

  return useCommonMutationApi<OrganizationItem, OrganizationPayload>({
    url: "/organization",
    method: "POST",
    mutationKey: ["admin", "create", "organization"],
    successMessage: "Organization created",
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "organizations"] })
    },
  })
}

export function useCreatePropertyMutation() {
  const queryClient = useQueryClient()

  return useCommonMutationApi<ApiSuccessResponse<PropertyItem>, PropertyPayload>({
    url: "/property",
    method: "POST",
    mutationKey: ["admin", "create", "property"],
    successMessage: "Property created",
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "properties"] })
    },
  })
}

export function useCreateTenantMutation() {
  const queryClient = useQueryClient()

  return useCommonMutationApi<ApiSuccessResponse<TenantItem>, TenantPayload>({
    url: "/tenant",
    method: "POST",
    mutationKey: ["admin", "create", "tenant"],
    successMessage: "Tenant created",
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "tenants"] })
    },
  })
}

export function useCreateTechnicianMutation() {
  const queryClient = useQueryClient()

  return useCommonMutationApi<ApiSuccessResponse<TechnicianItem>, TechnicianPayload>({
    url: "/technician",
    method: "POST",
    mutationKey: ["admin", "create", "technician"],
    successMessage: "Technician created",
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "technicians"] })
    },
  })
}

export function useCreatePlanMutation() {
  const queryClient = useQueryClient()

  return useCommonMutationApi<ApiSuccessResponse<PlanItem>, PlanPayload>({
    url: "/subscription/plans",
    method: "POST",
    mutationKey: ["admin", "create", "plan"],
    successMessage: "Plan created",
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "plans"] })
    },
  })
}

export function useCreateSubscriptionMutation() {
  const queryClient = useQueryClient()

  return useCommonMutationApi<ApiSuccessResponse<SubscriptionItem>, SubscriptionPayload>({
    url: "/subscription",
    method: "POST",
    mutationKey: ["admin", "create", "subscription"],
    successMessage: "Subscription created",
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "subscriptions"] })
    },
  })
}

export function useSubscriptionsQuery() {
  return useQueryWrapper<ApiSuccessResponse<SubscriptionItem[]>, SubscriptionItem[]>(
    ["admin", "subscriptions"],
    "/subscription",
    {
      select: (response) => response?.data ?? [],
    }
  )
}

export function useDeleteOrganizationMutation() {
  return useDeleteEntityMutation(
    ["admin", "delete", "organization"],
    [["admin", "organizations"]],
    (id) => `/organization/${id}`
  )
}

export function useDeletePropertyMutation() {
  return useDeleteEntityMutation(
    ["admin", "delete", "property"],
    [["admin", "properties"], ["admin", "analytics", "dashboard"]],
    (id) => `/property/${id}`
  )
}

export function useDeleteTenantMutation() {
  return useDeleteEntityMutation(
    ["admin", "delete", "tenant"],
    [["admin", "tenants"], ["admin", "analytics", "technicians"]],
    (id) => `/tenant/${id}`
  )
}

export function useDeleteTechnicianMutation() {
  return useDeleteEntityMutation(
    ["admin", "delete", "technician"],
    [["admin", "technicians"], ["admin", "analytics", "technicians"]],
    (id) => `/technician/${id}`
  )
}

export function useDeletePlanMutation() {
  return useDeleteEntityMutation(
    ["admin", "delete", "plan"],
    [["admin", "plans"]],
    (id) => `/subscription/plans/${id}`
  )
}

export function useToggleOrganizationMutation() {
  return usePatchEntityMutation<ApiSuccessResponse<OrganizationItem>>(
    ["admin", "toggle", "organization"],
    [["admin", "organizations"]],
    (id) => `/organization/${id}`
  )
}

export function useTogglePropertyMutation() {
  return usePatchEntityMutation<ApiSuccessResponse<PropertyItem>>(
    ["admin", "toggle", "property"],
    [["admin", "properties"]],
    (id) => `/property/${id}`
  )
}

export function useToggleTenantMutation() {
  return usePatchEntityMutation<ApiSuccessResponse<TenantItem>>(
    ["admin", "toggle", "tenant"],
    [["admin", "tenants"]],
    (id) => `/tenant/${id}`
  )
}

export function useToggleTechnicianMutation() {
  return usePatchEntityMutation<ApiSuccessResponse<TechnicianItem>>(
    ["admin", "toggle", "technician"],
    [["admin", "technicians"]],
    (id) => `/technician/${id}`
  )
}

export function useTogglePlanMutation() {
  return usePatchEntityMutation<ApiSuccessResponse<PlanItem>>(
    ["admin", "toggle", "plan"],
    [["admin", "plans"]],
    (id) => `/subscription/plans/${id}`
  )
}
