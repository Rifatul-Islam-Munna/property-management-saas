import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { WorkerInspectionsPage } from "@/components/dashboard/worker-pages"
import { WorkerShell } from "@/components/dashboard/worker-shell"

export default function WorkerInspectionsRoute() {
  return (
    <DashboardGate roleKey="worker" bare>
      <WorkerShell>
        <WorkerInspectionsPage />
      </WorkerShell>
    </DashboardGate>
  )
}
