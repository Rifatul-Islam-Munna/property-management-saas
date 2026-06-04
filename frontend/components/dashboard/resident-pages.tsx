"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  Bell,
  BriefcaseBusiness,
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  CreditCard,
  FileText,
  Home,
  Mail,
  MapPin,
  Phone,
  Repeat,
  Settings2,
  Shield,
  Ticket,
  User2,
  Users,
  Wrench,
} from "lucide-react"
import { postRequest } from "@/api-hooks/api-hooks"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { UploadCollectionField } from "@/components/shared/upload-collection-field"
import { RichTextContent } from "@/components/shared/rich-text-editor"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  DashboardPanelSkeleton,
  DashboardTableSkeleton,
  WithBone,
} from "@/components/dashboard/dashboard-loading"
import { useResidentCreateTicketMutation, useResidentLeaveTenantMutation, useResidentSendMessageMutation, useResidentUpdateAssignmentRequestMutation } from "@/hooks/use-resident-actions"
import {
  useResidentAnnouncementsQuery,
  useResidentAssignmentRequestsQuery,
  useResidentBillsQuery,
  useResidentMeQuery,
  useResidentMessagesQuery,
  useResidentTicketsQuery,
  useResidentWorkspaceQuery,
} from "@/hooks/use-resident-dashboard"
import { useMeQuery } from "@/hooks/use-auth"
import { useOrganizationStripeSettingsQuery } from "@/hooks/use-organization-settings"
import type { ApiSuccessResponse } from "@/lib/types/api"
import type { BillItem } from "@/lib/types/dashboard"
import { toast } from "sonner"

function formatDate(value?: string | null) {
  if (!value) return "Not set"
  return new Date(value).toLocaleDateString()
}

function formatMoney(value?: number | null, currency = "USD") {
  return `${currency} ${value ?? 0}`
}

function resolveDisplayCurrency(currency: string | null | undefined, fallback = "USD") {
  const normalized = currency?.trim()?.toUpperCase()
  if (!normalized || normalized === "BDT") return fallback
  return normalized
}

function buildMonthDueDate(monthKey: string, dueDay?: number | null) {
  if (!monthKey || !dueDay) return ""
  const [yearString, monthString] = monthKey.split("-")
  const year = Number(yearString)
  const month = Number(monthString)
  if (!year || !month) return ""
  const lastDay = new Date(year, month, 0).getDate()
  return new Date(Date.UTC(year, month - 1, Math.min(dueDay, lastDay))).toISOString()
}

function formatMonthLabel(monthKey?: string | null) {
  if (!monthKey) return "One-time"
  const [yearString, monthString] = monthKey.split("-")
  const year = Number(yearString)
  const month = Number(monthString)
  if (!year || !month) return monthKey
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
  })
}

function formatAddress(address?: {
  street?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  zipCode?: string | null
} | null) {
  return [address?.street, address?.city, address?.state, address?.country, address?.zipCode].filter(Boolean).join(", ") || "Not set"
}

function paginateItems<T>(items: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize
  return items.slice(start, start + pageSize)
}

function PaginationControls({
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
    <div className="flex items-center justify-between gap-3 border-t pt-4 text-sm text-slate-600">
      <p>Page {page} / {totalPages}</p>
      <div className="flex items-center gap-2">
        <Button type="button" size="sm" variant="outline" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="mr-1 size-4" />
          Prev
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next
          <ChevronRight className="ml-1 size-4" />
        </Button>
      </div>
    </div>
  )
}

function ResidentStatCard({
  label,
  value,
  note,
}: {
  label: string
  value: string
  note?: string
}) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-3 text-lg font-semibold text-slate-950">{value}</p>
      {note ? <p className="mt-2 text-xs text-slate-500">{note}</p> : null}
    </div>
  )
}

function ResidentSoftPanel({
  title,
  value,
  note,
}: {
  title: string
  value: string
  note?: string
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{title}</p>
      <p className="mt-3 text-sm font-semibold text-slate-950">{value}</p>
      {note ? <p className="mt-2 text-xs text-slate-500">{note}</p> : null}
    </div>
  )
}

function ResidentPageHero({
  icon: Icon,
  badge,
  title,
  body,
}: {
  icon: typeof Building2
  badge: string
  title: string
  body: string
}) {
  return (
    <section className="rounded-2xl border bg-background p-5">
      <div className="space-y-3">
        <Badge variant="outline" className="border-blue-200 text-blue-700">
          {badge}
        </Badge>
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <Icon className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h1>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{body}</p>
          </div>
        </div>
      </div>
    </section>
  )
}

function ResidentSupportCard({
  title = "Contact property team",
  body = "Send direct message to linked owner account.",
}: {
  title?: string
  body?: string
}) {
  const { data: me } = useResidentMeQuery()
  const sendMessage = useResidentSendMessageMutation()
  const [content, setContent] = useState("")
  const roomId = useMemo(() => {
    if (!me?.activeOwnerId || !me.id) return ""
    return [me.activeOwnerId, me.id].sort().join(":")
  }, [me?.activeOwnerId, me?.id])

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{body}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (!roomId || !content.trim()) return
            sendMessage.mutate(
              {
                roomType: "direct",
                roomId,
                content: content.trim(),
              },
              {
                onSuccess: () => setContent(""),
              }
            )
          }}
        >
          <Textarea
            placeholder={me?.activeOwnerId ? "Write message to property team" : "No owner linked yet"}
            value={content}
            onChange={(event) => setContent(event.target.value ?? "")}
          />
          <Button type="submit" disabled={sendMessage.isPending || !roomId || !content.trim()}>
            Send message
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function ResidentStripePayButton({ bill }: { bill: BillItem }) {
  const [isPending, setIsPending] = useState(false)

  return (
    <Button
      type="button"
      size="sm"
      className="bg-blue-700 text-white hover:bg-blue-800"
      disabled={isPending || bill.status === "paid"}
      onClick={async () => {
        if (typeof window === "undefined") return
        setIsPending(true)
        const origin = window.location.origin
        const [data, error] = await postRequest<
          ApiSuccessResponse<{ checkoutUrl: string }>,
          { successUrl: string; cancelUrl: string }
        >(`/bill/${bill._id}/stripe-checkout`, {
          successUrl: `${origin}/dashboard/resident/pay/success`,
          cancelUrl: `${origin}/dashboard/resident/pay/cancel`,
        })

        if (error || !data?.data?.checkoutUrl) {
          toast.error(error?.message ?? "Stripe checkout failed")
          setIsPending(false)
          return
        }

        window.location.assign(data.data.checkoutUrl)
      }}
    >
      {isPending ? "Opening..." : "Pay now"}
    </Button>
  )
}

