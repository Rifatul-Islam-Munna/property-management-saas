import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { AdminShell } from "@/components/dashboard/admin-shell"
import { AdminPropertiesPage } from "@/components/dashboard/admin-pages"

export default function AdminPropertiesRoute() {
  return (
    <DashboardGate roleKey="admin" bare>
      <AdminShell>
        <AdminPropertiesPage />
      </AdminShell>
    </DashboardGate>
  )
}
