"use client"

import { useState } from "react"
import { AlertCircle, ArrowUpRight, Building2, CreditCard, Home, Users, Wrench } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DashboardPanelSkeleton,
  DashboardCardSkeleton,
  DashboardTableSkeleton,
  WithBone,
} from "@/components/dashboard/dashboard-loading"
import { ImageUploadField } from "@/components/shared/image-upload-field"
import {
  useAdminAnalyticsQuery,
  useOrganizationsQuery,
  usePlansQuery,
  usePropertiesQuery,
  useTechniciansQuery,
  useTechnicianStatsQuery,
  useTenantsQuery,
  useTicketStatsQuery,
  useTicketsQuery,
  useUsersQuery,
} from "@/hooks/use-admin-dashboard"
import {
  useDeleteOrganizationMutation,
  useDeletePlanMutation,
  useDeletePropertyMutation,
  useDeleteTechnicianMutation,
  useDeleteTenantMutation,
  useCreatePlanMutation,
  useSubscriptionsQuery,
  useToggleOrganizationMutation,
  useTogglePlanMutation,
  useTogglePropertyMutation,
  useToggleTechnicianMutation,
  useToggleTenantMutation,
} from "@/hooks/use-admin-actions"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Textarea } from "@/components/ui/textarea"

function splitCsv(value?: string) {
  return value?.split(",").map((item) => item.trim()).filter(Boolean) ?? []
}

function MetricCard({
  title,
  value,
  note,
  icon: Icon,
}: {
  title: string
  value: string | number
  note: string
  icon: typeof Home
}) {
  return (
    <Card className="border-border bg-background shadow-none">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-slate-700">{title}</CardTitle>
        <Icon className="size-4 text-slate-500" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold text-slate-950">{value}</div>
        <p className="text-xs text-slate-600">{note}</p>
      </CardContent>
    </Card>
  )
}

