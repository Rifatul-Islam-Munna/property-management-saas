import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { WorkerTicketsPage } from "@/components/dashboard/worker-pages"
import { WorkerShell } from "@/components/dashboard/worker-shell"

export default function WorkerTicketsRoute() {
  return (
    <DashboardGate roleKey="worker" bare>
      <WorkerShell>
        <WorkerTicketsPage />
      </WorkerShell>
    </DashboardGate>
  )
}
