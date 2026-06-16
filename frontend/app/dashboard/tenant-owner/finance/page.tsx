import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { TenantOwnerFinancePage } from "@/components/dashboard/tenant-owner-pages"
import { TenantOwnerShell } from "@/components/dashboard/tenant-owner-shell"

export default function TenantOwnerFinanceRoute() {
  return (
    <DashboardGate roleKey="tenant-owner" bare>
      <TenantOwnerShell>
        <TenantOwnerFinancePage />
      </TenantOwnerShell>
    </DashboardGate>
  )
}
