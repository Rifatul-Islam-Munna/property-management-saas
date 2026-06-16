import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { TenantOwnerAssetsPage } from "@/components/dashboard/tenant-owner-pages"
import { TenantOwnerShell } from "@/components/dashboard/tenant-owner-shell"

export default function TenantOwnerAssetsRoute() {
  return (
    <DashboardGate roleKey="tenant-owner" bare>
      <TenantOwnerShell>
        <TenantOwnerAssetsPage />
      </TenantOwnerShell>
    </DashboardGate>
  )
}
