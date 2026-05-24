import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { AdminShell } from "@/components/dashboard/admin-shell"
import { AdminSubscriptionsPage } from "@/components/dashboard/admin-pages"

export default function AdminSubscriptionsRoute() {
  return (
    <DashboardGate roleKey="admin" bare>
      <AdminShell>
        <AdminSubscriptionsPage />
      </AdminShell>
    </DashboardGate>
  )
}
