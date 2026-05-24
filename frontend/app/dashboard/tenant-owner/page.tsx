import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { TenantOwnerDashboardBlock } from "@/components/dashboard/tenant-owner-dashboard-block"

export default function TenantOwnerDashboardPage() {
  return (
    <DashboardGate roleKey="tenant-owner" bare>
      <TenantOwnerDashboardBlock />
    </DashboardGate>
  )
}
