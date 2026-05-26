import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { ResidentDashboardBlock } from "@/components/dashboard/resident-dashboard-block"

export default function ResidentDashboardPage() {
  return (
    <DashboardGate roleKey="resident" bare>
      <ResidentDashboardBlock />
    </DashboardGate>
  )
}
