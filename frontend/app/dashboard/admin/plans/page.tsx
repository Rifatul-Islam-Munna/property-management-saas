import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { AdminShell } from "@/components/dashboard/admin-shell"
import { AdminPlansPage } from "@/components/dashboard/admin-pages"

export default function AdminPlansRoute() {
  return (
    <DashboardGate roleKey="admin" bare>
      <AdminShell>
        <AdminPlansPage />
      </AdminShell>
    </DashboardGate>
  )
}
