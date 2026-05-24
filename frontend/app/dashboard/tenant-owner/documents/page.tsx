import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { TenantOwnerDocumentsPage } from "@/components/dashboard/tenant-owner-pages"
import { TenantOwnerShell } from "@/components/dashboard/tenant-owner-shell"

export default function TenantOwnerDocumentsRoute() {
  return (
    <DashboardGate roleKey="tenant-owner" bare>
      <TenantOwnerShell>
        <TenantOwnerDocumentsPage />
      </TenantOwnerShell>
    </DashboardGate>
  )
}
