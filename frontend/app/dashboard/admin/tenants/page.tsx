import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { AdminShell } from "@/components/dashboard/admin-shell"
import { AdminTenantsPage } from "@/components/dashboard/admin-pages"

export default function AdminTenantsRoute() {
  return (
    <DashboardGate roleKey="admin" bare>
      <AdminShell>
        <AdminTenantsPage />
      </AdminShell>
    </DashboardGate>
  )
}
