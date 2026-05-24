import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { RolePlaceholder } from "@/components/dashboard/role-placeholder"

export default function ResidentDashboardPage() {
  return (
    <DashboardGate roleKey="resident">
      <RolePlaceholder
        title="Resident workspace"
        body="Shell ready for renter and guest. Next pages can plug in rent status, notices, tickets, docs."
      />
    </DashboardGate>
  )
}
