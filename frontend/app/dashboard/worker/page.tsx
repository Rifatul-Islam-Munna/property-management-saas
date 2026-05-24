import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { WorkerDashboard } from "@/components/dashboard/worker-dashboard"

export default function WorkerDashboardPage() {
  return (
    <DashboardGate roleKey="worker">
      <WorkerDashboard />
    </DashboardGate>
  )
}
