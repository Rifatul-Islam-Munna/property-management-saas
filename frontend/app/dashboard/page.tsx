"use client"

import { AdminDashboardBlock } from "@/components/dashboard/admin-dashboard-block"
import { DashboardPanelSkeleton } from "@/components/dashboard/dashboard-loading"
import { ResidentDashboardBlock } from "@/components/dashboard/resident-dashboard-block"
import { TenantOwnerDashboardBlock } from "@/components/dashboard/tenant-owner-dashboard-block"
import { WorkerDashboardBlock } from "@/components/dashboard/worker-dashboard-block"
import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { useMeQuery } from "@/hooks/use-auth"

export default function DashboardPage() {
  const { data: me, isLoading } = useMeQuery()

  if (isLoading || !me) {
    return <DashboardPanelSkeleton />
  }

  if (me.role === "tetentwoner") {
    return (
      <DashboardGate roleKey="tenant-owner" bare>
        <TenantOwnerDashboardBlock />
      </DashboardGate>
    )
  }

  if (me.role === "admin" || me.role === "super_admin") {
    return (
      <DashboardGate roleKey="admin" bare>
        <AdminDashboardBlock />
      </DashboardGate>
    )
  }

  if (me.role === "worker") {
    return (
      <DashboardGate roleKey="worker" bare>
        <WorkerDashboardBlock />
      </DashboardGate>
    )
  }

  return (
    <DashboardGate roleKey="resident" bare>
      <ResidentDashboardBlock />
    </DashboardGate>
  )
}
