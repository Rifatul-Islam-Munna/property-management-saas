import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { ResidentRecurringPage } from "@/components/dashboard/resident-pages"
import { ResidentShell } from "@/components/dashboard/resident-shell"

export default function ResidentRecurringRoute() {
  return (
    <DashboardGate roleKey="resident" bare>
      <ResidentShell>
        <ResidentRecurringPage />
      </ResidentShell>
    </DashboardGate>
  )
}
