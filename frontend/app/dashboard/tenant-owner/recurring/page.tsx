import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { TenantOwnerRecurringPage } from "@/components/dashboard/tenant-owner-pages"
import { TenantOwnerShell } from "@/components/dashboard/tenant-owner-shell"

export default function TenantOwnerRecurringRoute() {
  return (
    <DashboardGate roleKey="tenant-owner" bare>
      <TenantOwnerShell>
        <TenantOwnerRecurringPage />
      </TenantOwnerShell>
    </DashboardGate>
  )
}
