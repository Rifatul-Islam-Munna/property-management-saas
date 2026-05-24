import type { AuthUser } from "@/lib/types/auth"

export type DashboardRoleKey =
  | "admin"
  | "tenant-owner"
  | "resident"
  | "worker"

export type DashboardNavItem = {
  label: string
  href: string
}

export type DashboardRoleConfig = {
  key: DashboardRoleKey
  title: string
  subtitle: string
  allowedRoles: AuthUser["role"][]
  nav: DashboardNavItem[]
}

export type DashboardMetrics = {
  totalTickets: number
  openTickets: number
  emergencyTickets: number
  totalProperties: number
  totalUnits: number
  occupiedUnits: number
  occupancyRate: number
}

export type TicketStatBucket = {
  _id: string
  count: number
}

export type OccupancyStats = {
  vacant: number
  occupied: number
  maintenance: number
  reserved: number
}

export type TechnicianStats = {
  totalTechnicians: number
  activeTechnicians: number
  totalTenants: number
}

export type OrganizationItem = {
  _id: string
  name: string
  slug: string
  isActive: boolean
}

export type PropertyItem = {
  _id: string
  name: string
  type: string
  totalUnits?: number
  isActive?: boolean
}

export type UnitItem = {
  _id: string
  unitNumber: string
  status: string
  rentAmount?: number
}

export type TenantItem = {
  _id: string
  propertyId?: string
  unitId?: string | null
  fullName: string
  email?: string
  phoneNumber?: string
  tenantKind?: string
  monthlyRent?: number | null
  oneTimeGuestFee?: number | null
  guestFeePaid?: boolean
  paymentRecords?: Array<{
    monthKey: string
    status: string
    amount: number
    paidAt?: string | null
    dueDate?: string | null
    paymentMethod?: string | null
    note?: string | null
  }>
  isActive?: boolean
}

export type TicketItem = {
  _id: string
  propertyId?: string
  unitId?: string
  tenantId?: string
  title: string
  description?: string
  category?: string
  priority: string
  status: string
  assignedTo?: string | null
  images?: string[]
  createdAt?: string
}

export type TechnicianItem = {
  _id: string
  fullName: string
  specialty?: string
  isActive?: boolean
}

export type PlanItem = {
  _id: string
  name: string
  description?: string
  interval: string
  amount: number
  isActive?: boolean
  monthlyPrice?: number
  yearlyPrice?: number
  maxProperties?: number
  maxUsers?: number
  features?: string[]
  paddlePriceIdMonthly?: string | null
  paddlePriceIdYearly?: string | null
}

export type SubscriptionItem = {
  _id: string
  organizationId: string
  ownerUserId: string
  planId: string
  billingInterval: "monthly" | "yearly"
  status: "pending" | "active" | "cancelled" | "expired"
  amount: number
  currentPeriodStart?: string | null
  currentPeriodEnd?: string | null
}

export type AnnouncementItem = {
  _id: string
  title: string
  content: string
  propertyId?: string | null
  audience?: string
  isActive?: boolean
  createdAt?: string
}

export type WorkOrderItem = {
  _id: string
  propertyId?: string
  unitId?: string | null
  ticketId?: string | null
  title: string
  description?: string
  assignedTo?: string | null
  priority?: string
  status: string
  completionProof?: string[]
}

export type InspectionItem = {
  _id: string
  propertyId?: string
  unitId?: string | null
  type: string
  scheduledAt?: string
  checklist?: string[]
  photos?: string[]
  completed?: boolean
}

export type RecurringMaintenanceItem = {
  _id: string
  propertyId?: string
  unitId?: string | null
  title: string
  description?: string
  frequency: string
  nextRunAt?: string
  isActive?: boolean
}

export type MessageItem = {
  _id: string
  receiverId?: string
  title?: string
  content?: string
  attachments?: string[]
  createdAt?: string
}

export type VendorItem = {
  _id: string
  name: string
  category: string
  email?: string | null
  phone?: string | null
  isActive?: boolean
}

export type UploadImageResponse = {
  message: string
  url: string
  fileName: string
  mimeType: string
  size: number
}
