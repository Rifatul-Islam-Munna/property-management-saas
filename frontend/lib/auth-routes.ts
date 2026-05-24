import type { AuthUser } from "@/lib/types/auth"

export function getDashboardPath(role?: AuthUser["role"]) {
  switch (role) {
    case "super_admin":
    case "admin":
      return "/dashboard/admin"
    case "tetentwoner":
      return "/dashboard/tenant-owner"
    case "worker":
      return "/dashboard/worker"
    case "renter":
    case "guest":
      return "/dashboard/resident"
    default:
      return "/login"
  }
}
