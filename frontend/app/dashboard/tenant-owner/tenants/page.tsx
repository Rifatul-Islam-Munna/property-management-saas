import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { TenantOwnerShell } from "@/components/dashboard/tenant-owner-shell"
import { TenantOwnerTenantsPage } from "@/components/dashboard/tenant-owner-pages"

export default function TenantOwnerTenantsRoute() {
  return (
    <DashboardGate roleKey="tenant-owner" bare>
      <TenantOwnerShell>
        <TenantOwnerTenantsPage />
      </TenantOwnerShell>
    </DashboardGate>
  )
}
