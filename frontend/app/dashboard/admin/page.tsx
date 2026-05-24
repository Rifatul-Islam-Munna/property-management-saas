import { AdminDashboardBlock } from "@/components/dashboard/admin-dashboard-block"
import { DashboardGate } from "@/components/dashboard/dashboard-gate"

export default function AdminDashboardPage() {
  return (
    <DashboardGate roleKey="admin" bare>
      <AdminDashboardBlock />
    </DashboardGate>
  )
}
