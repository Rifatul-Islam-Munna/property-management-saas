"use client"

import { Bell, Building2, FileText, Home, Ticket, User2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import {
  DashboardCardSkeleton,
  DashboardPanelSkeleton,
  WithBone,
} from "@/components/dashboard/dashboard-loading"
import { useResidentAnnouncementsQuery, useResidentMessagesQuery, useResidentTicketsQuery, useResidentWorkspaceQuery } from "@/hooks/use-resident-dashboard"

function MetricCard({
  title,
  value,
  note,
}: {
  title: string
  value: string | number
  note: string
}) {
  return (
    <Card className="border-border bg-background shadow-none">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-slate-700">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold text-slate-950">{value}</div>
        <p className="text-xs text-slate-600">{note}</p>
      </CardContent>
    </Card>
  )
}

export function ResidentDashboard() {
  const workspace = useResidentWorkspaceQuery()
  const announcements = useResidentAnnouncementsQuery()
  const messages = useResidentMessagesQuery()
  const tickets = useResidentTicketsQuery()

  const documentCount = (messages.data ?? []).filter((item) => item.kind === "document").length
  const recentNotices = (announcements.data ?? []).slice(0, 3)
  const recentTickets = (tickets.data ?? []).slice(0, 4)
  const loading =
    workspace.isLoading ||
    announcements.isLoading ||
    messages.isLoading ||
    tickets.isLoading

  return (
    <div className="space-y-6">
      <WithBone name="resident-overview" loading={loading} fallback={<DashboardPanelSkeleton />}>
        <section className="rounded-2xl border bg-background p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <Badge variant="outline" className="border-blue-200 text-blue-700">
                Guest + renter workspace
              </Badge>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                Same dashboard shell, focused on stay details, notices, documents, support.
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-600">
                Track property details, unit status, rent or guest fee context, incoming notices,
                shared documents, and your support tickets from one place.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
              <div className="rounded-xl border bg-background px-4 py-3"><p className="text-slate-500">Property</p><p className="mt-1 text-lg font-semibold">{workspace.data?.property?.name ?? "Unassigned"}</p></div>
              <div className="rounded-xl border bg-background px-4 py-3"><p className="text-slate-500">Unit</p><p className="mt-1 text-lg font-semibold">{workspace.data?.unit?.unitNumber ?? "Pending"}</p></div>
              <div className="rounded-xl border bg-background px-4 py-3"><p className="text-slate-500">Profile</p><p className="mt-1 text-lg font-semibold">{workspace.data?.tenant?.tenantKind ?? "Resident"}</p></div>
              <div className="rounded-xl border bg-background px-4 py-3"><p className="text-slate-500">Notices</p><p className="mt-1 text-lg font-semibold">{announcements.data?.length ?? 0}</p></div>
              <div className="rounded-xl border bg-background px-4 py-3"><p className="text-slate-500">Tickets</p><p className="mt-1 text-lg font-semibold">{tickets.data?.length ?? 0}</p></div>
            </div>
          </div>
        </section>
      </WithBone>

      <WithBone
        name="resident-metrics"
        loading={loading}
        fallback={<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{Array.from({ length: 5 }).map((_, index) => <DashboardCardSkeleton key={index} />)}</div>}
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard title="Active notices" value={announcements.data?.length ?? 0} note="Owner or admin updates" />
          <MetricCard title="Documents" value={documentCount} note="Shared files in messages" />
          <MetricCard title="Support tickets" value={tickets.data?.length ?? 0} note="Your created requests" />
          <MetricCard title="Rent / fee" value={workspace.data?.tenant?.tenantKind === "guest" ? workspace.data?.tenant?.oneTimeGuestFee ?? 0 : workspace.data?.tenant?.monthlyRent ?? 0} note={workspace.data?.tenant?.tenantKind === "guest" ? "One-time guest fee" : "Monthly rent"} />
          <MetricCard title="Unit status" value={workspace.data?.unit?.status ?? "n/a"} note={workspace.data?.property?.type ?? "No property linked"} />
        </div>
      </WithBone>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="shadow-none lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent notices</CardTitle>
            <CardDescription>Most recent property communications.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentNotices.length ? recentNotices.map((notice) => (
              <div key={notice._id} className="rounded-xl border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-slate-950">{notice.title}</p>
                  <Badge variant="outline">{notice.type ?? "notice"}</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-600">{notice.content}</p>
              </div>
            )) : (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon"><Bell /></EmptyMedia>
                  <EmptyTitle>No notices yet</EmptyTitle>
                  <EmptyDescription>Owner notices will appear here.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Profile snapshot</CardTitle>
            <CardDescription>Current linked stay and account scope.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <div className="rounded-xl border p-3"><div className="flex items-center gap-2 font-medium text-slate-950"><User2 className="size-4" /> Resident</div><p className="mt-2">{workspace.data?.tenant?.fullName ?? "No tenant profile linked"}</p></div>
            <div className="rounded-xl border p-3"><div className="flex items-center gap-2 font-medium text-slate-950"><Building2 className="size-4" /> Property</div><p className="mt-2">{workspace.data?.property?.name ?? "No active property"}</p></div>
            <div className="rounded-xl border p-3"><div className="flex items-center gap-2 font-medium text-slate-950"><Home className="size-4" /> Unit</div><p className="mt-2">{workspace.data?.unit?.unitNumber ?? "No active unit"}</p></div>
            <div className="rounded-xl border p-3"><div className="flex items-center gap-2 font-medium text-slate-950"><FileText className="size-4" /> Documents</div><p className="mt-2">{documentCount} shared file messages</p></div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Recent tickets</CardTitle>
          <CardDescription>Open and past support requests you created.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentTickets.length ? recentTickets.map((ticket) => (
            <div key={ticket._id} className="rounded-xl border p-3">
              <div className="flex flex-wrap gap-2">
                <p className="font-medium text-slate-950">{ticket.title}</p>
                <Badge variant="outline">{ticket.priority}</Badge>
                <Badge>{ticket.status}</Badge>
              </div>
              <p className="mt-2 text-sm text-slate-600">{ticket.description}</p>
            </div>
          )) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><Ticket /></EmptyMedia>
                <EmptyTitle>No tickets yet</EmptyTitle>
                <EmptyDescription>Create first support request from Tickets page.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
