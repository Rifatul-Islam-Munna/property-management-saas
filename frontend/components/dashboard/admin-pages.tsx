"use client"

import { useState } from "react"
import { Building2, CreditCard, Home, Shield, UserRoundPlus, Users, Wrench } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { DashboardPanelSkeleton, DashboardTableSkeleton, WithBone } from "@/components/dashboard/dashboard-loading"
import { useMeQuery } from "@/hooks/use-auth"
import {
  useCreateOrganizationMutation,
  useCreatePlanMutation,
  useCreatePropertyMutation,
  useCreateSubscriptionMutation,
  useCreateTechnicianMutation,
  useCreateTenantMutation,
  useCreateTenantOwnerMutation,
  useDeleteOrganizationMutation,
  useDeletePlanMutation,
  useDeletePropertyMutation,
  useDeleteTechnicianMutation,
  useDeleteTenantMutation,
  useSubscriptionsQuery,
  useToggleOrganizationMutation,
  useTogglePlanMutation,
  useTogglePropertyMutation,
  useToggleTechnicianMutation,
  useToggleTenantMutation,
} from "@/hooks/use-admin-actions"
import {
  useOrganizationsQuery,
  usePlansQuery,
  usePropertiesQuery,
  useTechniciansQuery,
  useTenantsQuery,
  useUsersQuery,
} from "@/hooks/use-admin-dashboard"

function splitCsv(value?: string) {
  return value?.split(",").map((item) => item.trim()).filter(Boolean) ?? []
}

function AdminPageHero({
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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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
      </div>
    </section>
  )
}

function OrgBoundNote({ enabled }: { enabled: boolean }) {
  if (enabled) return null
  return (
    <Alert>
      <Building2 />
      <AlertTitle>Org-bound action</AlertTitle>
      <AlertDescription>
        Current admin has no `organizationId`. Property, tenant, technician, subscription routes need org-bound admin.
      </AlertDescription>
    </Alert>
  )
}

