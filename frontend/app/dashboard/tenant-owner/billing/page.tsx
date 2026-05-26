import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { TenantOwnerBillingPage } from "@/components/dashboard/tenant-owner-pages"
import { TenantOwnerShell } from "@/components/dashboard/tenant-owner-shell"

export default function TenantOwnerBillingRoute() {
  return (
    <DashboardGate roleKey="tenant-owner" bare>
      <TenantOwnerShell>
        <TenantOwnerBillingPage />
      </TenantOwnerShell>
    </DashboardGate>
  )
}
