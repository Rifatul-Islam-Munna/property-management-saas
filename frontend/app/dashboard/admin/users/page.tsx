import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { AdminShell } from "@/components/dashboard/admin-shell"
import { AdminUsersPage } from "@/components/dashboard/admin-pages"

export default function AdminUsersRoute() {
  return (
    <DashboardGate roleKey="admin" bare>
      <AdminShell>
        <AdminUsersPage />
      </AdminShell>
    </DashboardGate>
  )
}
