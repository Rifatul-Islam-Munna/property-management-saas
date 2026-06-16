import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { TenantOwnerReportsPage } from "@/components/dashboard/tenant-owner-pages"
import { TenantOwnerShell } from "@/components/dashboard/tenant-owner-shell"

export default function TenantOwnerReportsRoute() {
  return (
    <DashboardGate roleKey="tenant-owner" bare>
      <TenantOwnerShell>
        <TenantOwnerReportsPage />
      </TenantOwnerShell>
    </DashboardGate>
  )
}
