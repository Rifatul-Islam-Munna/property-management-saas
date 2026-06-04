"use client"

import { useState } from "react"
import { Bell, Building2, Home, Users, Wrench } from "lucide-react"
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
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useMeQuery } from "@/hooks/use-auth"
import {
  useOwnerCreatePropertyMutation,
  useOwnerCreateTechnicianMutation,
  useOwnerCreateTenantMutation,
  useOwnerCreateUnitMutation,
  useOwnerCreateUserMutation,
  useOwnerSendNoticeMutation,
} from "@/hooks/use-owner-actions"
import { useOwnerPropertiesQuery, useOwnerUsersQuery } from "@/hooks/use-owner-dashboard"

function splitCsv(value?: string) {
  return value?.split(",").map((item) => item.trim()).filter(Boolean) ?? []
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

export function TenantOwnerControlCenter() {
  const { data: me } = useMeQuery()
  const properties = useOwnerPropertiesQuery()
  const users = useOwnerUsersQuery()
  const createProperty = useOwnerCreatePropertyMutation()
  const createUnit = useOwnerCreateUnitMutation()
  const createUser = useOwnerCreateUserMutation()
  const createTenant = useOwnerCreateTenantMutation()
  const createTechnician = useOwnerCreateTechnicianMutation()
  const sendNotice = useOwnerSendNoticeMutation()

  const [propertyForm, setPropertyForm] = useState({
    name: "",
    type: "apartment",
    city: "",
    street: "",
    totalUnits: "",
    description: "",
  })
  const [unitForm, setUnitForm] = useState({
    propertyId: "",
    unitNumber: "",
    floor: "",
    type: "",
    status: "vacant",
    monthlyRent: "",
    area: "",
  })
  const [userForm, setUserForm] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    jobTitle: "",
    propertyIds: "",
    role: "worker",
  })
  const [tenantForm, setTenantForm] = useState({
    tenantKind: "renter",
    propertyId: "",
    unitId: "",
    userId: "",
    fullName: "",
    email: "",
    phone: "",
    monthlyRent: "",
    oneTimeGuestFee: "",
  })
  const [technicianForm, setTechnicianForm] = useState({
    name: "",
    email: "",
    phone: "",
    skills: "",
    availability: "available",
    assignedProperties: "",
  })
  const [noticeForm, setNoticeForm] = useState({
    propertyId: "",
    title: "",
    content: "",
    audience: "roles",
    targetRoles: "renter,guest",
    targetUserIds: "",
    attachments: "",
  })

  const propertyList = Array.isArray(properties.data) ? properties.data : []
  const userList = Array.isArray(users.data) ? users.data : []
  const canUseOrgScopedRoutes = Boolean(me?.organizationId ?? "")

  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Tenant owner controls</CardTitle>
          <CardDescription>
            Same admin-grade UI, but owner-safe actions only.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <ControlDialog
            title="Add property"
            description="One tenant owner can manage many properties."
            trigger={<Button variant="outline" className="h-12 justify-start shadow-none"><Building2 data-icon="inline-start" />Property</Button>}
          >
            <form className="flex flex-col gap-4" onSubmit={(event) => {
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
                address: {
                  street: propertyForm.street || undefined,
                  city: propertyForm.city || undefined,
                },
              })
            }}>
              <FieldGroup>
                {!canUseOrgScopedRoutes ? <Alert><Building2 /><AlertTitle>Org-bound action</AlertTitle><AlertDescription>Owner needs `organizationId` in JWT.</AlertDescription></Alert> : null}
                <Field><FieldLabel>Name</FieldLabel><Input value={propertyForm.name} onChange={(event) => setPropertyForm((current) => ({ ...current, name: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Type</FieldLabel><Select value={propertyForm.type} onValueChange={(value) => setPropertyForm((current) => ({ ...current, type: value ?? "apartment" }))}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{["apartment","hotel","villa","office","coworking_space","vacation_rental"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
                <Field><FieldLabel>Street</FieldLabel><Input value={propertyForm.street} onChange={(event) => setPropertyForm((current) => ({ ...current, street: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>City</FieldLabel><Input value={propertyForm.city} onChange={(event) => setPropertyForm((current) => ({ ...current, city: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Total units</FieldLabel><Input type="number" value={propertyForm.totalUnits} onChange={(event) => setPropertyForm((current) => ({ ...current, totalUnits: event.target.value ?? "" }))} /></Field>
              </FieldGroup>
              <DialogFooter><Button type="submit" disabled={createProperty.isPending || !canUseOrgScopedRoutes}>Add property</Button></DialogFooter>
            </form>
          </ControlDialog>

          <ControlDialog
            title="Add unit"
            description="Add many units under same property."
            trigger={<Button variant="outline" className="h-12 justify-start shadow-none"><Home data-icon="inline-start" />Unit</Button>}
          >
            <form className="flex flex-col gap-4" onSubmit={(event) => {
              event.preventDefault()
              createUnit.mutate({
                propertyId: unitForm.propertyId,
                unitNumber: unitForm.unitNumber,
                floor: Number(unitForm.floor || "0") || undefined,
                type: unitForm.type || undefined,
                status: unitForm.status as "vacant" | "occupied" | "maintenance" | "reserved",
                monthlyRent: Number(unitForm.monthlyRent || "0") || undefined,
                area: Number(unitForm.area || "0") || undefined,
              })
            }}>
              <FieldGroup>
                <Field><FieldLabel>Property</FieldLabel><Select value={unitForm.propertyId} onValueChange={(value) => setUnitForm((current) => ({ ...current, propertyId: value ?? "" }))}><SelectTrigger className="w-full"><SelectValue placeholder="Select property" /></SelectTrigger><SelectContent><SelectGroup>{propertyList.map((property) => <SelectItem key={property._id} value={property._id}>{property.name}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
                <Field><FieldLabel>Unit number</FieldLabel><Input value={unitForm.unitNumber} onChange={(event) => setUnitForm((current) => ({ ...current, unitNumber: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Status</FieldLabel><Select value={unitForm.status} onValueChange={(value) => setUnitForm((current) => ({ ...current, status: value ?? "vacant" }))}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{["vacant","occupied","maintenance","reserved"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
              </FieldGroup>
              <DialogFooter><Button type="submit" disabled={createUnit.isPending || !canUseOrgScopedRoutes}>Add unit</Button></DialogFooter>
            </form>
          </ControlDialog>

          <ControlDialog
            title="Add worker / renter / guest"
            description="Owner can create worker, renter, guest. Worker can link to many properties."
            trigger={<Button variant="outline" className="h-12 justify-start shadow-none"><Users data-icon="inline-start" />Users</Button>}
          >
            <form className="flex flex-col gap-4" onSubmit={(event) => {
              event.preventDefault()
              createUser.mutate({
                fullName: userForm.fullName,
                email: userForm.email,
                phoneNumber: userForm.phoneNumber,
                password: userForm.password,
                jobTitle: userForm.jobTitle || undefined,
                propertyIds: splitCsv(userForm.propertyIds),
                role: userForm.role as "worker" | "renter" | "guest",
              })
            }}>
              <FieldGroup>
                <Field><FieldLabel>Role</FieldLabel><Select value={userForm.role} onValueChange={(value) => setUserForm((current) => ({ ...current, role: value ?? "worker" }))}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{["worker","renter","guest"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
                <Field><FieldLabel>Name</FieldLabel><Input value={userForm.fullName} onChange={(event) => setUserForm((current) => ({ ...current, fullName: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Email</FieldLabel><Input type="email" value={userForm.email} onChange={(event) => setUserForm((current) => ({ ...current, email: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Property ids</FieldLabel><Input value={userForm.propertyIds} onChange={(event) => setUserForm((current) => ({ ...current, propertyIds: event.target.value ?? "" }))} /><FieldDescription>Comma separated. Worker can have many.</FieldDescription></Field>
              </FieldGroup>
              <DialogFooter><Button type="submit" disabled={createUser.isPending || !canUseOrgScopedRoutes}>Add user</Button></DialogFooter>
            </form>
          </ControlDialog>

          <ControlDialog
            title="Add tenant record"
            description="Track guest fee or renter monthly rent."
            trigger={<Button variant="outline" className="h-12 justify-start shadow-none"><Users data-icon="inline-start" />Tenant record</Button>}
          >
            <form className="flex flex-col gap-4" onSubmit={(event) => {
              event.preventDefault()
              createTenant.mutate({
                tenantKind: tenantForm.tenantKind as "renter" | "guest",
                propertyId: tenantForm.propertyId,
                unitId: tenantForm.unitId || undefined,
                userId: tenantForm.userId || undefined,
                fullName: tenantForm.fullName,
                email: tenantForm.email,
                phone: tenantForm.phone,
                monthlyRent: Number(tenantForm.monthlyRent || "0") || undefined,
                oneTimeGuestFee: Number(tenantForm.oneTimeGuestFee || "0") || undefined,
              })
            }}>
              <FieldGroup>
                <Field><FieldLabel>Kind</FieldLabel><Select value={tenantForm.tenantKind} onValueChange={(value) => setTenantForm((current) => ({ ...current, tenantKind: value ?? "renter" }))}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{["renter","guest"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
                <Field><FieldLabel>Property</FieldLabel><Select value={tenantForm.propertyId} onValueChange={(value) => setTenantForm((current) => ({ ...current, propertyId: value ?? "" }))}><SelectTrigger className="w-full"><SelectValue placeholder="Select property" /></SelectTrigger><SelectContent><SelectGroup>{propertyList.map((property) => <SelectItem key={property._id} value={property._id}>{property.name}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
                <Field><FieldLabel>Linked user</FieldLabel><Select value={tenantForm.userId} onValueChange={(value) => setTenantForm((current) => ({ ...current, userId: value ?? "" }))}><SelectTrigger className="w-full"><SelectValue placeholder="Optional user" /></SelectTrigger><SelectContent><SelectGroup>{userList.filter((user) => ["renter","guest"].includes(user.role)).map((user) => <SelectItem key={user.id} value={user.id}>{user.fullName}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
              </FieldGroup>
              <DialogFooter><Button type="submit" disabled={createTenant.isPending || !canUseOrgScopedRoutes}>Add tenant record</Button></DialogFooter>
            </form>
          </ControlDialog>

          <ControlDialog
            title="Add technician"
            description="Create or link global worker as technician."
            trigger={<Button variant="outline" className="h-12 justify-start shadow-none"><Wrench data-icon="inline-start" />Technician</Button>}
          >
            <form className="flex flex-col gap-4" onSubmit={(event) => {
              event.preventDefault()
              createTechnician.mutate({
                name: technicianForm.name,
                email: technicianForm.email,
                phone: technicianForm.phone,
                skills: splitCsv(technicianForm.skills),
                availability: technicianForm.availability as "available" | "busy" | "on_leave" | "off_duty",
                assignedProperties: splitCsv(technicianForm.assignedProperties),
              })
            }}>
              <FieldGroup>
                <Field><FieldLabel>Name</FieldLabel><Input value={technicianForm.name} onChange={(event) => setTechnicianForm((current) => ({ ...current, name: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Email</FieldLabel><Input type="email" value={technicianForm.email} onChange={(event) => setTechnicianForm((current) => ({ ...current, email: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Assigned properties</FieldLabel><Input value={technicianForm.assignedProperties} onChange={(event) => setTechnicianForm((current) => ({ ...current, assignedProperties: event.target.value ?? "" }))} /><FieldDescription>Comma separated property ids</FieldDescription></Field>
              </FieldGroup>
              <DialogFooter><Button type="submit" disabled={createTechnician.isPending || !canUseOrgScopedRoutes}>Add technician</Button></DialogFooter>
            </form>
          </ControlDialog>

          <ControlDialog
            title="Send notice"
            description="Send notice to renters, guests, workers, or chosen users."
            trigger={<Button variant="outline" className="h-12 justify-start shadow-none"><Bell data-icon="inline-start" />Notice</Button>}
          >
            <form className="flex flex-col gap-4" onSubmit={(event) => {
              event.preventDefault()
              sendNotice.mutate({
                propertyId: noticeForm.propertyId || undefined,
                title: noticeForm.title,
                content: noticeForm.content,
                audience: (noticeForm.audience === "roles"
                  ? "role_based"
                  : noticeForm.audience === "users"
                    ? "user_based"
                    : "all") as "all" | "role_based" | "user_based",
                targetRoles: splitCsv(noticeForm.targetRoles) as Array<"worker" | "renter" | "guest">,
                targetUserIds: splitCsv(noticeForm.targetUserIds),
                attachments: splitCsv(noticeForm.attachments),
                isActive: true,
              })
            }}>
              <FieldGroup>
                <Field><FieldLabel>Property</FieldLabel><Select value={noticeForm.propertyId} onValueChange={(value) => setNoticeForm((current) => ({ ...current, propertyId: value ?? "" }))}><SelectTrigger className="w-full"><SelectValue placeholder="Optional property" /></SelectTrigger><SelectContent><SelectGroup>{propertyList.map((property) => <SelectItem key={property._id} value={property._id}>{property.name}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
                <Field><FieldLabel>Title</FieldLabel><Input value={noticeForm.title} onChange={(event) => setNoticeForm((current) => ({ ...current, title: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Content</FieldLabel><Textarea value={noticeForm.content} onChange={(event) => setNoticeForm((current) => ({ ...current, content: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Target roles</FieldLabel><Input value={noticeForm.targetRoles} onChange={(event) => setNoticeForm((current) => ({ ...current, targetRoles: event.target.value ?? "" }))} /><FieldDescription>Example: renter,guest</FieldDescription></Field>
              </FieldGroup>
              <DialogFooter><Button type="submit" disabled={sendNotice.isPending || !canUseOrgScopedRoutes}>Send notice</Button></DialogFooter>
            </form>
          </ControlDialog>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Owner scope</CardTitle>
          <CardDescription>Current owner setup.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <Alert>
            <Building2 />
            <AlertTitle>Multi-property owner</AlertTitle>
            <AlertDescription>
              One tenant owner can add and manage many properties under same org.
            </AlertDescription>
          </Alert>
          <Alert>
            <Users />
            <AlertTitle>User rules</AlertTitle>
            <AlertDescription>
              Owner can create worker, renter, guest. Worker can span many properties. Renter and guest stay one active property at time.
            </AlertDescription>
          </Alert>
          <div className="rounded-xl border p-4">
            <p className="font-medium text-slate-950">Current organization</p>
            <p className="mt-1 break-all">{me?.organizationId ?? "No organization bound"}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
