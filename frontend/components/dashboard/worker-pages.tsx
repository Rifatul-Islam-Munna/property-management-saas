"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  AlarmClock,
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  FolderOpen,
  MessageSquare,
  Shield,
  Repeat,
  Settings2,
  Ticket,
  User2,
  Wrench,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
} from "@/hooks/use-worker-actions"
import {
  useWorkerInspectionsQuery,
  useWorkerMessagesQuery,
  useWorkerRecurringMaintenancesQuery,
  useWorkerTicketsQuery,
} from "@/hooks/use-worker-dashboard"
import {
  useWorkerAssignmentRequestsQuery,
  useWorkerLeaveAssignmentMutation,
  useWorkerUpdateAssignmentRequestMutation,
} from "@/hooks/use-worker-requests"
import type {
  MessageItem,
} from "@/lib/types/dashboard"

function formatDate(value?: string | null) {
  if (!value) return "Not set"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "Not set"
  return parsed.toLocaleDateString()
}

function formatDateTime(value?: string | null) {
  if (!value) return "Not set"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "Not set"
  return parsed.toLocaleString()
}

function formatMoney(value?: number | null, currency = "USD") {
  return `${currency} ${value ?? 0}`
}

function resolvePropertyLabel(propertyId?: string | null) {
  if (!propertyId) return "No property"
  return `Property ${propertyId.slice(-6).toUpperCase()}`
}

function resolveTicketLocation(ticket: {
  propertyName?: string | null
  propertyId?: string | null
  unitNumber?: string | null
  unitId?: string | null
}) {
  const propertyLabel = ticket.propertyName?.trim() || resolvePropertyLabel(ticket.propertyId)
  const unitLabel = ticket.unitNumber?.trim() || null

  return {
    propertyLabel,
    unitLabel: unitLabel ? `Unit ${unitLabel}` : "No unit",
  }
}

function resolveAssetLocation(item: {
  propertyName?: string | null
  propertyId?: string | null
  unitNumber?: string | null
  unitId?: string | null
}) {
  return {
    propertyLabel: item.propertyName?.trim() || resolvePropertyLabel(item.propertyId),
    unitLabel: item.unitNumber?.trim()
      ? `Unit ${item.unitNumber}`
      : item.unitId
        ? `Unit ${item.unitId.slice(-6).toUpperCase()}`
        : "No unit",
  }
}

const workerSheetClassName =
  "!w-screen !max-w-screen overflow-y-auto border-l-0 md:!w-screen md:!max-w-screen lg:!w-1/2 lg:!max-w-none"

function paginateItems<T>(items: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize
  return items.slice(start, start + pageSize)
}

function WorkerPageHero({
  icon: Icon,
  badge,
  title,
  body,
}: {
  icon: typeof Wrench
  badge: string
  title: string
  body: string
}) {
  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_32%),linear-gradient(145deg,_#ffffff_0%,_#f8fafc_48%,_#ecfeff_100%)] p-5">
      <div className="space-y-3">
        <Badge variant="outline" className="border-sky-200 bg-white/80 text-sky-700">
          {badge}
        </Badge>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
            <Icon className="size-5" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              {title}
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">{body}</p>
          </div>
        </div>
      </div>
    </section>
  )
}

function WorkerStatCard({
  label,
  value,
  note,
}: {
  label: string
  value: string | number
  note: string
}) {
  return (
    <Card className="overflow-hidden border-slate-200 bg-white">
      <CardContent className="space-y-2 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          {label}
        </p>
        <p className="text-2xl font-semibold text-slate-950">{value}</p>
        <p className="text-xs text-slate-600">{note}</p>
      </CardContent>
    </Card>
  )
}

function WorkerPagination({
  page,
  total,
  pageSize,
  onPageChange,
}: {
  page: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  if (total <= pageSize) return null

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-600">
        Page {page} of {totalPages}
      </p>
      <Pagination className="mx-0 w-auto justify-start sm:justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(event) => {
                event.preventDefault()
                if (page > 1) onPageChange(page - 1)
              }}
              className={page <= 1 ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(event) => {
                event.preventDefault()
                if (page < totalPages) onPageChange(page + 1)
              }}
              className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}

function WorkerFilterBar({
  search,
  onSearchChange,
  children,
}: {
  search: string
  onSearchChange: (value: string) => void
  children?: React.ReactNode
}) {
  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,0.7fr))]">
      <Input
        value={search}
        onChange={(event) => onSearchChange(event.target.value ?? "")}
        placeholder="Search title, note, status"
        className="bg-white"
      />
      {children}
    </div>
  )
}

function WorkerSummaryTable({
  headers,
  rows,
  emptyText,
}: {
  headers: string[]
  rows: React.ReactNode
  emptyText: string
}) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 md:block">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              {headers.map((header) => (
                <TableHead key={header}>{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>{rows}</TableBody>
        </Table>
      </div>
      <p className="md:hidden text-xs text-slate-500">{emptyText}</p>
    </>
  )
}

function WorkerEmpty({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Wrench
  title: string
  body: string
}) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{body}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

function useWorkerCollections() {
  const { data: me } = useMeQuery()
  const tickets = useWorkerTicketsQuery()
  const inspections = useWorkerInspectionsQuery()
  const recurring = useWorkerRecurringMaintenancesQuery()
  const messages = useWorkerMessagesQuery()

  return {
    me,
    tickets,
    inspections,
    recurring,
    messages,
    ticketList: Array.isArray(tickets.data) ? tickets.data : [],
    inspectionList: Array.isArray(inspections.data) ? inspections.data : [],
    recurringList: Array.isArray(recurring.data) ? recurring.data : [],
    messageList: Array.isArray(messages.data) ? messages.data : [],
  }
}

function useResetPage(deps: Array<string | number>) {
  const [page, setPage] = useState(1)

  useEffect(() => {
    setPage(1)
  }, deps)

  return [page, setPage] as const
}

