import { TenantOwnerStaffPage } from "@/components/dashboard/tenant-owner-pages"
import { TenantOwnerShell } from "@/components/dashboard/tenant-owner-shell"
import { DashboardGate } from "@/components/dashboard/dashboard-gate"

export default function TenantOwnerStaffRoute() {
  return (
    <DashboardGate roleKey="tenant-owner" bare>
      <TenantOwnerShell>
        <TenantOwnerStaffPage />
      </TenantOwnerShell>
    </DashboardGate>
  )
}
