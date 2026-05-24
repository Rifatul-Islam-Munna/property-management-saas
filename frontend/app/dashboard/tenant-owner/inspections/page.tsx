import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { TenantOwnerInspectionsPage } from "@/components/dashboard/tenant-owner-pages"
import { TenantOwnerShell } from "@/components/dashboard/tenant-owner-shell"

export default function TenantOwnerInspectionsRoute() {
  return (
    <DashboardGate roleKey="tenant-owner" bare>
      <TenantOwnerShell>
        <TenantOwnerInspectionsPage />
      </TenantOwnerShell>
    </DashboardGate>
  )
}
