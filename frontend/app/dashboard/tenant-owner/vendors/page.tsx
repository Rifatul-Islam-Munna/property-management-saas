import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { TenantOwnerShell } from "@/components/dashboard/tenant-owner-shell"
import { TenantOwnerVendorsPage } from "@/components/dashboard/tenant-owner-pages"

export default function TenantOwnerVendorsRoute() {
  return (
    <DashboardGate roleKey="tenant-owner" bare>
      <TenantOwnerShell>
        <TenantOwnerVendorsPage />
      </TenantOwnerShell>
    </DashboardGate>
  )
}
