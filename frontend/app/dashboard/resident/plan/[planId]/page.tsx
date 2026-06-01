import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { ResidentShell } from "@/components/dashboard/resident-shell"
import { PlanEditorPage } from "@/components/plan/plan-editor-page"

export default async function ResidentPlanDetailRoute({
  params,
}: {
  params: Promise<{ planId: string }>
}) {
  const { planId } = await params

  return (
    <DashboardGate roleKey="resident" bare>
      <ResidentShell>
        <PlanEditorPage roleTitle="Resident" roleBasePath="/dashboard/resident/plan" planId={planId} />
      </ResidentShell>
    </DashboardGate>
  )
}
