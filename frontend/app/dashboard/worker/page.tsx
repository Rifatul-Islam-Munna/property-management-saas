import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { RolePlaceholder } from "@/components/dashboard/role-placeholder"

export default function WorkerDashboardPage() {
  return (
    <DashboardGate roleKey="worker">
      <RolePlaceholder
        title="Worker workspace"
        body="Shell ready. Next pages can plug in assigned tickets, work orders, schedule, property links."
      />
    </DashboardGate>
  )
}
