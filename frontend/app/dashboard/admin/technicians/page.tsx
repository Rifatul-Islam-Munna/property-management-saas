import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { AdminShell } from "@/components/dashboard/admin-shell"
import { AdminTechniciansPage } from "@/components/dashboard/admin-pages"

export default function AdminTechniciansRoute() {
  return (
    <DashboardGate roleKey="admin" bare>
      <AdminShell>
        <AdminTechniciansPage />
      </AdminShell>
    </DashboardGate>
  )
}
