"use client"

import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { AdminDashboard } from "@/components/dashboard/admin-dashboard"
import { AdminShell } from "@/components/dashboard/admin-shell"
import { SectionCards } from "@/components/section-cards"

export function AdminDashboardBlock() {
  return (
    <AdminShell>
      <SectionCards />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
      <div className="px-4 lg:px-6">
        <AdminDashboard />
      </div>
    </AdminShell>
  )
}
