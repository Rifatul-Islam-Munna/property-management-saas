"use client"

import { TenantOwnerShell } from "@/components/dashboard/tenant-owner-shell"

export function ResidentShell({
  children,
  showInsights = false,
}: {
  children: React.ReactNode
  showInsights?: boolean
}) {
  return <TenantOwnerShell showInsights={showInsights}>{children}</TenantOwnerShell>
}
