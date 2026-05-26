import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { ResidentVendorsPage } from "@/components/dashboard/resident-pages"
import { ResidentShell } from "@/components/dashboard/resident-shell"

export default function ResidentVendorsRoute() {
  return (
    <DashboardGate roleKey="resident" bare>
      <ResidentShell>
        <ResidentVendorsPage />
      </ResidentShell>
    </DashboardGate>
  )
}
