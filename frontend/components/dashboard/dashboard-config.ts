import type { DashboardRoleConfig } from "@/lib/types/dashboard"

export const dashboardConfigs: DashboardRoleConfig[] = [
  {
    key: "admin",
    title: "Admin dashboard",
    subtitle: "System-wide ops, org growth, users, plans.",
    allowedRoles: ["super_admin", "admin"],
    nav: [
      { label: "Overview", href: "#overview" },
      { label: "Users", href: "#users" },
      { label: "Properties", href: "#properties" },
      { label: "Plans", href: "#plans" },
    ],
  },
  {
    key: "tenant-owner",
    title: "Tenant owner dashboard",
    subtitle: "Property ops, staff, billing, notices.",
    allowedRoles: ["tetentwoner"],
    nav: [
      { label: "Overview", href: "#overview" },
      { label: "Tickets", href: "#tickets" },
      { label: "Tenants", href: "#tenants" },
    ],
  },
  {
    key: "resident",
    title: "Resident dashboard",
    subtitle: "Rent, notices, support tickets, documents.",
    allowedRoles: ["renter", "guest"],
    nav: [
      { label: "Overview", href: "#overview" },
      { label: "Payments", href: "#payments" },
      { label: "Notices", href: "#notices" },
    ],
  },
  {
    key: "worker",
    title: "Worker dashboard",
    subtitle: "Assignments, ticket work, property links.",
    allowedRoles: ["worker"],
    nav: [
      { label: "Overview", href: "#overview" },
      { label: "Work", href: "#work" },
      { label: "Messages", href: "#messages" },
    ],
  },
]

export function getDashboardConfig(key: DashboardRoleConfig["key"]) {
  return dashboardConfigs.find((config) => config.key === key)
}
