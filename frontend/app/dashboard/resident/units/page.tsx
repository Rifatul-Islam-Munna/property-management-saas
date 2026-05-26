import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { ResidentUnitsPage } from "@/components/dashboard/resident-pages"
import { ResidentShell } from "@/components/dashboard/resident-shell"

export default function ResidentUnitsRoute() {
  return (
    <DashboardGate roleKey="resident" bare>
      <ResidentShell>
        <ResidentUnitsPage />
      </ResidentShell>
    </DashboardGate>
  )
}
