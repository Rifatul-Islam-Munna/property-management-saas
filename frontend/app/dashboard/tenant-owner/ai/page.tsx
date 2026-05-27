import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { TenantOwnerAiPage } from "@/components/dashboard/tenant-owner-ai-page"
import { TenantOwnerShell } from "@/components/dashboard/tenant-owner-shell"

export default function TenantOwnerAiRoute() {
  return (
    <DashboardGate roleKey="tenant-owner" bare>
      <TenantOwnerShell>
        <TenantOwnerAiPage />
      </TenantOwnerShell>
    </DashboardGate>
  )
}
