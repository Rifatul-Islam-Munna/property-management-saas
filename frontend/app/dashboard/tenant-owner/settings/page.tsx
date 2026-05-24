import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { TenantOwnerSettingsPage } from "@/components/dashboard/tenant-owner-pages"
import { TenantOwnerShell } from "@/components/dashboard/tenant-owner-shell"

export default function TenantOwnerSettingsRoute() {
  return (
    <DashboardGate roleKey="tenant-owner" bare>
      <TenantOwnerShell>
        <TenantOwnerSettingsPage />
      </TenantOwnerShell>
    </DashboardGate>
  )
}
