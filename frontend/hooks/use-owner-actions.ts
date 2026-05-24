"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { deleteRequest, patchRequest, postRequest } from "@/api-hooks/api-hooks"
import { useCommonMutationApi } from "@/api-hooks/use-api-mutation"
import type { ApiSuccessResponse } from "@/lib/types/api"
import type { AuthResponse } from "@/lib/types/auth"
import type {
  AnnouncementItem,
  InspectionItem,
  MessageItem,
  PropertyItem,
  RecurringMaintenanceItem,
  TechnicianItem,
  TenantItem,
  UnitItem,
  TicketItem,
  VendorItem,
  WorkOrderItem,
} from "@/lib/types/dashboard"

type OwnerManagedUserPayload = {
  fullName: string
  email: string
  phoneNumber: string
  password: string
  jobTitle?: string
  propertyIds?: string[]
  role: "worker" | "renter" | "guest"
}

type OwnerAssignmentRequestPayload = {
  direction: "owner_to_user"
  targetUserId: string
  targetEmail?: string
  requestedRole: "worker" | "renter" | "guest"
  propertyIds?: string[]
  message?: string
}

type OwnerPropertyPayload = {
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

type UnitPayload = {
  propertyId: string
  unitNumber: string
  floor?: number
  type?: string
  status?: "vacant" | "occupied" | "maintenance" | "reserved"
  tenantId?: string
  monthlyRent?: number
  area?: number
  notes?: string
  images?: string[]
  amenities?: string[]
  isActive?: boolean
}

type OwnerTenantPayload = {
  tenantKind?: "renter" | "guest"
  propertyId: string
  unitId?: string
  userId?: string
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

type OwnerTechnicianPayload = {
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

type NoticePayload = {
  propertyId?: string
  title: string
  content: string
  audience?: "all" | "roles" | "users"
  targetRoles?: Array<"worker" | "renter" | "guest">
  targetUserIds?: string[]
  attachments?: string[]
  isActive?: boolean
}

type OwnerDocumentPayload = {
  recipientIds: string[]
  documentUrl: string
  title?: string
  note?: string
}

type OwnerTicketPayload = {
  propertyId: string
  unitId?: string
  tenantId?: string
  title: string
  description: string
  category: string
  priority?: string
  images?: string[]
}

type OwnerTicketAssignPayload = {
  ticketId: string
  assignedTo: string
}

type OwnerTicketUpdatePayload = {
  id: string
  payload: {
    status?: string
    actualCost?: number
  }
}

type OwnerWorkOrderPayload = {
  propertyId: string
  unitId?: string
  ticketId?: string
  title: string
  description: string
  assignedTo?: string
  scheduledDate?: string
  dueDate?: string
  priority?: string
  status?: string
  completionProof?: string[]
}

type OwnerInspectionPayload = {
  propertyId: string
  unitId?: string
  type: string
  scheduledAt: string
  checklist?: string[]
  photos?: string[]
  damageReport?: string
  notes?: string
  completed?: boolean
}

type OwnerRecurringPayload = {
  propertyId: string
  unitId?: string
  title: string
  description?: string
  frequency: string
  nextRunAt: string
  isActive?: boolean
}

type OwnerVendorPayload = {
  name: string
  email?: string
  phone?: string
  category: string
  address?: string
  notes?: string
  isActive?: boolean
}

type OwnerTenantPaymentPayload = {
  tenantId: string
  monthKey: string
  amount: number
  status?: string
  paidAt?: string
  dueDate?: string
  paymentMethod?: string
  note?: string
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
      if (error || !data) throw new Error(error?.message ?? "Delete failed")
      return data
    },
    onSuccess: async () => {
      toast.success("Deleted")
      await Promise.all(queryKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })))
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
      const [data, error] = await patchRequest<TData, Record<string, unknown>>(urlFactory(id), payload)
      if (error || !data) throw new Error(error?.message ?? "Update failed")
      return data
    },
    onSuccess: async () => {
      toast.success("Updated")
      await Promise.all(queryKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })))
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useOwnerCreateUserMutation() {
  const queryClient = useQueryClient()
  return useCommonMutationApi<AuthResponse | { message: string }, OwnerManagedUserPayload>({
    url: "/user/create",
    method: "POST",
    mutationKey: ["owner", "create", "user"],
    successMessage: "User created",
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["owner", "users"] })
    },
  })
}

