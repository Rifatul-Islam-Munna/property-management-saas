import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { TenantOwnerNotificationsPage } from "@/components/dashboard/tenant-owner-pages"
import { TenantOwnerShell } from "@/components/dashboard/tenant-owner-shell"

export default function TenantOwnerNotificationsRoute() {
  return (
    <DashboardGate roleKey="tenant-owner" bare>
      <TenantOwnerShell>
        <TenantOwnerNotificationsPage />
      </TenantOwnerShell>
    </DashboardGate>
  )
}
