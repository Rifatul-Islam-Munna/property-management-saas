import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { ResidentNoticesPage } from "@/components/dashboard/resident-pages"
import { ResidentShell } from "@/components/dashboard/resident-shell"

export default function ResidentNoticesRoute() {
  return (
    <DashboardGate roleKey="resident" bare>
      <ResidentShell>
        <ResidentNoticesPage />
      </ResidentShell>
    </DashboardGate>
  )
}
