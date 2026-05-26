import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { ResidentTenantsPage } from "@/components/dashboard/resident-pages"
import { ResidentShell } from "@/components/dashboard/resident-shell"

export default function ResidentTenantsRoute() {
  return (
    <DashboardGate roleKey="resident" bare>
      <ResidentShell>
        <ResidentTenantsPage />
      </ResidentShell>
    </DashboardGate>
  )
}
