import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { ResidentTicketsPage } from "@/components/dashboard/resident-pages"
import { ResidentShell } from "@/components/dashboard/resident-shell"

export default function ResidentTicketsRoute() {
  return (
    <DashboardGate roleKey="resident" bare>
      <ResidentShell>
        <ResidentTicketsPage />
      </ResidentShell>
    </DashboardGate>
  )
}