export function AdminDashboard() {
  const analytics = useAdminAnalyticsQuery()
  const ticketStats = useTicketStatsQuery()
  const technicianStats = useTechnicianStatsQuery()
  const users = useUsersQuery()
  const organizations = useOrganizationsQuery()
  const properties = usePropertiesQuery()
  const tenants = useTenantsQuery()
  const tickets = useTicketsQuery()
  const technicians = useTechniciansQuery()
  const plans = usePlansQuery()
  const subscriptions = useSubscriptionsQuery()
  const deleteOrganization = useDeleteOrganizationMutation()
  const deleteProperty = useDeletePropertyMutation()
  const deleteTenant = useDeleteTenantMutation()
  const deleteTechnician = useDeleteTechnicianMutation()
  const deletePlan = useDeletePlanMutation()
  const createPlan = useCreatePlanMutation()
  const toggleOrganization = useToggleOrganizationMutation()
  const toggleProperty = useTogglePropertyMutation()
  const toggleTenant = useToggleTenantMutation()
  const toggleTechnician = useToggleTechnicianMutation()
  const togglePlan = useTogglePlanMutation()
  const usersList = Array.isArray(users.data) ? users.data : []
  const organizationsList = Array.isArray(organizations.data) ? organizations.data : []
  const propertiesList = Array.isArray(properties.data) ? properties.data : []
  const tenantsList = Array.isArray(tenants.data) ? tenants.data : []
  const ticketsList = Array.isArray(tickets.data) ? tickets.data : []
  const techniciansList = Array.isArray(technicians.data) ? technicians.data : []
  const plansList = Array.isArray(plans.data) ? plans.data : []
  const subscriptionsList = Array.isArray(subscriptions.data) ? subscriptions.data : []
  const [planForm, setPlanForm] = useState({
    name: "",
    description: "",
    monthlyPrice: "",
    yearlyPrice: "",
    maxProperties: "",
    maxUsers: "",
    features: "",
    isActive: true,
  })

  const loading =
    analytics.isLoading ||
    users.isLoading ||
    organizations.isLoading ||
    properties.isLoading ||
    tenants.isLoading ||
    tickets.isLoading ||
    technicians.isLoading ||
    plans.isLoading

  return (
    <div className="space-y-6">
      <WithBone name="admin-overview" loading={loading} fallback={<DashboardPanelSkeleton />}>
        <section
          id="overview"
          className="rounded-2xl border bg-background p-5"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <Badge variant="outline" className="border-blue-200 text-blue-700">
                Admin control center
              </Badge>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                Real route data. Reusable shell. Mobile first.
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-600">
                This screen pulls from users, organizations, properties, tenants, tickets,
                technicians, plans, subscriptions analytics.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div className="rounded-xl border bg-background px-4 py-3">
                <p className="text-slate-500">Users</p>
                <p className="mt-1 text-lg font-semibold">{usersList.length ?? 0}</p>
              </div>
              <div className="rounded-xl border bg-background px-4 py-3">
                <p className="text-slate-500">Orgs</p>
                <p className="mt-1 text-lg font-semibold">{organizationsList.length ?? 0}</p>
              </div>
              <div className="rounded-xl border bg-background px-4 py-3">
                <p className="text-slate-500">Plans</p>
                <p className="mt-1 text-lg font-semibold">{plansList.length ?? 0}</p>
              </div>
              <div className="rounded-xl border bg-background px-4 py-3">
                <p className="text-slate-500">Techs</p>
                <p className="mt-1 text-lg font-semibold">
                  {technicianStats.data?.activeTechnicians ?? 0}
                </p>
              </div>
            </div>
          </div>
        </section>
      </WithBone>

      <WithBone
        name="admin-metrics"
        loading={loading}
        fallback={
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <DashboardCardSkeleton key={index} />
            ))}
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Properties"
            value={analytics.data?.totalProperties ?? 0}
            note={`${analytics.data?.totalUnits ?? 0} total units`}
            icon={Building2}
          />
          <MetricCard
            title="Open tickets"
            value={analytics.data?.openTickets ?? 0}
            note={`${analytics.data?.emergencyTickets ?? 0} emergency`}
            icon={AlertCircle}
          />
          <MetricCard
            title="Occupancy"
            value={`${analytics.data?.occupancyRate ?? 0}%`}
            note={`${analytics.data?.occupiedUnits ?? 0} occupied units`}
            icon={Home}
          />
          <MetricCard
            title="Active technicians"
            value={technicianStats.data?.activeTechnicians ?? 0}
            note={`${technicianStats.data?.totalTenants ?? 0} active tenants`}
            icon={Wrench}
          />
        </div>
      </WithBone>
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList variant="line" className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="ops">Operations</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <WithBone
            name="admin-users"
            loading={users.isLoading}
            fallback={<DashboardTableSkeleton />}
          >
            <Card id="users" className="shadow-none">
              <CardHeader>
                <CardTitle>User access</CardTitle>
                <CardDescription>Seeded super admin + live role list.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Subscription</TableHead>
                      <TableHead>Organization</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersList.slice(0, 8).map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.fullName}</TableCell>
                        <TableCell className="capitalize">{user.role}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          {user.subscriptionRequired ? (
                            <Badge variant={user.subscriptionActive ? "default" : "outline"}>
                              {user.subscriptionActive ? "Active" : "Need plan"}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">N/A</Badge>
                          )}
                        </TableCell>
                        <TableCell>{user.organizationId ?? "Unbound"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </WithBone>

          <div className="grid gap-4 lg:grid-cols-2">
            <WithBone
              name="admin-organizations"
              loading={organizations.isLoading}
              fallback={<DashboardTableSkeleton />}
            >
              <Card className="shadow-none">
                <CardHeader>
                  <CardTitle>Organizations</CardTitle>
                  <CardDescription>Admin-owned org records.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {organizationsList.length === 0 ? (
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <Building2 />
                        </EmptyMedia>
                        <EmptyTitle>No organizations</EmptyTitle>
                        <EmptyDescription>Create first org from admin controls.</EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ) : organizationsList.slice(0, 5).map((organization) => (
                    <div
                      key={organization._id}
                      className="flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium text-slate-950">{organization.name}</p>
                        <p className="text-xs text-slate-600">{organization.slug}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={organization.isActive ?? false}
                          onCheckedChange={(checked) =>
                            toggleOrganization.mutate({
                              id: organization._id,
                              payload: { isActive: checked ?? false },
                            })
                          }
                        />
                        <Badge variant={organization.isActive ? "default" : "outline"}>
                          {organization.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Button variant="outline" size="sm" onClick={() => deleteOrganization.mutate(organization._id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </WithBone>

            <WithBone
              name="admin-properties"
              loading={properties.isLoading}
              fallback={<DashboardTableSkeleton />}
            >
              <Card id="properties" className="shadow-none">
                <CardHeader>
                  <CardTitle>Properties</CardTitle>
                  <CardDescription>Quick system inventory.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {propertiesList.length === 0 ? (
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <Home />
                        </EmptyMedia>
                        <EmptyTitle>No properties</EmptyTitle>
                        <EmptyDescription>Use org-bound admin to create properties.</EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ) : propertiesList.slice(0, 5).map((property) => (
                    <div
                      key={property._id}
                      className="flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium text-slate-950">{property.name}</p>
                        <p className="text-xs text-slate-600">
                          {property.type} • {property.totalUnits ?? 0} units
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={property.isActive ?? false}
                          onCheckedChange={(checked) =>
                            toggleProperty.mutate({
                              id: property._id,
                              payload: { isActive: checked ?? false },
                            })
                          }
                        />
                        <ArrowUpRight className="size-4 text-slate-400" />
                        <Button variant="outline" size="sm" onClick={() => deleteProperty.mutate(property._id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </WithBone>
          </div>
        </TabsContent>

        <TabsContent value="ops" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <WithBone
              name="admin-tickets"
              loading={tickets.isLoading || ticketStats.isLoading}
              fallback={<DashboardTableSkeleton />}
            >
              <Card className="shadow-none">
                <CardHeader>
                  <CardTitle>Recent tickets</CardTitle>
                  <CardDescription>
                    Status groups: {(ticketStats.data?.byStatus ?? []).length}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {ticketsList.length === 0 ? (
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <AlertCircle />
                        </EmptyMedia>
                        <EmptyTitle>No tickets</EmptyTitle>
                        <EmptyDescription>Tickets will show here from live route data.</EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ) : ticketsList.slice(0, 6).map((ticket) => (
                    <div
                      key={ticket._id}
                      className="flex items-center justify-between rounded-xl border p-3"
                    >
                      <div>
                        <p className="font-medium text-slate-950">{ticket.title}</p>
                        <p className="text-xs text-slate-600">
                          {ticket.priority} • {ticket.status}
                        </p>
                      </div>
                      <Badge variant="outline">{ticket.status}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </WithBone>

            <WithBone
              name="admin-people"
              loading={tenants.isLoading || technicians.isLoading}
              fallback={<DashboardTableSkeleton />}
            >
              <Card className="shadow-none">
                <CardHeader>
                  <CardTitle>Tenants and technicians</CardTitle>
                  <CardDescription>Ops people snapshot.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border p-3">
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                      <Users className="size-4" />
                      Tenants
                    </div>
                    <div className="space-y-2">
                      {tenantsList.length === 0 ? (
                        <p className="text-xs text-slate-500">No tenants yet</p>
                      ) : tenantsList.slice(0, 4).map((tenant) => (
                        <div key={tenant._id} className="rounded-lg border p-2">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium">{tenant.fullName}</p>
                              <p className="text-xs text-slate-600">
                                {tenant.tenantKind ?? "resident"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={tenant.isActive ?? false}
                                onCheckedChange={(checked) =>
                                  toggleTenant.mutate({
                                    id: tenant._id,
                                    payload: { isActive: checked ?? false },
                                  })
                                }
                              />
                              <Button variant="outline" size="sm" onClick={() => deleteTenant.mutate(tenant._id)}>
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border p-3">
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                      <Wrench className="size-4" />
                      Technicians
                    </div>
                    <div className="space-y-2">
                      {techniciansList.length === 0 ? (
                        <p className="text-xs text-slate-500">No technicians yet</p>
                      ) : techniciansList.slice(0, 4).map((technician) => (
                        <div key={technician._id} className="rounded-lg border p-2">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium">{technician.fullName}</p>
                              <p className="text-xs text-slate-600">
                                {technician.specialty ?? "General"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={technician.isActive ?? false}
                                onCheckedChange={(checked) =>
                                  toggleTechnician.mutate({
                                    id: technician._id,
                                    payload: { isActive: checked ?? false },
                                  })
                                }
                              />
                              <Button variant="outline" size="sm" onClick={() => deleteTechnician.mutate(technician._id)}>
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </WithBone>
          </div>
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Add plan</CardTitle>
              <CardDescription>
                Admin can define plan name, features, limits, monthly price, yearly price.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault()
                  createPlan.mutate(
                    {
                      name: planForm.name,
                      description: planForm.description || undefined,
                      monthlyPrice: Number(planForm.monthlyPrice || "0"),
                      yearlyPrice: Number(planForm.yearlyPrice || "0"),
                      maxProperties: Number(planForm.maxProperties || "0") || undefined,
                      maxUsers: Number(planForm.maxUsers || "0") || undefined,
                      features: splitCsv(planForm.features),
                      isActive: planForm.isActive,
                    },
                    {
                      onSuccess: () => {
                        setPlanForm({
                          name: "",
                          description: "",
                          monthlyPrice: "",
                          yearlyPrice: "",
                          maxProperties: "",
                          maxUsers: "",
                          features: "",
                          isActive: true,
                        })
                      },
                    }
                  )
                }}
              >
                <FieldGroup>
                  <Field><FieldLabel>Plan name</FieldLabel><Input placeholder="Starter, Growth, Enterprise" value={planForm.name} onChange={(event) => setPlanForm((current) => ({ ...current, name: event.target.value ?? "" }))} /></Field>
                  <Field><FieldLabel>Description (Optional)</FieldLabel><Textarea placeholder="Short plan summary" value={planForm.description} onChange={(event) => setPlanForm((current) => ({ ...current, description: event.target.value ?? "" }))} /></Field>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field><FieldLabel>Monthly price</FieldLabel><Input type="number" placeholder="499" value={planForm.monthlyPrice} onChange={(event) => setPlanForm((current) => ({ ...current, monthlyPrice: event.target.value ?? "" }))} /></Field>
                    <Field><FieldLabel>Yearly price</FieldLabel><Input type="number" placeholder="4999" value={planForm.yearlyPrice} onChange={(event) => setPlanForm((current) => ({ ...current, yearlyPrice: event.target.value ?? "" }))} /></Field>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field><FieldLabel>Max properties (Optional)</FieldLabel><Input type="number" placeholder="10" value={planForm.maxProperties} onChange={(event) => setPlanForm((current) => ({ ...current, maxProperties: event.target.value ?? "" }))} /></Field>
                    <Field><FieldLabel>Max users (Optional)</FieldLabel><Input type="number" placeholder="50" value={planForm.maxUsers} onChange={(event) => setPlanForm((current) => ({ ...current, maxUsers: event.target.value ?? "" }))} /></Field>
                  </div>
                  <Field>
                    <FieldLabel>Features</FieldLabel>
                    <Textarea placeholder="tickets, chat, analytics, vendors" value={planForm.features} onChange={(event) => setPlanForm((current) => ({ ...current, features: event.target.value ?? "" }))} />
                    <FieldDescription>Comma separated feature list.</FieldDescription>
                  </Field>
                  <Field className="flex flex-row items-center justify-between rounded-xl border px-4 py-3">
                    <div>
                      <FieldLabel>Active status</FieldLabel>
                      <FieldDescription>Inactive plan stays hidden for new sales.</FieldDescription>
                    </div>
                    <Switch checked={planForm.isActive} onCheckedChange={(checked) => setPlanForm((current) => ({ ...current, isActive: checked ?? true }))} />
                  </Field>
                </FieldGroup>
                <Button type="submit" disabled={createPlan.isPending || !planForm.name || !planForm.monthlyPrice || !planForm.yearlyPrice}>
                  Add plan
                </Button>
              </form>
            </CardContent>
          </Card>

          <WithBone
            name="admin-plans"
            loading={plans.isLoading}
            fallback={<DashboardTableSkeleton />}
          >
            <Card id="plans" className="shadow-none">
              <CardHeader>
                <CardTitle>Subscription plans</CardTitle>
                <CardDescription>Super admin plan controls.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plan</TableHead>
                      <TableHead>Monthly</TableHead>
                      <TableHead>Yearly</TableHead>
                      <TableHead>Features</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Limits</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plansList.slice(0, 8).map((plan) => (
                      <TableRow key={plan._id}>
                        <TableCell className="font-medium">{plan.name}</TableCell>
                        <TableCell>{plan.monthlyPrice ?? 0}</TableCell>
                        <TableCell>{plan.yearlyPrice ?? 0}</TableCell>
                        <TableCell className="max-w-56">
                          <div className="flex flex-wrap gap-1">
                            {(plan.features ?? []).length ? (plan.features ?? []).slice(0, 4).map((feature) => (
                              <Badge key={feature} variant="secondary">{feature}</Badge>
                            )) : <span className="text-xs text-slate-500">No features</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={plan.isActive ?? false}
                              onCheckedChange={(checked) =>
                                togglePlan.mutate({
                                  id: plan._id,
                                  payload: { isActive: checked ?? false },
                                })
                              }
                            />
                            <Badge variant={plan.isActive ? "default" : "outline"}>
                              {plan.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {plan.maxProperties ?? 0} props / {plan.maxUsers ?? 0} users
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={() => deletePlan.mutate(plan._id)}>
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </WithBone>

          <WithBone
            name="admin-subscriptions"
            loading={subscriptions.isLoading}
            fallback={<DashboardTableSkeleton />}
          >
            <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Subscriptions</CardTitle>
              <CardDescription>Live billing records from backend.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {subscriptionsList.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <CreditCard />
                    </EmptyMedia>
                    <EmptyTitle>No subscriptions</EmptyTitle>
                    <EmptyDescription>Create first subscription from admin controls.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : subscriptionsList.slice(0, 6).map((subscription) => (
                <div key={subscription._id} className="flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-slate-950">{subscription.planId}</p>
                    <p className="text-xs text-slate-600">
                      {subscription.organizationId} • {subscription.billingInterval}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={subscription.status === "active" ? "default" : "outline"}>
                      {subscription.status}
                    </Badge>
                    <span className="text-sm font-medium">{subscription.amount}</span>
                  </div>
                </div>
              ))}
            </CardContent>
            </Card>
          </WithBone>
        </TabsContent>

        <TabsContent value="media" className="space-y-4">
          <WithBone
            name="admin-media"
            loading={false}
            fallback={<DashboardPanelSkeleton />}
          >
            <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Reusable image upload</CardTitle>
              <CardDescription>
                Admin can reuse this comp anywhere later.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <ImageUploadField />
              <div className="rounded-xl border p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-950">
                  <CreditCard className="size-4" />
                  Admin notes
                </div>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                  <li>Default seeded super admin: `test@gmail.com` / `11111111`</li>
                  <li>Public signup now supports `worker` and `tetentwoner`</li>
                  <li>Dashboard shell reusable for 4 role layouts</li>
                </ul>
              </div>
            </CardContent>
            </Card>
          </WithBone>
        </TabsContent>
      </Tabs>
    </div>
  )
}
