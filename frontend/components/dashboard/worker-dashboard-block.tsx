"use client"

import { WorkerOverviewPage } from "@/components/dashboard/worker-pages"
import { WorkerShell } from "@/components/dashboard/worker-shell"

export function WorkerDashboardBlock() {
  return (
    <WorkerShell>
      <WorkerOverviewPage />
    </WorkerShell>
  )
}
