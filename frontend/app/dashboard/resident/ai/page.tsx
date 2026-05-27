import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { ResidentAiPage } from "@/components/dashboard/resident-ai-page"
import { ResidentShell } from "@/components/dashboard/resident-shell"

export default function ResidentAiRoute() {
  return (
    <DashboardGate roleKey="resident" bare>
      <ResidentShell>
        <ResidentAiPage />
      </ResidentShell>
    </DashboardGate>
  )
}
