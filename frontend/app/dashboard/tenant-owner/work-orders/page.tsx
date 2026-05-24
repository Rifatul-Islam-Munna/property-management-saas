import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { TenantOwnerShell } from "@/components/dashboard/tenant-owner-shell"
import { TenantOwnerWorkOrdersPage } from "@/components/dashboard/tenant-owner-pages"

export default function TenantOwnerWorkOrdersRoute() {
  return (
    <DashboardGate roleKey="tenant-owner" bare>
      <TenantOwnerShell>
        <TenantOwnerWorkOrdersPage />
      </TenantOwnerShell>
    </DashboardGate>
  )
}
