import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { TenantOwnerShell } from "@/components/dashboard/tenant-owner-shell"
import { TenantOwnerTechniciansPage } from "@/components/dashboard/tenant-owner-pages"

export default function TenantOwnerTechniciansRoute() {
  return (
    <DashboardGate roleKey="tenant-owner" bare>
      <TenantOwnerShell>
        <TenantOwnerTechniciansPage />
      </TenantOwnerShell>
    </DashboardGate>
  )
}
