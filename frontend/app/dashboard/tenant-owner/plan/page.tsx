import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { TenantOwnerShell } from "@/components/dashboard/tenant-owner-shell"
import { PlanListPage } from "@/components/plan/plan-list-page"

export default function TenantOwnerPlanRoute() {
  return (
    <DashboardGate roleKey="tenant-owner" bare>
      <TenantOwnerShell>
        <PlanListPage roleTitle="Tenant owner" roleBasePath="/dashboard/tenant-owner/plan" />
      </TenantOwnerShell>
    </DashboardGate>
  )
}
