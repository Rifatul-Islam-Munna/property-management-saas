"use client"

import { useMemo, useState } from "react"
import {
  AlarmClock,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  MessageSquare,
  Repeat,
  Ticket,
  Wrench,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { UploadCollectionField } from "@/components/shared/upload-collection-field"
import {
  DashboardCardSkeleton,
  DashboardPanelSkeleton,
  DashboardTableSkeleton,
  WithBone,
} from "@/components/dashboard/dashboard-loading"
import { useMeQuery } from "@/hooks/use-auth"
import {
  useWorkerAddTicketNoteMutation,
  useWorkerSendMessageMutation,
  useWorkerSubmitInspectionReportMutation,
  useWorkerSubmitRecurringReportMutation,
  useWorkerUpdateTicketMutation,
  useWorkerUpdateWorkOrderMutation,
} from "@/hooks/use-worker-actions"
import {
  useWorkerInspectionsQuery,
  useWorkerMessagesQuery,
  useWorkerRecurringMaintenancesQuery,
  useWorkerTicketsQuery,
  useWorkerWorkOrdersQuery,
} from "@/hooks/use-worker-dashboard"

function MetricCard({ title, value, note }: { title: string; value: string | number; note: string }) {
  return (
    <Card className="overflow-hidden border-slate-200 bg-white/90 shadow-none">
      <CardContent className="space-y-1 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</p>
        <p className="text-2xl font-semibold text-slate-950">{value}</p>
        <p className="text-xs text-slate-600">{note}</p>
      </CardContent>
    </Card>
  )
}

function formatDate(value?: string | null) {
  if (!value) return "No date"
  return new Date(value).toLocaleDateString()
}

export function WorkerDashboard() {
  const { data: me } = useMeQuery()
  const tickets = useWorkerTicketsQuery()
  const workOrders = useWorkerWorkOrdersQuery()
  const inspections = useWorkerInspectionsQuery()
  const recurring = useWorkerRecurringMaintenancesQuery()
  const messages = useWorkerMessagesQuery()
  const updateWorkOrder = useWorkerUpdateWorkOrderMutation()
  const updateTicket = useWorkerUpdateTicketMutation()
  const addTicketNote = useWorkerAddTicketNoteMutation()
  const sendMessage = useWorkerSendMessageMutation()
  const submitInspectionReport = useWorkerSubmitInspectionReportMutation()
  const submitRecurringReport = useWorkerSubmitRecurringReportMutation()
  const ticketList = Array.isArray(tickets.data) ? tickets.data : []
  const workOrderList = Array.isArray(workOrders.data) ? workOrders.data : []
  const inspectionList = Array.isArray(inspections.data) ? inspections.data : []
  const recurringList = Array.isArray(recurring.data) ? recurring.data : []
  const messageList = Array.isArray(messages.data) ? messages.data : []
  const [inspectionNotes, setInspectionNotes] = useState<Record<string, string>>({})
  const [inspectionDamage, setInspectionDamage] = useState<Record<string, string>>({})
  const [inspectionFiles, setInspectionFiles] = useState<Record<string, string[]>>({})
  const [recurringNotes, setRecurringNotes] = useState<Record<string, string>>({})
  const [recurringFiles, setRecurringFiles] = useState<Record<string, string[]>>({})
  const [workOrderStatus, setWorkOrderStatus] = useState<Record<string, string>>({})
  const [workOrderNotes, setWorkOrderNotes] = useState<Record<string, string>>({})
  const [workOrderFiles, setWorkOrderFiles] = useState<Record<string, string[]>>({})
  const [ticketStatus, setTicketStatus] = useState<Record<string, string>>({})
  const [ticketCosts, setTicketCosts] = useState<Record<string, string>>({})
  const [ticketNotes, setTicketNotes] = useState<Record<string, string>>({})
  const [messageDrafts, setMessageDrafts] = useState<Record<string, string>>({})

  const loading =
    me === undefined ||
    tickets.isLoading ||
    workOrders.isLoading ||
    inspections.isLoading ||
    recurring.isLoading ||
    messages.isLoading

  const urgentTickets = useMemo(
    () => ticketList.filter((item) => item.priority === "emergency" || item.priority === "high"),
    [ticketList]
  )
  const dueSoonWorkOrders = useMemo(
    () => workOrderList.filter((item) => item.status !== "completed").slice(0, 3),
    [workOrderList]
  )
  const unreadMessages = useMemo(
    () => messageList.filter((item) => !item.readBy?.includes(me?.id ?? "")),
    [me?.id, messageList]
  )
  const documentMessages = useMemo(
    () => messageList.filter((item) => item.kind === "document").slice(0, 4),
    [messageList]
  )
  const replyThreads = useMemo(() => {
    const seen = new Set<string>()
    return messageList.filter((item) => {
      const roomKey = item.roomId ?? item._id
      if (seen.has(roomKey)) return false
      seen.add(roomKey)
      return true
    }).slice(0, 4)
  }, [messageList])

  return (
    <div className="space-y-5 pb-24">
      <WithBone name="worker-overview" loading={loading} fallback={<DashboardPanelSkeleton />}>
        <section
          id="overview"
          className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_38%),linear-gradient(145deg,_#0f172a_0%,_#1e293b_52%,_#0f766e_100%)] p-5 text-white shadow-[0_20px_80px_-40px_rgba(15,23,42,0.8)]"
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">Field mode</Badge>
                <h1 className="max-w-xl text-3xl font-semibold tracking-tight">Fast worker board for phone-first job updates.</h1>
                <p className="max-w-lg text-sm leading-6 text-slate-200">
                  Open job, snap proof, send note, move next. Built for workers on site, not desk.
                </p>
              </div>
              <div className="min-w-[10rem] rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-200">Worker</p>
                <p className="mt-2 text-lg font-semibold">{me?.fullName ?? "Worker"}</p>
                <p className="text-sm text-slate-200">{me?.jobTitle ?? "Field team"}</p>
                <p className="mt-3 text-xs text-slate-300">{me?.propertyIds?.length ?? 0} linked properties</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur"><p className="text-xs uppercase tracking-[0.18em] text-slate-200">Tickets</p><p className="mt-2 text-2xl font-semibold">{ticketList.length}</p></div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur"><p className="text-xs uppercase tracking-[0.18em] text-slate-200">Work orders</p><p className="mt-2 text-2xl font-semibold">{workOrderList.length}</p></div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur"><p className="text-xs uppercase tracking-[0.18em] text-slate-200">Inspections</p><p className="mt-2 text-2xl font-semibold">{inspectionList.filter((item) => !item.completed).length}</p></div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur"><p className="text-xs uppercase tracking-[0.18em] text-slate-200">Unread</p><p className="mt-2 text-2xl font-semibold">{unreadMessages.length}</p></div>
            </div>
          </div>
        </section>
      </WithBone>

      <WithBone
        name="worker-metrics"
        loading={loading}
        fallback={<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <DashboardCardSkeleton key={index} />)}</div>}
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Urgent now" value={urgentTickets.length} note="High + emergency tickets" />
          <MetricCard title="Due next" value={dueSoonWorkOrders.length} note="Top jobs needing movement" />
          <MetricCard title="Reports pending" value={inspectionList.filter((item) => !item.completed).length + recurringList.length} note="Inspection + recurring updates" />
          <MetricCard title="Files shared" value={documentMessages.length} note="Recent owner documents" />
        </div>
      </WithBone>

      <section id="queue" className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden border-slate-200 bg-white shadow-none">
          <CardHeader>
            <CardTitle>Assigned tickets</CardTitle>
            <CardDescription>Big touch targets. Move status fast, drop cost, save note.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {ticketList.length ? ticketList.map((item) => (
              <div key={item._id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{item.category ?? "general"}</Badge>
                      <Badge variant={item.priority === "emergency" || item.priority === "high" ? "destructive" : "secondary"}>{item.priority}</Badge>
                      <Badge>{item.status}</Badge>
                    </div>
                    <p className="mt-3 text-base font-semibold text-slate-950">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{item.description ?? "No details"}</p>
                  </div>
                  <div className="rounded-2xl bg-white px-3 py-2 text-right">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Opened</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">{formatDate(item.createdAt)}</p>
                  </div>
                </div>

                <form
                  className="mt-4 grid gap-3"
                  onSubmit={(event) => {
                    event.preventDefault()
                    updateTicket.mutate({
                      id: item._id,
                      status: ticketStatus[item._id] ?? item.status,
                      actualCost: ticketCosts[item._id] ? Number(ticketCosts[item._id]) : undefined,
                    })
                  }}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field>
                      <FieldLabel>Status</FieldLabel>
                      <Select value={ticketStatus[item._id] ?? item.status} onValueChange={(value) => setTicketStatus((current) => ({ ...current, [item._id]: value ?? item.status }))}>
                        <SelectTrigger className="h-11 w-full rounded-xl bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {["assigned", "in_progress", "waiting_parts", "completed", "escalated"].map((status) => (
                              <SelectItem key={status} value={status}>{status}</SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field>
                      <FieldLabel>Actual cost</FieldLabel>
                      <Input className="h-11 rounded-xl bg-white" inputMode="decimal" placeholder="0" value={ticketCosts[item._id] ?? ""} onChange={(event) => setTicketCosts((current) => ({ ...current, [item._id]: event.target.value ?? "" }))} />
                    </Field>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" className="min-h-11 rounded-xl" disabled={updateTicket.isPending}>Save ticket</Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-11 rounded-xl"
                      disabled={addTicketNote.isPending || !(ticketNotes[item._id] ?? "").trim()}
                      onClick={() => addTicketNote.mutate({ id: item._id, content: ticketNotes[item._id] ?? "" })}
                    >
                      Save internal note
                    </Button>
                  </div>
                  <Field>
                    <FieldLabel>Worker note</FieldLabel>
                    <Textarea className="min-h-24 rounded-2xl bg-white" value={ticketNotes[item._id] ?? ""} onChange={(event) => setTicketNotes((current) => ({ ...current, [item._id]: event.target.value ?? "" }))} placeholder="Need parts, access blocked, work done, follow-up..." />
                  </Field>
                </form>
              </div>
            )) : <Empty><EmptyHeader><EmptyMedia variant="icon"><Ticket /></EmptyMedia><EmptyTitle>No assigned tickets</EmptyTitle><EmptyDescription>Owner-assigned ticket work show here.</EmptyDescription></EmptyHeader></Empty>}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-slate-200 bg-white shadow-none">
          <CardHeader>
            <CardTitle>Work orders</CardTitle>
            <CardDescription>One-thumb progress update with proof files.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {workOrderList.length ? workOrderList.map((item) => (
              <div key={item._id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{item.priority ?? "medium"}</Badge>
                      <Badge>{item.status}</Badge>
                    </div>
                    <p className="mt-3 text-base font-semibold text-slate-950">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{item.description ?? "No details"}</p>
                  </div>
                  <div className="rounded-2xl bg-white px-3 py-2 text-right">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Due</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">{formatDate(item.dueDate ?? item.scheduledDate)}</p>
                  </div>
                </div>
                <form
                  className="mt-4 space-y-4"
                  onSubmit={(event) => {
                    event.preventDefault()
                    updateWorkOrder.mutate({
                      id: item._id,
                      status: workOrderStatus[item._id] ?? item.status,
                      completionNotes: workOrderNotes[item._id] ?? "",
                      completionProof: workOrderFiles[item._id] ?? [],
                    })
                  }}
                >
                  <FieldGroup>
                    <Field>
                      <FieldLabel>Status</FieldLabel>
                      <Select value={workOrderStatus[item._id] ?? item.status} onValueChange={(value) => setWorkOrderStatus((current) => ({ ...current, [item._id]: value ?? item.status }))}>
                        <SelectTrigger className="h-11 w-full rounded-xl bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {["open", "scheduled", "in_progress", "completed", "cancelled"].map((status) => (
                              <SelectItem key={status} value={status}>{status}</SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field><FieldLabel>Completion note</FieldLabel><Textarea className="min-h-24 rounded-2xl bg-white" value={workOrderNotes[item._id] ?? item.completionNotes ?? ""} onChange={(event) => setWorkOrderNotes((current) => ({ ...current, [item._id]: event.target.value ?? "" }))} /></Field>
                    <UploadCollectionField label="Proof files" accept="image/*,.pdf,.doc,.docx" kind="file" values={workOrderFiles[item._id] ?? item.completionProof ?? []} onChange={(values) => setWorkOrderFiles((current) => ({ ...current, [item._id]: values }))} />
                  </FieldGroup>
                  <Button type="submit" className="min-h-11 rounded-xl" disabled={updateWorkOrder.isPending}>Save work order</Button>
                </form>
              </div>
            )) : <Empty><EmptyHeader><EmptyMedia variant="icon"><BriefcaseBusiness /></EmptyMedia><EmptyTitle>No work orders</EmptyTitle><EmptyDescription>Assigned work orders show here.</EmptyDescription></EmptyHeader></Empty>}
          </CardContent>
        </Card>
      </section>

      <div id="updates" className="grid gap-4 xl:grid-cols-2">
        <WithBone name="worker-inspections" loading={inspections.isLoading} fallback={<DashboardTableSkeleton />}>
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Inspections</CardTitle>
              <CardDescription>Submit condition report, damage notes, files, mark done.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {inspectionList.length ? inspectionList.map((item) => (
                <div key={item._id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{item.type}</Badge>
                    <Badge variant={item.completed ? "default" : "secondary"}>{item.completed ? "done" : "pending"}</Badge>
                  </div>
                  <p className="mt-3 text-base font-semibold text-slate-950">{formatDate(item.scheduledAt)}</p>
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
                      <Field><FieldLabel>Worker report</FieldLabel><Textarea className="min-h-24 rounded-2xl bg-slate-50" value={inspectionNotes[item._id] ?? item.workerReport ?? ""} onChange={(event) => setInspectionNotes((current) => ({ ...current, [item._id]: event.target.value ?? "" }))} /></Field>
                      <Field><FieldLabel>Damage report</FieldLabel><Textarea className="min-h-24 rounded-2xl bg-slate-50" value={inspectionDamage[item._id] ?? item.damageReport ?? ""} onChange={(event) => setInspectionDamage((current) => ({ ...current, [item._id]: event.target.value ?? "" }))} /></Field>
                      <UploadCollectionField label="Report files" accept="image/*,.pdf,.doc,.docx" kind="file" values={inspectionFiles[item._id] ?? item.workerReportFiles ?? []} onChange={(values) => setInspectionFiles((current) => ({ ...current, [item._id]: values }))} />
                    </FieldGroup>
                    <Button type="submit" className="min-h-11 rounded-xl" disabled={submitInspectionReport.isPending}>Submit inspection</Button>
                  </form>
                </div>
              )) : <Empty><EmptyHeader><EmptyMedia variant="icon"><ClipboardCheck /></EmptyMedia><EmptyTitle>No inspections</EmptyTitle><EmptyDescription>Owner-assigned inspections show here.</EmptyDescription></EmptyHeader></Empty>}
            </CardContent>
          </Card>
        </WithBone>

        <WithBone name="worker-recurring" loading={recurring.isLoading} fallback={<DashboardTableSkeleton />}>
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Recurring maintenance</CardTitle>
              <CardDescription>Quick run report for repeat jobs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recurringList.length ? recurringList.map((item) => (
                <div key={item._id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{item.frequency}</Badge>
                    <Badge variant="secondary">{formatDate(item.nextRunAt)}</Badge>
                  </div>
                  <p className="mt-3 text-base font-semibold text-slate-950">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.description ?? "No description"}</p>
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
                      <Field><FieldLabel>Run report</FieldLabel><Textarea className="min-h-24 rounded-2xl bg-slate-50" value={recurringNotes[item._id] ?? ""} onChange={(event) => setRecurringNotes((current) => ({ ...current, [item._id]: event.target.value ?? "" }))} /></Field>
                      <UploadCollectionField label="Run files" accept="image/*,.pdf,.doc,.docx" kind="file" values={recurringFiles[item._id] ?? []} onChange={(values) => setRecurringFiles((current) => ({ ...current, [item._id]: values }))} />
                    </FieldGroup>
                    <Button type="submit" className="min-h-11 rounded-xl" disabled={submitRecurringReport.isPending}>Submit recurring</Button>
                  </form>
                </div>
              )) : <Empty><EmptyHeader><EmptyMedia variant="icon"><Repeat /></EmptyMedia><EmptyTitle>No recurring tasks</EmptyTitle><EmptyDescription>Repeat jobs show here.</EmptyDescription></EmptyHeader></Empty>}
            </CardContent>
          </Card>
        </WithBone>
      </div>

      <section id="messages" className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Quick inbox</CardTitle>
            <CardDescription>Recent owner docs and direct messages.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {messageList.length ? messageList.slice(0, 6).map((item) => (
              <div key={item._id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{item.kind ?? "text"}</Badge>
                      <Badge variant={!item.readBy?.includes(me?.id ?? "") ? "default" : "secondary"}>
                        {!item.readBy?.includes(me?.id ?? "") ? "new" : "seen"}
                      </Badge>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-950">{item.senderName ?? "Team"}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{item.content ?? "No message body"}</p>
                    {item.attachments?.[0] ? <a className="mt-3 inline-flex text-sm font-medium text-sky-700" href={item.attachments[0]} target="_blank" rel="noreferrer">Open file</a> : null}
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-500">{formatDate(item.createdAt)}</div>
                </div>
              </div>
            )) : <Empty><EmptyHeader><EmptyMedia variant="icon"><MessageSquare /></EmptyMedia><EmptyTitle>No messages</EmptyTitle><EmptyDescription>Owner messages and docs appear here.</EmptyDescription></EmptyHeader></Empty>}
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Reply from site</CardTitle>
            <CardDescription>Fast direct reply in same room. Best for field updates.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {replyThreads.length ? replyThreads.map((item) => (
              <div key={`reply-${item._id}`} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center gap-2">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                    {item.kind === "document" ? <FileText className="size-4" /> : <MessageSquare className="size-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{item.senderName ?? "Team"}</p>
                    <p className="text-xs text-slate-500">{item.roomType ?? "direct"} room</p>
                  </div>
                </div>
                <Textarea className="mt-4 min-h-24 rounded-2xl bg-slate-50" placeholder="Send quick update..." value={messageDrafts[item.roomId ?? item._id] ?? ""} onChange={(event) => setMessageDrafts((current) => ({ ...current, [item.roomId ?? item._id]: event.target.value ?? "" }))} />
                <Button
                  className="mt-3 min-h-11 rounded-xl"
                  disabled={sendMessage.isPending || !(messageDrafts[item.roomId ?? item._id] ?? "").trim()}
                  onClick={() => sendMessage.mutate({
                    roomType: (item.roomType as "direct" | "ticket") ?? "direct",
                    roomId: item.roomId ?? "",
                    content: messageDrafts[item.roomId ?? item._id] ?? "",
                  })}
                >
                  Send reply
                </Button>
              </div>
            )) : (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon"><AlarmClock /></EmptyMedia>
                  <EmptyTitle>No active threads</EmptyTitle>
                  <EmptyDescription>Once owner sends direct message or document, quick reply box appears here.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-4 gap-2">
          <a href="#overview" className="flex min-h-12 flex-col items-center justify-center rounded-2xl bg-slate-100 text-[11px] font-semibold text-slate-700"><Wrench className="mb-1 size-4" />Home</a>
          <a href="#queue" className="flex min-h-12 flex-col items-center justify-center rounded-2xl bg-slate-100 text-[11px] font-semibold text-slate-700"><Ticket className="mb-1 size-4" />Queue</a>
          <a href="#updates" className="flex min-h-12 flex-col items-center justify-center rounded-2xl bg-slate-100 text-[11px] font-semibold text-slate-700"><CheckCircle2 className="mb-1 size-4" />Update</a>
          <a href="#messages" className="flex min-h-12 flex-col items-center justify-center rounded-2xl bg-slate-100 text-[11px] font-semibold text-slate-700"><MessageSquare className="mb-1 size-4" />Inbox</a>
        </div>
      </div>
    </div>
  )
}
