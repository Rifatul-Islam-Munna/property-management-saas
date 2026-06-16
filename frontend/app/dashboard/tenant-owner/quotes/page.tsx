import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { TenantOwnerVendorQuotesPage } from "@/components/dashboard/tenant-owner-pages"
import { TenantOwnerShell } from "@/components/dashboard/tenant-owner-shell"

export default function TenantOwnerQuotesRoute() {
  return (
    <DashboardGate roleKey="tenant-owner" bare>
      <TenantOwnerShell>
        <TenantOwnerVendorQuotesPage />
      </TenantOwnerShell>
    </DashboardGate>
  )
}
