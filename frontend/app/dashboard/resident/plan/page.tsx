import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { ResidentShell } from "@/components/dashboard/resident-shell"
import { PlanListPage } from "@/components/plan/plan-list-page"

export default function ResidentPlanRoute() {
  return (
    <DashboardGate roleKey="resident" bare>
      <ResidentShell>
        <PlanListPage roleTitle="Resident" roleBasePath="/dashboard/resident/plan" />
      </ResidentShell>
    </DashboardGate>
  )
}
