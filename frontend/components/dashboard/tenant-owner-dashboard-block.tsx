"use client"

import { TenantOwnerDashboard } from "@/components/dashboard/tenant-owner-dashboard"
import { TenantOwnerShell } from "@/components/dashboard/tenant-owner-shell"

export function TenantOwnerDashboardBlock() {
  return (
    <TenantOwnerShell showInsights>
      <TenantOwnerDashboard />
    </TenantOwnerShell>
  )
}
