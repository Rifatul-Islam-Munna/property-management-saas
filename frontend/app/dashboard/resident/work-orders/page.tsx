import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { ResidentWorkOrdersPage } from "@/components/dashboard/resident-pages"
import { ResidentShell } from "@/components/dashboard/resident-shell"

export default function ResidentWorkOrdersRoute() {
  return (
    <DashboardGate roleKey="resident" bare>
      <ResidentShell>
        <ResidentWorkOrdersPage />
      </ResidentShell>
    </DashboardGate>
  )
}
