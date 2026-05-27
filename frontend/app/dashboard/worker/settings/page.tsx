import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { WorkerSettingsPage } from "@/components/dashboard/worker-pages"
import { WorkerShell } from "@/components/dashboard/worker-shell"

export default function WorkerSettingsRoute() {
  return (
    <DashboardGate roleKey="worker" bare>
      <WorkerShell>
        <WorkerSettingsPage />
      </WorkerShell>
    </DashboardGate>
  )
}
