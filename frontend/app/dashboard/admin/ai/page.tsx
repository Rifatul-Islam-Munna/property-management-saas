import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { AdminAiPage } from "@/components/dashboard/admin-ai-page"
import { AdminShell } from "@/components/dashboard/admin-shell"

export default function AdminAiRoute() {
  return (
    <DashboardGate roleKey="admin" bare>
      <AdminShell>
        <AdminAiPage />
      </AdminShell>
    </DashboardGate>
  )
}
