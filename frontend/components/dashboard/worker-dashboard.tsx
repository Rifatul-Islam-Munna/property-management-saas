"use client"

import { useState } from "react"
import { ClipboardCheck, Repeat } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { UploadCollectionField } from "@/components/shared/upload-collection-field"
import { DashboardTableSkeleton, WithBone } from "@/components/dashboard/dashboard-loading"
import {
  useWorkerSubmitInspectionReportMutation,
  useWorkerSubmitRecurringReportMutation,
} from "@/hooks/use-owner-actions"
import {
  useWorkerInspectionsQuery,
  useWorkerRecurringMaintenancesQuery,
} from "@/hooks/use-owner-dashboard"

export function WorkerDashboard() {
  const inspections = useWorkerInspectionsQuery()
  const recurring = useWorkerRecurringMaintenancesQuery()
  const submitInspectionReport = useWorkerSubmitInspectionReportMutation()
  const submitRecurringReport = useWorkerSubmitRecurringReportMutation()
  const inspectionList = Array.isArray(inspections.data) ? inspections.data : []
  const recurringList = Array.isArray(recurring.data) ? recurring.data : []
  const [inspectionNotes, setInspectionNotes] = useState<Record<string, string>>({})
  const [inspectionDamage, setInspectionDamage] = useState<Record<string, string>>({})
  const [inspectionFiles, setInspectionFiles] = useState<Record<string, string[]>>({})
  const [recurringNotes, setRecurringNotes] = useState<Record<string, string>>({})
  const [recurringFiles, setRecurringFiles] = useState<Record<string, string[]>>({})

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-background p-5">
        <Badge variant="outline">Worker reporting</Badge>
        <h1 className="mt-3 text-2xl font-semibold text-slate-950">Assigned inspections and recurring work</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">When owner assigns inspection or recurring maintenance, worker submits report from here.</p>
      </section>

      <WithBone name="worker-inspections" loading={inspections.isLoading} fallback={<DashboardTableSkeleton />}>
        <Card className="shadow-none" id="overview">
          <CardHeader>
            <CardTitle>Assigned inspections</CardTitle>
            <CardDescription>Submit condition report, damage notes, files, and mark complete.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {inspectionList.length ? inspectionList.map((item) => (
              <div key={item._id} className="rounded-xl border p-4">
                <div className="flex flex-wrap gap-2">
                  <p className="font-medium text-slate-950">{item.type}</p>
                  <Badge variant={item.completed ? "default" : "outline"}>{item.completed ? "Done" : "Pending"}</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-600">{item.scheduledAt ? new Date(item.scheduledAt).toLocaleDateString() : "No date"}</p>
                <form
                  className="mt-4 space-y-4"
                  onSubmit={(event) => {
                    event.preventDefault()
                    submitInspectionReport.mutate({
                      id: item._id,
                      workerReport: inspectionNotes[item._id] ?? "",
                      damageReport: inspectionDamage[item._id] ?? "",
                      workerReportFiles: inspectionFiles[item._id] ?? [],
                      completed: true,
                    })
                  }}
                >
                  <FieldGroup>
                    <Field><FieldLabel>Worker report</FieldLabel><Textarea value={inspectionNotes[item._id] ?? ""} onChange={(event) => setInspectionNotes((current) => ({ ...current, [item._id]: event.target.value ?? "" }))} /></Field>
                    <Field><FieldLabel>Damage report (Optional)</FieldLabel><Textarea value={inspectionDamage[item._id] ?? ""} onChange={(event) => setInspectionDamage((current) => ({ ...current, [item._id]: event.target.value ?? "" }))} /></Field>
                    <UploadCollectionField label="Report files" accept="image/*,.pdf,.doc,.docx" kind="file" values={inspectionFiles[item._id] ?? []} onChange={(values) => setInspectionFiles((current) => ({ ...current, [item._id]: values }))} />
                  </FieldGroup>
                  <Button type="submit" disabled={submitInspectionReport.isPending}>Submit inspection report</Button>
                </form>
              </div>
            )) : <Empty><EmptyHeader><EmptyMedia variant="icon"><ClipboardCheck /></EmptyMedia><EmptyTitle>No assigned inspections</EmptyTitle><EmptyDescription>Owner-assigned inspections will show here.</EmptyDescription></EmptyHeader></Empty>}
          </CardContent>
        </Card>
      </WithBone>

      <WithBone name="worker-recurring" loading={recurring.isLoading} fallback={<DashboardTableSkeleton />}>
        <Card className="shadow-none" id="work">
          <CardHeader>
            <CardTitle>Recurring maintenance</CardTitle>
            <CardDescription>Submit run report each time recurring task done.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recurringList.length ? recurringList.map((item) => (
              <div key={item._id} className="rounded-xl border p-4">
                <div className="flex flex-wrap gap-2">
                  <p className="font-medium text-slate-950">{item.title}</p>
                  <Badge variant="outline">{item.frequency}</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-600">{item.description ?? "No description"}</p>
                <form
                  className="mt-4 space-y-4"
                  onSubmit={(event) => {
                    event.preventDefault()
                    submitRecurringReport.mutate({
                      id: item._id,
                      status: "completed",
                      note: recurringNotes[item._id] ?? "",
                      files: recurringFiles[item._id] ?? [],
                    })
                  }}
                >
                  <FieldGroup>
                    <Field><FieldLabel>Run report</FieldLabel><Textarea value={recurringNotes[item._id] ?? ""} onChange={(event) => setRecurringNotes((current) => ({ ...current, [item._id]: event.target.value ?? "" }))} /></Field>
                    <UploadCollectionField label="Run files" accept="image/*,.pdf,.doc,.docx" kind="file" values={recurringFiles[item._id] ?? []} onChange={(values) => setRecurringFiles((current) => ({ ...current, [item._id]: values }))} />
                  </FieldGroup>
                  <Button type="submit" disabled={submitRecurringReport.isPending}>Submit recurring report</Button>
                </form>
              </div>
            )) : <Empty><EmptyHeader><EmptyMedia variant="icon"><Repeat /></EmptyMedia><EmptyTitle>No recurring tasks</EmptyTitle><EmptyDescription>Owner-assigned recurring work will show here.</EmptyDescription></EmptyHeader></Empty>}
          </CardContent>
        </Card>
      </WithBone>
    </div>
  )
}