export function useOwnerCreateAssignmentRequestMutation() {
  const queryClient = useQueryClient()
  return useCommonMutationApi<any, OwnerAssignmentRequestPayload>({
    url: "/user/assignment-requests",
    method: "POST",
    mutationKey: ["owner", "create", "assignment-request"],
    successMessage: "Request sent",
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["owner", "assignment-requests"] }),
        queryClient.invalidateQueries({ queryKey: ["owner", "users"] }),
      ])
    },
  })
}

export function useOwnerSendDocumentMutation() {
  const queryClient = useQueryClient()
  return useCommonMutationApi<ApiSuccessResponse<MessageItem>, OwnerDocumentPayload>({
    url: "/messaging/documents",
    method: "POST",
    mutationKey: ["owner", "create", "document"],
    successMessage: "Document sent",
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["owner", "messages"] })
    },
  })
}

export function useOwnerCreatePropertyMutation() {
  const queryClient = useQueryClient()
  return useCommonMutationApi<ApiSuccessResponse<PropertyItem>, OwnerPropertyPayload>({
    url: "/property",
    method: "POST",
    mutationKey: ["owner", "create", "property"],
    successMessage: "Property created",
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["owner", "properties"] })
    },
  })
}

export function useOwnerCreateUnitMutation() {
  const queryClient = useQueryClient()
  return useCommonMutationApi<ApiSuccessResponse<UnitItem>, UnitPayload>({
    url: "/unit",
    method: "POST",
    mutationKey: ["owner", "create", "unit"],
    successMessage: "Unit created",
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["owner", "units"] })
    },
  })
}

export function useOwnerCreateTenantMutation() {
  const queryClient = useQueryClient()
  return useCommonMutationApi<ApiSuccessResponse<TenantItem>, OwnerTenantPayload>({
    url: "/tenant",
    method: "POST",
    mutationKey: ["owner", "create", "tenant"],
    successMessage: "Tenant created",
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["owner", "tenants"] })
    },
  })
}

export function useOwnerCreateTechnicianMutation() {
  const queryClient = useQueryClient()
  return useCommonMutationApi<ApiSuccessResponse<TechnicianItem>, OwnerTechnicianPayload>({
    url: "/technician",
    method: "POST",
    mutationKey: ["owner", "create", "technician"],
    successMessage: "Technician created",
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["owner", "technicians"] })
    },
  })
}

export function useOwnerSendNoticeMutation() {
  const queryClient = useQueryClient()
  return useCommonMutationApi<ApiSuccessResponse<AnnouncementItem>, NoticePayload>({
    url: "/announcement/notice",
    method: "POST",
    mutationKey: ["owner", "create", "notice"],
    successMessage: "Notice sent",
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["owner", "announcements"] })
    },
  })
}

export function useOwnerCreateTicketMutation() {
  const queryClient = useQueryClient()
  return useCommonMutationApi<ApiSuccessResponse<TicketItem>, OwnerTicketPayload>({
    url: "/ticket",
    method: "POST",
    mutationKey: ["owner", "create", "ticket"],
    successMessage: "Ticket created",
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["owner", "tickets"] })
    },
  })
}

