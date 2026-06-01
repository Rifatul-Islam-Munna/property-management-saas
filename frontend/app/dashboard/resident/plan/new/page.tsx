import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { ResidentShell } from "@/components/dashboard/resident-shell"
import { PlanEditorPage } from "@/components/plan/plan-editor-page"

export default function ResidentNewPlanRoute() {
  return (
    <DashboardGate roleKey="resident" bare>
      <ResidentShell>
        <PlanEditorPage roleTitle="Resident" roleBasePath="/dashboard/resident/plan" />
      </ResidentShell>
    </DashboardGate>
  )
}
