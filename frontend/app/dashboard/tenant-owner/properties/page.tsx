import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { TenantOwnerPropertiesPage } from "@/components/dashboard/tenant-owner-pages"
import { TenantOwnerShell } from "@/components/dashboard/tenant-owner-shell"

export default function TenantOwnerPropertiesRoute() {
  return (
    <DashboardGate roleKey="tenant-owner" bare>
      <TenantOwnerShell>
        <TenantOwnerPropertiesPage />
      </TenantOwnerShell>
    </DashboardGate>
  )
}
