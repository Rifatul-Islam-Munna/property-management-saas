import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { TenantOwnerShell } from "@/components/dashboard/tenant-owner-shell"
import { TenantOwnerUsersPage } from "@/components/dashboard/tenant-owner-pages"

export default function TenantOwnerUsersRoute() {
  return (
    <DashboardGate roleKey="tenant-owner" bare>
      <TenantOwnerShell>
        <TenantOwnerUsersPage />
      </TenantOwnerShell>
    </DashboardGate>
  )
}
