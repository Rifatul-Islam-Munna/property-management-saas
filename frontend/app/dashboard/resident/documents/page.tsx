import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { ResidentDocumentsPage } from "@/components/dashboard/resident-pages"
import { ResidentShell } from "@/components/dashboard/resident-shell"

export default function ResidentDocumentsRoute() {
  return (
    <DashboardGate roleKey="resident" bare>
      <ResidentShell>
        <ResidentDocumentsPage />
      </ResidentShell>
    </DashboardGate>
  )
}
