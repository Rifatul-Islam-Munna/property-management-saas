import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { ResidentBillingPage } from "@/components/dashboard/resident-pages"
import { ResidentShell } from "@/components/dashboard/resident-shell"

export default function ResidentBillingRoute() {
  return (
    <DashboardGate roleKey="resident" bare>
      <ResidentShell>
        <ResidentBillingPage />
      </ResidentShell>
    </DashboardGate>
  )
}
