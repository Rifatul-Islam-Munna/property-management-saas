import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { TenantOwnerNoticesPage } from "@/components/dashboard/tenant-owner-pages"
import { TenantOwnerShell } from "@/components/dashboard/tenant-owner-shell"

export default function TenantOwnerNoticesRoute() {
  return (
    <DashboardGate roleKey="tenant-owner" bare>
      <TenantOwnerShell>
        <TenantOwnerNoticesPage />
      </TenantOwnerShell>
    </DashboardGate>
  )
}
