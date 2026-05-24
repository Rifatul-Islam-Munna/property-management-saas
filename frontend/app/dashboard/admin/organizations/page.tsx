import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { AdminShell } from "@/components/dashboard/admin-shell"
import { AdminOrganizationsPage } from "@/components/dashboard/admin-pages"

export default function AdminOrganizationsRoute() {
  return (
    <DashboardGate roleKey="admin" bare>
      <AdminShell>
        <AdminOrganizationsPage />
      </AdminShell>
    </DashboardGate>
  )
}
