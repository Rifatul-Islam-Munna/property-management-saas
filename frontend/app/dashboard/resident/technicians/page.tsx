import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { ResidentTechniciansPage } from "@/components/dashboard/resident-pages"
import { ResidentShell } from "@/components/dashboard/resident-shell"

export default function ResidentTechniciansRoute() {
  return (
    <DashboardGate roleKey="resident" bare>
      <ResidentShell>
        <ResidentTechniciansPage />
      </ResidentShell>
    </DashboardGate>
  )
}
