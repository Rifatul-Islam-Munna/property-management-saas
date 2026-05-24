"use client"

import { useState } from "react"
import { Building2, CreditCard, Home, UserCog2, UserRoundPlus, Wrench } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useMeQuery } from "@/hooks/use-auth"
import {
  useCreateOrganizationMutation,
  useCreatePlanMutation,
  useCreatePropertyMutation,
  useCreateSubscriptionMutation,
  useCreateTechnicianMutation,
  useCreateTenantMutation,
  useCreateTenantOwnerMutation,
} from "@/hooks/use-admin-actions"
import { useOrganizationsQuery, usePlansQuery, usePropertiesQuery } from "@/hooks/use-admin-dashboard"

function splitCsv(value?: string) {
  return value
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean) ?? []
}

function ControlDialog({
  trigger,
  title,
  description,
  children,
}: {
  trigger: React.ReactNode
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[88svh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}

export function AdminControlCenter() {
  const { data: me } = useMeQuery()
  const organizations = useOrganizationsQuery()
  const properties = usePropertiesQuery()
  const plans = usePlansQuery()
  const createTenantOwner = useCreateTenantOwnerMutation()
  const createOrganization = useCreateOrganizationMutation()
  const createProperty = useCreatePropertyMutation()
  const createTenant = useCreateTenantMutation()
  const createTechnician = useCreateTechnicianMutation()
  const createPlan = useCreatePlanMutation()
  const createSubscription = useCreateSubscriptionMutation()

  const [tenantOwnerForm, setTenantOwnerForm] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    organizationId: "",
    jobTitle: "",
  })
  const [organizationForm, setOrganizationForm] = useState({
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
  const [propertyForm, setPropertyForm] = useState({
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
    images: "",
    documents: "",
    isActive: true,
  })
  const [tenantForm, setTenantForm] = useState({
    tenantKind: "renter",
    propertyId: "",
    unitId: "",
    fullName: "",
    email: "",
    phone: "",
    address: "",
    monthlyRent: "",
    securityDeposit: "",
    oneTimeGuestFee: "",
    notes: "",
    isActive: true,
  })
  const [technicianForm, setTechnicianForm] = useState({
    name: "",
    email: "",
    phone: "",
    skills: "",
    availability: "available",
    assignedProperties: "",
    hourlyRate: "",
    notes: "",
    isActive: true,
  })
  const [planForm, setPlanForm] = useState({
    name: "",
    description: "",
    monthlyPrice: "",
    yearlyPrice: "",
    maxProperties: "1",
    maxUsers: "5",
    features: "",
    isActive: true,
  })
  const [subscriptionForm, setSubscriptionForm] = useState({
    organizationId: "",
    planId: "",
    billingInterval: "monthly",
  })

  const orgList = Array.isArray(organizations.data) ? organizations.data : []
  const propertyList = Array.isArray(properties.data) ? properties.data : []
  const planList = Array.isArray(plans.data) ? plans.data : []
  const canUseOrgScopedRoutes = Boolean(me?.organizationId ?? "")

  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Admin controls</CardTitle>
          <CardDescription>
            Same dashboard style. Real forms for main admin endpoints.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <ControlDialog
            title="Create tenant owner"
            description="Admin can create tenant owner users."
            trigger={
              <Button variant="outline" className="h-12 justify-start shadow-none">
                <UserRoundPlus data-icon="inline-start" />
                Tenant owner
              </Button>
            }
          >
            <form
              className="flex flex-col gap-4"
              onSubmit={(event) => {
                event.preventDefault()
                createTenantOwner.mutate({
                  ...tenantOwnerForm,
                  organizationId: tenantOwnerForm.organizationId || undefined,
                  jobTitle: tenantOwnerForm.jobTitle || undefined,
                  role: "tetentwoner",
                })
              }}
            >
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="to-name">Full name</FieldLabel>
                  <Input id="to-name" value={tenantOwnerForm.fullName} onChange={(event) => setTenantOwnerForm((current) => ({ ...current, fullName: event.target.value ?? "" }))} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="to-email">Email</FieldLabel>
                  <Input id="to-email" type="email" value={tenantOwnerForm.email} onChange={(event) => setTenantOwnerForm((current) => ({ ...current, email: event.target.value ?? "" }))} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="to-phone">Phone</FieldLabel>
                  <Input id="to-phone" value={tenantOwnerForm.phoneNumber} onChange={(event) => setTenantOwnerForm((current) => ({ ...current, phoneNumber: event.target.value ?? "" }))} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="to-password">Password</FieldLabel>
                  <Input id="to-password" type="password" value={tenantOwnerForm.password} onChange={(event) => setTenantOwnerForm((current) => ({ ...current, password: event.target.value ?? "" }))} />
                </Field>
                <Field>
                  <FieldLabel>Organization</FieldLabel>
                  <Select value={tenantOwnerForm.organizationId} onValueChange={(value) => setTenantOwnerForm((current) => ({ ...current, organizationId: value ?? "" }))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select organization" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {orgList.map((organization) => (
                          <SelectItem key={organization._id} value={organization._id}>
                            {organization.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              </FieldGroup>
              <DialogFooter>
                <Button type="submit" disabled={createTenantOwner.isPending}>Create</Button>
              </DialogFooter>
            </form>
          </ControlDialog>

          <ControlDialog
            title="Create organization"
            description="System org plus SaaS limits."
            trigger={
              <Button variant="outline" className="h-12 justify-start shadow-none">
                <Building2 data-icon="inline-start" />
                Organization
              </Button>
            }
          >
            <form
              className="flex flex-col gap-4"
              onSubmit={(event) => {
                event.preventDefault()
                createOrganization.mutate({
                  ...organizationForm,
                  subscriptionStatus: organizationForm.subscriptionStatus as
                    | "active"
                    | "trial"
                    | "expired"
                    | "cancelled",
                  subscriptionPlan: organizationForm.subscriptionPlan as
                    | "starter"
                    | "growth"
                    | "enterprise",
                  maxProperties: Number(organizationForm.maxProperties ?? "0"),
                  maxUsers: Number(organizationForm.maxUsers ?? "0"),
                })
              }}
            >
              <FieldGroup>
                <Field><FieldLabel>Name</FieldLabel><Input value={organizationForm.name} onChange={(event) => setOrganizationForm((current) => ({ ...current, name: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Slug</FieldLabel><Input value={organizationForm.slug} onChange={(event) => setOrganizationForm((current) => ({ ...current, slug: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Email</FieldLabel><Input type="email" value={organizationForm.email} onChange={(event) => setOrganizationForm((current) => ({ ...current, email: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Phone</FieldLabel><Input value={organizationForm.phone} onChange={(event) => setOrganizationForm((current) => ({ ...current, phone: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Address</FieldLabel><Input value={organizationForm.address} onChange={(event) => setOrganizationForm((current) => ({ ...current, address: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Description</FieldLabel><Textarea value={organizationForm.description} onChange={(event) => setOrganizationForm((current) => ({ ...current, description: event.target.value ?? "" }))} /></Field>
                <Field>
                  <FieldLabel>Status</FieldLabel>
                  <Select value={organizationForm.subscriptionStatus} onValueChange={(value) => setOrganizationForm((current) => ({ ...current, subscriptionStatus: value ?? "trial" }))}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectGroup>{["trial", "active", "expired", "cancelled"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectGroup></SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Plan</FieldLabel>
                  <Select value={organizationForm.subscriptionPlan} onValueChange={(value) => setOrganizationForm((current) => ({ ...current, subscriptionPlan: value ?? "starter" }))}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectGroup>{["starter", "growth", "enterprise"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectGroup></SelectContent>
                  </Select>
                </Field>
                <Field><FieldLabel>Max properties</FieldLabel><Input type="number" value={organizationForm.maxProperties} onChange={(event) => setOrganizationForm((current) => ({ ...current, maxProperties: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Max users</FieldLabel><Input type="number" value={organizationForm.maxUsers} onChange={(event) => setOrganizationForm((current) => ({ ...current, maxUsers: event.target.value ?? "" }))} /></Field>
                <Field orientation="horizontal">
                  <FieldLabel htmlFor="org-active">Active</FieldLabel>
                  <Switch id="org-active" checked={organizationForm.isActive ?? true} onCheckedChange={(checked) => setOrganizationForm((current) => ({ ...current, isActive: checked ?? true }))} />
                </Field>
              </FieldGroup>
              <DialogFooter><Button type="submit" disabled={createOrganization.isPending}>Create</Button></DialogFooter>
            </form>
          </ControlDialog>

          <ControlDialog
            title="Create property"
            description="Needs org-bound admin login."
            trigger={
              <Button variant="outline" className="h-12 justify-start shadow-none">
                <Home data-icon="inline-start" />
                Property
              </Button>
            }
          >
            <form
              className="flex flex-col gap-4"
              onSubmit={(event) => {
                event.preventDefault()
                createProperty.mutate({
                  name: propertyForm.name,
                  type: propertyForm.type as
                    | "apartment"
                    | "hotel"
                    | "villa"
                    | "office"
                    | "coworking_space"
                    | "vacation_rental",
                  description: propertyForm.description || undefined,
                  totalUnits: Number(propertyForm.totalUnits || "0") || undefined,
                  totalFloors: Number(propertyForm.totalFloors || "0") || undefined,
                  contactPhone: propertyForm.contactPhone || undefined,
                  contactEmail: propertyForm.contactEmail || undefined,
                  amenities: splitCsv(propertyForm.amenities),
                  images: splitCsv(propertyForm.images),
                  documents: splitCsv(propertyForm.documents),
                  address: {
                    street: propertyForm.street || undefined,
                    city: propertyForm.city || undefined,
                    state: propertyForm.state || undefined,
                    country: propertyForm.country || undefined,
                    zipCode: propertyForm.zipCode || undefined,
                  },
                  isActive: propertyForm.isActive,
                })
              }}
            >
              <FieldGroup>
                {!canUseOrgScopedRoutes ? (
                  <Alert>
                    <Building2 />
                    <AlertTitle>Org-bound action</AlertTitle>
                    <AlertDescription>
                      This route needs admin or owner account with `organizationId`.
                    </AlertDescription>
                  </Alert>
                ) : null}
                <Field><FieldLabel>Name</FieldLabel><Input value={propertyForm.name} onChange={(event) => setPropertyForm((current) => ({ ...current, name: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Type</FieldLabel><Select value={propertyForm.type} onValueChange={(value) => setPropertyForm((current) => ({ ...current, type: value ?? "apartment" }))}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{["apartment","hotel","villa","office","coworking_space","vacation_rental"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
                <Field><FieldLabel>Street</FieldLabel><Input value={propertyForm.street} onChange={(event) => setPropertyForm((current) => ({ ...current, street: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>City</FieldLabel><Input value={propertyForm.city} onChange={(event) => setPropertyForm((current) => ({ ...current, city: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Total units</FieldLabel><Input type="number" value={propertyForm.totalUnits} onChange={(event) => setPropertyForm((current) => ({ ...current, totalUnits: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Amenities</FieldLabel><Input value={propertyForm.amenities} onChange={(event) => setPropertyForm((current) => ({ ...current, amenities: event.target.value ?? "" }))} /><FieldDescription>Comma separated</FieldDescription></Field>
              </FieldGroup>
              <DialogFooter><Button type="submit" disabled={createProperty.isPending || !canUseOrgScopedRoutes}>Create</Button></DialogFooter>
            </form>
          </ControlDialog>

          <ControlDialog
            title="Create tenant"
            description="Renter or guest under selected property."
            trigger={
              <Button variant="outline" className="h-12 justify-start shadow-none">
                <UserCog2 data-icon="inline-start" />
                Tenant
              </Button>
            }
          >
            <form
              className="flex flex-col gap-4"
              onSubmit={(event) => {
                event.preventDefault()
                createTenant.mutate({
                  tenantKind: tenantForm.tenantKind as "renter" | "guest",
                  propertyId: tenantForm.propertyId,
                  unitId: tenantForm.unitId || undefined,
                  fullName: tenantForm.fullName,
                  email: tenantForm.email,
                  phone: tenantForm.phone,
                  address: tenantForm.address || undefined,
                  monthlyRent: Number(tenantForm.monthlyRent || "0") || undefined,
                  securityDeposit: Number(tenantForm.securityDeposit || "0") || undefined,
                  oneTimeGuestFee: Number(tenantForm.oneTimeGuestFee || "0") || undefined,
                  notes: tenantForm.notes || undefined,
                  isActive: tenantForm.isActive,
                })
              }}
            >
              <FieldGroup>
                {!canUseOrgScopedRoutes ? <Alert><Home /><AlertTitle>Org-bound action</AlertTitle><AlertDescription>Needs org-bound admin login.</AlertDescription></Alert> : null}
                <Field><FieldLabel>Kind</FieldLabel><Select value={tenantForm.tenantKind} onValueChange={(value) => setTenantForm((current) => ({ ...current, tenantKind: value ?? "renter" }))}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{["renter","guest"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
                <Field><FieldLabel>Property</FieldLabel><Select value={tenantForm.propertyId} onValueChange={(value) => setTenantForm((current) => ({ ...current, propertyId: value ?? "" }))}><SelectTrigger className="w-full"><SelectValue placeholder="Select property" /></SelectTrigger><SelectContent><SelectGroup>{propertyList.map((property) => <SelectItem key={property._id} value={property._id}>{property.name}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
                <Field><FieldLabel>Full name</FieldLabel><Input value={tenantForm.fullName} onChange={(event) => setTenantForm((current) => ({ ...current, fullName: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Email</FieldLabel><Input type="email" value={tenantForm.email} onChange={(event) => setTenantForm((current) => ({ ...current, email: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Phone</FieldLabel><Input value={tenantForm.phone} onChange={(event) => setTenantForm((current) => ({ ...current, phone: event.target.value ?? "" }))} /></Field>
              </FieldGroup>
              <DialogFooter><Button type="submit" disabled={createTenant.isPending || !canUseOrgScopedRoutes}>Create</Button></DialogFooter>
            </form>
          </ControlDialog>

          <ControlDialog
            title="Create technician"
            description="Global tech profile linked into org."
            trigger={
              <Button variant="outline" className="h-12 justify-start shadow-none">
                <Wrench data-icon="inline-start" />
                Technician
              </Button>
            }
          >
            <form
              className="flex flex-col gap-4"
              onSubmit={(event) => {
                event.preventDefault()
                createTechnician.mutate({
                  name: technicianForm.name,
                  email: technicianForm.email,
                  phone: technicianForm.phone,
                  skills: splitCsv(technicianForm.skills),
                  availability: technicianForm.availability as
                    | "available"
                    | "busy"
                    | "on_leave"
                    | "off_duty",
                  assignedProperties: splitCsv(technicianForm.assignedProperties),
                  hourlyRate: Number(technicianForm.hourlyRate || "0") || undefined,
                  notes: technicianForm.notes || undefined,
                  isActive: technicianForm.isActive,
                })
              }}
            >
              <FieldGroup>
                {!canUseOrgScopedRoutes ? <Alert><Wrench /><AlertTitle>Org-bound action</AlertTitle><AlertDescription>Needs org-bound admin login.</AlertDescription></Alert> : null}
                <Field><FieldLabel>Name</FieldLabel><Input value={technicianForm.name} onChange={(event) => setTechnicianForm((current) => ({ ...current, name: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Email</FieldLabel><Input type="email" value={technicianForm.email} onChange={(event) => setTechnicianForm((current) => ({ ...current, email: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Phone</FieldLabel><Input value={technicianForm.phone} onChange={(event) => setTechnicianForm((current) => ({ ...current, phone: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Skills</FieldLabel><Input value={technicianForm.skills} onChange={(event) => setTechnicianForm((current) => ({ ...current, skills: event.target.value ?? "" }))} /><FieldDescription>Comma separated</FieldDescription></Field>
              </FieldGroup>
              <DialogFooter><Button type="submit" disabled={createTechnician.isPending || !canUseOrgScopedRoutes}>Create</Button></DialogFooter>
            </form>
          </ControlDialog>

          <ControlDialog
            title="Create plan"
            description="SaaS subscription plan. Paddle catalog auto-syncs when backend key exists."
            trigger={
              <Button variant="outline" className="h-12 justify-start shadow-none">
                <CreditCard data-icon="inline-start" />
                Plan
              </Button>
            }
          >
            <form
              className="flex flex-col gap-4"
              onSubmit={(event) => {
                event.preventDefault()
                createPlan.mutate({
                  name: planForm.name,
                  description: planForm.description || undefined,
                  monthlyPrice: Number(planForm.monthlyPrice || "0"),
                  yearlyPrice: Number(planForm.yearlyPrice || "0"),
                  maxProperties: Number(planForm.maxProperties || "0") || undefined,
                  maxUsers: Number(planForm.maxUsers || "0") || undefined,
                  features: splitCsv(planForm.features),
                  isActive: planForm.isActive,
                })
              }}
            >
              <FieldGroup>
                <Field><FieldLabel>Name</FieldLabel><Input value={planForm.name} onChange={(event) => setPlanForm((current) => ({ ...current, name: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Monthly price</FieldLabel><Input type="number" value={planForm.monthlyPrice} onChange={(event) => setPlanForm((current) => ({ ...current, monthlyPrice: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Yearly price</FieldLabel><Input type="number" value={planForm.yearlyPrice} onChange={(event) => setPlanForm((current) => ({ ...current, yearlyPrice: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Features</FieldLabel><Textarea value={planForm.features} onChange={(event) => setPlanForm((current) => ({ ...current, features: event.target.value ?? "" }))} /><FieldDescription>Comma separated</FieldDescription></Field>
              </FieldGroup>
              <DialogFooter><Button type="submit" disabled={createPlan.isPending}>Create</Button></DialogFooter>
            </form>
          </ControlDialog>

          <ControlDialog
            title="Create subscription"
            description="Attach plan to organization."
            trigger={
              <Button variant="outline" className="h-12 justify-start shadow-none">
                <CreditCard data-icon="inline-start" />
                Subscription
              </Button>
            }
          >
            <form
              className="flex flex-col gap-4"
              onSubmit={(event) => {
                event.preventDefault()
                createSubscription.mutate({
                  organizationId: subscriptionForm.organizationId,
                  planId: subscriptionForm.planId,
                  billingInterval: subscriptionForm.billingInterval as "monthly" | "yearly",
                })
              }}
            >
              <FieldGroup>
                {!canUseOrgScopedRoutes ? <Alert><CreditCard /><AlertTitle>Org-bound action</AlertTitle><AlertDescription>Subscription create route needs org-bound admin login.</AlertDescription></Alert> : null}
                <Field><FieldLabel>Organization</FieldLabel><Select value={subscriptionForm.organizationId} onValueChange={(value) => setSubscriptionForm((current) => ({ ...current, organizationId: value ?? "" }))}><SelectTrigger className="w-full"><SelectValue placeholder="Select organization" /></SelectTrigger><SelectContent><SelectGroup>{orgList.map((organization) => <SelectItem key={organization._id} value={organization._id}>{organization.name}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
                <Field><FieldLabel>Plan</FieldLabel><Select value={subscriptionForm.planId} onValueChange={(value) => setSubscriptionForm((current) => ({ ...current, planId: value ?? "" }))}><SelectTrigger className="w-full"><SelectValue placeholder="Select plan" /></SelectTrigger><SelectContent><SelectGroup>{planList.map((plan) => <SelectItem key={plan._id} value={plan._id}>{plan.name}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
                <Field><FieldLabel>Billing</FieldLabel><Select value={subscriptionForm.billingInterval} onValueChange={(value) => setSubscriptionForm((current) => ({ ...current, billingInterval: value ?? "monthly" }))}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{["monthly","yearly"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
              </FieldGroup>
              <DialogFooter><Button type="submit" disabled={createSubscription.isPending || !canUseOrgScopedRoutes}>Create</Button></DialogFooter>
            </form>
          </ControlDialog>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Access note</CardTitle>
          <CardDescription>Current backend behavior.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <Alert>
            <Building2 />
            <AlertTitle>Super admin</AlertTitle>
            <AlertDescription>
              Best for orgs, plans, tenant owners, high-level visibility.
            </AlertDescription>
          </Alert>
          <Alert>
            <Home />
            <AlertTitle>Org-scoped routes</AlertTitle>
            <AlertDescription>
              Property, tenant, technician, subscription create/update/delete use JWT `organizationId`.
            </AlertDescription>
          </Alert>
          <div className="rounded-xl border p-4">
            <p className="font-medium text-slate-950">Current account org</p>
            <p className="mt-1 break-all">{me?.organizationId ?? "No organization bound"}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
