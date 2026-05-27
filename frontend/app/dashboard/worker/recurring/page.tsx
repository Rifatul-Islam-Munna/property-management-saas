import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { WorkerRecurringPage } from "@/components/dashboard/worker-pages"
import { WorkerShell } from "@/components/dashboard/worker-shell"

export default function WorkerRecurringRoute() {
  return (
    <DashboardGate roleKey="worker" bare>
      <WorkerShell>
        <WorkerRecurringPage />
      </WorkerShell>
    </DashboardGate>
  )
}
