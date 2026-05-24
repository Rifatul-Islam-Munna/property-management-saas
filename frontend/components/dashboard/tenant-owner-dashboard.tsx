"use client"

import { Bell, BriefcaseBusiness, Building2, ClipboardCheck, Home, Repeat, Users, Wrench } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DashboardPanelSkeleton,
  DashboardCardSkeleton,
  DashboardTableSkeleton,
  WithBone,
} from "@/components/dashboard/dashboard-loading"
import {
  useOwnerAnnouncementsQuery,
  useOwnerAnalyticsQuery,
  useOwnerInspectionsQuery,
  useOwnerOccupancyStatsQuery,
  useOwnerPropertiesQuery,
  useOwnerRecurringMaintenancesQuery,
  useOwnerTechniciansQuery,
  useOwnerTechnicianStatsQuery,
  useOwnerTenantsQuery,
  useOwnerTicketStatsQuery,
  useOwnerTicketsQuery,
  useOwnerUnitsQuery,
  useOwnerUsersQuery,
  useOwnerVendorsQuery,
  useOwnerWorkOrdersQuery,
} from "@/hooks/use-owner-dashboard"
import {
  useOwnerDeleteTechnicianMutation,
  useOwnerDeleteTenantMutation,
  useOwnerDeleteUnitMutation,
  useOwnerTogglePropertyMutation,
  useOwnerToggleTechnicianMutation,
  useOwnerToggleTenantMutation,
  useOwnerToggleUnitMutation,
} from "@/hooks/use-owner-actions"

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

