import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { WorkerMessagesPage } from "@/components/dashboard/worker-pages"
import { WorkerShell } from "@/components/dashboard/worker-shell"

export default function WorkerMessagesRoute() {
  return (
    <DashboardGate roleKey="worker" bare>
      <WorkerShell>
        <WorkerMessagesPage />
      </WorkerShell>
    </DashboardGate>
  )
}
