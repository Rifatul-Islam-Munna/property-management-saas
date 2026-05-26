import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { ResidentInspectionsPage } from "@/components/dashboard/resident-pages"
import { ResidentShell } from "@/components/dashboard/resident-shell"

export default function ResidentInspectionsRoute() {
  return (
    <DashboardGate roleKey="resident" bare>
      <ResidentShell>
        <ResidentInspectionsPage />
      </ResidentShell>
    </DashboardGate>
  )
}
