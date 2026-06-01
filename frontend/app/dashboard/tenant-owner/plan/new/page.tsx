import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { TenantOwnerShell } from "@/components/dashboard/tenant-owner-shell"
import { PlanEditorPage } from "@/components/plan/plan-editor-page"

export default function TenantOwnerNewPlanRoute() {
  return (
    <DashboardGate roleKey="tenant-owner" bare>
      <TenantOwnerShell>
        <PlanEditorPage roleTitle="Tenant owner" roleBasePath="/dashboard/tenant-owner/plan" />
      </TenantOwnerShell>
    </DashboardGate>
  )
}