export function AdminUsersPage() {
  const users = useUsersQuery()
  const organizations = useOrganizationsQuery()
  const plans = usePlansQuery()
  const createTenantOwner = useCreateTenantOwnerMutation()
  const createSubscription = useCreateSubscriptionMutation()
  const userList = Array.isArray(users.data) ? users.data : []
  const orgList = Array.isArray(organizations.data) ? organizations.data : []
  const planList = Array.isArray(plans.data) ? plans.data : []
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    organizationId: "",
    jobTitle: "",
  })
  const [subscriptionForms, setSubscriptionForms] = useState<Record<string, {
    planId: string
    billingInterval: "monthly" | "yearly"
    status: "pending" | "active" | "cancelled" | "expired"
    currentPeriodStart: string
    currentPeriodEnd: string
  }>>({})

  function getSubscriptionForm(userId: string) {
    return subscriptionForms[userId] ?? {
      planId: "",
      billingInterval: "monthly",
      status: "active",
      currentPeriodStart: "",
      currentPeriodEnd: "",
    }
  }

  function setSubscriptionForm(
    userId: string,
    nextValue: Partial<{
      planId: string
      billingInterval: "monthly" | "yearly"
      status: "pending" | "active" | "cancelled" | "expired"
      currentPeriodStart: string
      currentPeriodEnd: string
    }>
  ) {
    setSubscriptionForms((current) => ({
      ...current,
      [userId]: {
        ...getSubscriptionForm(userId),
        ...nextValue,
      },
    }))
  }

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <AdminPageHero icon={Users} badge="People" title="Admin users" body="Create tenant owners and review all platform users from dedicated page." />
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Create tenant owner</CardTitle>
            <CardDescription>Admin can create tenant owner accounts here.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(event) => {
              event.preventDefault()
              createTenantOwner.mutate({
                ...form,
                organizationId: form.organizationId || undefined,
                jobTitle: form.jobTitle || undefined,
                role: "tetentwoner",
              })
            }}>
              <FieldGroup>
                <Field><FieldLabel>Full name</FieldLabel><Input value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Email</FieldLabel><Input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Phone</FieldLabel><Input value={form.phoneNumber} onChange={(event) => setForm((current) => ({ ...current, phoneNumber: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Password</FieldLabel><Input type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Job title (Optional)</FieldLabel><Input value={form.jobTitle} onChange={(event) => setForm((current) => ({ ...current, jobTitle: event.target.value ?? "" }))} /></Field>
                <Field>
                  <FieldLabel>Organization (Optional)</FieldLabel>
                  <Select value={form.organizationId} onValueChange={(value) => setForm((current) => ({ ...current, organizationId: value ?? "" }))}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select organization" /></SelectTrigger>
                    <SelectContent><SelectGroup>{orgList.map((organization) => <SelectItem key={organization._id} value={organization._id}>{organization.name}</SelectItem>)}</SelectGroup></SelectContent>
                  </Select>
                </Field>
              </FieldGroup>
              <Button type="submit" disabled={createTenantOwner.isPending}>Create tenant owner</Button>
            </form>
          </CardContent>
        </Card>

        <WithBone name="admin-page-users" loading={users.isLoading} fallback={<DashboardTableSkeleton />}>
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>User list</CardTitle>
              <CardDescription>All roles from live route.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {userList.length ? userList.map((user) => (
                <div key={user.id} className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-slate-950">{user.fullName}</p>
                    <Badge variant="outline">{user.role}</Badge>
                    {user.subscriptionActive ? <Badge className="bg-emerald-600">{user.subscriptionTier ?? "active plan"}</Badge> : null}
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{user.email}</p>
                  {user.organizationId ? <p className="mt-1 text-xs text-slate-500">Org: {user.organizationId}</p> : null}

                  {user.role === "tetentwoner" ? (
                    <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-slate-950">Assign subscription</p>
                          <p className="text-xs text-slate-600">Pick plan + month range for this tenant owner.</p>
                        </div>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <Field>
                          <FieldLabel>Plan</FieldLabel>
                          <Select value={getSubscriptionForm(user.id).planId} onValueChange={(value) => setSubscriptionForm(user.id, { planId: value ?? "" })}>
                            <SelectTrigger className="w-full"><SelectValue placeholder="Select plan" /></SelectTrigger>
                            <SelectContent><SelectGroup>{planList.map((plan) => <SelectItem key={plan._id} value={plan._id}>{plan.name}</SelectItem>)}</SelectGroup></SelectContent>
                          </Select>
                        </Field>
                        <Field>
                          <FieldLabel>Billing</FieldLabel>
                          <Select value={getSubscriptionForm(user.id).billingInterval} onValueChange={(value) => setSubscriptionForm(user.id, { billingInterval: (value ?? "monthly") as "monthly" | "yearly" })}>
                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent><SelectGroup>{["monthly", "yearly"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectGroup></SelectContent>
                          </Select>
                        </Field>
                        <Field>
                          <FieldLabel>Status</FieldLabel>
                          <Select value={getSubscriptionForm(user.id).status} onValueChange={(value) => setSubscriptionForm(user.id, { status: (value ?? "active") as "pending" | "active" | "cancelled" | "expired" })}>
                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent><SelectGroup>{["active", "pending", "cancelled", "expired"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectGroup></SelectContent>
                          </Select>
                        </Field>
                        <Field>
                          <FieldLabel>Start date (Optional)</FieldLabel>
                          <Input type="date" value={getSubscriptionForm(user.id).currentPeriodStart} onChange={(event) => setSubscriptionForm(user.id, { currentPeriodStart: event.target.value ?? "" })} />
                        </Field>
                        <Field>
                          <FieldLabel>End date (Optional)</FieldLabel>
                          <Input type="date" value={getSubscriptionForm(user.id).currentPeriodEnd} onChange={(event) => setSubscriptionForm(user.id, { currentPeriodEnd: event.target.value ?? "" })} />
                        </Field>
                      </div>
                      <div className="mt-3">
                        <Button
                          size="sm"
                          disabled={createSubscription.isPending || !(user.organizationId ?? "") || !getSubscriptionForm(user.id).planId}
                          onClick={() => createSubscription.mutate({
                            organizationId: user.organizationId ?? "",
                            ownerUserId: user.id,
                            planId: getSubscriptionForm(user.id).planId,
                            billingInterval: getSubscriptionForm(user.id).billingInterval,
                            status: getSubscriptionForm(user.id).status,
                            currentPeriodStart: getSubscriptionForm(user.id).currentPeriodStart || undefined,
                            currentPeriodEnd: getSubscriptionForm(user.id).currentPeriodEnd || undefined,
                          })}
                        >
                          Assign subscription
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )) : <Empty><EmptyHeader><EmptyMedia variant="icon"><Users /></EmptyMedia><EmptyTitle>No users</EmptyTitle><EmptyDescription>Users will show here.</EmptyDescription></EmptyHeader></Empty>}
            </CardContent>
          </Card>
        </WithBone>
      </div>
    </div>
  )
}

export function AdminOrganizationsPage() {
  const organizations = useOrganizationsQuery()
  const createOrganization = useCreateOrganizationMutation()
  const toggleOrganization = useToggleOrganizationMutation()
  const deleteOrganization = useDeleteOrganizationMutation()
  const organizationList = Array.isArray(organizations.data) ? organizations.data : []
  const [form, setForm] = useState({
    name: "",
    slug: "",
    email: "",
    phone: "",
    address: "",
    description: "",
    subscriptionStatus: "trial",
    subscriptionPlan: "starter",
    maxProperties: "5",
    maxUsers: "10",
    isActive: true,
  })

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <AdminPageHero icon={Building2} badge="Organizations" title="Organizations" body="Create and manage tenant organizations, SaaS limits, and active status." />
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="shadow-none">
          <CardHeader><CardTitle>Create organization</CardTitle><CardDescription>Set org info plus SaaS limits.</CardDescription></CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(event) => {
              event.preventDefault()
              createOrganization.mutate({
                ...form,
                subscriptionStatus: form.subscriptionStatus as "active" | "trial" | "expired" | "cancelled",
                subscriptionPlan: form.subscriptionPlan as "starter" | "growth" | "enterprise",
                maxProperties: Number(form.maxProperties || "0"),
                maxUsers: Number(form.maxUsers || "0"),
              })
            }}>
              <FieldGroup>
                <Field><FieldLabel>Name</FieldLabel><Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Slug</FieldLabel><Input value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Email (Optional)</FieldLabel><Input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Phone (Optional)</FieldLabel><Input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Address (Optional)</FieldLabel><Input value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Description (Optional)</FieldLabel><Textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Status</FieldLabel><Select value={form.subscriptionStatus} onValueChange={(value) => setForm((current) => ({ ...current, subscriptionStatus: value ?? "trial" }))}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{["trial","active","expired","cancelled"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
                <Field><FieldLabel>Plan tier</FieldLabel><Select value={form.subscriptionPlan} onValueChange={(value) => setForm((current) => ({ ...current, subscriptionPlan: value ?? "starter" }))}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{["starter","growth","enterprise"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
                <Field><FieldLabel>Max properties</FieldLabel><Input type="number" value={form.maxProperties} onChange={(event) => setForm((current) => ({ ...current, maxProperties: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Max users</FieldLabel><Input type="number" value={form.maxUsers} onChange={(event) => setForm((current) => ({ ...current, maxUsers: event.target.value ?? "" }))} /></Field>
              </FieldGroup>
              <Button type="submit" disabled={createOrganization.isPending}>Create organization</Button>
            </form>
          </CardContent>
        </Card>

        <WithBone name="admin-page-orgs" loading={organizations.isLoading} fallback={<DashboardTableSkeleton />}>
          <Card className="shadow-none">
            <CardHeader><CardTitle>Organization list</CardTitle><CardDescription>Toggle and clean old orgs.</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              {organizationList.length ? organizationList.map((organization) => (
                <div key={organization._id} className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div><p className="font-medium text-slate-950">{organization.name}</p><p className="text-xs text-slate-600">{organization.slug}</p></div>
                  <div className="flex items-center gap-2">
                    <Switch checked={organization.isActive ?? false} onCheckedChange={(checked) => toggleOrganization.mutate({ id: organization._id, payload: { isActive: checked ?? false } })} />
                    <Button variant="outline" size="sm" className="shadow-none" onClick={() => deleteOrganization.mutate(organization._id)}>Delete</Button>
                  </div>
                </div>
              )) : <Empty><EmptyHeader><EmptyMedia variant="icon"><Building2 /></EmptyMedia><EmptyTitle>No organizations</EmptyTitle><EmptyDescription>Create first organization from this page.</EmptyDescription></EmptyHeader></Empty>}
            </CardContent>
          </Card>
        </WithBone>
      </div>
    </div>
  )
}

export function AdminPlansPage() {
  const plans = usePlansQuery()
  const createPlan = useCreatePlanMutation()
  const togglePlan = useTogglePlanMutation()
  const deletePlan = useDeletePlanMutation()
  const planList = Array.isArray(plans.data) ? plans.data : []
  const [form, setForm] = useState({
    name: "",
    description: "",
    monthlyPrice: "",
    yearlyPrice: "",
    maxProperties: "",
    maxUsers: "",
    features: "",
    isActive: true,
  })

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <AdminPageHero icon={CreditCard} badge="Billing" title="Plans" body="Create SaaS plans with features and limits. Paddle product and price IDs sync automatically." />
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="shadow-none">
          <CardHeader><CardTitle>Create plan</CardTitle><CardDescription>Plan name, price, limits, features. Paddle product and monthly/yearly prices auto-sync when backend key exists.</CardDescription></CardHeader>
          <CardContent>
            <Alert className="mb-4 border-blue-200 bg-blue-50/70 text-blue-950">
              <CreditCard />
              <AlertTitle>Auto Paddle sync</AlertTitle>
              <AlertDescription>
                No raw Paddle ids here. Backend creates product + monthly/yearly prices, then stores ids on plan automatically.
              </AlertDescription>
            </Alert>
            <form className="space-y-4" onSubmit={(event) => {
              event.preventDefault()
              createPlan.mutate({
                name: form.name,
                description: form.description || undefined,
                monthlyPrice: Number(form.monthlyPrice || "0"),
                yearlyPrice: Number(form.yearlyPrice || "0"),
                maxProperties: Number(form.maxProperties || "0") || undefined,
                maxUsers: Number(form.maxUsers || "0") || undefined,
                features: splitCsv(form.features),
                isActive: form.isActive,
              })
            }}>
              <FieldGroup>
                <Field><FieldLabel>Name</FieldLabel><Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Description (Optional)</FieldLabel><Textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Monthly price</FieldLabel><Input type="number" value={form.monthlyPrice} onChange={(event) => setForm((current) => ({ ...current, monthlyPrice: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Yearly price</FieldLabel><Input type="number" value={form.yearlyPrice} onChange={(event) => setForm((current) => ({ ...current, yearlyPrice: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Max properties (Optional)</FieldLabel><Input type="number" value={form.maxProperties} onChange={(event) => setForm((current) => ({ ...current, maxProperties: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Max users (Optional)</FieldLabel><Input type="number" value={form.maxUsers} onChange={(event) => setForm((current) => ({ ...current, maxUsers: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Features</FieldLabel><Textarea value={form.features} onChange={(event) => setForm((current) => ({ ...current, features: event.target.value ?? "" }))} /><FieldDescription>Comma separated</FieldDescription></Field>
              </FieldGroup>
              <Button type="submit" disabled={createPlan.isPending}>Create plan</Button>
            </form>
          </CardContent>
        </Card>

        <WithBone name="admin-page-plans" loading={plans.isLoading} fallback={<DashboardTableSkeleton />}>
          <Card className="shadow-none">
            <CardHeader><CardTitle>Plan list</CardTitle><CardDescription>Billing plans for landing and subscription flow.</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              {planList.length ? planList.map((plan) => (
                <div key={plan._id} className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-950">{plan.name}</p>
                      <p className="text-xs text-slate-600">{plan.monthlyPrice ?? 0} / month • {plan.yearlyPrice ?? 0} / year</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={plan.isActive ?? false} onCheckedChange={(checked) => togglePlan.mutate({ id: plan._id, payload: { isActive: checked ?? false } })} />
                      <Button variant="outline" size="sm" className="shadow-none" onClick={() => deletePlan.mutate(plan._id)}>Delete</Button>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(plan.features ?? []).map((feature) => <Badge key={feature} variant="secondary">{feature}</Badge>)}
                  </div>
                </div>
              )) : <Empty><EmptyHeader><EmptyMedia variant="icon"><CreditCard /></EmptyMedia><EmptyTitle>No plans</EmptyTitle><EmptyDescription>Create first plan from this page.</EmptyDescription></EmptyHeader></Empty>}
            </CardContent>
          </Card>
        </WithBone>
      </div>
    </div>
  )
}

export function AdminPropertiesPage() {
  const { data: me } = useMeQuery()
  const properties = usePropertiesQuery()
  const createProperty = useCreatePropertyMutation()
  const toggleProperty = useTogglePropertyMutation()
  const deleteProperty = useDeletePropertyMutation()
  const propertyList = Array.isArray(properties.data) ? properties.data : []
  const canUseOrgScopedRoutes = Boolean(me?.organizationId ?? "")
  const [form, setForm] = useState({
    name: "",
    type: "apartment",
    street: "",
    city: "",
    state: "",
    country: "",
    zipCode: "",
    description: "",
    totalUnits: "",
    totalFloors: "",
    contactPhone: "",
    contactEmail: "",
    amenities: "",
    isActive: true,
  })

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <AdminPageHero icon={Home} badge="Portfolio" title="Properties" body="Admin property create and system inventory on dedicated page." />
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="shadow-none">
          <CardHeader><CardTitle>Create property</CardTitle><CardDescription>Needs org-bound admin JWT.</CardDescription></CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(event) => {
              event.preventDefault()
              createProperty.mutate({
                name: form.name,
                type: form.type as "apartment" | "hotel" | "villa" | "office" | "coworking_space" | "vacation_rental",
                description: form.description || undefined,
                totalUnits: Number(form.totalUnits || "0") || undefined,
                totalFloors: Number(form.totalFloors || "0") || undefined,
                contactPhone: form.contactPhone || undefined,
                contactEmail: form.contactEmail || undefined,
                amenities: splitCsv(form.amenities),
                address: {
                  street: form.street || undefined,
                  city: form.city || undefined,
                  state: form.state || undefined,
                  country: form.country || undefined,
                  zipCode: form.zipCode || undefined,
                },
                isActive: form.isActive,
              })
            }}>
              <OrgBoundNote enabled={canUseOrgScopedRoutes} />
              <FieldGroup>
                <Field><FieldLabel>Name</FieldLabel><Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Type</FieldLabel><Select value={form.type} onValueChange={(value) => setForm((current) => ({ ...current, type: value ?? "apartment" }))}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{["apartment","hotel","villa","office","coworking_space","vacation_rental"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
                <Field><FieldLabel>Street (Optional)</FieldLabel><Input value={form.street} onChange={(event) => setForm((current) => ({ ...current, street: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>City (Optional)</FieldLabel><Input value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Total units (Optional)</FieldLabel><Input type="number" value={form.totalUnits} onChange={(event) => setForm((current) => ({ ...current, totalUnits: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Amenities (Optional)</FieldLabel><Input value={form.amenities} onChange={(event) => setForm((current) => ({ ...current, amenities: event.target.value ?? "" }))} /></Field>
              </FieldGroup>
              <Button type="submit" disabled={createProperty.isPending || !canUseOrgScopedRoutes}>Create property</Button>
            </form>
          </CardContent>
        </Card>

        <WithBone name="admin-page-properties" loading={properties.isLoading} fallback={<DashboardTableSkeleton />}>
          <Card className="shadow-none">
            <CardHeader><CardTitle>Property list</CardTitle><CardDescription>System property inventory.</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              {propertyList.length ? propertyList.map((property) => (
                <div key={property._id} className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div><p className="font-medium text-slate-950">{property.name}</p><p className="text-xs text-slate-600">{property.type} • {property.totalUnits ?? 0} units</p></div>
                  <div className="flex items-center gap-2">
                    <Switch checked={property.isActive ?? false} onCheckedChange={(checked) => toggleProperty.mutate({ id: property._id, payload: { isActive: checked ?? false } })} />
                    <Button variant="outline" size="sm" className="shadow-none" onClick={() => deleteProperty.mutate(property._id)}>Delete</Button>
                  </div>
                </div>
              )) : <Empty><EmptyHeader><EmptyMedia variant="icon"><Home /></EmptyMedia><EmptyTitle>No properties</EmptyTitle><EmptyDescription>Create first property from this page.</EmptyDescription></EmptyHeader></Empty>}
            </CardContent>
          </Card>
        </WithBone>
      </div>
    </div>
  )
}

export function AdminTenantsPage() {
  const { data: me } = useMeQuery()
  const properties = usePropertiesQuery()
  const tenants = useTenantsQuery()
  const createTenant = useCreateTenantMutation()
  const toggleTenant = useToggleTenantMutation()
  const deleteTenant = useDeleteTenantMutation()
  const propertyList = Array.isArray(properties.data) ? properties.data : []
  const tenantList = Array.isArray(tenants.data) ? tenants.data : []
  const canUseOrgScopedRoutes = Boolean(me?.organizationId ?? "")
  const [form, setForm] = useState({
    tenantKind: "renter",
    propertyId: "",
    fullName: "",
    email: "",
    phone: "",
    address: "",
    monthlyRent: "",
    oneTimeGuestFee: "",
  })

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <AdminPageHero icon={Shield} badge="Residents" title="Tenants" body="Create renter or guest records and manage active resident data." />
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="shadow-none">
          <CardHeader><CardTitle>Create tenant</CardTitle><CardDescription>Renter or guest under selected property.</CardDescription></CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(event) => {
              event.preventDefault()
              createTenant.mutate({
                tenantKind: form.tenantKind as "renter" | "guest",
                propertyId: form.propertyId,
                fullName: form.fullName,
                email: form.email,
                phone: form.phone,
                address: form.address || undefined,
                monthlyRent: Number(form.monthlyRent || "0") || undefined,
                oneTimeGuestFee: Number(form.oneTimeGuestFee || "0") || undefined,
              })
            }}>
              <OrgBoundNote enabled={canUseOrgScopedRoutes} />
              <FieldGroup>
                <Field><FieldLabel>Kind</FieldLabel><Select value={form.tenantKind} onValueChange={(value) => setForm((current) => ({ ...current, tenantKind: value ?? "renter" }))}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{["renter","guest"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
                <Field><FieldLabel>Property</FieldLabel><Select value={form.propertyId} onValueChange={(value) => setForm((current) => ({ ...current, propertyId: value ?? "" }))}><SelectTrigger className="w-full"><SelectValue placeholder="Select property" /></SelectTrigger><SelectContent><SelectGroup>{propertyList.map((property) => <SelectItem key={property._id} value={property._id}>{property.name}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
                <Field><FieldLabel>Full name</FieldLabel><Input value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Email</FieldLabel><Input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Phone</FieldLabel><Input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value ?? "" }))} /></Field>
                {form.tenantKind === "renter" ? <Field><FieldLabel>Monthly rent (Optional)</FieldLabel><Input type="number" value={form.monthlyRent} onChange={(event) => setForm((current) => ({ ...current, monthlyRent: event.target.value ?? "" }))} /></Field> : <Field><FieldLabel>Guest fee (Optional)</FieldLabel><Input type="number" value={form.oneTimeGuestFee} onChange={(event) => setForm((current) => ({ ...current, oneTimeGuestFee: event.target.value ?? "" }))} /></Field>}
              </FieldGroup>
              <Button type="submit" disabled={createTenant.isPending || !canUseOrgScopedRoutes}>Create tenant</Button>
            </form>
          </CardContent>
        </Card>

        <WithBone name="admin-page-tenants" loading={tenants.isLoading} fallback={<DashboardTableSkeleton />}>
          <Card className="shadow-none">
            <CardHeader><CardTitle>Tenant list</CardTitle><CardDescription>Platform resident records.</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              {tenantList.length ? tenantList.map((tenant) => (
                <div key={tenant._id} className="flex flex-col gap-3 rounded-xl border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-slate-950">{tenant.fullName}</p>
                    <Badge variant="outline">{tenant.tenantKind ?? "resident"}</Badge>
                  </div>
                  <p className="text-sm text-slate-600">{tenant.email ?? "No email"}</p>
                  <div className="flex items-center gap-2">
                    <Switch checked={tenant.isActive ?? false} onCheckedChange={(checked) => toggleTenant.mutate({ id: tenant._id, payload: { isActive: checked ?? false } })} />
                    <Button variant="outline" size="sm" className="shadow-none" onClick={() => deleteTenant.mutate(tenant._id)}>Delete</Button>
                  </div>
                </div>
              )) : <Empty><EmptyHeader><EmptyMedia variant="icon"><Shield /></EmptyMedia><EmptyTitle>No tenants</EmptyTitle><EmptyDescription>Create first tenant from this page.</EmptyDescription></EmptyHeader></Empty>}
            </CardContent>
          </Card>
        </WithBone>
      </div>
    </div>
  )
}

export function AdminTechniciansPage() {
  const { data: me } = useMeQuery()
  const technicians = useTechniciansQuery()
  const createTechnician = useCreateTechnicianMutation()
  const toggleTechnician = useToggleTechnicianMutation()
  const deleteTechnician = useDeleteTechnicianMutation()
  const technicianList = Array.isArray(technicians.data) ? technicians.data : []
  const canUseOrgScopedRoutes = Boolean(me?.organizationId ?? "")
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    skills: "",
    availability: "available",
    assignedProperties: "",
  })

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <AdminPageHero icon={Wrench} badge="Field Team" title="Technicians" body="Create technician profiles and manage active worker-style technical resources." />
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="shadow-none">
          <CardHeader><CardTitle>Create technician</CardTitle><CardDescription>Global profile linked into org scope.</CardDescription></CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(event) => {
              event.preventDefault()
              createTechnician.mutate({
                name: form.name,
                email: form.email,
                phone: form.phone,
                skills: splitCsv(form.skills),
                availability: form.availability as "available" | "busy" | "on_leave" | "off_duty",
                assignedProperties: splitCsv(form.assignedProperties),
              })
            }}>
              <OrgBoundNote enabled={canUseOrgScopedRoutes} />
              <FieldGroup>
                <Field><FieldLabel>Name</FieldLabel><Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Email</FieldLabel><Input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Phone</FieldLabel><Input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Skills</FieldLabel><Input value={form.skills} onChange={(event) => setForm((current) => ({ ...current, skills: event.target.value ?? "" }))} /><FieldDescription>Comma separated</FieldDescription></Field>
                <Field><FieldLabel>Availability</FieldLabel><Select value={form.availability} onValueChange={(value) => setForm((current) => ({ ...current, availability: value ?? "available" }))}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{["available","busy","on_leave","off_duty"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
              </FieldGroup>
              <Button type="submit" disabled={createTechnician.isPending || !canUseOrgScopedRoutes}>Create technician</Button>
            </form>
          </CardContent>
        </Card>

        <WithBone name="admin-page-technicians" loading={technicians.isLoading} fallback={<DashboardTableSkeleton />}>
          <Card className="shadow-none">
            <CardHeader><CardTitle>Technician list</CardTitle><CardDescription>Active and inactive technical resources.</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              {technicianList.length ? technicianList.map((technician) => (
                <div key={technician._id} className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div><p className="font-medium text-slate-950">{technician.fullName}</p><p className="text-xs text-slate-600">{technician.specialty ?? "General"}</p></div>
                  <div className="flex items-center gap-2">
                    <Switch checked={technician.isActive ?? false} onCheckedChange={(checked) => toggleTechnician.mutate({ id: technician._id, payload: { isActive: checked ?? false } })} />
                    <Button variant="outline" size="sm" className="shadow-none" onClick={() => deleteTechnician.mutate(technician._id)}>Delete</Button>
                  </div>
                </div>
              )) : <Empty><EmptyHeader><EmptyMedia variant="icon"><Wrench /></EmptyMedia><EmptyTitle>No technicians</EmptyTitle><EmptyDescription>Create first technician from this page.</EmptyDescription></EmptyHeader></Empty>}
            </CardContent>
          </Card>
        </WithBone>
      </div>
    </div>
  )
}

export function AdminSubscriptionsPage() {
  const users = useUsersQuery()
  const organizations = useOrganizationsQuery()
  const plans = usePlansQuery()
  const subscriptions = useSubscriptionsQuery()
  const createSubscription = useCreateSubscriptionMutation()
  const userList = Array.isArray(users.data) ? users.data : []
  const organizationList = Array.isArray(organizations.data) ? organizations.data : []
  const planList = Array.isArray(plans.data) ? plans.data : []
  const subscriptionList = Array.isArray(subscriptions.data) ? subscriptions.data : []
  const tenantOwnerList = userList.filter((user) => user.role === "tetentwoner")
  const [form, setForm] = useState({
    organizationId: "",
    ownerUserId: "",
    planId: "",
    billingInterval: "monthly",
    status: "active",
    currentPeriodStart: "",
    currentPeriodEnd: "",
  })

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <AdminPageHero icon={CreditCard} badge="Subscriptions" title="Subscriptions" body="Attach plan to organization or tenant owner and set custom month/date range from admin panel." />
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="shadow-none">
          <CardHeader><CardTitle>Create subscription</CardTitle><CardDescription>Bind plan to organization with owner and custom start/end date if needed.</CardDescription></CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(event) => {
              event.preventDefault()
              createSubscription.mutate({
                organizationId: form.organizationId,
                ownerUserId: form.ownerUserId || undefined,
                planId: form.planId,
                billingInterval: form.billingInterval as "monthly" | "yearly",
                status: form.status as "pending" | "active" | "cancelled" | "expired",
                currentPeriodStart: form.currentPeriodStart || undefined,
                currentPeriodEnd: form.currentPeriodEnd || undefined,
              })
            }}>
              <FieldGroup>
                <Field><FieldLabel>Organization</FieldLabel><Select value={form.organizationId} onValueChange={(value) => setForm((current) => ({ ...current, organizationId: value ?? "" }))}><SelectTrigger className="w-full"><SelectValue placeholder="Select organization" /></SelectTrigger><SelectContent><SelectGroup>{organizationList.map((organization) => <SelectItem key={organization._id} value={organization._id}>{organization.name}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
                <Field><FieldLabel>Tenant owner (Optional)</FieldLabel><Select value={form.ownerUserId} onValueChange={(value) => setForm((current) => ({ ...current, ownerUserId: value ?? "" }))}><SelectTrigger className="w-full"><SelectValue placeholder="Select tenant owner" /></SelectTrigger><SelectContent><SelectGroup>{tenantOwnerList.filter((user) => !form.organizationId || user.organizationId === form.organizationId).map((user) => <SelectItem key={user.id} value={user.id}>{user.fullName}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
                <Field><FieldLabel>Plan</FieldLabel><Select value={form.planId} onValueChange={(value) => setForm((current) => ({ ...current, planId: value ?? "" }))}><SelectTrigger className="w-full"><SelectValue placeholder="Select plan" /></SelectTrigger><SelectContent><SelectGroup>{planList.map((plan) => <SelectItem key={plan._id} value={plan._id}>{plan.name}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
                <Field><FieldLabel>Billing</FieldLabel><Select value={form.billingInterval} onValueChange={(value) => setForm((current) => ({ ...current, billingInterval: value ?? "monthly" }))}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{["monthly","yearly"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
                <Field><FieldLabel>Status</FieldLabel><Select value={form.status} onValueChange={(value) => setForm((current) => ({ ...current, status: value ?? "active" }))}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{["active","pending","cancelled","expired"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
                <Field><FieldLabel>Start date (Optional)</FieldLabel><Input type="date" value={form.currentPeriodStart} onChange={(event) => setForm((current) => ({ ...current, currentPeriodStart: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>End date (Optional)</FieldLabel><Input type="date" value={form.currentPeriodEnd} onChange={(event) => setForm((current) => ({ ...current, currentPeriodEnd: event.target.value ?? "" }))} /></Field>
              </FieldGroup>
              <Button type="submit" disabled={createSubscription.isPending}>Create subscription</Button>
            </form>
          </CardContent>
        </Card>

        <WithBone name="admin-page-subscriptions" loading={subscriptions.isLoading} fallback={<DashboardTableSkeleton />}>
          <Card className="shadow-none">
            <CardHeader><CardTitle>Subscription list</CardTitle><CardDescription>Current org billing records.</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              {subscriptionList.length ? subscriptionList.map((subscription) => (
                <div key={subscription._id} className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-slate-950">{subscription.planId}</p>
                    <Badge variant={subscription.status === "active" ? "default" : "outline"}>{subscription.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{subscription.organizationId} • {subscription.billingInterval} • {subscription.amount}</p>
                </div>
              )) : <Empty><EmptyHeader><EmptyMedia variant="icon"><CreditCard /></EmptyMedia><EmptyTitle>No subscriptions</EmptyTitle><EmptyDescription>Create first subscription from this page.</EmptyDescription></EmptyHeader></Empty>}
            </CardContent>
          </Card>
        </WithBone>
      </div>
    </div>
  )
}

export function AdminOverviewPlaceholder() {
  return (
    <div className="px-4 lg:px-6">
      <WithBone name="admin-overview-page" loading={false} fallback={<DashboardPanelSkeleton />}>
        <AdminPageHero icon={Building2} badge="Overview" title="Admin overview" body="Use left sidebar pages for dedicated controls, same pattern as tenant owner dashboard." />
      </WithBone>
    </div>
  )
}
