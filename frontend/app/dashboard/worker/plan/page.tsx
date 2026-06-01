import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { WorkerShell } from "@/components/dashboard/worker-shell"
import { PlanListPage } from "@/components/plan/plan-list-page"

export default function WorkerPlanRoute() {
  return (
    <DashboardGate roleKey="worker" bare>
      <WorkerShell>
        <PlanListPage roleTitle="Worker" roleBasePath="/dashboard/worker/plan" />
      </WorkerShell>
    </DashboardGate>
  )
}
