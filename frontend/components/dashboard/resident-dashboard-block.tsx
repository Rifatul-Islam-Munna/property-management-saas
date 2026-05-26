"use client"

import { ResidentDashboard } from "@/components/dashboard/resident-dashboard"
import { ResidentShell } from "@/components/dashboard/resident-shell"

export function ResidentDashboardBlock() {
  return (
    <ResidentShell showInsights>
      <ResidentDashboard />
    </ResidentShell>
  )
}
