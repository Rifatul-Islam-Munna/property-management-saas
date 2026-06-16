import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { TenantOwnerHealthPage } from "@/components/dashboard/tenant-owner-pages"
import { TenantOwnerShell } from "@/components/dashboard/tenant-owner-shell"

export default function TenantOwnerHealthRoute() {
  return (
    <DashboardGate roleKey="tenant-owner" bare>
      <TenantOwnerShell>
        <TenantOwnerHealthPage />
      </TenantOwnerShell>
    </DashboardGate>
  )
}