function WorkerAssignmentPanel() {
  const { data: me } = useMeQuery()
  const requests = useWorkerAssignmentRequestsQuery()
  const updateRequest = useWorkerUpdateAssignmentRequestMutation()
  const leaveAssignment = useWorkerLeaveAssignmentMutation()
  const requestList = requests.data ?? []
  const pendingOwnerInvites = requestList.filter(
    (item: any) => item.status === "pending" && item.direction === "owner_to_user"
  )
  const acceptedOwnerLinks = useMemo(() => {
    const seen = new Set<string>()
    return requestList.filter((item: any) => {
      if (item.status !== "accepted") return false
      const ownerId = item.ownerUserId ?? item.ownerUser?._id
      if (!ownerId || seen.has(ownerId)) return false
      seen.add(ownerId)
      return true
    })
  }, [requestList])

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Worker requests</CardTitle>
          <CardDescription>Accept or reject owner invites here.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {pendingOwnerInvites.length ? pendingOwnerInvites.map((item: any) => (
            <div key={item._id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{item.requestedRole ?? "worker"}</Badge>
                <Badge>{item.status}</Badge>
              </div>
              <p className="mt-3 font-semibold text-slate-950">
                {item.ownerUser?.fullName ?? item.requesterUser?.fullName ?? "Owner"}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {item.properties?.map((property: any) => property.name).filter(Boolean).join(", ") || "No property attached"}
              </p>
              <p className="mt-1 text-xs text-slate-500">{item.message ?? "No message"}</p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  disabled={updateRequest.isPending}
                  onClick={() => updateRequest.mutate({ id: item._id, status: "accepted" })}
                >
                  Accept request
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={updateRequest.isPending}
                  onClick={() => updateRequest.mutate({ id: item._id, status: "rejected" })}
                >
                  Reject
                </Button>
              </div>
            </div>
          )) : (
            <WorkerEmpty icon={Shield} title="No pending invites" body="Owner worker requests will show here." />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Leave owner link</CardTitle>
          <CardDescription>Worker can leave current apartment team from here.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {acceptedOwnerLinks.length ? acceptedOwnerLinks.map((item: any) => {
            const ownerId = item.ownerUserId ?? item.ownerUser?._id
            const isActiveOwner = (me?.activeOwnerId ?? "") === ownerId
            return (
              <div key={`accepted-${ownerId}`} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-950">
                    {item.ownerUser?.fullName ?? "Owner"}
                  </p>
                  {isActiveOwner ? <Badge>Active</Badge> : <Badge variant="outline">Linked</Badge>}
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {item.properties?.map((property: any) => property.name).filter(Boolean).join(", ") || "No property attached"}
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="outline" className="mt-3" disabled={leaveAssignment.isPending}>
                      {leaveAssignment.isPending ? "Leaving..." : "Leave this owner"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Leave worker assignment?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This removes your worker link from this owner and related properties.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => leaveAssignment.mutate({ ownerUserId: ownerId })}>
                        Confirm leave
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )
          }) : (
            <WorkerEmpty icon={Shield} title="No owner links yet" body="Accept owner invite first, then leave control appears here." />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function WorkerQuickSubmitCard() {
  const { ticketList, inspectionList, recurringList } = useWorkerCollections()
  const updateTicket = useWorkerUpdateTicketMutation()
  const submitInspectionReport = useWorkerSubmitInspectionReportMutation()
  const submitRecurringReport = useWorkerSubmitRecurringReportMutation()
  const [note, setNote] = useState("")
  const [files, setFiles] = useState<string[]>([])
  const [status, setStatus] = useState("")
  const [cost, setCost] = useState("")

  const currentWork = useMemo(() => {
    const activeTicket =
      ticketList.find((item) => item.status === "in_progress") ??
      ticketList.find((item) => item.status === "assigned") ??
      ticketList.find((item) => item.priority === "emergency" || item.priority === "high") ??
      ticketList.find((item) => item.status !== "completed" && item.status !== "cancelled")

    if (activeTicket) {
      return {
        kind: "ticket" as const,
        id: activeTicket._id,
        title: activeTicket.title,
        body: activeTicket.description ?? "Save progress and cost fast.",
        badge: activeTicket.status,
        sub: activeTicket.scheduledDate
          ? `Scheduled ${formatDate(activeTicket.scheduledDate)}`
          : activeTicket.priority,
        defaultStatus: activeTicket.status,
        defaultNote: activeTicket.completionNotes ?? "",
        defaultFiles: activeTicket.completionProof ?? [],
        property: activeTicket.propertyName?.trim() || resolvePropertyLabel(activeTicket.propertyId),
        unit: activeTicket.unitNumber?.trim() ? `Unit ${activeTicket.unitNumber}` : "No unit",
      }
    }

    const activeInspection = inspectionList.find((item) => !item.completed)
    if (activeInspection) {
      return {
        kind: "inspection" as const,
        id: activeInspection._id,
        title: `${activeInspection.type} inspection`,
        body: activeInspection.damageReport ?? activeInspection.notes ?? "Submit report and proof files.",
        badge: activeInspection.completed ? "done" : "pending",
        sub: formatDate(activeInspection.scheduledAt),
        defaultStatus: "completed",
        defaultNote: activeInspection.workerReport ?? "",
        defaultFiles: activeInspection.workerReportFiles ?? [],
        property: resolvePropertyLabel(activeInspection.propertyId),
        unit: activeInspection.unitId ? `Unit ${activeInspection.unitId.slice(-6).toUpperCase()}` : "No unit",
      }
    }

    const activeRecurring = recurringList.find(
      (item) => item.runHistory?.[0]?.status !== "completed"
    )
    if (activeRecurring) {
      return {
        kind: "recurring" as const,
        id: activeRecurring._id,
        title: activeRecurring.title,
        body: activeRecurring.description ?? "Submit recurring run note and files.",
        badge: activeRecurring.runHistory?.[0]?.status ?? "scheduled",
        sub: formatDate(activeRecurring.nextRunAt),
        defaultStatus: "completed",
        defaultNote: activeRecurring.runHistory?.[0]?.note ?? "",
        defaultFiles: activeRecurring.runHistory?.[0]?.files ?? [],
        property: resolvePropertyLabel(activeRecurring.propertyId),
        unit: activeRecurring.unitId ? `Unit ${activeRecurring.unitId.slice(-6).toUpperCase()}` : "No unit",
      }
    }

    return null
  }, [inspectionList, recurringList, ticketList])

  useEffect(() => {
    setNote(currentWork?.defaultNote ?? "")
    setFiles(currentWork?.defaultFiles ?? [])
    setStatus(currentWork?.defaultStatus ?? "")
    setCost("")
  }, [currentWork])

  if (!currentWork) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current work first</CardTitle>
          <CardDescription>No active assignment right now.</CardDescription>
        </CardHeader>
        <CardContent>
          <WorkerEmpty icon={Wrench} title="No current work" body="Next assigned job will land here first." />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden border-slate-200 bg-[linear-gradient(145deg,#0f172a_0%,#1e293b_48%,#115e59_100%)] text-white">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">
            Current work now
          </Badge>
          <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">
            {currentWork.badge}
          </Badge>
        </div>
        <CardTitle className="text-white">{currentWork.title}</CardTitle>
        <CardDescription className="text-slate-200">
          {currentWork.body} | {currentWork.sub}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid gap-2 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-3 text-sm text-slate-100">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">Location</p>
            <p className="mt-1 font-medium text-white">{currentWork.property}</p>
            <p className="text-slate-300">{currentWork.unit}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-3 text-sm text-slate-100">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">Quick submit</p>
            <p className="mt-1 font-medium text-white">One form only</p>
            <p className="text-slate-300">Status, note, proof, done.</p>
          </div>
        </div>
        {currentWork.kind === "ticket" ? (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              updateTicket.mutate({
                id: currentWork.id,
                status: status || "in_progress",
                actualCost: cost ? Number(cost) : undefined,
                completionNotes: note,
                completionProof: files,
              })
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel className="text-white">Status</FieldLabel>
                <Select value={status} onValueChange={(value) => setStatus(value ?? "in_progress")}>
                  <SelectTrigger className="h-11 w-full rounded-xl border-white/20 bg-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {["assigned", "in_progress", "waiting_parts", "completed", "escalated"].map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel className="text-white">Actual cost</FieldLabel>
                <Input
                  value={cost}
                  onChange={(event) => setCost(event.target.value ?? "")}
                  placeholder="0"
                  className="h-11 rounded-xl border-white/20 bg-white/10 text-white placeholder:text-slate-300"
                />
              </Field>
            </div>
            <Field>
              <FieldLabel className="text-white">Quick note</FieldLabel>
              <Textarea
                value={note}
                onChange={(event) => setNote(event.target.value ?? "")}
                placeholder="Work started, blocked, completed..."
                className="min-h-24 rounded-2xl border-white/20 bg-white/10 text-white placeholder:text-slate-300"
              />
            </Field>
            <UploadCollectionField
              label="Proof files"
              accept="image/*,.pdf,.doc,.docx"
              kind="file"
              values={files}
              onChange={setFiles}
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" className="min-h-11 rounded-xl bg-white text-slate-950 hover:bg-slate-100" disabled={updateTicket.isPending}>
                Save ticket fast
              </Button>
              <Link href="/dashboard/worker/tickets" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 px-4 text-sm font-medium text-white">
                Open full page
              </Link>
            </div>
          </form>
        ) : null}

        {currentWork.kind === "inspection" ? (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              submitInspectionReport.mutate({
                id: currentWork.id,
                workerReport: note,
                damageReport: note,
                workerReportFiles: files,
                completed: true,
              })
            }}
          >
            <Field>
              <FieldLabel className="text-white">Inspection note</FieldLabel>
              <Textarea
                value={note}
                onChange={(event) => setNote(event.target.value ?? "")}
                placeholder="Condition, issue, access, damage..."
                className="min-h-24 rounded-2xl border-white/20 bg-white/10 text-white placeholder:text-slate-300"
              />
            </Field>
            <UploadCollectionField
              label="Inspection files"
              accept="image/*,.pdf,.doc,.docx"
              kind="file"
              values={files}
              onChange={setFiles}
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" className="min-h-11 rounded-xl bg-white text-slate-950 hover:bg-slate-100" disabled={submitInspectionReport.isPending}>
                Submit inspection fast
              </Button>
              <Link href="/dashboard/worker/inspections" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 px-4 text-sm font-medium text-white">
                Open full page
              </Link>
            </div>
          </form>
        ) : null}

        {currentWork.kind === "recurring" ? (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              submitRecurringReport.mutate({
                id: currentWork.id,
                status: "completed",
                note,
                files,
              })
            }}
          >
            <Field>
              <FieldLabel className="text-white">Run note</FieldLabel>
              <Textarea
                value={note}
                onChange={(event) => setNote(event.target.value ?? "")}
                placeholder="Task done, issue found, follow-up needed..."
                className="min-h-24 rounded-2xl border-white/20 bg-white/10 text-white placeholder:text-slate-300"
              />
            </Field>
            <UploadCollectionField
              label="Run files"
              accept="image/*,.pdf,.doc,.docx"
              kind="file"
              values={files}
              onChange={setFiles}
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" className="min-h-11 rounded-xl bg-white text-slate-950 hover:bg-slate-100" disabled={submitRecurringReport.isPending}>
                Submit run fast
              </Button>
              <Link href="/dashboard/worker/recurring" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 px-4 text-sm font-medium text-white">
                Open full page
              </Link>
            </div>
          </form>
        ) : null}
      </CardContent>
    </Card>
  )
}

export function WorkerOverviewPage() {
  const { me, tickets, inspections, recurring, messages, ticketList, inspectionList, recurringList, messageList } =
    useWorkerCollections()

  const loading =
    me === undefined ||
    tickets.isLoading ||
    inspections.isLoading ||
    recurring.isLoading ||
    messages.isLoading

  const urgentTickets = ticketList.filter(
    (item) => item.priority === "emergency" || item.priority === "high"
  )
  const pendingInspections = inspectionList.filter((item) => !item.completed)
  const unreadMessages = messageList.filter((item) => !item.readBy?.includes(me?.id ?? ""))

  const queue = useMemo(() => {
    const ticketRows = ticketList.map((item) => ({
      id: `ticket-${item._id}`,
      type: "Ticket",
      title: item.title,
      status: item.status,
      when: item.createdAt ?? null,
      note: item.description ?? "No details",
      href: "/dashboard/worker/tickets",
    }))
    const inspectionRows = inspectionList.map((item) => ({
      id: `inspection-${item._id}`,
      type: "Inspection",
      title: `${item.type} inspection`,
      status: item.completed ? "completed" : "pending",
      when: item.scheduledAt ?? null,
      note: item.damageReport ?? item.notes ?? "Report pending",
      href: "/dashboard/worker/inspections",
    }))
    const recurringRows = recurringList.map((item) => ({
      id: `recurring-${item._id}`,
      type: "Recurring",
      title: item.title,
      status: item.runHistory?.[0]?.status ?? "scheduled",
      when: item.nextRunAt ?? null,
      note: item.description ?? "No details",
      href: "/dashboard/worker/recurring",
    }))

    return [...ticketRows, ...inspectionRows, ...recurringRows]
      .sort((a, b) => new Date(a.when ?? 0).getTime() - new Date(b.when ?? 0).getTime())
      .slice(0, 8)
  }, [inspectionList, recurringList, ticketList])

  return (
    <div className="space-y-6 pb-10">
      <WithBone name="worker-overview-hero" loading={loading} fallback={<DashboardPanelSkeleton />}>
        <WorkerPageHero
          icon={Wrench}
          badge="Worker workspace"
          title="Worker dashboard built for fast phone use."
          body="Current job first, quick submit first, then simple pages for tickets, inspections, recurring work, and messages."
        />
      </WithBone>

      <WithBone name="worker-current-work" loading={loading} fallback={<DashboardPanelSkeleton />}>
        <WorkerQuickSubmitCard />
      </WithBone>

      <WithBone name="worker-assignments" loading={loading} fallback={<DashboardPanelSkeleton />}>
        <WorkerAssignmentPanel />
      </WithBone>

      <WithBone
        name="worker-overview-stats"
        loading={loading}
        fallback={
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <DashboardCardSkeleton key={index} />
            ))}
          </div>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <WorkerStatCard label="Urgent tickets" value={urgentTickets.length} note="High + emergency work" />
          <WorkerStatCard label="Assigned now" value={ticketList.filter((item) => item.status === "assigned").length} note="Ready to start" />
          <WorkerStatCard label="Pending inspections" value={pendingInspections.length} note="Report still missing" />
          <WorkerStatCard label="Unread messages" value={unreadMessages.length} note="Owner or team updates" />
        </div>
      </WithBone>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
          <CardTitle>Jump to page</CardTitle>
          <CardDescription>Open one work area fast.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {[
              { href: "/dashboard/worker/tickets", title: "Tickets", body: "Update status, cost, notes", icon: Ticket },
              { href: "/dashboard/worker/inspections", title: "Inspections", body: "Damage and worker reports", icon: ClipboardCheck },
              { href: "/dashboard/worker/recurring", title: "Recurring", body: "Routine run submissions", icon: Repeat },
              { href: "/dashboard/worker/messages", title: "Messages", body: "Reply from site", icon: MessageSquare },
              { href: "/dashboard/worker/settings", title: "Settings", body: "Account and scope details", icon: Settings2 },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-slate-300 hover:bg-white"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex size-10 items-center justify-center rounded-2xl bg-slate-950 text-white">
                      <item.icon className="size-4" />
                    </div>
                    <p className="mt-3 font-semibold text-slate-950">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.body}</p>
                  </div>
                  <ArrowRight className="size-4 text-slate-400 transition group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Worker profile</CardTitle>
            <CardDescription>Quick scope for shift start.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <div className="rounded-2xl border p-4">
              <div className="flex items-center gap-2 font-medium text-slate-950">
                <User2 className="size-4" />
                Worker
              </div>
              <p className="mt-2">{me?.fullName ?? "Worker"}</p>
              <p className="text-xs text-slate-500">{me?.email ?? "No email"}</p>
            </div>
            <div className="rounded-2xl border p-4">
              <div className="flex items-center gap-2 font-medium text-slate-950">
                <Building2 className="size-4" />
                Linked properties
              </div>
              <p className="mt-2">{me?.propertyIds?.length ?? 0} active property links</p>
            </div>
            <div className="rounded-2xl border p-4">
              <div className="flex items-center gap-2 font-medium text-slate-950">
                <FolderOpen className="size-4" />
                Documents in inbox
              </div>
              <p className="mt-2">
                {messageList.filter((item) => item.kind === "document").length} shared files
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming queue</CardTitle>
          <CardDescription>Cross-page list for what needs touch next.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {queue.length ? (
            queue.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="block rounded-2xl border border-slate-200 p-4 transition hover:bg-slate-50"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{item.type}</Badge>
                      <Badge>{item.status}</Badge>
                    </div>
                    <p className="mt-3 font-semibold text-slate-950">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.note}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
                    {formatDate(item.when)}
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <WorkerEmpty
              icon={AlarmClock}
              title="No queue yet"
              body="When owner assigns tasks, summary queue shows here."
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function WorkerTicketsPage() {
  const { ticketList, tickets } = useWorkerCollections()
  const updateTicket = useWorkerUpdateTicketMutation()
  const addTicketNote = useWorkerAddTicketNoteMutation()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [scheduleFilter, setScheduleFilter] = useState("all")
  const [ticketStatus, setTicketStatus] = useState<Record<string, string>>({})
  const [ticketCosts, setTicketCosts] = useState<Record<string, string>>({})
  const [ticketNotes, setTicketNotes] = useState<Record<string, string>>({})
  const [ticketProofs, setTicketProofs] = useState<Record<string, string[]>>({})
  const [selectedUpdateTicketId, setSelectedUpdateTicketId] = useState<string | null>(null)
  const [selectedDetailTicketId, setSelectedDetailTicketId] = useState<string | null>(null)

  const filteredTickets = useMemo(() => {
    return ticketList.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false
      if (priorityFilter !== "all" && item.priority !== priorityFilter) return false
      if (scheduleFilter === "scheduled" && !item.scheduledDate) return false
      if (scheduleFilter === "unscheduled" && item.scheduledDate) return false
      if (!search.trim()) return true
      const needle = search.trim().toLowerCase()
      return [item.title, item.description, item.category, item.status, item.priority]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle)
    })
  }, [priorityFilter, scheduleFilter, search, statusFilter, ticketList])

  const [page, setPage] = useResetPage([search, statusFilter, priorityFilter, scheduleFilter])
  const pageSize = 5
  const pagedTickets = paginateItems(filteredTickets, page, pageSize)
  const selectedUpdateTicket = ticketList.find((item) => item._id === selectedUpdateTicketId) ?? null
  const selectedDetailTicket = ticketList.find((item) => item._id === selectedDetailTicketId) ?? null

  return (
    <div className="space-y-6">
      <WorkerPageHero
        icon={Ticket}
        badge="Tickets"
        title="Assigned tickets with clean table, fast actions, detail view."
        body="Worker sees simple list first, then opens action or details only when needed."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <WorkerStatCard label="Total tickets" value={ticketList.length} note="All assigned items" />
        <WorkerStatCard label="Urgent" value={ticketList.filter((item) => item.priority === "emergency" || item.priority === "high").length} note="Need attention first" />
        <WorkerStatCard label="In progress" value={ticketList.filter((item) => item.status === "in_progress").length} note="Already started" />
        <WorkerStatCard label="Completed" value={ticketList.filter((item) => item.status === "completed").length} note="Finished work" />
      </div>

      <WithBone name="worker-page-tickets" loading={tickets.isLoading} fallback={<DashboardTableSkeleton />}>
        <Card>
          <CardHeader>
            <CardTitle>Ticket table</CardTitle>
            <CardDescription>Simple job list first. Open sheet only when worker needs action or details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <WorkerFilterBar search={search} onSearchChange={setSearch}>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
              >
                <option value="all">All status</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In progress</option>
                <option value="waiting_parts">Waiting parts</option>
                <option value="completed">Completed</option>
                <option value="escalated">Escalated</option>
              </select>
              <select
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value)}
                className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
              >
                <option value="all">All priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="emergency">Emergency</option>
              </select>
              <select
                value={scheduleFilter}
                onChange={(event) => setScheduleFilter(event.target.value)}
                className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
              >
                <option value="all">All schedule</option>
                <option value="scheduled">Scheduled</option>
                <option value="unscheduled">No schedule</option>
              </select>
            </WorkerFilterBar>

            {pagedTickets.length ? (
              <>
                <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 md:block">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead>Ticket</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Schedule</TableHead>
                        <TableHead>Opened</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagedTickets.map((item) => (
                        <TableRow key={item._id}>
                          <TableCell className="min-w-52">
                            <div>
                              <p className="font-medium text-slate-950">{item.title}</p>
                              <p className="mt-1 text-xs text-slate-500">
                                {resolveTicketLocation(item).propertyLabel}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{item.category ?? "general"}</TableCell>
                          <TableCell>
                            <Badge>{item.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={item.priority === "emergency" || item.priority === "high" ? "destructive" : "outline"}>
                              {item.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>{item.scheduledDate ? formatDate(item.scheduledDate) : "Not set"}</TableCell>
                          <TableCell>{formatDate(item.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2 whitespace-nowrap">
                              <Button type="button" size="sm" className="rounded-xl" onClick={() => setSelectedUpdateTicketId(item._id)}>
                                Action
                              </Button>
                              <Button type="button" size="sm" variant="outline" className="rounded-xl" onClick={() => setSelectedDetailTicketId(item._id)}>
                                View
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="space-y-3 md:hidden">
                  {pagedTickets.map((item) => (
                    <div key={item._id} className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">{item.category ?? "general"}</Badge>
                        <Badge>{item.status}</Badge>
                        <Badge variant={item.priority === "emergency" || item.priority === "high" ? "destructive" : "secondary"}>
                          {item.priority}
                        </Badge>
                      </div>
                      <p className="mt-3 text-base font-semibold text-slate-950">{item.title}</p>
                      <div className="mt-3 space-y-2 text-sm text-slate-600">
                        <div className="rounded-2xl bg-slate-50 px-3 py-2">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Location</p>
                          <p className="mt-1 text-slate-950">{resolveTicketLocation(item).propertyLabel}</p>
                          <p className="text-slate-600">{resolveTicketLocation(item).unitLabel}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-2xl bg-slate-50 px-3 py-2">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Schedule</p>
                            <p className="mt-1 text-slate-950">{item.scheduledDate ? formatDate(item.scheduledDate) : "Not set"}</p>
                          </div>
                          <div className="rounded-2xl bg-slate-50 px-3 py-2">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Opened</p>
                            <p className="mt-1 text-slate-950">{formatDate(item.createdAt)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <Button type="button" className="min-h-11 rounded-xl" onClick={() => setSelectedUpdateTicketId(item._id)}>
                          Action
                        </Button>
                        <Button type="button" variant="outline" className="min-h-11 rounded-xl" onClick={() => setSelectedDetailTicketId(item._id)}>
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <WorkerPagination page={page} total={filteredTickets.length} pageSize={pageSize} onPageChange={setPage} />
              </>
            ) : (
              <WorkerEmpty icon={Ticket} title="No tickets match" body="Try another filter or wait for owner assignment." />
            )}
          </CardContent>
        </Card>
      </WithBone>

      <Sheet open={Boolean(selectedUpdateTicket)} onOpenChange={(open) => !open && setSelectedUpdateTicketId(null)}>
        <SheetContent side="right" className={workerSheetClassName}>
          <SheetHeader className="border-b border-slate-200 px-5 py-4">
            <SheetTitle>Update ticket</SheetTitle>
            <SheetDescription>Submit proof, update status, add worker update.</SheetDescription>
          </SheetHeader>
          {selectedUpdateTicket ? (
            <form
              className="grid gap-4 p-5"
              onSubmit={(event) => {
                event.preventDefault()
                updateTicket.mutate(
                  {
                    id: selectedUpdateTicket._id,
                    status: ticketStatus[selectedUpdateTicket._id] ?? selectedUpdateTicket.status,
                    actualCost: ticketCosts[selectedUpdateTicket._id] ? Number(ticketCosts[selectedUpdateTicket._id]) : undefined,
                    completionNotes: ticketNotes[selectedUpdateTicket._id] ?? selectedUpdateTicket.completionNotes ?? "",
                    completionProof: ticketProofs[selectedUpdateTicket._id] ?? selectedUpdateTicket.completionProof ?? [],
                  },
                  { onSuccess: () => setSelectedUpdateTicketId(null) }
                )
              }}
            >
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-medium text-slate-950">{selectedUpdateTicket.title}</p>
                <p className="mt-1">{resolveTicketLocation(selectedUpdateTicket).propertyLabel}</p>
                <p className="mt-1">{resolveTicketLocation(selectedUpdateTicket).unitLabel}</p>
                <p className="mt-1">
                  {selectedUpdateTicket.scheduledDate ? `Scheduled ${formatDate(selectedUpdateTicket.scheduledDate)}` : "No schedule"}
                  {selectedUpdateTicket.dueDate ? ` | Due ${formatDate(selectedUpdateTicket.dueDate)}` : ""}
                </p>
              </div>
              <FieldGroup>
                <Field>
                  <FieldLabel>Status</FieldLabel>
                  <Select
                    value={ticketStatus[selectedUpdateTicket._id] ?? selectedUpdateTicket.status}
                    onValueChange={(value) =>
                      setTicketStatus((current) => ({ ...current, [selectedUpdateTicket._id]: value ?? selectedUpdateTicket.status }))
                    }
                  >
                    <SelectTrigger className="h-11 w-full rounded-xl bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {["assigned", "in_progress", "completed", "cancelled"].map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Actual cost</FieldLabel>
                  <Input
                    className="h-11 rounded-xl bg-white"
                    inputMode="decimal"
                    placeholder="0"
                    value={ticketCosts[selectedUpdateTicket._id] ?? ""}
                    onChange={(event) =>
                      setTicketCosts((current) => ({ ...current, [selectedUpdateTicket._id]: event.target.value ?? "" }))
                    }
                  />
                </Field>
              </FieldGroup>
              <Field>
                <FieldLabel>Worker update</FieldLabel>
                <Textarea
                  className="min-h-28 rounded-2xl bg-white"
                  value={ticketNotes[selectedUpdateTicket._id] ?? selectedUpdateTicket.completionNotes ?? ""}
                  onChange={(event) =>
                    setTicketNotes((current) => ({ ...current, [selectedUpdateTicket._id]: event.target.value ?? "" }))
                  }
                  placeholder="What you did, blocked issue, final result..."
                />
              </Field>
              <UploadCollectionField
                label="Proof files"
                accept="image/*,.pdf,.doc,.docx"
                kind="file"
                values={ticketProofs[selectedUpdateTicket._id] ?? selectedUpdateTicket.completionProof ?? []}
                onChange={(values) =>
                  setTicketProofs((current) => ({ ...current, [selectedUpdateTicket._id]: values }))
                }
              />
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="submit" className="min-h-11 rounded-xl" disabled={updateTicket.isPending}>
                  Save action
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 rounded-xl"
                  disabled={addTicketNote.isPending || !(ticketNotes[selectedUpdateTicket._id] ?? "").trim()}
                  onClick={() =>
                    addTicketNote.mutate(
                      {
                        id: selectedUpdateTicket._id,
                        content: ticketNotes[selectedUpdateTicket._id] ?? "",
                      },
                      { onSuccess: () => setSelectedUpdateTicketId(null) }
                    )
                  }
                >
                  Save note only
                </Button>
              </div>
            </form>
          ) : null}
        </SheetContent>
      </Sheet>

      <Sheet open={Boolean(selectedDetailTicket)} onOpenChange={(open) => !open && setSelectedDetailTicketId(null)}>
        <SheetContent side="right" className={workerSheetClassName}>
          <SheetHeader className="border-b border-slate-200 px-5 py-4">
            <SheetTitle>Ticket details</SheetTitle>
            <SheetDescription>Full job context, notes, files, instructions.</SheetDescription>
          </SheetHeader>
          {selectedDetailTicket ? (
            <div className="grid gap-4 p-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{selectedDetailTicket.category ?? "general"}</Badge>
                  <Badge>{selectedDetailTicket.status}</Badge>
                  <Badge variant={selectedDetailTicket.priority === "emergency" || selectedDetailTicket.priority === "high" ? "destructive" : "secondary"}>
                    {selectedDetailTicket.priority}
                  </Badge>
                </div>
                <p className="mt-3 text-lg font-semibold text-slate-950">{selectedDetailTicket.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{selectedDetailTicket.description ?? "No details"}</p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border p-4 text-sm text-slate-700">
                  <p className="font-medium text-slate-950">Location</p>
                  <p className="mt-2">{resolveTicketLocation(selectedDetailTicket).propertyLabel}</p>
                  <p className="mt-1">{resolveTicketLocation(selectedDetailTicket).unitLabel}</p>
                </div>
                <div className="rounded-2xl border p-4 text-sm text-slate-700">
                  <p className="font-medium text-slate-950">Schedule</p>
                  <p className="mt-2">{selectedDetailTicket.scheduledDate ? formatDate(selectedDetailTicket.scheduledDate) : "No schedule set"}</p>
                  <p className="mt-1">{selectedDetailTicket.dueDate ? `Due ${formatDate(selectedDetailTicket.dueDate)}` : "No due date set"}</p>
                </div>
              </div>

              <div className="rounded-2xl border p-4 text-sm text-slate-700">
                <p className="font-medium text-slate-950">Instruction for worker</p>
                {selectedDetailTicket.internalNotes?.length ? (
                  <div className="mt-3 space-y-2">
                    {selectedDetailTicket.internalNotes.map((note, index) => (
                      <div key={`${note.createdAt ?? index}-${note.userId}`} className="rounded-xl border bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">{note.userName} | {formatDateTime(note.createdAt)}</p>
                        <p className="mt-1">{note.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-slate-500">No owner note yet.</p>
                )}
              </div>

              <div className="rounded-2xl border p-4 text-sm text-slate-700">
                <p className="font-medium text-slate-950">Worker update</p>
                <p className="mt-2">{selectedDetailTicket.completionNotes ?? "No worker update yet."}</p>
              </div>

              {selectedDetailTicket.images?.length ? (
                <div className="rounded-2xl border p-4 text-sm text-slate-700">
                  <p className="font-medium text-slate-950">Resident images</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedDetailTicket.images.map((image) => (
                      <a key={image} href={image} target="_blank" rel="noreferrer" className="rounded-lg border px-3 py-2 text-xs text-sky-700">
                        Open image
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}

              {selectedDetailTicket.completionProof?.length ? (
                <div className="rounded-2xl border p-4 text-sm text-slate-700">
                  <p className="font-medium text-slate-950">Proof files</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedDetailTicket.completionProof.map((file) => (
                      <a key={file} href={file} target="_blank" rel="noreferrer" className="rounded-lg border px-3 py-2 text-xs text-sky-700">
                        Open proof
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}

export function WorkerWorkOrdersPage() {
  return (
    <div className="space-y-6">
      <WorkerPageHero
        icon={Ticket}
        badge="Tickets"
        title="Old work order route moved."
        body="Use ticket page for assignment, progress, cost, proof, completion."
      />
      <Card>
        <CardHeader>
          <CardTitle>Single flow now</CardTitle>
          <CardDescription>All repair execution stays in tickets.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/dashboard/worker/tickets" className="inline-flex min-h-11 items-center justify-center rounded-xl border px-4 text-sm font-medium text-slate-950">
            Open ticket page
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

export function WorkerInspectionsPage() {
  const { inspectionList, inspections } = useWorkerCollections()
  const submitInspectionReport = useWorkerSubmitInspectionReportMutation()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [inspectionNotes, setInspectionNotes] = useState<Record<string, string>>({})
  const [inspectionDamage, setInspectionDamage] = useState<Record<string, string>>({})
  const [inspectionFiles, setInspectionFiles] = useState<Record<string, string[]>>({})
  const [inspectionCosts, setInspectionCosts] = useState<Record<string, string>>({})
  const [selectedInspectionId, setSelectedInspectionId] = useState<string | null>(null)
  const [selectedInspectionViewId, setSelectedInspectionViewId] = useState<string | null>(null)

  const filteredItems = useMemo(() => {
    return inspectionList.filter((item) => {
      const completed = item.completed ? "completed" : "pending"
      if (statusFilter !== "all" && completed !== statusFilter) return false
      if (!search.trim()) return true
      const needle = search.trim().toLowerCase()
      return [item.type, item.damageReport, item.workerReport, item.notes]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle)
    })
  }, [inspectionList, search, statusFilter])

  const [page, setPage] = useResetPage([search, statusFilter])
  const pageSize = 4
  const pagedItems = paginateItems(filteredItems, page, pageSize)
  const selectedInspection = inspectionList.find((item) => item._id === selectedInspectionId) ?? null
  const selectedInspectionView = inspectionList.find((item) => item._id === selectedInspectionViewId) ?? null

  return (
    <div className="space-y-6">
      <WorkerPageHero
        icon={ClipboardCheck}
        badge="Inspections"
        title="Inspection jobs with simple action flow."
        body="See assigned checks first, then open action or details only when needed."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <WorkerStatCard label="All inspections" value={inspectionList.length} note="Assigned inspection items" />
        <WorkerStatCard label="Pending" value={inspectionList.filter((item) => !item.completed).length} note="Need worker report" />
        <WorkerStatCard label="Done" value={inspectionList.filter((item) => item.completed).length} note="Already submitted" />
        <WorkerStatCard label="With damage note" value={inspectionList.filter((item) => Boolean(item.damageReport)).length} note="Damage recorded" />
      </div>

      <WithBone name="worker-page-inspections" loading={inspections.isLoading} fallback={<DashboardTableSkeleton />}>
        <Card>
          <CardHeader>
            <CardTitle>Inspection table</CardTitle>
            <CardDescription>Desktop table, mobile cards, full-width sheets for report and details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <WorkerFilterBar search={search} onSearchChange={setSearch}>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
              >
                <option value="all">All status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </WorkerFilterBar>

            {pagedItems.length ? (
              <>
                <div className="hidden overflow-hidden rounded-2xl border border-slate-200 md:block">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Scheduled</TableHead>
                        <TableHead>Property</TableHead>
                        <TableHead>Reported</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagedItems.map((item) => (
                        <TableRow key={item._id}>
                          <TableCell className="font-medium text-slate-950">{item.type}</TableCell>
                          <TableCell>
                            <Badge variant={item.completed ? "default" : "secondary"}>
                              {item.completed ? "done" : "pending"}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(item.scheduledAt)}</TableCell>
                          <TableCell>{resolveAssetLocation(item).propertyLabel}</TableCell>
                          <TableCell>{formatDate(item.workerReportedAt)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2 whitespace-nowrap">
                              <Button type="button" size="sm" className="rounded-xl" onClick={() => setSelectedInspectionId(item._id)}>
                                Action
                              </Button>
                              <Button type="button" size="sm" variant="outline" className="rounded-xl" onClick={() => setSelectedInspectionViewId(item._id)}>
                                View
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="space-y-3 md:hidden">
                  {pagedItems.map((item) => (
                    <div key={item._id} className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">{item.type}</Badge>
                        <Badge variant={item.completed ? "default" : "secondary"}>
                          {item.completed ? "done" : "pending"}
                        </Badge>
                      </div>
                      <p className="mt-3 text-base font-semibold text-slate-950">{item.type} inspection</p>
                      <div className="mt-3 space-y-2 text-sm text-slate-600">
                        <div className="rounded-2xl bg-slate-50 px-3 py-2">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Property</p>
                          <p className="mt-1 text-slate-950">{resolveAssetLocation(item).propertyLabel}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-2xl bg-slate-50 px-3 py-2">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Scheduled</p>
                            <p className="mt-1 text-slate-950">{formatDate(item.scheduledAt)}</p>
                          </div>
                          <div className="rounded-2xl bg-slate-50 px-3 py-2">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Reported</p>
                            <p className="mt-1 text-slate-950">{formatDate(item.workerReportedAt)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <Button type="button" className="min-h-11 rounded-xl" onClick={() => setSelectedInspectionId(item._id)}>
                          Action
                        </Button>
                        <Button type="button" variant="outline" className="min-h-11 rounded-xl" onClick={() => setSelectedInspectionViewId(item._id)}>
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <WorkerPagination page={page} total={filteredItems.length} pageSize={pageSize} onPageChange={setPage} />
              </>
            ) : (
              <WorkerEmpty icon={ClipboardCheck} title="No inspections match" body="Assigned inspection work will appear here." />
            )}
          </CardContent>
        </Card>
      </WithBone>

      <Sheet open={Boolean(selectedInspection)} onOpenChange={(open) => !open && setSelectedInspectionId(null)}>
        <SheetContent side="right" className={workerSheetClassName}>
          <SheetHeader className="border-b border-slate-200 px-5 py-4">
            <SheetTitle>Inspection action</SheetTitle>
            <SheetDescription>Submit worker report, damage note, proof files.</SheetDescription>
          </SheetHeader>
          {selectedInspection ? (
            <form
              className="grid gap-4 p-5"
              onSubmit={(event) => {
                event.preventDefault()
                submitInspectionReport.mutate({
                  id: selectedInspection._id,
                  workerReport: inspectionNotes[selectedInspection._id] ?? selectedInspection.workerReport ?? "",
                  damageReport: inspectionDamage[selectedInspection._id] ?? selectedInspection.damageReport ?? "",
                  workerReportFiles: inspectionFiles[selectedInspection._id] ?? selectedInspection.workerReportFiles ?? [],
                  actualCost: inspectionCosts[selectedInspection._id] ? Number(inspectionCosts[selectedInspection._id]) : undefined,
                  completed: true,
                }, {
                  onSuccess: () => setSelectedInspectionId(null),
                })
              }}
            >
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-medium text-slate-950">{selectedInspection.type} inspection</p>
                <p className="mt-1">{resolveAssetLocation(selectedInspection).propertyLabel}</p>
                <p className="mt-1">{resolveAssetLocation(selectedInspection).unitLabel}</p>
                <p className="mt-1">{selectedInspection.scheduledAt ? `Scheduled ${formatDate(selectedInspection.scheduledAt)}` : "No schedule"}</p>
              </div>
              <Field>
                <FieldLabel>Actual cost</FieldLabel>
                <Input
                  className="h-11 rounded-xl bg-white"
                  inputMode="decimal"
                  placeholder="0"
                  value={inspectionCosts[selectedInspection._id] ?? `${selectedInspection.actualCost ?? ""}`}
                  onChange={(event) => setInspectionCosts((current) => ({ ...current, [selectedInspection._id]: event.target.value ?? "" }))}
                />
              </Field>
              <Field>
                <FieldLabel>Worker report</FieldLabel>
                <Textarea
                  className="min-h-28 rounded-2xl bg-white"
                  value={inspectionNotes[selectedInspection._id] ?? selectedInspection.workerReport ?? ""}
                  onChange={(event) => setInspectionNotes((current) => ({ ...current, [selectedInspection._id]: event.target.value ?? "" }))}
                />
              </Field>
              <Field>
                <FieldLabel>Damage report</FieldLabel>
                <Textarea
                  className="min-h-28 rounded-2xl bg-white"
                  value={inspectionDamage[selectedInspection._id] ?? selectedInspection.damageReport ?? ""}
                  onChange={(event) => setInspectionDamage((current) => ({ ...current, [selectedInspection._id]: event.target.value ?? "" }))}
                />
              </Field>
              <UploadCollectionField
                label="Report files"
                accept="image/*,.pdf,.doc,.docx"
                kind="file"
                values={inspectionFiles[selectedInspection._id] ?? selectedInspection.workerReportFiles ?? []}
                onChange={(values) => setInspectionFiles((current) => ({ ...current, [selectedInspection._id]: values }))}
              />
              <Button type="submit" className="min-h-11 rounded-xl" disabled={submitInspectionReport.isPending}>
                Submit inspection
              </Button>
            </form>
          ) : null}
        </SheetContent>
      </Sheet>

      <Sheet open={Boolean(selectedInspectionView)} onOpenChange={(open) => !open && setSelectedInspectionViewId(null)}>
        <SheetContent side="right" className={workerSheetClassName}>
          <SheetHeader className="border-b border-slate-200 px-5 py-4">
            <SheetTitle>Inspection details</SheetTitle>
            <SheetDescription>See inspection context before worker submits report.</SheetDescription>
          </SheetHeader>
          {selectedInspectionView ? (
            <div className="grid gap-4 p-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{selectedInspectionView.type}</Badge>
                  <Badge variant={selectedInspectionView.completed ? "default" : "secondary"}>
                    {selectedInspectionView.completed ? "done" : "pending"}
                  </Badge>
                </div>
                <p className="mt-3 text-base text-slate-700">{selectedInspectionView.notes ?? "No inspection note."}</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border p-4 text-sm text-slate-700">
                  <p className="font-medium text-slate-950">Location</p>
                  <p className="mt-2">{resolveAssetLocation(selectedInspectionView).propertyLabel}</p>
                  <p className="mt-1">{resolveAssetLocation(selectedInspectionView).unitLabel}</p>
                </div>
                <div className="rounded-2xl border p-4 text-sm text-slate-700">
                  <p className="font-medium text-slate-950">Schedule</p>
                  <p className="mt-2">{formatDate(selectedInspectionView.scheduledAt)}</p>
                  <p className="mt-1">Reported {formatDate(selectedInspectionView.workerReportedAt)}</p>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border p-4 text-sm text-slate-700">
                  <p className="font-medium text-slate-950">Estimated cost</p>
                  <p className="mt-2">{formatMoney(selectedInspectionView.estimatedCost ?? 0, (selectedInspectionView.currency ?? "usd").toUpperCase())}</p>
                </div>
                <div className="rounded-2xl border p-4 text-sm text-slate-700">
                  <p className="font-medium text-slate-950">Actual cost</p>
                  <p className="mt-2">{formatMoney(selectedInspectionView.actualCost ?? 0, (selectedInspectionView.currency ?? "usd").toUpperCase())}</p>
                </div>
              </div>
              <div className="rounded-2xl border p-4 text-sm text-slate-700">
                <p className="font-medium text-slate-950">Latest worker report</p>
                <p className="mt-2">{selectedInspectionView.workerReport ?? "No report yet."}</p>
              </div>
              <div className="rounded-2xl border p-4 text-sm text-slate-700">
                <p className="font-medium text-slate-950">Damage note</p>
                <p className="mt-2">{selectedInspectionView.damageReport ?? "No damage note."}</p>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}

export function WorkerRecurringPage() {
  const { recurringList, recurring } = useWorkerCollections()
  const submitRecurringReport = useWorkerSubmitRecurringReportMutation()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [recurringNotes, setRecurringNotes] = useState<Record<string, string>>({})
  const [recurringFiles, setRecurringFiles] = useState<Record<string, string[]>>({})
  const [recurringCosts, setRecurringCosts] = useState<Record<string, string>>({})
  const [selectedRecurringId, setSelectedRecurringId] = useState<string | null>(null)
  const [selectedRecurringViewId, setSelectedRecurringViewId] = useState<string | null>(null)

  const filteredItems = useMemo(() => {
    return recurringList.filter((item) => {
      const latestStatus = item.runHistory?.[0]?.status ?? "scheduled"
      if (statusFilter !== "all" && latestStatus !== statusFilter) return false
      if (!search.trim()) return true
      const needle = search.trim().toLowerCase()
      return [item.title, item.description, item.frequency, latestStatus]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle)
    })
  }, [recurringList, search, statusFilter])

  const [page, setPage] = useResetPage([search, statusFilter])
  const pageSize = 4
  const pagedItems = paginateItems(filteredItems, page, pageSize)
  const selectedRecurring = recurringList.find((item) => item._id === selectedRecurringId) ?? null
  const selectedRecurringView = recurringList.find((item) => item._id === selectedRecurringViewId) ?? null

  return (
    <div className="space-y-6">
      <WorkerPageHero
        icon={Repeat}
        badge="Recurring"
        title="Recurring work with simple submit flow."
        body="See repeat task list first, then open action or details only when needed."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <WorkerStatCard label="Plans" value={recurringList.length} note="Assigned recurring schedules" />
        <WorkerStatCard label="Due soon" value={recurringList.filter((item) => Boolean(item.nextRunAt)).length} note="Has next run date" />
        <WorkerStatCard label="Completed runs" value={recurringList.filter((item) => item.runHistory?.[0]?.status === "completed").length} note="Latest run closed" />
        <WorkerStatCard label="Active" value={recurringList.filter((item) => item.isActive !== false).length} note="Still active schedules" />
      </div>

      <WithBone name="worker-page-recurring" loading={recurring.isLoading} fallback={<DashboardTableSkeleton />}>
        <Card>
          <CardHeader>
            <CardTitle>Recurring table</CardTitle>
            <CardDescription>Desktop table, mobile cards, full-width sheets for run submit and details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <WorkerFilterBar search={search} onSearchChange={setSearch}>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
              >
                <option value="all">All statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
              </select>
            </WorkerFilterBar>

            {pagedItems.length ? (
              <>
                <div className="hidden overflow-hidden rounded-2xl border border-slate-200 md:block">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead>Task</TableHead>
                        <TableHead>Frequency</TableHead>
                        <TableHead>Next run</TableHead>
                        <TableHead>Latest status</TableHead>
                        <TableHead>Reported</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagedItems.map((item) => (
                        <TableRow key={item._id}>
                          <TableCell className="min-w-52">
                            <div>
                              <p className="font-medium text-slate-950">{item.title}</p>
                              <p className="mt-1 text-xs text-slate-500">{resolveAssetLocation(item).propertyLabel}</p>
                            </div>
                          </TableCell>
                          <TableCell>{item.frequency}</TableCell>
                          <TableCell>{formatDate(item.nextRunAt)}</TableCell>
                          <TableCell><Badge>{item.runHistory?.[0]?.status ?? "scheduled"}</Badge></TableCell>
                          <TableCell>{formatDate(item.runHistory?.[0]?.reportedAt)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2 whitespace-nowrap">
                              <Button type="button" size="sm" className="rounded-xl" onClick={() => setSelectedRecurringId(item._id)}>
                                Action
                              </Button>
                              <Button type="button" size="sm" variant="outline" className="rounded-xl" onClick={() => setSelectedRecurringViewId(item._id)}>
                                View
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="space-y-3 md:hidden">
                  {pagedItems.map((item) => (
                    <div key={item._id} className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">{item.frequency}</Badge>
                        <Badge>{item.runHistory?.[0]?.status ?? "scheduled"}</Badge>
                      </div>
                      <p className="mt-3 text-base font-semibold text-slate-950">{item.title}</p>
                      <div className="mt-3 space-y-2 text-sm text-slate-600">
                        <div className="rounded-2xl bg-slate-50 px-3 py-2">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Property</p>
                          <p className="mt-1 text-slate-950">{resolveAssetLocation(item).propertyLabel}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-2xl bg-slate-50 px-3 py-2">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Next run</p>
                            <p className="mt-1 text-slate-950">{formatDate(item.nextRunAt)}</p>
                          </div>
                          <div className="rounded-2xl bg-slate-50 px-3 py-2">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Reported</p>
                            <p className="mt-1 text-slate-950">{formatDate(item.runHistory?.[0]?.reportedAt)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <Button type="button" className="min-h-11 rounded-xl" onClick={() => setSelectedRecurringId(item._id)}>
                          Action
                        </Button>
                        <Button type="button" variant="outline" className="min-h-11 rounded-xl" onClick={() => setSelectedRecurringViewId(item._id)}>
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <WorkerPagination page={page} total={filteredItems.length} pageSize={pageSize} onPageChange={setPage} />
              </>
            ) : (
              <WorkerEmpty icon={Repeat} title="No recurring tasks match" body="Assigned repeat jobs will show here." />
            )}
          </CardContent>
        </Card>
      </WithBone>

      <Sheet open={Boolean(selectedRecurring)} onOpenChange={(open) => !open && setSelectedRecurringId(null)}>
        <SheetContent side="right" className={workerSheetClassName}>
          <SheetHeader className="border-b border-slate-200 px-5 py-4">
            <SheetTitle>Recurring action</SheetTitle>
            <SheetDescription>Submit run note and proof files fast.</SheetDescription>
          </SheetHeader>
          {selectedRecurring ? (
            <form
              className="grid gap-4 p-5"
              onSubmit={(event) => {
                event.preventDefault()
                submitRecurringReport.mutate({
                  id: selectedRecurring._id,
                  status: "completed",
                  note: recurringNotes[selectedRecurring._id] ?? "",
                  files: recurringFiles[selectedRecurring._id] ?? [],
                  actualCost: recurringCosts[selectedRecurring._id] ? Number(recurringCosts[selectedRecurring._id]) : undefined,
                }, {
                  onSuccess: () => setSelectedRecurringId(null),
                })
              }}
            >
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-medium text-slate-950">{selectedRecurring.title}</p>
                <p className="mt-1">{resolveAssetLocation(selectedRecurring).propertyLabel}</p>
                <p className="mt-1">{resolveAssetLocation(selectedRecurring).unitLabel}</p>
                <p className="mt-1">{selectedRecurring.nextRunAt ? `Next run ${formatDate(selectedRecurring.nextRunAt)}` : "No next run date"}</p>
              </div>
              <Field>
                <FieldLabel>Actual cost</FieldLabel>
                <Input
                  className="h-11 rounded-xl bg-white"
                  inputMode="decimal"
                  placeholder="0"
                  value={recurringCosts[selectedRecurring._id] ?? `${selectedRecurring.actualCost ?? ""}`}
                  onChange={(event) => setRecurringCosts((current) => ({ ...current, [selectedRecurring._id]: event.target.value ?? "" }))}
                />
              </Field>
              <Field>
                <FieldLabel>Run report</FieldLabel>
                <Textarea
                  className="min-h-28 rounded-2xl bg-white"
                  value={recurringNotes[selectedRecurring._id] ?? selectedRecurring.runHistory?.[0]?.note ?? ""}
                  onChange={(event) => setRecurringNotes((current) => ({ ...current, [selectedRecurring._id]: event.target.value ?? "" }))}
                />
              </Field>
              <UploadCollectionField
                label="Run files"
                accept="image/*,.pdf,.doc,.docx"
                kind="file"
                values={recurringFiles[selectedRecurring._id] ?? selectedRecurring.runHistory?.[0]?.files ?? []}
                onChange={(values) => setRecurringFiles((current) => ({ ...current, [selectedRecurring._id]: values }))}
              />
              <Button type="submit" className="min-h-11 rounded-xl" disabled={submitRecurringReport.isPending}>
                Submit recurring
              </Button>
            </form>
          ) : null}
        </SheetContent>
      </Sheet>

      <Sheet open={Boolean(selectedRecurringView)} onOpenChange={(open) => !open && setSelectedRecurringViewId(null)}>
        <SheetContent side="right" className={workerSheetClassName}>
          <SheetHeader className="border-b border-slate-200 px-5 py-4">
            <SheetTitle>Recurring details</SheetTitle>
            <SheetDescription>See repeat task context before worker submits.</SheetDescription>
          </SheetHeader>
          {selectedRecurringView ? (
            <div className="grid gap-4 p-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{selectedRecurringView.frequency}</Badge>
                  <Badge>{selectedRecurringView.runHistory?.[0]?.status ?? "scheduled"}</Badge>
                </div>
                <p className="mt-3 text-lg font-semibold text-slate-950">{selectedRecurringView.title}</p>
                <p className="mt-2 text-sm text-slate-600">{selectedRecurringView.description ?? "No description"}</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border p-4 text-sm text-slate-700">
                  <p className="font-medium text-slate-950">Location</p>
                  <p className="mt-2">{resolveAssetLocation(selectedRecurringView).propertyLabel}</p>
                  <p className="mt-1">{resolveAssetLocation(selectedRecurringView).unitLabel}</p>
                </div>
                <div className="rounded-2xl border p-4 text-sm text-slate-700">
                  <p className="font-medium text-slate-950">Run timing</p>
                  <p className="mt-2">{selectedRecurringView.nextRunAt ? `Next ${formatDate(selectedRecurringView.nextRunAt)}` : "No next run date"}</p>
                  <p className="mt-1">Last report {formatDate(selectedRecurringView.runHistory?.[0]?.reportedAt)}</p>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border p-4 text-sm text-slate-700">
                  <p className="font-medium text-slate-950">Estimated cost</p>
                  <p className="mt-2">{formatMoney(selectedRecurringView.estimatedCost ?? 0, (selectedRecurringView.currency ?? "usd").toUpperCase())}</p>
                </div>
                <div className="rounded-2xl border p-4 text-sm text-slate-700">
                  <p className="font-medium text-slate-950">Actual cost</p>
                  <p className="mt-2">{formatMoney(selectedRecurringView.actualCost ?? 0, (selectedRecurringView.currency ?? "usd").toUpperCase())}</p>
                </div>
              </div>
              <div className="rounded-2xl border p-4 text-sm text-slate-700">
                <p className="font-medium text-slate-950">Latest note</p>
                <p className="mt-2">{selectedRecurringView.runHistory?.[0]?.note ?? "No latest note."}</p>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}

export function WorkerMessagesPage() {
  const { me, messageList, messages } = useWorkerCollections()
  const sendMessage = useWorkerSendMessageMutation()
  const [search, setSearch] = useState("")
  const [kindFilter, setKindFilter] = useState("all")
  const [messageDrafts, setMessageDrafts] = useState<Record<string, string>>({})
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)
  const [selectedMessageViewId, setSelectedMessageViewId] = useState<string | null>(null)

  const threads = useMemo(() => {
    const seen = new Set<string>()
    return messageList.filter((item) => {
      const roomKey = item.roomId ?? item._id
      if (seen.has(roomKey)) return false
      seen.add(roomKey)
      return true
    })
  }, [messageList])

  const filteredThreads = useMemo(() => {
    return threads.filter((item) => {
      if (kindFilter !== "all" && (item.kind ?? "text") !== kindFilter) return false
      if (!search.trim()) return true
      const needle = search.trim().toLowerCase()
      return [item.senderName, item.content, item.kind, item.roomType]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle)
    })
  }, [kindFilter, search, threads])

  const [page, setPage] = useResetPage([search, kindFilter])
  const pageSize = 5
  const pagedThreads = paginateItems(filteredThreads, page, pageSize)
  const selectedMessage = threads.find((item) => item._id === selectedMessageId) ?? null
  const selectedMessageView = threads.find((item) => item._id === selectedMessageViewId) ?? null

  return (
    <div className="space-y-6">
      <WorkerPageHero
        icon={MessageSquare}
        badge="Messages"
        title="Messages, notices, files in one worker inbox."
        body="Owner updates, ticket chat, and shared files stay together with simple reply flow."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <WorkerStatCard label="Threads" value={threads.length} note="Unique active rooms" />
        <WorkerStatCard label="Unread" value={messageList.filter((item) => !item.readBy?.includes(me?.id ?? "")).length} note="Need review" />
        <WorkerStatCard label="Documents" value={messageList.filter((item) => item.kind === "document").length} note="Shared file messages" />
        <WorkerStatCard label="Direct rooms" value={threads.filter((item) => (item.roomType ?? "direct") === "direct").length} note="One to one rooms" />
      </div>

      <WithBone name="worker-page-messages" loading={messages.isLoading} fallback={<DashboardTableSkeleton />}>
        <Card>
          <CardHeader>
            <CardTitle>Inbox table</CardTitle>
            <CardDescription>Desktop table, mobile cards, full-width sheets for reply and details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <WorkerFilterBar search={search} onSearchChange={setSearch}>
              <select
                value={kindFilter}
                onChange={(event) => setKindFilter(event.target.value)}
                className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
              >
                <option value="all">All kinds</option>
                <option value="text">Text</option>
                <option value="document">Document</option>
              </select>
            </WorkerFilterBar>

            {pagedThreads.length ? (
              <>
                <div className="hidden overflow-hidden rounded-2xl border border-slate-200 md:block">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead>Sender</TableHead>
                        <TableHead>Kind</TableHead>
                        <TableHead>Room</TableHead>
                        <TableHead>Preview</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagedThreads.map((item) => (
                        <TableRow key={item._id}>
                          <TableCell className="font-medium text-slate-950">{item.senderName ?? "Team"}</TableCell>
                          <TableCell><Badge variant="outline">{item.kind ?? "text"}</Badge></TableCell>
                          <TableCell>{item.roomType ?? "direct"}</TableCell>
                          <TableCell className="max-w-56 truncate">{item.content ?? "No content"}</TableCell>
                          <TableCell>{formatDate(item.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2 whitespace-nowrap">
                              <Button type="button" size="sm" className="rounded-xl" onClick={() => setSelectedMessageId(item._id)}>
                                Reply
                              </Button>
                              <Button type="button" size="sm" variant="outline" className="rounded-xl" onClick={() => setSelectedMessageViewId(item._id)}>
                                View
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="space-y-3 md:hidden">
                  {pagedThreads.map((item) => {
                    return (
                      <div key={item._id} className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">{item.kind ?? "text"}</Badge>
                          <Badge variant={!item.readBy?.includes(me?.id ?? "") ? "default" : "secondary"}>
                            {!item.readBy?.includes(me?.id ?? "") ? "new" : "seen"}
                          </Badge>
                        </div>
                        <p className="mt-3 text-base font-semibold text-slate-950">{item.senderName ?? "Team"}</p>
                        <div className="mt-3 space-y-2 text-sm text-slate-600">
                          <div className="rounded-2xl bg-slate-50 px-3 py-2">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Type</p>
                            <p className="mt-1 text-slate-950">{item.roomType ?? "direct"}</p>
                          </div>
                          <div className="rounded-2xl bg-slate-50 px-3 py-2">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Received</p>
                            <p className="mt-1 text-slate-950">{formatDate(item.createdAt)}</p>
                          </div>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <Button type="button" className="min-h-11 rounded-xl" onClick={() => setSelectedMessageId(item._id)}>
                            Reply
                          </Button>
                          <Button type="button" variant="outline" className="min-h-11 rounded-xl" onClick={() => setSelectedMessageViewId(item._id)}>
                            View
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <WorkerPagination page={page} total={filteredThreads.length} pageSize={pageSize} onPageChange={setPage} />
              </>
            ) : (
              <WorkerEmpty icon={MessageSquare} title="No threads match" body="Owner and team messages appear here." />
            )}
          </CardContent>
        </Card>
      </WithBone>

      <Sheet open={Boolean(selectedMessage)} onOpenChange={(open) => !open && setSelectedMessageId(null)}>
        <SheetContent side="right" className={workerSheetClassName}>
          <SheetHeader className="border-b border-slate-200 px-5 py-4">
            <SheetTitle>Reply message</SheetTitle>
            <SheetDescription>Quick worker reply for owner, office, or ticket chat.</SheetDescription>
          </SheetHeader>
          {selectedMessage ? (() => {
            const roomKey = selectedMessage.roomId ?? selectedMessage._id
            return (
              <div className="grid gap-4 p-5">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <p className="font-medium text-slate-950">{selectedMessage.senderName ?? "Team"}</p>
                  <p className="mt-1 capitalize">{selectedMessage.roomType ?? "direct"} | {selectedMessage.kind ?? "text"}</p>
                  <p className="mt-2">{selectedMessage.content ?? "No message body"}</p>
                </div>
                <Textarea
                  className="min-h-32 rounded-2xl bg-white"
                  placeholder="Send quick update..."
                  value={messageDrafts[roomKey] ?? ""}
                  onChange={(event) =>
                    setMessageDrafts((current) => ({ ...current, [roomKey]: event.target.value ?? "" }))
                  }
                />
                <Button
                  className="min-h-11 rounded-xl"
                  disabled={sendMessage.isPending || !(messageDrafts[roomKey] ?? "").trim()}
                  onClick={() =>
                    sendMessage.mutate({
                      roomType: (selectedMessage.roomType as "direct" | "ticket") ?? "direct",
                      roomId: selectedMessage.roomId ?? "",
                      content: messageDrafts[roomKey] ?? "",
                    }, {
                      onSuccess: () => setSelectedMessageId(null),
                    })
                  }
                >
                  Send reply
                </Button>
              </div>
            )
          })() : null}
        </SheetContent>
      </Sheet>

      <Sheet open={Boolean(selectedMessageView)} onOpenChange={(open) => !open && setSelectedMessageViewId(null)}>
        <SheetContent side="right" className={workerSheetClassName}>
          <SheetHeader className="border-b border-slate-200 px-5 py-4">
            <SheetTitle>Message details</SheetTitle>
            <SheetDescription>See update, file, or notice clearly before replying.</SheetDescription>
          </SheetHeader>
          {selectedMessageView ? (
            <div className="grid gap-4 p-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{selectedMessageView.kind ?? "text"}</Badge>
                  <Badge>{selectedMessageView.roomType ?? "direct"}</Badge>
                </div>
                <p className="mt-3 text-lg font-semibold text-slate-950">{selectedMessageView.senderName ?? "Team"}</p>
                <p className="mt-2 text-sm text-slate-600">{selectedMessageView.content ?? "No message body"}</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border p-4 text-sm text-slate-700">
                  <p className="font-medium text-slate-950">Received</p>
                  <p className="mt-2">{formatDateTime(selectedMessageView.createdAt)}</p>
                </div>
                <div className="rounded-2xl border p-4 text-sm text-slate-700">
                  <p className="font-medium text-slate-950">Status</p>
                  <p className="mt-2">{selectedMessageView.readBy?.includes(me?.id ?? "") ? "Seen" : "New"}</p>
                </div>
              </div>
              {selectedMessageView.attachments?.length ? (
                <div className="rounded-2xl border p-4 text-sm text-slate-700">
                  <p className="font-medium text-slate-950">Shared files</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedMessageView.attachments.map((file) => (
                      <a key={file} href={file} target="_blank" rel="noreferrer" className="rounded-lg border px-3 py-2 text-xs text-sky-700">
                        Open file
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}

export function WorkerSettingsPage() {
  const { me, ticketList, inspectionList, recurringList, messageList, tickets, inspections, recurring, messages } =
    useWorkerCollections()

  const loading =
    me === undefined ||
    tickets.isLoading ||
    inspections.isLoading ||
    recurring.isLoading ||
    messages.isLoading

  const workloadRows = [
    { label: "Tickets", total: ticketList.length, open: ticketList.filter((item) => item.status !== "completed").length },
    { label: "Inspections", total: inspectionList.length, open: inspectionList.filter((item) => !item.completed).length },
    { label: "Recurring", total: recurringList.length, open: recurringList.filter((item) => item.runHistory?.[0]?.status !== "completed").length },
    { label: "Messages", total: messageList.length, open: messageList.filter((item) => !item.readBy?.includes(me?.id ?? "")).length },
  ]

  return (
    <div className="space-y-6">
      <WorkerPageHero
        icon={Settings2}
        badge="Settings"
        title="Worker settings and scope page."
        body="Simple account details, workload summary, property link count, and mobile-readable rules so worker knows exactly what this account can do."
      />

      <WithBone name="worker-page-settings" loading={loading} fallback={<DashboardPanelSkeleton />}>
        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>Current worker identity and access scope.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-700">
              <div className="rounded-2xl border p-4">
                <p className="font-medium text-slate-950">Name</p>
                <p className="mt-1">{me?.fullName ?? "Unknown"}</p>
              </div>
              <div className="rounded-2xl border p-4">
                <p className="font-medium text-slate-950">Email</p>
                <p className="mt-1 break-all">{me?.email ?? "Unknown"}</p>
              </div>
              <div className="rounded-2xl border p-4">
                <p className="font-medium text-slate-950">Role</p>
                <p className="mt-1">{me?.role ?? "worker"}</p>
              </div>
              <div className="rounded-2xl border p-4">
                <p className="font-medium text-slate-950">Property links</p>
                <p className="mt-1">{me?.propertyIds?.length ?? 0} linked properties</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Worker rules</CardTitle>
            <CardDescription>Important behavior already live in platform.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-slate-700">
              <div className="rounded-2xl border p-4">Worker can receive tickets, inspections, recurring tasks, direct messages.</div>
              <div className="rounded-2xl border p-4">Worker can link to multiple properties under owner scope.</div>
              <div className="rounded-2xl border p-4">Most worker actions happen from mobile, so pages now keep forms stacked and touch-friendly.</div>
              <div className="rounded-2xl border p-4">Owner team still controls assignment, notices, and property setup.</div>
            </CardContent>
          </Card>

          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Workload table</CardTitle>
              <CardDescription>One quick snapshot for current assigned work.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>Area</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Open / unread</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workloadRows.map((row) => (
                      <TableRow key={row.label}>
                        <TableCell className="font-medium text-slate-950">{row.label}</TableCell>
                        <TableCell>{row.total}</TableCell>
                        <TableCell>{row.open}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </WithBone>
    </div>
  )
}