export function TenantOwnerDashboard() {
  const analytics = useOwnerAnalyticsQuery()
  const ticketStats = useOwnerTicketStatsQuery()
  const occupancy = useOwnerOccupancyStatsQuery()
  const technicianStats = useOwnerTechnicianStatsQuery()
  const users = useOwnerUsersQuery()
  const properties = useOwnerPropertiesQuery()
  const units = useOwnerUnitsQuery()
  const tenants = useOwnerTenantsQuery()
  const technicians = useOwnerTechniciansQuery()
  const tickets = useOwnerTicketsQuery()
  const announcements = useOwnerAnnouncementsQuery()
  const vendors = useOwnerVendorsQuery()
  const workOrders = useOwnerWorkOrdersQuery()
  const recurring = useOwnerRecurringMaintenancesQuery()
  const inspections = useOwnerInspectionsQuery()
  const toggleProperty = useOwnerTogglePropertyMutation()
  const toggleUnit = useOwnerToggleUnitMutation()
  const toggleTenant = useOwnerToggleTenantMutation()
  const toggleTechnician = useOwnerToggleTechnicianMutation()
  const deleteUnit = useOwnerDeleteUnitMutation()
  const deleteTenant = useOwnerDeleteTenantMutation()
  const deleteTechnician = useOwnerDeleteTechnicianMutation()

  const propertiesList = Array.isArray(properties.data) ? properties.data : []
  const unitsList = Array.isArray(units.data) ? units.data : []
  const usersList = Array.isArray(users.data) ? users.data : []
  const tenantsList = Array.isArray(tenants.data) ? tenants.data : []
  const techniciansList = Array.isArray(technicians.data) ? technicians.data : []
  const ticketsList = Array.isArray(tickets.data) ? tickets.data : []
  const announcementsList = Array.isArray(announcements.data) ? announcements.data : []
  const vendorsList = Array.isArray(vendors.data) ? vendors.data : []
  const workOrdersList = Array.isArray(workOrders.data) ? workOrders.data : []
  const recurringList = Array.isArray(recurring.data) ? recurring.data : []
  const inspectionsList = Array.isArray(inspections.data) ? inspections.data : []

  const loading =
    analytics.isLoading ||
    users.isLoading ||
    properties.isLoading ||
    units.isLoading ||
    tenants.isLoading ||
    technicians.isLoading ||
    vendors.isLoading ||
    workOrders.isLoading ||
    recurring.isLoading ||
    inspections.isLoading

  return (
    <div className="space-y-6">
      <WithBone name="owner-overview" loading={loading} fallback={<DashboardPanelSkeleton />}>
        <section id="overview" className="rounded-2xl border bg-background p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <Badge variant="outline" className="border-blue-200 text-blue-700">
                Tenant owner workspace
              </Badge>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                Same admin-grade look, focused on properties, units, staff, residents.
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-600">
                Manage many properties, create workers and residents, control units, vendors, payments, notices, tickets, and field technicians.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4 xl:grid-cols-6">
              <div className="rounded-xl border bg-background px-4 py-3"><p className="text-slate-500">Properties</p><p className="mt-1 text-lg font-semibold">{propertiesList.length ?? 0}</p></div>
              <div className="rounded-xl border bg-background px-4 py-3"><p className="text-slate-500">Units</p><p className="mt-1 text-lg font-semibold">{unitsList.length ?? 0}</p></div>
              <div className="rounded-xl border bg-background px-4 py-3"><p className="text-slate-500">Users</p><p className="mt-1 text-lg font-semibold">{usersList.length ?? 0}</p></div>
              <div className="rounded-xl border bg-background px-4 py-3"><p className="text-slate-500">Tickets</p><p className="mt-1 text-lg font-semibold">{analytics.data?.openTickets ?? 0}</p></div>
              <div className="rounded-xl border bg-background px-4 py-3"><p className="text-slate-500">Vendors</p><p className="mt-1 text-lg font-semibold">{vendorsList.length ?? 0}</p></div>
              <div className="rounded-xl border bg-background px-4 py-3"><p className="text-slate-500">Work orders</p><p className="mt-1 text-lg font-semibold">{workOrdersList.length ?? 0}</p></div>
            </div>
          </div>
        </section>
      </WithBone>

      <WithBone
        name="owner-metrics"
        loading={loading}
        fallback={<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">{Array.from({ length: 6 }).map((_, index) => <DashboardCardSkeleton key={index} />)}</div>}
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <MetricCard title="Occupancy" value={`${analytics.data?.occupancyRate ?? 0}%`} note={`${occupancy.data?.occupied ?? 0} occupied / ${analytics.data?.totalUnits ?? 0} units`} />
          <MetricCard title="Open tickets" value={analytics.data?.openTickets ?? 0} note={`${ticketStats.data?.byPriority?.length ?? 0} priority buckets`} />
          <MetricCard title="Workers" value={usersList.filter((user) => user.role === "worker").length} note="Global workers linked to owner" />
          <MetricCard title="Technicians" value={technicianStats.data?.activeTechnicians ?? 0} note={`${technicianStats.data?.totalTenants ?? 0} active tenants`} />
          <MetricCard title="Vendors" value={vendorsList.length} note="Ready external service contacts" />
          <MetricCard title="Recurring / inspection" value={`${recurringList.length} / ${inspectionsList.length}`} note={`${workOrdersList.length} work orders live`} />
        </div>
      </WithBone>

      <Tabs defaultValue="portfolio" className="space-y-4">
        <TabsList variant="line" className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="people">People</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="notices">Notices</TabsTrigger>
        </TabsList>

        <TabsContent value="portfolio" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <WithBone name="owner-properties" loading={properties.isLoading} fallback={<DashboardTableSkeleton />}>
              <Card id="properties" className="shadow-none">
                <CardHeader>
                  <CardTitle>Properties</CardTitle>
                  <CardDescription>Owner can keep many properties here.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {propertiesList.length === 0 ? (
                    <Empty><EmptyHeader><EmptyMedia variant="icon"><Building2 /></EmptyMedia><EmptyTitle>No properties</EmptyTitle><EmptyDescription>Add first property from controls.</EmptyDescription></EmptyHeader></Empty>
                  ) : propertiesList.map((property) => (
                    <div key={property._id} className="flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium text-slate-950">{property.name}</p>
                        <p className="text-xs text-slate-600">{property.type} • {property.totalUnits ?? 0} units</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={property.isActive ?? false}
                          onCheckedChange={(checked) =>
                            toggleProperty.mutate({ id: property._id, payload: { isActive: checked ?? false } })
                          }
                        />
                        <Badge variant={property.isActive ? "default" : "outline"}>{property.isActive ? "Active" : "Inactive"}</Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </WithBone>

            <WithBone name="owner-units" loading={units.isLoading} fallback={<DashboardTableSkeleton />}>
              <Card className="shadow-none">
                <CardHeader>
                  <CardTitle>Units</CardTitle>
                  <CardDescription>Track occupancy and availability.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {unitsList.length === 0 ? (
                    <Empty><EmptyHeader><EmptyMedia variant="icon"><Home /></EmptyMedia><EmptyTitle>No units</EmptyTitle><EmptyDescription>Add units under any owner property.</EmptyDescription></EmptyHeader></Empty>
                  ) : unitsList.slice(0, 8).map((unit) => (
                    <div key={unit._id} className="flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium text-slate-950">{unit.unitNumber}</p>
                        <p className="text-xs text-slate-600">{unit.status} • rent {unit.rentAmount ?? 0}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={(unit as { isActive?: boolean }).isActive ?? false} onCheckedChange={(checked) => toggleUnit.mutate({ id: unit._id, payload: { isActive: checked ?? false } })} />
                        <Button variant="outline" size="sm" onClick={() => deleteUnit.mutate(unit._id)}>Delete</Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </WithBone>
          </div>
        </TabsContent>

        <TabsContent value="people" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle>Users</CardTitle>
                <CardDescription>Workers, renters, guests under owner scope.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {usersList.slice(0, 8).map((user) => (
                  <div key={user.id} className="rounded-xl border p-3">
                    <p className="font-medium text-slate-950">{user.fullName}</p>
                    <p className="text-xs text-slate-600">{user.role} • {user.email}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card id="tenants" className="shadow-none">
              <CardHeader>
                <CardTitle>Tenant records</CardTitle>
                <CardDescription>Guests and renters.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {tenantsList.length === 0 ? (
                  <Empty><EmptyHeader><EmptyMedia variant="icon"><Users /></EmptyMedia><EmptyTitle>No tenant records</EmptyTitle><EmptyDescription>Add guest or renter records from controls.</EmptyDescription></EmptyHeader></Empty>
                ) : tenantsList.slice(0, 8).map((tenant) => (
                  <div key={tenant._id} className="flex flex-col gap-3 rounded-xl border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-slate-950">{tenant.fullName}</p>
                        <p className="text-xs text-slate-600">{tenant.tenantKind ?? "resident"}</p>
                      </div>
                      <Badge variant={(tenant.isActive ?? false) ? "default" : "outline"}>{(tenant.isActive ?? false) ? "Active" : "Inactive"}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={tenant.isActive ?? false} onCheckedChange={(checked) => toggleTenant.mutate({ id: tenant._id, payload: { isActive: checked ?? false } })} />
                      <Button variant="outline" size="sm" onClick={() => deleteTenant.mutate(tenant._id)}>Delete</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardHeader>
                <CardTitle>Technicians</CardTitle>
                <CardDescription>Global profiles linked to owner properties.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {techniciansList.length === 0 ? (
                  <Empty><EmptyHeader><EmptyMedia variant="icon"><Wrench /></EmptyMedia><EmptyTitle>No technicians</EmptyTitle><EmptyDescription>Add or link technician now.</EmptyDescription></EmptyHeader></Empty>
                ) : techniciansList.slice(0, 8).map((technician) => (
                  <div key={technician._id} className="flex flex-col gap-3 rounded-xl border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-slate-950">{technician.fullName}</p>
                        <p className="text-xs text-slate-600">{technician.specialty ?? "General"}</p>
                      </div>
                      <Badge variant={(technician.isActive ?? false) ? "default" : "outline"}>{(technician.isActive ?? false) ? "Active" : "Inactive"}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={technician.isActive ?? false} onCheckedChange={(checked) => toggleTechnician.mutate({ id: technician._id, payload: { isActive: checked ?? false } })} />
                      <Button variant="outline" size="sm" onClick={() => deleteTechnician.mutate(technician._id)}>Delete</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="operations" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card id="tickets" className="shadow-none">
              <CardHeader>
                <CardTitle>Tickets</CardTitle>
                <CardDescription>Current property support work.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {ticketsList.length === 0 ? (
                  <Empty><EmptyHeader><EmptyMedia variant="icon"><Bell /></EmptyMedia><EmptyTitle>No tickets</EmptyTitle><EmptyDescription>Resident and worker tickets show here.</EmptyDescription></EmptyHeader></Empty>
                ) : ticketsList.slice(0, 8).map((ticket) => (
                  <div key={ticket._id} className="rounded-xl border p-3">
                    <p className="font-medium text-slate-950">{ticket.title}</p>
                    <p className="text-xs text-slate-600">{ticket.priority} • {ticket.status}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardHeader>
                <CardTitle>Occupancy snapshot</CardTitle>
                <CardDescription>Quick unit status totals.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vacant</TableHead>
                      <TableHead>Occupied</TableHead>
                      <TableHead>Maintenance</TableHead>
                      <TableHead>Reserved</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>{occupancy.data?.vacant ?? 0}</TableCell>
                      <TableCell>{occupancy.data?.occupied ?? 0}</TableCell>
                      <TableCell>{occupancy.data?.maintenance ?? 0}</TableCell>
                      <TableCell>{occupancy.data?.reserved ?? 0}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardHeader>
                <CardTitle>Ops pipeline</CardTitle>
                <CardDescription>Vendors, work orders, recurring plans, inspections.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border p-3">
                  <div className="flex items-center gap-2 text-slate-700"><BriefcaseBusiness className="size-4" /> Vendors</div>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">{vendorsList.length}</p>
                </div>
                <div className="rounded-xl border p-3">
                  <div className="flex items-center gap-2 text-slate-700"><ClipboardCheck className="size-4" /> Work orders</div>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">{workOrdersList.length}</p>
                </div>
                <div className="rounded-xl border p-3">
                  <div className="flex items-center gap-2 text-slate-700"><Repeat className="size-4" /> Recurring</div>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">{recurringList.length}</p>
                </div>
                <div className="rounded-xl border p-3">
                  <div className="flex items-center gap-2 text-slate-700"><ClipboardCheck className="size-4" /> Inspections</div>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">{inspectionsList.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notices" className="space-y-4">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Notices</CardTitle>
              <CardDescription>Owner notices to guests, renters, workers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {announcementsList.length === 0 ? (
                <Empty><EmptyHeader><EmptyMedia variant="icon"><Bell /></EmptyMedia><EmptyTitle>No notices</EmptyTitle><EmptyDescription>Send first notice from owner controls.</EmptyDescription></EmptyHeader></Empty>
              ) : announcementsList.slice(0, 8).map((notice) => (
                <div key={notice._id} className="rounded-xl border p-3">
                  <p className="font-medium text-slate-950">{notice.title}</p>
                  <p className="text-xs text-slate-600">{notice.audience ?? "general"}</p>
                  <p className="mt-2 text-sm text-slate-700">{notice.content}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
