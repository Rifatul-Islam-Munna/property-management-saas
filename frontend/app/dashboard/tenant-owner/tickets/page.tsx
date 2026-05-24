import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { TenantOwnerTicketsPage } from "@/components/dashboard/tenant-owner-pages"
import { TenantOwnerShell } from "@/components/dashboard/tenant-owner-shell"

export default function TenantOwnerTicketsRoute() {
  return (
    <DashboardGate roleKey="tenant-owner" bare>
      <TenantOwnerShell>
        <TenantOwnerTicketsPage />
      </TenantOwnerShell>
    </DashboardGate>
  )
}
