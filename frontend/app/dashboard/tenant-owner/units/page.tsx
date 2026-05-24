import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { TenantOwnerShell } from "@/components/dashboard/tenant-owner-shell"
import { TenantOwnerUnitsPage } from "@/components/dashboard/tenant-owner-pages"

export default function TenantOwnerUnitsRoute() {
  return (
    <DashboardGate roleKey="tenant-owner" bare>
      <TenantOwnerShell>
        <TenantOwnerUnitsPage />
      </TenantOwnerShell>
    </DashboardGate>
  )
}