export function useOwnerAssignTicketMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: ["owner", "assign", "ticket"],
    mutationFn: async ({ ticketId, assignedTo }: OwnerTicketAssignPayload) => {
      const [data, error] = await patchRequest<ApiSuccessResponse<TicketItem>, undefined>(
        `/ticket/${ticketId}/assign/${assignedTo}`,
        undefined
      )
      if (error || !data) throw new Error(error?.message ?? "Assign failed")
      return data
    },
    onSuccess: async () => {
      toast.success("Ticket assigned")
      await queryClient.invalidateQueries({ queryKey: ["owner", "tickets"] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useOwnerUpdateTicketMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: ["owner", "update", "ticket"],
    mutationFn: async ({ id, payload }: OwnerTicketUpdatePayload) => {
      const [data, error] = await patchRequest<ApiSuccessResponse<TicketItem>, typeof payload>(
        `/ticket/${id}`,
        payload
      )
      if (error || !data) throw new Error(error?.message ?? "Ticket update failed")
      return data
    },
    onSuccess: async () => {
      toast.success("Ticket updated")
      await queryClient.invalidateQueries({ queryKey: ["owner", "tickets"] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useOwnerCreateWorkOrderMutation() {
  const queryClient = useQueryClient()
  return useCommonMutationApi<ApiSuccessResponse<WorkOrderItem>, OwnerWorkOrderPayload>({
    url: "/work-order",
    method: "POST",
    mutationKey: ["owner", "create", "work-order"],
    successMessage: "Work order created",
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["owner", "work-orders"] })
    },
  })
}

export function useOwnerCreateInspectionMutation() {
  const queryClient = useQueryClient()
  return useCommonMutationApi<ApiSuccessResponse<InspectionItem>, OwnerInspectionPayload>({
    url: "/inspection",
    method: "POST",
    mutationKey: ["owner", "create", "inspection"],
    successMessage: "Inspection created",
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["owner", "inspections"] })
    },
  })
}

export function useOwnerCreateRecurringMaintenanceMutation() {
  const queryClient = useQueryClient()
  return useCommonMutationApi<ApiSuccessResponse<RecurringMaintenanceItem>, OwnerRecurringPayload>({
    url: "/recurring-maintenance",
    method: "POST",
    mutationKey: ["owner", "create", "recurring-maintenance"],
    successMessage: "Recurring maintenance created",
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["owner", "recurring-maintenances"] })
    },
  })
}

export function useOwnerCreateVendorMutation() {
  const queryClient = useQueryClient()
  return useCommonMutationApi<ApiSuccessResponse<VendorItem>, OwnerVendorPayload>({
    url: "/vendor",
    method: "POST",
    mutationKey: ["owner", "create", "vendor"],
    successMessage: "Vendor created",
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["owner", "vendors"] })
    },
  })
}

export function useOwnerRecordTenantPaymentMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: ["owner", "record", "tenant-payment"],
    mutationFn: async ({ tenantId, ...payload }: OwnerTenantPaymentPayload) => {
      const [data, error] = await postRequest<ApiSuccessResponse<TenantItem>, typeof payload>(
        `/tenant/${tenantId}/payments`,
        payload
      )
      if (error || !data) throw new Error(error?.message ?? "Payment record failed")
      return data
    },
    onSuccess: async () => {
      toast.success("Payment recorded")
      await queryClient.invalidateQueries({ queryKey: ["owner", "tenants"] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useOwnerTogglePropertyMutation() {
  return usePatchEntityMutation<ApiSuccessResponse<PropertyItem>>(
    ["owner", "toggle", "property"],
    [["owner", "properties"]],
    (id) => `/property/${id}`
  )
}

export function useOwnerToggleUnitMutation() {
  return usePatchEntityMutation<ApiSuccessResponse<UnitItem>>(
    ["owner", "toggle", "unit"],
    [["owner", "units"]],
    (id) => `/unit/${id}`
  )
}

export function useOwnerToggleTenantMutation() {
  return usePatchEntityMutation<ApiSuccessResponse<TenantItem>>(
    ["owner", "toggle", "tenant"],
    [["owner", "tenants"]],
    (id) => `/tenant/${id}`
  )
}

export function useOwnerToggleTechnicianMutation() {
  return usePatchEntityMutation<ApiSuccessResponse<TechnicianItem>>(
    ["owner", "toggle", "technician"],
    [["owner", "technicians"]],
    (id) => `/technician/${id}`
  )
}

export function useOwnerDeleteUnitMutation() {
  return useDeleteEntityMutation(
    ["owner", "delete", "unit"],
    [["owner", "units"]],
    (id) => `/unit/${id}`
  )
}

export function useOwnerDeleteTenantMutation() {
  return useDeleteEntityMutation(
    ["owner", "delete", "tenant"],
    [["owner", "tenants"]],
    (id) => `/tenant/${id}`
  )
}

export function useOwnerDeleteTechnicianMutation() {
  return useDeleteEntityMutation(
    ["owner", "delete", "technician"],
    [["owner", "technicians"]],
    (id) => `/technician/${id}`
  )
}
