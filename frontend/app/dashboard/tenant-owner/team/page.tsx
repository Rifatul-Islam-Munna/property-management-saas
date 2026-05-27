import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { TenantOwnerShell } from "@/components/dashboard/tenant-owner-shell"
import { TenantOwnerTeamPage } from "@/components/dashboard/tenant-owner-pages"

export default function TenantOwnerTeamRoute() {
  return (
    <DashboardGate roleKey="tenant-owner" bare>
      <TenantOwnerShell>
        <TenantOwnerTeamPage />
      </TenantOwnerShell>
    </DashboardGate>
  )
}
