"use client"

import { AdminDashboard } from "@/components/dashboard/admin-dashboard"
import { AdminShell } from "@/components/dashboard/admin-shell"

export function AdminDashboardBlock() {
  return (
    <AdminShell>
      <div className="px-4 lg:px-6">
        <AdminDashboard />
      </div>
    </AdminShell>
  )
}
