import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { ResidentUsersPage } from "@/components/dashboard/resident-pages"
import { ResidentShell } from "@/components/dashboard/resident-shell"

export default function ResidentUsersRoute() {
  return (
    <DashboardGate roleKey="resident" bare>
      <ResidentShell>
        <ResidentUsersPage />
      </ResidentShell>
    </DashboardGate>
  )
}