function ResidentMonthlyStripePayButton({
  monthKey,
}: {
  monthKey: string
}) {
  const [isPending, setIsPending] = useState(false)

  return (
    <Button
      type="button"
      size="sm"
      className="bg-blue-700 text-white hover:bg-blue-800"
      disabled={isPending}
      onClick={async () => {
        if (typeof window === "undefined") return
        setIsPending(true)
        const origin = window.location.origin
        const [data, error] = await postRequest<
          ApiSuccessResponse<{ checkoutUrl: string }>,
          { monthKey: string; successUrl: string; cancelUrl: string }
        >("/bill/my/monthly-checkout", {
          monthKey,
          successUrl: `${origin}/dashboard/resident/pay/success`,
          cancelUrl: `${origin}/dashboard/resident/pay/cancel`,
        })

        if (error || !data?.data?.checkoutUrl) {
          toast.error(error?.message ?? "Monthly payment checkout failed")
          setIsPending(false)
          return
        }

        window.location.assign(data.data.checkoutUrl)
      }}
    >
      {isPending ? "Opening..." : "Pay monthly rent"}
    </Button>
  )
}

type ResidentBillingRow = {
  id: string
  source: "monthly" | "bill"
  kind: string
  title: string
  monthKey?: string | null
  amount: number
  currency: string
  status: string
  dueDate?: string | null
  paidAt?: string | null
  bill?: BillItem | null
  note?: string | null
}

function ResidentBillingTable({
  rows,
  defaultCurrency,
}: {
  rows: ResidentBillingRow[]
  defaultCurrency: string
}) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [page, setPage] = useState(1)
  const pageSize = 8

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false
      if (typeFilter !== "all" && row.source !== typeFilter) return false
      if (!search.trim()) return true
      const needle = search.trim().toLowerCase()
      return [
        row.title,
        row.kind,
        row.monthKey ?? "",
        row.note ?? "",
        formatMonthLabel(row.monthKey),
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    })
  }, [rows, search, statusFilter, typeFilter])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, typeFilter])

  const pagedRows = paginateItems(filteredRows, page, pageSize)

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>Billing ledger</CardTitle>
        <CardDescription>Full rent, fee, custom bill, payment history.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <Input value={search} onChange={(event) => setSearch(event.target.value ?? "")} placeholder="Search title, month, kind" />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="unpaid">Unpaid</option>
            <option value="overdue">Overdue</option>
          </select>
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All types</option>
            <option value="monthly">Monthly rent/fee</option>
            <option value="bill">Custom bills</option>
          </select>
        </div>
        <div className="overflow-hidden rounded-2xl border">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Month</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedRows.length ? pagedRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="min-w-44">
                    <div>
                      <p className="font-medium text-slate-950">{row.title}</p>
                      {row.note ? <p className="mt-1 whitespace-normal text-xs text-slate-500">{row.note}</p> : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{row.kind}</Badge>
                      <Badge variant="secondary">{row.source === "monthly" ? "monthly" : "custom"}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>{formatMonthLabel(row.monthKey)}</TableCell>
                  <TableCell><Badge>{row.status}</Badge></TableCell>
                  <TableCell>{formatMoney(row.amount, row.currency || defaultCurrency)}</TableCell>
                  <TableCell>{formatDate(row.dueDate)}</TableCell>
                  <TableCell>{formatDate(row.paidAt)}</TableCell>
                  <TableCell className="text-right">
                    {row.bill && row.status !== "paid" ? <ResidentStripePayButton bill={row.bill} /> : <span className="text-xs text-slate-400">No action</span>}
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-sm text-slate-500">
                    No billing rows match filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <PaginationControls page={page} total={filteredRows.length} pageSize={pageSize} onPageChange={setPage} />
      </CardContent>
    </Card>
  )
}

