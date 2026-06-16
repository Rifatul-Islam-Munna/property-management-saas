import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { TenantOwnerLeasesPage } from "@/components/dashboard/tenant-owner-pages"
import { TenantOwnerShell } from "@/components/dashboard/tenant-owner-shell"

export default function TenantOwnerLeasesRoute() {
  return (
    <DashboardGate roleKey="tenant-owner" bare>
      <TenantOwnerShell>
        <TenantOwnerLeasesPage />
      </TenantOwnerShell>
    </DashboardGate>
  )
}
