export type AuthUser = {
  id: string
  fullName: string
  email: string
  phoneNumber: string
  organizationId?: string | null
  organizationIds: string[]
  role: "super_admin" | "admin" | "tetentwoner" | "worker" | "renter" | "guest"
  status: "invited" | "active" | "suspended"
  subscriptionTier?: "starter" | "growth" | "enterprise" | null
  subscriptionRequired: boolean
  subscriptionActive: boolean
}

export type AuthResponse = {
  access_token: string
  refresh_token: string
  user: AuthUser
}

export type LoginPayload = {
  email: string
  password: string
}

export type WorkerSignupPayload = {
  fullName: string
  email: string
  phoneNumber: string
  password: string
  jobTitle?: string
}

export type PublicSignupPayload = WorkerSignupPayload & {
  role: "worker" | "tetentwoner" | "renter" | "guest"
}
