import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { ResidentPropertiesPage } from "@/components/dashboard/resident-pages"
import { ResidentShell } from "@/components/dashboard/resident-shell"

export default function ResidentPropertiesRoute() {
  return (
    <DashboardGate roleKey="resident" bare>
      <ResidentShell>
        <ResidentPropertiesPage />
      </ResidentShell>
    </DashboardGate>
  )
}
