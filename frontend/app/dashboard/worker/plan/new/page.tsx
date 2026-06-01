import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { WorkerShell } from "@/components/dashboard/worker-shell"
import { PlanEditorPage } from "@/components/plan/plan-editor-page"

export default function WorkerNewPlanRoute() {
  return (
    <DashboardGate roleKey="worker" bare>
      <WorkerShell>
        <PlanEditorPage roleTitle="Worker" roleBasePath="/dashboard/worker/plan" />
      </WorkerShell>
    </DashboardGate>
  )
}
