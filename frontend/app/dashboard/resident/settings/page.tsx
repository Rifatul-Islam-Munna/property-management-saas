import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { ResidentSettingsPage } from "@/components/dashboard/resident-pages"
import { ResidentShell } from "@/components/dashboard/resident-shell"

export default function ResidentSettingsRoute() {
  return (
    <DashboardGate roleKey="resident" bare>
      <ResidentShell>
        <ResidentSettingsPage />
      </ResidentShell>
    </DashboardGate>
  )
}
