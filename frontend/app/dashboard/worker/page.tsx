import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { WorkerDashboardBlock } from "@/components/dashboard/worker-dashboard-block"

export default function WorkerDashboardPage() {
  return (
    <DashboardGate roleKey="worker" bare>
      <WorkerDashboardBlock />
    </DashboardGate>
  )
}