export function ResidentStripePaymentResultPage({
  mode,
  billId,
  token,
  sessionId,
}: {
  mode: "success" | "cancel"
  billId?: string
  token?: string
  sessionId?: string
}) {
  const [state, setState] = useState<{
    loading: boolean
    paid: boolean
    message: string
    bill?: BillItem
  }>({
    loading: mode === "success",
    paid: false,
    message: mode === "cancel" ? "Payment canceled. Bill still pending until paid." : "Verifying Stripe payment...",
  })

  useEffect(() => {
    if (mode !== "success") return
    if (!billId || !token || !sessionId) {
      setState({
        loading: false,
        paid: false,
        message: "Payment return data missing. Please open tenant bills again.",
      })
      return
    }

    let active = true

    const verifyPayment = async () => {
      const [data, error] = await postRequest<
        ApiSuccessResponse<{
          paid: boolean
          bill: BillItem
          sessionStatus?: string | null
          paymentStatus?: string | null
        }>,
        { sessionId: string; token: string }
      >(`/bill/${billId}/stripe-verify`, {
        sessionId,
        token,
      })

      if (!active) return

      if (error || !data?.data) {
        setState({
          loading: false,
          paid: false,
          message: error?.message ?? "Payment verification failed",
        })
        return
      }

      setState({
        loading: false,
        paid: Boolean(data.data.paid),
        message: data.data.paid
          ? "Payment verified. Bill marked paid."
          : `Stripe says ${data.data.paymentStatus ?? data.data.sessionStatus ?? "pending"}.`,
        bill: data.data.bill,
      })
    }

    verifyPayment()

    return () => {
      active = false
    }
  }, [billId, mode, sessionId, token])

  return (
    <div className="space-y-6">
      <ResidentPageHero
        icon={CreditCard}
        badge="Stripe"
        title={mode === "success" ? "Payment return" : "Payment canceled"}
        body="Return page checks token-based Stripe result and shows bill status for mobile users."
      />
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>{mode === "success" ? "Bill payment status" : "Checkout stopped"}</CardTitle>
          <CardDescription>{state.message}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant={state.paid ? "default" : "outline"}>
              {state.loading ? "Verifying" : state.paid ? "Paid" : "Pending"}
            </Badge>
            {state.bill?.paymentMode ? <Badge variant="secondary">{state.bill.paymentMode}</Badge> : null}
            {state.bill?.stripeCheckoutStatus ? <Badge variant="outline">{state.bill.stripeCheckoutStatus}</Badge> : null}
          </div>
          {state.bill ? (
            <div className="rounded-xl border p-4 text-sm text-slate-700">
              <p className="font-medium text-slate-950">{state.bill.title}</p>
              <p className="mt-1">{formatMoney(state.bill.amount, resolveDisplayCurrency(state.bill.currency, "USD"))}</p>
              <p className="mt-1 text-xs text-slate-500">Due: {formatDate(state.bill.dueDate)}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {state.bill.stripeHostedInvoiceUrl ? <a href={state.bill.stripeHostedInvoiceUrl} target="_blank" rel="noreferrer" className="rounded-lg border px-3 py-2 text-xs text-blue-700">Open Stripe invoice</a> : null}
                {state.bill.stripeInvoicePdf ? <a href={state.bill.stripeInvoicePdf} target="_blank" rel="noreferrer" className="rounded-lg border px-3 py-2 text-xs text-blue-700">Open invoice PDF</a> : null}
              </div>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <a href="/dashboard/resident/tenants" className="inline-flex items-center rounded-lg bg-slate-950 px-4 py-2 text-sm text-white">Back to bills</a>
            <a href="/dashboard/resident" className="inline-flex items-center rounded-lg border px-4 py-2 text-sm text-slate-700">Resident home</a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ResidentNoticesList() {
  const announcements = useResidentAnnouncementsQuery()
  const items = announcements.data ?? []

  return (
    <WithBone name="resident-notices-list" loading={announcements.isLoading} fallback={<DashboardTableSkeleton />}>
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Notices</CardTitle>
          <CardDescription>Resident-visible owner and admin communications.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.length ? items.map((notice) => (
            <div key={notice._id} className="rounded-xl border p-4">
              <div className="flex flex-wrap gap-2">
                <p className="font-medium text-slate-950">{notice.title}</p>
                <Badge variant="outline">{notice.type ?? "notice"}</Badge>
                <Badge variant="secondary">{notice.priority ?? "normal"}</Badge>
              </div>
              <RichTextContent value={notice.content} className="mt-2" />
              <p className="mt-3 text-xs text-slate-500">{formatDate(notice.createdAt)}</p>
            </div>
          )) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><Bell /></EmptyMedia>
                <EmptyTitle>No notices yet</EmptyTitle>
                <EmptyDescription>Updates will appear here.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </WithBone>
  )
}

function ResidentDocumentsList() {
  const messages = useResidentMessagesQuery()
  const documents = useMemo(
    () => (messages.data ?? []).filter((item) => item.kind === "document"),
    [messages.data]
  )

  return (
    <WithBone name="resident-documents-list" loading={messages.isLoading} fallback={<DashboardTableSkeleton />}>
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>Files shared to your direct inbox.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {documents.length ? documents.map((item) => (
            <div key={item._id} className="rounded-xl border p-4">
              <p className="font-medium text-slate-950">{item.title ?? "Shared document"}</p>
              <RichTextContent value={item.content ?? "Shared document"} className="mt-2" />
              <p className="mt-1 text-xs text-slate-500">{formatDate(item.createdAt)}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(item.attachments ?? []).map((attachment) => (
                  <a
                    key={attachment}
                    href={attachment}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border px-3 py-2 text-sm text-blue-700"
                  >
                    Open file
                  </a>
                ))}
              </div>
            </div>
          )) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><FileText /></EmptyMedia>
                <EmptyTitle>No documents yet</EmptyTitle>
                <EmptyDescription>Shared files will land here.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </WithBone>
  )
}

function ResidentTicketCreateCard() {
  const workspace = useResidentWorkspaceQuery()
  const createTicket = useResidentCreateTicketMutation()
  const ticketCategories = ["plumbing", "electrical", "hvac", "cleaning", "appliance", "security", "internet", "structural", "general"]
  const ticketPriorities = ["low", "medium", "high", "emergency"]
  const [ticketImages, setTicketImages] = useState<string[]>([])
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "general",
    priority: "medium",
  })

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>Create ticket</CardTitle>
        <CardDescription>Open support request for your active property and unit.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (!workspace.data?.property?._id || !workspace.data?.tenant?._id) return
            createTicket.mutate(
              {
                propertyId: workspace.data.property._id,
                unitId: workspace.data.unit?._id,
                tenantId: workspace.data.tenant._id,
                title: form.title,
                description: form.description,
                category: form.category,
                priority: form.priority,
                images: ticketImages,
              },
              {
                onSuccess: () => {
                  setTicketImages([])
                  setForm({
                    title: "",
                    description: "",
                    category: "general",
                    priority: "medium",
                  })
                },
              }
            )
          }}
        >
          <FieldGroup>
            <Field><FieldLabel>Title</FieldLabel><Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value ?? "" }))} /></Field>
            <Field>
              <FieldLabel>Category</FieldLabel>
              <Select value={form.category} onValueChange={(value) => setForm((current) => ({ ...current, category: value ?? "general" }))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {ticketCategories.map((item) => (
                      <SelectItem key={item} value={item}>{item}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Priority</FieldLabel>
              <Select value={form.priority} onValueChange={(value) => setForm((current) => ({ ...current, priority: value ?? "medium" }))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {ticketPriorities.map((item) => (
                      <SelectItem key={item} value={item}>{item}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field><FieldLabel>Description</FieldLabel><Textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value ?? "" }))} /></Field>
            <UploadCollectionField
              label="Issue images (Optional)"
              accept="image/*"
              kind="image"
              values={ticketImages}
              onChange={setTicketImages}
            />
          </FieldGroup>
          <Button type="submit" disabled={createTicket.isPending || !workspace.data?.property?._id || !form.title || !form.description}>
            Submit ticket
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function ResidentTicketsList() {
  const tickets = useResidentTicketsQuery()
  const items = tickets.data ?? []

  return (
    <WithBone name="resident-tickets-list" loading={tickets.isLoading} fallback={<DashboardTableSkeleton />}>
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Your tickets</CardTitle>
          <CardDescription>Every ticket created from this resident account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.length ? items.map((ticket) => (
            <div key={ticket._id} className="rounded-xl border p-4">
              <div className="flex flex-wrap gap-2">
                <p className="font-medium text-slate-950">{ticket.title}</p>
                <Badge variant="outline">{ticket.category}</Badge>
                <Badge variant="secondary">{ticket.priority}</Badge>
                <Badge>{ticket.status}</Badge>
              </div>
              <p className="mt-2 text-sm text-slate-600">{ticket.description}</p>
              <div className="mt-3 grid gap-3 rounded-xl bg-slate-50 p-3 text-sm md:grid-cols-3">
                <div><p className="text-xs uppercase tracking-wide text-slate-500">Created</p><p className="font-medium text-slate-950">{formatDate(ticket.createdAt)}</p></div>
                <div><p className="text-xs uppercase tracking-wide text-slate-500">Due</p><p className="font-medium text-slate-950">{formatDate(ticket.dueDate)}</p></div>
                <div><p className="text-xs uppercase tracking-wide text-slate-500">Comments</p><p className="font-medium text-slate-950">{ticket.comments?.length ?? 0}</p></div>
              </div>
            </div>
          )) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><Ticket /></EmptyMedia>
                <EmptyTitle>No tickets yet</EmptyTitle>
                <EmptyDescription>First request starts from create card.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </WithBone>
  )
}

export function ResidentPropertiesPage() {
  const workspace = useResidentWorkspaceQuery()
  const pendingAssignment = workspace.data?.pendingAssignment

  return (
    <div className="space-y-6">
      <ResidentPageHero icon={Building2} badge="Portfolio" title="Property" body="Resident-facing property profile, address, amenities, and file access." />
      <WithBone name="resident-property" loading={workspace.isLoading} fallback={<DashboardPanelSkeleton />}>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <ResidentStatCard label="Property" value={workspace.data?.property?.name ?? "Pending assignment"} note={workspace.data?.property?.type ?? "No active property"} />
            <ResidentStatCard label="Contact email" value={workspace.data?.property?.contactEmail ?? "Not set"} note="Property team inbox" />
            <ResidentStatCard label="Contact phone" value={workspace.data?.property?.contactPhone ?? "Not set"} note="Call or WhatsApp if provided" />
          </div>
          <Card className="overflow-hidden border-slate-200 shadow-none">
            <CardHeader className="bg-gradient-to-r from-slate-950 to-slate-800 text-white">
              <CardTitle>{workspace.data?.property?.name ?? "No active property"}</CardTitle>
              <CardDescription className="text-slate-300">{workspace.data?.property?.type ?? "Waiting for owner assignment"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-6 text-sm text-slate-700">
            {!workspace.data?.property && pendingAssignment ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="font-medium text-slate-950">Assignment pending acceptance</p>
                <p className="mt-1 text-sm text-slate-600">Open `Users` page and accept owner invite first. After accept, assigned property shows here.</p>
              </div>
            ) : null}
            <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
              <div className="space-y-4">
                <div className="rounded-2xl border p-4">
                  <div className="flex items-center gap-2 text-slate-500">
                    <MapPin className="size-4" />
                    <p className="text-xs uppercase tracking-[0.2em]">Address</p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-700">{formatAddress(workspace.data?.property?.address)}</p>
                </div>
                <div className="rounded-2xl border p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Description</p>
                  <p className="mt-3 leading-6">{workspace.data?.property?.description ?? "No description yet"}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl border p-4">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Mail className="size-4" />
                    <p className="text-xs uppercase tracking-[0.2em]">Email</p>
                  </div>
                  <p className="mt-3">{workspace.data?.property?.contactEmail ?? "No email"}</p>
                </div>
                <div className="rounded-2xl border p-4">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Phone className="size-4" />
                    <p className="text-xs uppercase tracking-[0.2em]">Phone</p>
                  </div>
                  <p className="mt-3">{workspace.data?.property?.contactPhone ?? "No phone"}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Amenities</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(workspace.data?.property?.amenities ?? []).length ? (workspace.data?.property?.amenities ?? []).map((item) => <Badge key={item} variant="secondary">{item}</Badge>) : <span className="text-slate-500">No amenities listed</span>}
              </div>
            </div>
            </CardContent>
          </Card>
        </div>
      </WithBone>
      <ResidentDocumentsList />
    </div>
  )
}

export function ResidentUnitsPage() {
  const workspace = useResidentWorkspaceQuery()
  const { data: me } = useMeQuery()
  const stripeSettings = useOrganizationStripeSettingsQuery(
    Boolean(me && ["tetentwoner", "admin", "super_admin"].includes(me.role))
  )
  const defaultCurrency = stripeSettings.data?.defaultCurrency?.toUpperCase() ?? "USD"

  return (
    <div className="space-y-6">
      <ResidentPageHero icon={Home} badge="Unit" title="Unit" body="Active unit details, rent amount, amenities, and occupancy status." />
      <WithBone name="resident-unit" loading={workspace.isLoading} fallback={<DashboardPanelSkeleton />}>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <ResidentStatCard label="Unit" value={workspace.data?.unit?.unitNumber ?? "Not linked"} note={workspace.data?.unit?.type ?? "Type pending"} />
            <ResidentStatCard label="Status" value={workspace.data?.unit?.status ?? "Unknown"} />
            <ResidentStatCard label="Floor" value={String(workspace.data?.unit?.floor ?? "n/a")} />
            <ResidentStatCard label="Monthly rent" value={formatMoney(workspace.data?.unit?.monthlyRent ?? workspace.data?.tenant?.monthlyRent ?? 0, defaultCurrency)} />
          </div>
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Unit details</CardTitle>
              <CardDescription>Clean unit facts, amenities, possible recurring extras.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm text-slate-700 md:grid-cols-2">
              <div className="rounded-2xl border p-4"><p className="text-xs uppercase tracking-[0.2em] text-slate-500">Area</p><p className="mt-2 font-medium text-slate-950">{workspace.data?.unit?.area ?? "n/a"}</p></div>
              <div className="rounded-2xl border p-4"><p className="text-xs uppercase tracking-[0.2em] text-slate-500">Property</p><p className="mt-2 font-medium text-slate-950">{workspace.data?.property?.name ?? "No property"}</p></div>
              <div className="rounded-2xl border p-4 md:col-span-2"><p className="text-xs uppercase tracking-[0.2em] text-slate-500">Amenities</p><div className="mt-3 flex flex-wrap gap-2">{(workspace.data?.unit?.amenities ?? []).length ? (workspace.data?.unit?.amenities ?? []).map((item) => <Badge key={item} variant="secondary">{item}</Badge>) : <span className="text-slate-500">No unit amenities listed</span>}</div></div>
              <div className="rounded-2xl border p-4 md:col-span-2"><p className="text-xs uppercase tracking-[0.2em] text-slate-500">Possible extra charges</p><div className="mt-3 flex flex-wrap gap-2">{(workspace.data?.unit?.extraChargeTemplates ?? []).length ? (workspace.data?.unit?.extraChargeTemplates ?? []).map((item) => <Badge key={`${item.title}-${item.amount}`} variant="outline">{item.title}: {formatMoney(item.amount, defaultCurrency)} / {item.frequency ?? "monthly"}</Badge>) : <span className="text-slate-500">No extra charge templates set for this unit</span>}</div></div>
            </CardContent>
          </Card>
        </div>
      </WithBone>
    </div>
  )
}

export function ResidentUsersPage() {
  const { data: me, isLoading } = useResidentMeQuery()
  const workspace = useResidentWorkspaceQuery()
  const requests = useResidentAssignmentRequestsQuery()
  const updateAssignmentRequest = useResidentUpdateAssignmentRequestMutation()
  const [page, setPage] = useState(1)
  const pageSize = 5
  const requestList = requests.data ?? []
  const pagedRequests = paginateItems(requestList, page, pageSize)

  return (
    <div className="space-y-6">
      <ResidentPageHero icon={Users} badge="Account" title="Users" body="Resident account details, owner links, and assignment request history." />
      <WithBone name="resident-users" loading={isLoading || requests.isLoading || workspace.isLoading} fallback={<DashboardPanelSkeleton />}>
        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="shadow-none">
            <CardHeader><CardTitle>Your account</CardTitle><CardDescription>Signed-in guest or renter identity.</CardDescription></CardHeader>
            <CardContent className="grid gap-4 text-sm text-slate-700 md:grid-cols-2">
              <div className="rounded-2xl border p-4"><p className="text-xs uppercase tracking-[0.2em] text-slate-500">Name</p><p className="mt-2 font-medium text-slate-950">{me?.fullName ?? "Unknown"}</p></div>
              <div className="rounded-2xl border p-4"><p className="text-xs uppercase tracking-[0.2em] text-slate-500">Role</p><p className="mt-2 font-medium capitalize text-slate-950">{me?.role ?? "resident"}</p></div>
              <div className="rounded-2xl border p-4"><p className="text-xs uppercase tracking-[0.2em] text-slate-500">Linked owner</p><p className="mt-2 font-medium text-slate-950">{workspace.data?.linkedOwner?.fullName ?? "No active owner yet"}</p><p className="mt-1 text-xs text-slate-500">{workspace.data?.linkedOwner?.email ?? "No email"}</p></div>
              <div className="rounded-2xl border p-4"><p className="text-xs uppercase tracking-[0.2em] text-slate-500">Linked property</p><p className="mt-2 font-medium text-slate-950">{workspace.data?.property?.name ?? "No active property yet"}</p><p className="mt-1 text-xs text-slate-500">{workspace.data?.unit?.unitNumber ? `Unit ${workspace.data.unit.unitNumber}` : "No unit linked"}</p></div>
            </CardContent>
          </Card>
          <Card className="shadow-none">
            <CardHeader><CardTitle>Assignment requests</CardTitle><CardDescription>Owner invites or your join requests.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {requestList.length ? (
                <>
                  <div className="overflow-hidden rounded-2xl border">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead>Owner</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Property</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pagedRequests.map((item: any) => (
                          <TableRow key={item._id ?? `${item.requesterUserId}-${item.createdAt ?? ""}`}>
                            <TableCell className="min-w-44">
                              <p className="font-medium text-slate-950">{item.ownerUser?.fullName ?? item.requesterUser?.fullName ?? "Owner"}</p>
                              <p className="mt-1 whitespace-normal text-xs text-slate-500">{item.message ?? "No message"}</p>
                            </TableCell>
                            <TableCell><Badge variant="secondary">{item.requestedRole}</Badge></TableCell>
                            <TableCell className="min-w-44">
                              <p className="font-medium text-slate-950">{item.properties?.[0]?.name ?? "No property attached"}</p>
                              <p className="mt-1 whitespace-normal text-xs text-slate-500">{formatAddress(item.properties?.[0]?.address)}</p>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-2">
                                <Badge variant="outline">{item.direction}</Badge>
                                <Badge>{item.status}</Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {item.status === "pending" && item.direction === "owner_to_user" ? (
                                <div className="flex justify-end gap-2">
                                  <Button type="button" size="sm" className="bg-blue-700 text-white hover:bg-blue-800" disabled={updateAssignmentRequest.isPending} onClick={() => updateAssignmentRequest.mutate({ id: item._id, status: "accepted" })}>Accept</Button>
                                  <Button type="button" size="sm" variant="outline" disabled={updateAssignmentRequest.isPending} onClick={() => updateAssignmentRequest.mutate({ id: item._id, status: "rejected" })}>Reject</Button>
                                </div>
                              ) : <span className="text-xs text-slate-400">No action</span>}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <PaginationControls page={page} total={requestList.length} pageSize={pageSize} onPageChange={setPage} />
                </>
              ) : (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon"><Users /></EmptyMedia>
                    <EmptyTitle>No requests yet</EmptyTitle>
                    <EmptyDescription>Owner assignment flow will appear here.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </CardContent>
          </Card>
        </div>
      </WithBone>
      <ResidentSupportCard />
    </div>
  )
}

export function ResidentTenantsPage() {
  const workspace = useResidentWorkspaceQuery()
  const bills = useResidentBillsQuery()
  const { data: me } = useMeQuery()
  const leaveTenant = useResidentLeaveTenantMutation()
  const stripeSettings = useOrganizationStripeSettingsQuery(
    Boolean(me && ["tetentwoner", "admin", "super_admin"].includes(me.role))
  )
  const defaultCurrency = stripeSettings.data?.defaultCurrency?.toUpperCase() ?? "USD"
  const tenant = workspace.data?.tenant
  const pendingAssignment = workspace.data?.pendingAssignment
  const billList = bills.data ?? []
  const openBillList = billList.filter((bill) => bill.status !== "paid")
  const currentMonthKey = new Date().toISOString().slice(0, 7)
  const monthlyBillMap = useMemo(() => {
    const entries = billList
      .filter((bill) => ["rent", "guest_fee"].includes(bill.kind))
      .map((bill) => [bill.monthKey ?? "", bill] as const)
      .filter(([monthKey]) => Boolean(monthKey))
    return new Map(entries)
  }, [billList])
  const currentMonthRecord = tenant?.paymentRecords?.find((record) => record.monthKey === currentMonthKey)
  const openPaymentRecords = (tenant?.paymentRecords ?? []).filter((record) => record.status !== "paid")
  const currentMonthDueDate = tenant?.rentDueDay ? buildMonthDueDate(currentMonthKey, tenant.rentDueDay) : ""
  const [paymentPage, setPaymentPage] = useState(1)
  const [billPage, setBillPage] = useState(1)
  const paymentPageSize = 4
  const billPageSize = 4
  const pagedPaymentRecords = paginateItems(openPaymentRecords, paymentPage, paymentPageSize)
  const pagedOpenBills = paginateItems(openBillList, billPage, billPageSize)
  const hasOutstandingDues =
    openPaymentRecords.length > 0 ||
    openBillList.length > 0 ||
    (tenant?.tenantKind === "guest" && Boolean(tenant?.oneTimeGuestFee) && !tenant?.guestFeePaid)

  return (
    <div className="space-y-6">
      <ResidentPageHero icon={Shield} badge="Resident" title="Tenant profile" body="Guest or renter profile, stay terms, payment status, and leave control." />
      <WithBone name="resident-tenant" loading={workspace.isLoading} fallback={<DashboardPanelSkeleton />}>
        {!tenant && pendingAssignment ? (
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Accept owner invite first</CardTitle>
              <CardDescription>Tenant billing and direct pay unlock after you accept property assignment.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-700">
              <div className="rounded-2xl bg-slate-50/85 p-4">
                <p className="font-medium text-slate-950">Pending role</p>
                <p className="mt-1">{pendingAssignment.requestedRole ?? "resident"}</p>
              </div>
              <div className="rounded-2xl bg-slate-50/85 p-4">
                <p className="font-medium text-slate-950">Property</p>
                <p className="mt-1">{pendingAssignment.properties?.[0]?.name ?? "No property attached"}</p>
                <p className="mt-1 text-xs text-slate-500">{formatAddress(pendingAssignment.properties?.[0]?.address)}</p>
              </div>
            </CardContent>
          </Card>
        ) : null}
        <div className="grid gap-5 md:grid-cols-4">
          <ResidentStatCard label="Property" value={workspace.data?.property?.name ?? "Pending"} note={workspace.data?.unit?.unitNumber ? `Unit ${workspace.data.unit.unitNumber}` : "No unit"} />
          <ResidentStatCard label="Rent / fee" value={formatMoney(tenant?.tenantKind === "guest" ? tenant?.oneTimeGuestFee ?? 0 : tenant?.monthlyRent ?? 0, defaultCurrency)} note={tenant?.tenantKind ?? "resident"} />
          <ResidentStatCard label="Open monthly" value={String(openPaymentRecords.length)} note="Pending payment records" />
          <ResidentStatCard label="Open bills" value={String(openBillList.length)} note="Custom or extra charges" />
        </div>
        <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
          <Card className="border-slate-200 shadow-none">
            <CardHeader className="border-b pb-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>Profile</CardTitle>
                  <CardDescription>Current resident record linked by owner.</CardDescription>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" size="sm" variant="destructive" disabled={!tenant || hasOutstandingDues || leaveTenant.isPending}>
                      {leaveTenant.isPending ? "Leaving..." : "Leave tenant"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Leave tenant profile?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This removes your active resident link from this property. You cannot leave while dues remain unpaid.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => leaveTenant.mutate()} className="bg-red-600 text-white hover:bg-red-700">
                        Confirm leave
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 p-6 text-sm text-slate-700">
              <div className="grid gap-4 sm:grid-cols-2">
                <ResidentSoftPanel title="Property" value={workspace.data?.property?.name ?? "No property assigned yet"} note={formatAddress(workspace.data?.property?.address)} />
                <ResidentSoftPanel title="Unit" value={workspace.data?.unit?.unitNumber ?? "No unit assigned yet"} note={workspace.data?.unit?.type ?? "Type pending"} />
                <ResidentSoftPanel title="Kind" value={tenant?.tenantKind ?? "No profile"} />
                <ResidentSoftPanel title="Due day" value={tenant?.rentDueDay ? `Day ${tenant.rentDueDay}` : "Not set"} note="Monthly due anchor" />
                <ResidentSoftPanel title="Email" value={tenant?.email ?? "n/a"} />
                <ResidentSoftPanel title="Phone" value={tenant?.phone ?? tenant?.phoneNumber ?? "n/a"} />
              </div>
              <div className={`rounded-2xl p-4 text-xs ${hasOutstandingDues ? "bg-amber-50 text-amber-900" : "bg-emerald-50 text-emerald-900"}`}>
                {hasOutstandingDues ? "Leave disabled. Pay all open monthly dues and bills first." : "No outstanding dues. You can leave this tenant profile."}
              </div>
              <ResidentSoftPanel title="Lease / stay" value={`${formatDate(tenant?.movedInAt)} to ${formatDate(tenant?.movedOutAt)}`} />
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-none">
            <CardHeader className="border-b pb-5">
              <CardTitle>Billing</CardTitle>
              <CardDescription>Rent, extra charges, open payment actions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <ResidentSoftPanel title={tenant?.tenantKind === "guest" ? "Guest fee" : "Monthly rent"} value={formatMoney(tenant?.tenantKind === "guest" ? tenant?.oneTimeGuestFee ?? 0 : tenant?.monthlyRent ?? 0, defaultCurrency)} note={tenant?.rentDueDay ? `Due every month on day ${tenant.rentDueDay}` : "No due day set"} />
                <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-700">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Unit extra charges</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(workspace.data?.unit?.extraChargeTemplates ?? []).length ? (workspace.data?.unit?.extraChargeTemplates ?? []).map((item) => <Badge key={`${item.title}-${item.amount}`} variant="outline">{item.title}: {formatMoney(item.amount, defaultCurrency)} / {item.frequency ?? "monthly"}</Badge>) : <span className="text-slate-500">No unit-level extra charges listed</span>}
                  </div>
                </div>
              </div>
              {tenant?.tenantKind === "renter" && tenant?.monthlyRent && !currentMonthRecord ? (
                <div className="rounded-2xl bg-slate-50 p-5 text-sm">
                  <div className="flex flex-wrap gap-2">
                    <p className="font-medium text-slate-950">{currentMonthKey}</p>
                    <Badge>due</Badge>
                  </div>
                  <p className="mt-2 text-slate-600">Amount: {formatMoney(tenant.monthlyRent, defaultCurrency)}</p>
                  <p className="text-xs text-slate-500">Due: {formatDate(currentMonthDueDate || null)}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <ResidentMonthlyStripePayButton monthKey={currentMonthKey} />
                  </div>
                </div>
              ) : null}
              {openPaymentRecords.length ? pagedPaymentRecords.map((record) => (
                <div key={record.monthKey} className="rounded-2xl bg-slate-50 p-5 text-sm">
                  <div className="flex flex-wrap gap-2">
                    <p className="font-medium text-slate-950">{record.monthKey}</p>
                    <Badge>{record.status}</Badge>
                  </div>
                  <p className="mt-2 text-slate-600">Amount: {formatMoney(record.amount, defaultCurrency)}</p>
                  <p className="text-xs text-slate-500">Paid: {formatDate(record.paidAt)} | Due: {formatDate(record.dueDate)}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {record.status !== "paid" ? (
                      monthlyBillMap.get(record.monthKey) ? (
                        <ResidentStripePayButton bill={monthlyBillMap.get(record.monthKey)!} />
                      ) : (
                        <ResidentMonthlyStripePayButton monthKey={record.monthKey} />
                      )
                    ) : null}
                  </div>
                </div>
              )) : (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon"><Shield /></EmptyMedia>
                    <EmptyTitle>No payment records yet</EmptyTitle>
                    <EmptyDescription>Owner-posted payment history will appear here.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
              <PaginationControls page={paymentPage} total={openPaymentRecords.length} pageSize={paymentPageSize} onPageChange={setPaymentPage} />
              <div className="rounded-2xl bg-slate-50 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <CreditCard className="size-4 text-slate-500" />
                  <p className="font-medium text-slate-950">Open bills and extra expenses</p>
                </div>
                {openBillList.length ? (
                  <div className="space-y-3">
                    {pagedOpenBills.map((bill) => (
                      <div key={bill._id} className="rounded-2xl border bg-white p-5 text-sm">
                        <div className="flex flex-wrap gap-2">
                          <p className="font-medium text-slate-950">{bill.title}</p>
                          <Badge variant="outline">{bill.kind}</Badge>
                          <Badge>{bill.status}</Badge>
                        </div>
                        <p className="mt-2 text-slate-600">{bill.description ?? "No description"}</p>
                        <p className="mt-2 font-medium text-slate-950">{formatMoney(bill.amount, resolveDisplayCurrency(bill.currency, defaultCurrency))}</p>
                        <p className="text-xs text-slate-500">Due: {formatDate(bill.dueDate)} {bill.monthKey ? `| Month: ${bill.monthKey}` : ""}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {bill.paymentMode ? <Badge variant="secondary">{bill.paymentMode}</Badge> : null}
                          {bill.stripeCheckoutStatus ? <Badge variant="outline">{bill.stripeCheckoutStatus}</Badge> : null}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {bill.status !== "paid" ? <ResidentStripePayButton bill={bill} /> : null}
                          {(bill.attachments ?? []).map((attachment) => (
                            <a key={attachment} href={attachment} target="_blank" rel="noreferrer" className="rounded-lg border px-3 py-2 text-xs text-blue-700">Open bill file</a>
                          ))}
                          {bill.stripeHostedInvoiceUrl ? <a href={bill.stripeHostedInvoiceUrl} target="_blank" rel="noreferrer" className="rounded-lg border px-3 py-2 text-xs text-blue-700">Open Stripe invoice</a> : null}
                          {bill.stripeInvoicePdf ? <a href={bill.stripeInvoicePdf} target="_blank" rel="noreferrer" className="rounded-lg border px-3 py-2 text-xs text-blue-700">Invoice PDF</a> : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-slate-500">No unpaid bills here. Paid history lives in Billing page.</p>}
                <PaginationControls page={billPage} total={openBillList.length} pageSize={billPageSize} onPageChange={setBillPage} />
              </div>
            </CardContent>
          </Card>
        </div>
      </WithBone>
    </div>
  )
}

export function ResidentBillingPage() {
  const workspace = useResidentWorkspaceQuery()
  const bills = useResidentBillsQuery()
  const { data: me } = useMeQuery()
  const stripeSettings = useOrganizationStripeSettingsQuery(
    Boolean(me && ["tetentwoner", "admin", "super_admin"].includes(me.role))
  )
  const defaultCurrency = stripeSettings.data?.defaultCurrency?.toUpperCase() ?? "USD"
  const tenant = workspace.data?.tenant
  const billList = bills.data ?? []
  const monthlyBillMap = useMemo(() => {
    const entries = billList
      .filter((bill) => ["rent", "guest_fee"].includes(bill.kind) && bill.monthKey)
      .map((bill) => [bill.monthKey ?? "", bill] as const)
    return new Map(entries)
  }, [billList])

  const rows = useMemo<ResidentBillingRow[]>(() => {
    const monthlyRows = (tenant?.paymentRecords ?? []).map((record) => {
      const relatedBill = monthlyBillMap.get(record.monthKey)
      return {
        id: `monthly-${record.monthKey}`,
        source: "monthly" as const,
        kind: tenant?.tenantKind === "guest" ? "guest_fee" : "rent",
        title: tenant?.tenantKind === "guest" ? `Guest fee ${record.monthKey}` : `Monthly rent ${record.monthKey}`,
        monthKey: record.monthKey,
        amount: relatedBill?.amount ?? record.amount ?? 0,
        currency: resolveDisplayCurrency(relatedBill?.currency, defaultCurrency),
        status: relatedBill?.status ?? record.status,
        dueDate: relatedBill?.dueDate ?? record.dueDate,
        paidAt: relatedBill?.paidAt ?? record.paidAt,
        bill: relatedBill ?? null,
        note: record.note ?? null,
      }
    })

    const extraRows = billList
      .filter((bill) => !["rent", "guest_fee"].includes(bill.kind) || !bill.monthKey)
      .map((bill) => ({
        id: `bill-${bill._id}`,
        source: "bill" as const,
        kind: bill.kind,
        title: bill.title,
        monthKey: bill.monthKey,
        amount: bill.amount,
        currency: resolveDisplayCurrency(bill.currency, defaultCurrency),
        status: bill.status,
        dueDate: bill.dueDate,
        paidAt: bill.paidAt,
        bill,
        note: bill.description ?? bill.note ?? null,
      }))

    return [...monthlyRows, ...extraRows].sort((a, b) => {
      const aTime = new Date(a.dueDate ?? a.paidAt ?? 0).getTime()
      const bTime = new Date(b.dueDate ?? b.paidAt ?? 0).getTime()
      return bTime - aTime
    })
  }, [billList, defaultCurrency, monthlyBillMap, tenant?.paymentRecords, tenant?.tenantKind])

  return (
    <div className="space-y-6">
      <ResidentPageHero icon={CreditCard} badge="Billing" title="Billing history" body="Full payment ledger, filters, due items, paid items, direct Stripe action." />
      <WithBone name="resident-billing-ledger" loading={workspace.isLoading || bills.isLoading} fallback={<DashboardTableSkeleton />}>
        <ResidentBillingTable rows={rows} defaultCurrency={defaultCurrency} />
      </WithBone>
    </div>
  )
}

export function ResidentTechniciansPage() {
  const tickets = useResidentTicketsQuery()
  const openItems = (tickets.data ?? []).filter((item) => item.status !== "completed")

  return (
    <div className="space-y-6">
      <ResidentPageHero icon={Wrench} badge="Service" title="Technicians" body="Track service progress through ticket activity and talk with property team." />
      <WithBone name="resident-technicians" loading={tickets.isLoading} fallback={<DashboardTableSkeleton />}>
        <Card className="shadow-none">
          <CardHeader><CardTitle>Active service requests</CardTitle><CardDescription>Technician assignment is reflected through your open tickets.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {openItems.length ? openItems.map((item) => (
              <div key={item._id} className="rounded-xl border p-4">
                <div className="flex flex-wrap gap-2">
                  <p className="font-medium text-slate-950">{item.title}</p>
                  <Badge>{item.status}</Badge>
                  <Badge variant="outline">{item.priority}</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-600">{item.description}</p>
              </div>
            )) : (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon"><Wrench /></EmptyMedia>
                  <EmptyTitle>No active service yet</EmptyTitle>
                  <EmptyDescription>Open tickets will show active technician workflow here.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>
      </WithBone>
      <ResidentSupportCard title="Need technician update?" body="Ask property team for service ETA or technician details." />
    </div>
  )
}

export function ResidentNoticesPage() {
  return (
    <div className="space-y-6">
      <ResidentPageHero icon={Bell} badge="Notices" title="Notices" body="All resident-visible building and unit communications." />
      <ResidentNoticesList />
    </div>
  )
}

export function ResidentDocumentsPage() {
  return (
    <div className="space-y-6">
      <ResidentPageHero icon={FileText} badge="Documents" title="Documents" body="Owner-shared leases, notices, files, and direct document messages." />
      <ResidentDocumentsList />
    </div>
  )
}

export function ResidentVendorsPage() {
  const workspace = useResidentWorkspaceQuery()

  return (
    <div className="space-y-6">
      <ResidentPageHero icon={BriefcaseBusiness} badge="Contacts" title="Vendors" body="Resident-safe contact and escalation view for property support." />
      <WithBone name="resident-vendors" loading={workspace.isLoading} fallback={<DashboardPanelSkeleton />}>
        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="shadow-none">
            <CardHeader><CardTitle>Property contacts</CardTitle><CardDescription>Main support contacts already stored on property profile.</CardDescription></CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-700">
              <div className="rounded-xl border p-4"><p className="font-medium text-slate-950">Property</p><p className="mt-1">{workspace.data?.property?.name ?? "No property"}</p></div>
              <div className="rounded-xl border p-4"><p className="font-medium text-slate-950">Email</p><p className="mt-1">{workspace.data?.property?.contactEmail ?? "No email listed"}</p></div>
              <div className="rounded-xl border p-4"><p className="font-medium text-slate-950">Phone</p><p className="mt-1">{workspace.data?.property?.contactPhone ?? "No phone listed"}</p></div>
            </CardContent>
          </Card>
          <ResidentSupportCard title="Need vendor coordination?" body="Send one message to property team for utility, appliance, cleaning, or third-party follow-up." />
        </div>
      </WithBone>
    </div>
  )
}

export function ResidentTicketsPage() {
  return (
    <div className="space-y-6">
      <ResidentPageHero icon={Ticket} badge="Support" title="Tickets" body="Create support requests and track every ticket opened from your resident account." />
      <div className="grid gap-4 xl:grid-cols-2">
        <ResidentTicketCreateCard />
        <ResidentSupportCard title="Need urgent follow-up?" body="Message property team directly after ticket submission." />
      </div>
      <ResidentTicketsList />
    </div>
  )
}

export function ResidentWorkOrdersPage() {
  return (
    <div className="space-y-6">
      <ResidentPageHero icon={Ticket} badge="Tickets" title="Tickets" body="Repair flow now stays inside tickets from request to completion." />
      <Card className="shadow-none">
        <CardHeader><CardTitle>Single support flow</CardTitle><CardDescription>Open ticket page for status, images, notes, worker progress, final proof.</CardDescription></CardHeader>
        <CardContent>
          <Link href="/dashboard/resident/tickets" className="inline-flex min-h-11 items-center justify-center rounded-xl border px-4 text-sm font-medium text-slate-950">
            Open tickets
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

export function ResidentRecurringPage() {
  const announcements = useResidentAnnouncementsQuery()
  const items = (announcements.data ?? []).filter((item) => item.type === "maintenance")

  return (
    <div className="space-y-6">
      <ResidentPageHero icon={Repeat} badge="Recurring" title="Recurring maintenance" body="Scheduled building maintenance notices relevant to your stay." />
      <WithBone name="resident-recurring" loading={announcements.isLoading} fallback={<DashboardTableSkeleton />}>
        <Card className="shadow-none">
          <CardHeader><CardTitle>Maintenance schedule</CardTitle><CardDescription>Owner-posted recurring or planned maintenance updates.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {items.length ? items.map((item) => (
              <div key={item._id} className="rounded-xl border p-4">
                <p className="font-medium text-slate-950">{item.title}</p>
                <p className="mt-2 text-sm text-slate-600">{item.content}</p>
              </div>
            )) : (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon"><Repeat /></EmptyMedia>
                  <EmptyTitle>No recurring maintenance notices</EmptyTitle>
                  <EmptyDescription>Scheduled maintenance updates appear here.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>
      </WithBone>
    </div>
  )
}

export function ResidentInspectionsPage() {
  const workspace = useResidentWorkspaceQuery()

  return (
    <div className="space-y-6">
      <ResidentPageHero icon={ClipboardCheck} badge="Inspection" title="Inspections" body="Move-in, move-out, and stay record details available to resident." />
      <WithBone name="resident-inspections" loading={workspace.isLoading} fallback={<DashboardPanelSkeleton />}>
        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="shadow-none">
            <CardHeader><CardTitle>Stay dates</CardTitle><CardDescription>Move timeline from your resident profile.</CardDescription></CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-700">
              <div className="rounded-xl border p-4"><p className="font-medium text-slate-950">Moved in</p><p className="mt-1">{formatDate(workspace.data?.tenant?.movedInAt)}</p></div>
              <div className="rounded-xl border p-4"><p className="font-medium text-slate-950">Moved out</p><p className="mt-1">{formatDate(workspace.data?.tenant?.movedOutAt)}</p></div>
            </CardContent>
          </Card>
          <ResidentSupportCard title="Need inspection clarification?" body="Ask property team about checklists, damages, or move records." />
        </div>
      </WithBone>
    </div>
  )
}

export function ResidentSettingsPage() {
  const { data: me, isLoading } = useResidentMeQuery()
  const workspace = useResidentWorkspaceQuery()

  return (
    <div className="space-y-6">
      <ResidentPageHero icon={Settings2} badge="Settings" title="Resident settings" body="Account status, linked owner/property scope, and stay rules." />
      <WithBone name="resident-settings" loading={isLoading || workspace.isLoading} fallback={<DashboardPanelSkeleton />}>
        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="shadow-none">
            <CardHeader><CardTitle>Account</CardTitle><CardDescription>Resident access and current links.</CardDescription></CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-700">
              <div className="rounded-xl border p-4"><p className="font-medium text-slate-950">Status</p><p className="mt-1">{me?.status ?? "unknown"}</p></div>
              <div className="rounded-xl border p-4"><p className="font-medium text-slate-950">Owner</p><p className="mt-1 break-all">{me?.activeOwnerId ?? "No linked owner"}</p></div>
              <div className="rounded-xl border p-4"><p className="font-medium text-slate-950">Property</p><p className="mt-1 break-all">{me?.activePropertyId ?? "No linked property"}</p></div>
              <div className="rounded-xl border p-4"><p className="font-medium text-slate-950">Last login</p><p className="mt-1">{formatDate(me?.lastLoginAt)}</p></div>
            </CardContent>
          </Card>
          <Card className="shadow-none">
            <CardHeader><CardTitle>Resident rules</CardTitle><CardDescription>Current behavior already enforced in platform.</CardDescription></CardHeader>
            <CardContent className="space-y-4 text-sm leading-6 text-slate-700">
              <div className="rounded-xl border p-4">Renter and guest keep one active property at time.</div>
              <div className="rounded-xl border p-4">Tickets, notices, and direct documents stay scoped to your organization and owner link.</div>
              <div className="rounded-xl border p-4">Property team controls billing, notices, technician assignment, and property files.</div>
              <div className="rounded-xl border p-4">Current profile kind: {workspace.data?.tenant?.tenantKind ?? "not linked yet"}.</div>
            </CardContent>
          </Card>
        </div>
      </WithBone>
    </div>
  )
}
