"use client"

import { useMemo, useState } from "react"
import {
  Bell,
  BriefcaseBusiness,
  Building2,
  ClipboardCheck,
  FileText,
  Home,
  Repeat,
  Settings2,
  Shield,
  Ticket,
  UserPlus,
  Users,
  Wrench,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { UploadCollectionField } from "@/components/shared/upload-collection-field"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  DashboardPanelSkeleton,
  DashboardTableSkeleton,
  WithBone,
} from "@/components/dashboard/dashboard-loading"
import { useMeQuery } from "@/hooks/use-auth"
import {
  useOwnerAssignTicketMutation,
  useOwnerCreateInspectionMutation,
  useOwnerCreatePropertyMutation,
  useOwnerCreateRecurringMaintenanceMutation,
  useOwnerCreateTechnicianMutation,
  useOwnerCreateTenantMutation,
  useOwnerCreateTicketMutation,
  useOwnerCreateUnitMutation,
  useOwnerCreateVendorMutation,
  useOwnerCreateWorkOrderMutation,
  useOwnerCreateAssignmentRequestMutation,
  useOwnerDeleteTechnicianMutation,
  useOwnerDeleteTenantMutation,
  useOwnerDeleteUnitMutation,
  useOwnerSendDocumentMutation,
  useOwnerSendNoticeMutation,
  useOwnerRecordTenantPaymentMutation,
  useOwnerTogglePropertyMutation,
  useOwnerToggleTechnicianMutation,
  useOwnerToggleTenantMutation,
  useOwnerToggleUnitMutation,
  useOwnerUpdateTicketMutation,
} from "@/hooks/use-owner-actions"
import {
  useOwnerAnnouncementsQuery,
  useOwnerInspectionsQuery,
  useOwnerMessagesQuery,
  useOwnerPropertiesQuery,
  useOwnerRecurringMaintenancesQuery,
  useOwnerTechniciansQuery,
  useOwnerTenantsQuery,
  useOwnerTicketsQuery,
  useOwnerUnitsQuery,
  useOwnerUserSearchQuery,
  useOwnerUsersQuery,
  useOwnerVendorsQuery,
  useOwnerWorkOrdersQuery,
} from "@/hooks/use-owner-dashboard"
import type { PropertyItem } from "@/lib/types/dashboard"

function splitCsv(value?: string) {
  return value?.split(",").map((item) => item.trim()).filter(Boolean) ?? []
}

function OwnerPageHero({
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

function CreateSheet({
  open,
  onOpenChange,
  title,
  description,
  triggerLabel,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  triggerLabel: string
  children: React.ReactNode
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button className="bg-blue-700 text-white hover:bg-blue-800">
          {triggerLabel}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:!w-[50vw] sm:!max-w-[50vw]"
      >
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-6">{children}</div>
      </SheetContent>
    </Sheet>
  )
}

function PropertyMultiSelect({
  properties,
  selectedIds,
  setSelectedIds,
  helper,
}: {
  properties: PropertyItem[]
  selectedIds: string[]
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>
  helper: string
}) {
  const [pendingId, setPendingId] = useState("")
  const availableProperties = properties.filter((property) => !selectedIds.includes(property._id))

  return (
    <Field>
      <FieldLabel>Assigned properties</FieldLabel>
      <div className="flex gap-2">
        <Select value={pendingId} onValueChange={(value) => setPendingId(value ?? "")}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select property" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {availableProperties.map((property) => (
                <SelectItem key={property._id} value={property._id}>
                  {property.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          className="shadow-none"
          onClick={() => {
            if (!pendingId) return
            setSelectedIds((current) => (current.includes(pendingId) ? current : [...current, pendingId]))
            setPendingId("")
          }}
        >
          Add
        </Button>
      </div>
      <FieldDescription>{helper}</FieldDescription>
      <div className="mt-3 flex flex-wrap gap-2">
        {selectedIds.length ? selectedIds.map((propertyId) => {
          const property = properties.find((item) => item._id === propertyId)
          return (
            <Badge key={propertyId} variant="secondary" className="gap-2 px-3 py-1">
              {property?.name ?? propertyId}
              <button
                type="button"
                onClick={() => setSelectedIds((current) => current.filter((item) => item !== propertyId))}
              >
                x
              </button>
            </Badge>
          )
        }) : <span className="text-xs text-slate-500">No property selected yet</span>}
      </div>
    </Field>
  )
}

export function TenantOwnerPropertiesPage() {
  const properties = useOwnerPropertiesQuery()
  const createProperty = useOwnerCreatePropertyMutation()
  const toggleProperty = useOwnerTogglePropertyMutation()
  const propertyList = Array.isArray(properties.data) ? properties.data : []
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [form, setForm] = useState({
    name: "",
    type: "apartment" as
      | "apartment"
      | "hotel"
      | "villa"
      | "office"
      | "coworking_space"
      | "vacation_rental",
    street: "",
    city: "",
    state: "",
    country: "",
    zipCode: "",
    totalUnits: "",
    totalFloors: "",
    description: "",
    amenities: "",
    images: "",
    documents: "",
    contactPhone: "",
    contactEmail: "",
    isActive: true,
  })

  return (
    <div className="space-y-6">
      <OwnerPageHero
        icon={Building2}
        badge="Portfolio"
        title="Properties"
        body="Each property gets its own page flow now. No modal stack. Add, review, and activate units from dedicated screens."
      />
      <div className="flex justify-end">
        <CreateSheet
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          title="Add property"
          description="One tenant owner can manage many properties. Full property fields live here."
          triggerLabel="Add property"
        >
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault()
                createProperty.mutate(
                  {
                    name: form.name,
                    type: form.type,
                    description: form.description || undefined,
                    images: splitCsv(form.images),
                    documents: splitCsv(form.documents),
                    totalUnits: Number(form.totalUnits || "0") || undefined,
                    totalFloors: Number(form.totalFloors || "0") || undefined,
                    amenities: splitCsv(form.amenities),
                    contactPhone: form.contactPhone || undefined,
                    contactEmail: form.contactEmail || undefined,
                    isActive: form.isActive,
                    address: {
                      street: form.street || undefined,
                      city: form.city || undefined,
                      state: form.state || undefined,
                      country: form.country || undefined,
                      zipCode: form.zipCode || undefined,
                    },
                  },
                  {
                    onSuccess: () => {
                      setForm({
                        name: "",
                        type: "apartment",
                        street: "",
                        city: "",
                        totalFloors: "",
                        state: "",
                        country: "",
                        zipCode: "",
                        totalUnits: "",
                        description: "",
                        amenities: "",
                        images: "",
                        documents: "",
                        contactPhone: "",
                        contactEmail: "",
                        isActive: true,
                      })
                      setIsCreateOpen(false)
                    },
                  }
                )
              }}
            >
              <FieldGroup>
                <Field><FieldLabel>Name</FieldLabel><Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Type</FieldLabel><Select value={form.type} onValueChange={(value) => setForm((current) => ({ ...current, type: (value ?? "apartment") as typeof current.type }))}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{["apartment", "hotel", "villa", "office", "coworking_space", "vacation_rental"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
                <Field><FieldLabel>Street (Optional)</FieldLabel><Input value={form.street} onChange={(event) => setForm((current) => ({ ...current, street: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>City (Optional)</FieldLabel><Input value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>State (Optional)</FieldLabel><Input value={form.state} onChange={(event) => setForm((current) => ({ ...current, state: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Country (Optional)</FieldLabel><Input value={form.country} onChange={(event) => setForm((current) => ({ ...current, country: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Zip code (Optional)</FieldLabel><Input value={form.zipCode} onChange={(event) => setForm((current) => ({ ...current, zipCode: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Total units (Optional)</FieldLabel><Input type="number" value={form.totalUnits} onChange={(event) => setForm((current) => ({ ...current, totalUnits: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Total floors (Optional)</FieldLabel><Input type="number" value={form.totalFloors} onChange={(event) => setForm((current) => ({ ...current, totalFloors: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Amenities (Optional)</FieldLabel><Input value={form.amenities} onChange={(event) => setForm((current) => ({ ...current, amenities: event.target.value ?? "" }))} /><FieldDescription>Comma separated</FieldDescription></Field>
                <UploadCollectionField
                  label="Property images"
                  accept="image/*"
                  kind="image"
                  values={splitCsv(form.images)}
                  onChange={(values) => setForm((current) => ({ ...current, images: values.join(",") }))}
                />
                <UploadCollectionField
                  label="Property documents"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,image/*"
                  kind="file"
                  values={splitCsv(form.documents)}
                  onChange={(values) => setForm((current) => ({ ...current, documents: values.join(",") }))}
                />
                <Field><FieldLabel>Contact phone (Optional)</FieldLabel><Input value={form.contactPhone} onChange={(event) => setForm((current) => ({ ...current, contactPhone: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Contact email (Optional)</FieldLabel><Input type="email" value={form.contactEmail} onChange={(event) => setForm((current) => ({ ...current, contactEmail: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Description (Optional)</FieldLabel><Textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value ?? "" }))} /></Field>
                <Field className="flex flex-row items-center justify-between rounded-xl border px-4 py-3">
                  <div>
                    <FieldLabel>Active status</FieldLabel>
                    <FieldDescription>Property starts active by default.</FieldDescription>
                  </div>
                  <Switch checked={form.isActive} onCheckedChange={(checked) => setForm((current) => ({ ...current, isActive: checked ?? true }))} />
                </Field>
              </FieldGroup>
              <Button type="submit" disabled={createProperty.isPending}>Save property</Button>
            </form>
        </CreateSheet>
      </div>

      <div className="grid gap-4">
        <WithBone name="owner-page-properties" loading={properties.isLoading} fallback={<DashboardTableSkeleton />}>
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Property list</CardTitle>
              <CardDescription>Direct owner control from page view.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {propertyList.length ? propertyList.map((property) => (
                <div key={property._id} className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-slate-950">{property.name}</p>
                    <p className="text-xs text-slate-600">{property.type} - {property.totalUnits ?? 0} units</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={property.isActive ?? false}
                      onCheckedChange={(checked) =>
                        toggleProperty.mutate({ id: property._id, payload: { isActive: checked ?? false } })
                      }
                    />
                    <Badge variant={property.isActive ? "default" : "outline"}>
                      {property.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              )) : (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon"><Building2 /></EmptyMedia>
                    <EmptyTitle>No properties yet</EmptyTitle>
                    <EmptyDescription>Add first property from left card.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </CardContent>
          </Card>
        </WithBone>
      </div>
    </div>
  )
}

export function TenantOwnerUnitsPage() {
  const properties = useOwnerPropertiesQuery()
  const units = useOwnerUnitsQuery()
  const createUnit = useOwnerCreateUnitMutation()
  const toggleUnit = useOwnerToggleUnitMutation()
  const deleteUnit = useOwnerDeleteUnitMutation()
  const propertyList = Array.isArray(properties.data) ? properties.data : []
  const unitList = Array.isArray(units.data) ? units.data : []
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [form, setForm] = useState({
    propertyId: "",
    unitNumber: "",
    floor: "",
    type: "",
    status: "vacant",
    monthlyRent: "",
    area: "",
  })

  return (
    <div className="space-y-6">
      <OwnerPageHero
        icon={Home}
        badge="Inventory"
        title="Units"
        body="Assign each unit to one property from direct dropdown. This page now handles unit creation and inventory in one place."
      />
      <div className="flex justify-end">
        <CreateSheet
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          title="Add unit"
          description="Choose property, then add full unit details in sheet."
          triggerLabel="Add unit"
        >
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault()
                createUnit.mutate(
                  {
                    propertyId: form.propertyId,
                    unitNumber: form.unitNumber,
                    floor: Number(form.floor || "0") || undefined,
                    type: form.type || undefined,
                    status: form.status as "vacant" | "occupied" | "maintenance" | "reserved",
                    monthlyRent: Number(form.monthlyRent || "0") || undefined,
                    area: Number(form.area || "0") || undefined,
                  },
                  {
                    onSuccess: () => {
                      setForm({
                        propertyId: "",
                        unitNumber: "",
                        floor: "",
                        type: "",
                        status: "vacant",
                        monthlyRent: "",
                        area: "",
                      })
                      setIsCreateOpen(false)
                    },
                  }
                )
              }}
            >
              <FieldGroup>
                <Field><FieldLabel>Property</FieldLabel><Select value={form.propertyId} onValueChange={(value) => setForm((current) => ({ ...current, propertyId: value ?? "" }))}><SelectTrigger className="w-full"><SelectValue placeholder="Select property" /></SelectTrigger><SelectContent><SelectGroup>{propertyList.map((property) => <SelectItem key={property._id} value={property._id}>{property.name}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
                <Field><FieldLabel>Unit number</FieldLabel><Input value={form.unitNumber} onChange={(event) => setForm((current) => ({ ...current, unitNumber: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Status</FieldLabel><Select value={form.status} onValueChange={(value) => setForm((current) => ({ ...current, status: value ?? "vacant" }))}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{["vacant", "occupied", "maintenance", "reserved"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
                <Field><FieldLabel>Floor</FieldLabel><Input type="number" value={form.floor} onChange={(event) => setForm((current) => ({ ...current, floor: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Monthly rent</FieldLabel><Input type="number" value={form.monthlyRent} onChange={(event) => setForm((current) => ({ ...current, monthlyRent: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Area</FieldLabel><Input type="number" value={form.area} onChange={(event) => setForm((current) => ({ ...current, area: event.target.value ?? "" }))} /></Field>
              </FieldGroup>
              <Button type="submit" disabled={createUnit.isPending || !form.propertyId}>Save unit</Button>
            </form>
        </CreateSheet>
      </div>

      <div className="grid gap-4">
        <WithBone name="owner-page-units" loading={units.isLoading} fallback={<DashboardTableSkeleton />}>
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Unit list</CardTitle>
              <CardDescription>Track vacancy and remove wrong entries fast.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {unitList.length ? unitList.map((unit) => (
                <div key={unit._id} className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-slate-950">{unit.unitNumber}</p>
                    <p className="text-xs text-slate-600">{unit.status} - rent {unit.rentAmount ?? 0}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={(unit as { isActive?: boolean }).isActive ?? false}
                      onCheckedChange={(checked) =>
                        toggleUnit.mutate({ id: unit._id, payload: { isActive: checked ?? false } })
                      }
                    />
                    <Button variant="outline" size="sm" className="shadow-none" onClick={() => deleteUnit.mutate(unit._id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              )) : (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon"><Home /></EmptyMedia>
                    <EmptyTitle>No units yet</EmptyTitle>
                    <EmptyDescription>Add first unit after property setup.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </CardContent>
          </Card>
        </WithBone>
      </div>
    </div>
  )
}

export function TenantOwnerUsersPage() {
  const properties = useOwnerPropertiesQuery()
  const users = useOwnerUsersQuery()
  const createRequest = useOwnerCreateAssignmentRequestMutation()
  const propertyList = Array.isArray(properties.data) ? properties.data : []
  const userList = Array.isArray(users.data) ? users.data : []
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([])
  const [singlePropertyId, setSinglePropertyId] = useState("")
  const [form, setForm] = useState({
    role: "worker",
    message: "",
  })
  const searchResults = useOwnerUserSearchQuery(
    search,
    form.role as "worker" | "renter" | "guest"
  )

  const payloadPropertyIds = form.role === "worker"
    ? selectedPropertyIds
    : singlePropertyId ? [singlePropertyId] : []

  return (
    <div className="space-y-6">
      <OwnerPageHero
        icon={UserPlus}
        badge="Access"
        title="Users"
        body="People sign up themselves first. Tenant owner then searches by email or name, sends request, then assigns properties after acceptance."
      />
      <div className="flex justify-end">
        <CreateSheet
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          title="Find and request user"
          description="Search global worker, renter, or guest accounts by email or name, then send assignment request."
          triggerLabel="Request user"
        >
            <div className="space-y-4">
              <FieldGroup>
                <Field><FieldLabel>Role</FieldLabel><Select value={form.role} onValueChange={(value) => setForm((current) => ({ ...current, role: value ?? "worker" }))}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{["worker", "renter", "guest"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
                <Field><FieldLabel>Search by email or name</FieldLabel><Input value={search} onChange={(event) => setSearch(event.target.value ?? "")} placeholder="worker@example.com" /></Field>
                {form.role === "worker" ? (
                  <PropertyMultiSelect
                    properties={propertyList}
                    selectedIds={selectedPropertyIds}
                    setSelectedIds={setSelectedPropertyIds}
                    helper="Worker can connect to many properties and many tenant owners."
                  />
                ) : (
                  <Field>
                    <FieldLabel>Active property</FieldLabel>
                    <Select value={singlePropertyId} onValueChange={(value) => setSinglePropertyId(value ?? "")}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select property" /></SelectTrigger>
                      <SelectContent><SelectGroup>{propertyList.map((property) => <SelectItem key={property._id} value={property._id}>{property.name}</SelectItem>)}</SelectGroup></SelectContent>
                    </Select>
                    <FieldDescription>Renter and guest keep one active property at a time.</FieldDescription>
                  </Field>
                )}
                <Field><FieldLabel>Message (Optional)</FieldLabel><Textarea value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value ?? "" }))} /></Field>
              </FieldGroup>
              <div className="space-y-3">
                {searchResults.data?.length ? searchResults.data.map((candidate) => (
                  <div key={candidate.id} className="rounded-xl border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-950">{candidate.fullName}</p>
                        <p className="text-sm text-slate-600">{candidate.email}</p>
                      </div>
                      <Button
                        type="button"
                        disabled={createRequest.isPending || payloadPropertyIds.length === 0}
                        onClick={() =>
                          createRequest.mutate(
                            {
                              direction: "owner_to_user",
                              targetUserId: candidate.id,
                              targetEmail: candidate.email,
                              requestedRole: form.role as "worker" | "renter" | "guest",
                              propertyIds: payloadPropertyIds,
                              message: form.message || undefined,
                            },
                            {
                              onSuccess: () => {
                                setSelectedPropertyIds([])
                                setSinglePropertyId("")
                                setForm({ role: "worker", message: "" })
                                setSearch("")
                                setIsCreateOpen(false)
                              },
                            }
                          )
                        }
                      >
                        Send request
                      </Button>
                    </div>
                  </div>
                )) : search.trim().length >= 2 && !searchResults.isLoading ? (
                  <div className="rounded-xl border border-dashed p-4 text-sm text-slate-500">
                    No signed-up user found. Ask them to sign up first.
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed p-4 text-sm text-slate-500">
                    Search existing public users first.
                  </div>
                )}
              </div>
            </div>
        </CreateSheet>
      </div>

      <div className="grid gap-4">
        <WithBone name="owner-page-users" loading={users.isLoading} fallback={<DashboardTableSkeleton />}>
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Owner users</CardTitle>
              <CardDescription>Global workers stay reusable. Guests and renters stay scoped to one active property.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {userList.length ? userList.map((user) => (
                <div key={user.id} className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-slate-950">{user.fullName}</p>
                    <Badge variant="outline">{user.role}</Badge>
                    <Badge variant="secondary">{user.organizationIds?.length ?? 0} org links</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{user.email}</p>
                </div>
              )) : (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon"><Users /></EmptyMedia>
                    <EmptyTitle>No users yet</EmptyTitle>
                    <EmptyDescription>Send request to signed-up worker, renter, or guest from this page.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </CardContent>
          </Card>
        </WithBone>
      </div>
    </div>
  )
}

export function TenantOwnerTenantsPage() {
  const properties = useOwnerPropertiesQuery()
  const units = useOwnerUnitsQuery()
  const users = useOwnerUsersQuery()
  const tenants = useOwnerTenantsQuery()
  const createTenant = useOwnerCreateTenantMutation()
  const recordPayment = useOwnerRecordTenantPaymentMutation()
  const toggleTenant = useOwnerToggleTenantMutation()
  const deleteTenant = useOwnerDeleteTenantMutation()
  const propertyList = Array.isArray(properties.data) ? properties.data : []
  const unitList = Array.isArray(units.data) ? units.data : []
  const userList = Array.isArray(users.data) ? users.data : []
  const tenantList = Array.isArray(tenants.data) ? tenants.data : []
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [paymentMonth, setPaymentMonth] = useState(new Date().toISOString().slice(0, 7))
  const [form, setForm] = useState({
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

  const residentUsers = useMemo(
    () => userList.filter((user) => user.role === "renter" || user.role === "guest"),
    [userList]
  )

  return (
    <div className="space-y-6">
      <OwnerPageHero
        icon={Shield}
        badge="Residents"
        title="Tenant records"
        body="Track renters and guests with direct property dropdowns, linked user accounts, and fee inputs on one dedicated page."
      />
      <div className="flex justify-end">
        <CreateSheet
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          title="Add tenant record"
          description="Guest one-time fee or renter monthly rent."
          triggerLabel="Add tenant"
        >
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault()
                createTenant.mutate(
                  {
                    tenantKind: form.tenantKind as "renter" | "guest",
                    propertyId: form.propertyId,
                    unitId: form.unitId || undefined,
                    userId: form.userId || undefined,
                    fullName: form.fullName,
                    email: form.email,
                    phone: form.phone,
                    monthlyRent: Number(form.monthlyRent || "0") || undefined,
                    oneTimeGuestFee: Number(form.oneTimeGuestFee || "0") || undefined,
                  },
                  {
                    onSuccess: () => {
                      setForm({
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
                      setIsCreateOpen(false)
                    },
                  }
                )
              }}
            >
              <FieldGroup>
                <Field><FieldLabel>Kind</FieldLabel><Select value={form.tenantKind} onValueChange={(value) => setForm((current) => ({ ...current, tenantKind: value ?? "renter" }))}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{["renter", "guest"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
                <Field><FieldLabel>Property</FieldLabel><Select value={form.propertyId} onValueChange={(value) => setForm((current) => ({ ...current, propertyId: value ?? "" }))}><SelectTrigger className="w-full"><SelectValue placeholder="Select property" /></SelectTrigger><SelectContent><SelectGroup>{propertyList.map((property) => <SelectItem key={property._id} value={property._id}>{property.name}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
                <Field><FieldLabel>Unit (Optional)</FieldLabel><Select value={form.unitId} onValueChange={(value) => setForm((current) => ({ ...current, unitId: value ?? "" }))}><SelectTrigger className="w-full"><SelectValue placeholder="Select unit" /></SelectTrigger><SelectContent><SelectGroup>{unitList.map((unit) => <SelectItem key={unit._id} value={unit._id}>{unit.unitNumber}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
                <Field><FieldLabel>Linked user (Optional)</FieldLabel><Select value={form.userId} onValueChange={(value) => setForm((current) => ({ ...current, userId: value ?? "" }))}><SelectTrigger className="w-full"><SelectValue placeholder="Select signed-up resident" /></SelectTrigger><SelectContent><SelectGroup>{residentUsers.map((user) => <SelectItem key={user.id} value={user.id}>{user.fullName}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
                <Field><FieldLabel>Full name</FieldLabel><Input placeholder="Resident full name" value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Email</FieldLabel><Input type="email" placeholder="resident@email.com" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Phone</FieldLabel><Input placeholder="01XXXXXXXXX" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value ?? "" }))} /></Field>
                {form.tenantKind === "renter" ? (
                  <Field><FieldLabel>Monthly rent</FieldLabel><Input type="number" placeholder="Monthly rent amount" value={form.monthlyRent} onChange={(event) => setForm((current) => ({ ...current, monthlyRent: event.target.value ?? "" }))} /></Field>
                ) : (
                  <Field><FieldLabel>One-time guest fee</FieldLabel><Input type="number" placeholder="One-time guest fee" value={form.oneTimeGuestFee} onChange={(event) => setForm((current) => ({ ...current, oneTimeGuestFee: event.target.value ?? "" }))} /></Field>
                )}
              </FieldGroup>
              <Button type="submit" disabled={createTenant.isPending || !form.propertyId}>Create tenant record</Button>
            </form>
        </CreateSheet>
      </div>

      <div className="grid gap-4">
        <WithBone name="owner-page-tenants" loading={tenants.isLoading} fallback={<DashboardTableSkeleton />}>
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Tenant list</CardTitle>
              <CardDescription>One page for renter and guest status control, month payment tracking, fee follow-up.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Field>
                <FieldLabel>Payment month</FieldLabel>
                <Input type="month" value={paymentMonth} onChange={(event) => setPaymentMonth(event.target.value ?? "")} />
              </Field>
              {tenantList.length ? tenantList.map((tenant) => (
                <div key={tenant._id} className="flex flex-col gap-3 rounded-xl border p-4">
                  {(() => {
                    const activePayment = tenant.paymentRecords?.find((item) => item.monthKey === paymentMonth)
                    const expectedAmount =
                      tenant.tenantKind === "renter"
                        ? tenant.monthlyRent ?? 0
                        : tenant.oneTimeGuestFee ?? 0
                    return (
                      <>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-slate-950">{tenant.fullName}</p>
                    <Badge variant="outline">{tenant.tenantKind ?? "resident"}</Badge>
                    <Badge variant={tenant.isActive ? "default" : "secondary"}>
                      {tenant.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant={activePayment?.status === "paid" ? "default" : "outline"}>
                      {activePayment?.status ?? (tenant.tenantKind === "guest" && (tenant.guestFeePaid ?? false) ? "paid" : "unpaid")}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600">{tenant.email ?? "No email"}</p>
                  <div className="grid gap-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700 sm:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">Expected</p>
                      <p className="font-medium text-slate-950">{expectedAmount}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">Month</p>
                      <p className="font-medium text-slate-950">{paymentMonth || "No month"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">Last note</p>
                      <p className="font-medium text-slate-950">{activePayment?.note ?? "No note"}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="bg-blue-700 text-white hover:bg-blue-800"
                      disabled={recordPayment.isPending || !paymentMonth}
                      onClick={() =>
                        recordPayment.mutate({
                          tenantId: tenant._id,
                          monthKey: paymentMonth,
                          amount: activePayment?.amount ?? expectedAmount,
                          status: "paid",
                          paidAt: new Date().toISOString(),
                          note: tenant.tenantKind === "guest" ? "Guest fee collected" : "Rent collected",
                        })
                      }
                    >
                      Mark paid
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="shadow-none"
                      disabled={recordPayment.isPending || !paymentMonth}
                      onClick={() =>
                        recordPayment.mutate({
                          tenantId: tenant._id,
                          monthKey: paymentMonth,
                          amount: activePayment?.amount ?? expectedAmount,
                          status: "pending",
                          note: tenant.tenantKind === "guest" ? "Guest fee pending" : "Rent pending",
                        })
                      }
                    >
                      Mark pending
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={tenant.isActive ?? false}
                      onCheckedChange={(checked) =>
                        toggleTenant.mutate({ id: tenant._id, payload: { isActive: checked ?? false } })
                      }
                    />
                    <Button variant="outline" size="sm" className="shadow-none" onClick={() => deleteTenant.mutate(tenant._id)}>
                      Delete
                    </Button>
                  </div>
                      </>
                    )
                  })()}
                </div>
              )) : (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon"><Shield /></EmptyMedia>
                    <EmptyTitle>No tenant records</EmptyTitle>
                    <EmptyDescription>Add renter or guest records from this page.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </CardContent>
          </Card>
        </WithBone>
      </div>
    </div>
  )
}

export function TenantOwnerTechniciansPage() {
  const properties = useOwnerPropertiesQuery()
  const users = useOwnerUsersQuery()
  const technicians = useOwnerTechniciansQuery()
  const createTechnician = useOwnerCreateTechnicianMutation()
  const toggleTechnician = useOwnerToggleTechnicianMutation()
  const deleteTechnician = useOwnerDeleteTechnicianMutation()
  const propertyList = Array.isArray(properties.data) ? properties.data : []
  const technicianList = Array.isArray(technicians.data) ? technicians.data : []
  const workerUsers = Array.isArray(users.data) ? users.data.filter((user) => user.role === "worker") : []
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [assignedProperties, setAssignedProperties] = useState<string[]>([])
  const [form, setForm] = useState({
    userId: "",
    name: "",
    email: "",
    phone: "",
    skills: "",
    availability: "available",
  })

  return (
    <div className="space-y-6">
      <OwnerPageHero
        icon={Wrench}
        badge="Field Team"
        title="Technicians"
        body="Technician page now shows global worker linking clearly. One technician can serve many tenant owners and many properties."
      />
      <div className="flex justify-end">
        <CreateSheet
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          title="Add or link technician"
          description="Link existing worker or create new global technician profile."
          triggerLabel="Add technician"
        >
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault()
                createTechnician.mutate(
                  {
                    userId: form.userId || undefined,
                    name: form.name,
                    email: form.email,
                    phone: form.phone,
                    skills: splitCsv(form.skills),
                    availability: form.availability as "available" | "busy" | "on_leave" | "off_duty",
                    assignedProperties,
                  },
                  {
                    onSuccess: () => {
                      setForm({
                        userId: "",
                        name: "",
                        email: "",
                        phone: "",
                        skills: "",
                        availability: "available",
                      })
                      setAssignedProperties([])
                      setIsCreateOpen(false)
                    },
                  }
                )
              }}
            >
              <FieldGroup>
                <Field><FieldLabel>Linked worker user</FieldLabel><Select value={form.userId} onValueChange={(value) => setForm((current) => ({ ...current, userId: value ?? "" }))}><SelectTrigger className="w-full"><SelectValue placeholder="Optional worker account" /></SelectTrigger><SelectContent><SelectGroup>{workerUsers.map((user) => <SelectItem key={user.id} value={user.id}>{user.fullName}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
                <Field><FieldLabel>Name</FieldLabel><Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Email</FieldLabel><Input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Phone</FieldLabel><Input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Skills</FieldLabel><Input value={form.skills} onChange={(event) => setForm((current) => ({ ...current, skills: event.target.value ?? "" }))} /><FieldDescription>Comma separated. Example: plumbing,electrical</FieldDescription></Field>
                <Field><FieldLabel>Availability</FieldLabel><Select value={form.availability} onValueChange={(value) => setForm((current) => ({ ...current, availability: value ?? "available" }))}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{["available", "busy", "on_leave", "off_duty"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
                <PropertyMultiSelect
                  properties={propertyList}
                  selectedIds={assignedProperties}
                  setSelectedIds={setAssignedProperties}
                  helper="Technician can sit on many properties. Backend already keeps global technician links."
                />
              </FieldGroup>
              <Button type="submit" disabled={createTechnician.isPending}>Save technician</Button>
            </form>
        </CreateSheet>
      </div>

      <div className="grid gap-4">
        <WithBone name="owner-page-technicians" loading={technicians.isLoading} fallback={<DashboardTableSkeleton />}>
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Technician list</CardTitle>
              <CardDescription>Global technician records linked into owner workspace.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {technicianList.length ? technicianList.map((technician) => (
                <div key={technician._id} className="flex flex-col gap-3 rounded-xl border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-slate-950">{technician.fullName}</p>
                    <Badge variant="outline">{technician.specialty ?? "General"}</Badge>
                    <Badge variant={technician.isActive ? "default" : "secondary"}>
                      {technician.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={technician.isActive ?? false}
                      onCheckedChange={(checked) =>
                        toggleTechnician.mutate({ id: technician._id, payload: { isActive: checked ?? false } })
                      }
                    />
                    <Button variant="outline" size="sm" className="shadow-none" onClick={() => deleteTechnician.mutate(technician._id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              )) : (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon"><Wrench /></EmptyMedia>
                    <EmptyTitle>No technicians yet</EmptyTitle>
                    <EmptyDescription>Link worker or create technician profile from this page.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </CardContent>
          </Card>
        </WithBone>
      </div>
    </div>
  )
}

export function TenantOwnerNoticesPage() {
  const properties = useOwnerPropertiesQuery()
  const users = useOwnerUsersQuery()
  const announcements = useOwnerAnnouncementsQuery()
  const sendNotice = useOwnerSendNoticeMutation()
  const propertyList = Array.isArray(properties.data) ? properties.data : []
  const announcementList = Array.isArray(announcements.data) ? announcements.data : []
  const userList = Array.isArray(users.data) ? users.data : []
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [form, setForm] = useState({
    propertyId: "",
    title: "",
    content: "",
    audience: "roles",
    targetRoles: ["renter", "guest"] as Array<"worker" | "renter" | "guest">,
  })

  return (
    <div className="space-y-6">
      <OwnerPageHero
        icon={Bell}
        badge="Communication"
        title="Notices"
        body="Send building notice from dedicated page. Target by property, roles, or exact users."
      />
      <div className="flex justify-end">
        <CreateSheet
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          title="Send notice"
          description="Owner can notify workers, renters, guests, or selected people."
          triggerLabel="Send notice"
        >
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault()
                sendNotice.mutate(
                  {
                    propertyId: form.propertyId || undefined,
                    title: form.title,
                    content: form.content,
                    audience: form.audience as "all" | "roles" | "users",
                    targetRoles: form.audience === "roles" ? form.targetRoles : undefined,
                    targetUserIds: form.audience === "users" ? selectedUsers : undefined,
                    isActive: true,
                  },
                  {
                    onSuccess: () => {
                      setForm({
                        propertyId: "",
                        title: "",
                        content: "",
                        audience: "roles",
                        targetRoles: ["renter", "guest"],
                      })
                      setSelectedUsers([])
                      setIsCreateOpen(false)
                    },
                  }
                )
              }}
            >
              <FieldGroup>
                <Field><FieldLabel>Property</FieldLabel><Select value={form.propertyId} onValueChange={(value) => setForm((current) => ({ ...current, propertyId: value ?? "" }))}><SelectTrigger className="w-full"><SelectValue placeholder="Optional property" /></SelectTrigger><SelectContent><SelectGroup>{propertyList.map((property) => <SelectItem key={property._id} value={property._id}>{property.name}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
                <Field><FieldLabel>Title</FieldLabel><Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Content</FieldLabel><Textarea value={form.content} onChange={(event) => setForm((current) => ({ ...current, content: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Audience</FieldLabel><Select value={form.audience} onValueChange={(value) => setForm((current) => ({ ...current, audience: value ?? "roles" }))}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{["all", "roles", "users"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
                {form.audience === "roles" ? (
                  <Field>
                    <FieldLabel>Target roles</FieldLabel>
                    <div className="space-y-3 rounded-xl border p-4">
                      {(["worker", "renter", "guest"] as const).map((role) => (
                        <label key={role} className="flex items-center gap-3 text-sm text-slate-700">
                          <Checkbox
                            checked={form.targetRoles.includes(role)}
                            onCheckedChange={(checked) =>
                              setForm((current) => ({
                                ...current,
                                targetRoles: checked
                                  ? [...current.targetRoles, role]
                                  : current.targetRoles.filter((item) => item !== role),
                              }))
                            }
                          />
                          {role}
                        </label>
                      ))}
                    </div>
                  </Field>
                ) : null}
                {form.audience === "users" ? (
                  <Field>
                    <FieldLabel>Target users</FieldLabel>
                    <div className="space-y-3 rounded-xl border p-4">
                      {userList.map((user) => (
                        <label key={user.id} className="flex items-center gap-3 text-sm text-slate-700">
                          <Checkbox
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={(checked) =>
                              setSelectedUsers((current) =>
                                checked ? [...current, user.id] : current.filter((item) => item !== user.id)
                              )
                            }
                          />
                          {user.fullName} ({user.role})
                        </label>
                      ))}
                    </div>
                  </Field>
                ) : null}
              </FieldGroup>
              <Button type="submit" disabled={sendNotice.isPending}>Send notice</Button>
            </form>
        </CreateSheet>
      </div>

      <div className="grid gap-4">
        <WithBone name="owner-page-notices" loading={announcements.isLoading} fallback={<DashboardTableSkeleton />}>
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Notice feed</CardTitle>
              <CardDescription>Latest owner notices.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {announcementList.length ? announcementList.map((notice) => (
                <div key={notice._id} className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-slate-950">{notice.title}</p>
                    <Badge variant="outline">{notice.audience ?? "general"}</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{notice.content}</p>
                </div>
              )) : (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon"><Bell /></EmptyMedia>
                    <EmptyTitle>No notices yet</EmptyTitle>
                    <EmptyDescription>Send first notice from this page.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </CardContent>
          </Card>
        </WithBone>
      </div>
    </div>
  )
}

export function TenantOwnerDocumentsPage() {
  const users = useOwnerUsersQuery()
  const messages = useOwnerMessagesQuery()
  const sendDocument = useOwnerSendDocumentMutation()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [documentUrls, setDocumentUrls] = useState<string[]>([])
  const [form, setForm] = useState({
    title: "",
    note: "",
  })
  const userList = Array.isArray(users.data) ? users.data : []
  const messageList = Array.isArray(messages.data) ? messages.data : []

  return (
    <div className="space-y-6">
      <OwnerPageHero
        icon={FileText}
        badge="Documents"
        title="Send documents"
        body="Send document directly to worker, renter, guest, or selected users from one page."
      />
      <div className="flex justify-end">
        <CreateSheet
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          title="Send document"
          description="Upload from device, pick recipients, then send."
          triggerLabel="Send document"
        >
          <div className="space-y-4">
            <FieldGroup>
              <Field><FieldLabel>Title (Optional)</FieldLabel><Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value ?? "" }))} /></Field>
              <Field><FieldLabel>Note (Optional)</FieldLabel><Textarea value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value ?? "" }))} /></Field>
              <UploadCollectionField
                label="Document upload"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,image/*"
                kind="file"
                values={documentUrls}
                onChange={setDocumentUrls}
                optional={false}
              />
              <Field>
                <FieldLabel>Select recipients</FieldLabel>
                <div className="space-y-3 rounded-xl border p-4">
                  {userList.map((user) => (
                    <label key={user.id} className="flex items-center gap-3 text-sm text-slate-700">
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={(checked) =>
                          setSelectedUsers((current) =>
                            checked ? [...current, user.id] : current.filter((item) => item !== user.id)
                          )
                        }
                      />
                      {user.fullName} ({user.role})
                    </label>
                  ))}
                </div>
              </Field>
            </FieldGroup>
            <Button
              type="button"
              disabled={sendDocument.isPending || !selectedUsers.length || !documentUrls[0]}
              onClick={() =>
                sendDocument.mutate(
                  {
                    recipientIds: selectedUsers,
                    documentUrl: documentUrls[0] ?? "",
                    title: form.title || undefined,
                    note: form.note || undefined,
                  },
                  {
                    onSuccess: () => {
                      setSelectedUsers([])
                      setDocumentUrls([])
                      setForm({ title: "", note: "" })
                      setIsCreateOpen(false)
                    },
                  }
                )
              }
            >
              Send document
            </Button>
          </div>
        </CreateSheet>
      </div>

      <WithBone name="owner-page-documents" loading={messages.isLoading} fallback={<DashboardTableSkeleton />}>
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Recent document messages</CardTitle>
            <CardDescription>Document sends appear in messaging records.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {messageList.length ? messageList.slice(0, 12).map((message) => (
              <div key={message._id} className="rounded-xl border p-4">
                <p className="font-medium text-slate-950">{message.title ?? "Document"}</p>
                <p className="mt-1 text-sm text-slate-600">{message.content ?? "Sent document"}</p>
              </div>
            )) : (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon"><FileText /></EmptyMedia>
                  <EmptyTitle>No document sends yet</EmptyTitle>
                  <EmptyDescription>Upload and send document from top sheet.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>
      </WithBone>
    </div>
  )
}

export function TenantOwnerVendorsPage() {
  const vendors = useOwnerVendorsQuery()
  const createVendor = useOwnerCreateVendorMutation()
  const vendorList = Array.isArray(vendors.data) ? vendors.data : []
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [form, setForm] = useState({
    name: "",
    category: "general",
    email: "",
    phone: "",
    address: "",
    notes: "",
    isActive: true,
  })

  return (
    <div className="space-y-6">
      <OwnerPageHero
        icon={BriefcaseBusiness}
        badge="Partners"
        title="Vendors"
        body="Manage outside vendors, service contacts, and category-wise partners for owner operations."
      />
      <div className="flex justify-end">
        <CreateSheet
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          title="Add vendor"
          description="Save vendor contact for later work order or service use."
          triggerLabel="Add vendor"
        >
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              createVendor.mutate(
                {
                  name: form.name,
                  category: form.category,
                  email: form.email || undefined,
                  phone: form.phone || undefined,
                  address: form.address || undefined,
                  notes: form.notes || undefined,
                  isActive: form.isActive,
                },
                {
                  onSuccess: () => {
                    setForm({
                      name: "",
                      category: "general",
                      email: "",
                      phone: "",
                      address: "",
                      notes: "",
                      isActive: true,
                    })
                    setIsCreateOpen(false)
                  },
                }
              )
            }}
          >
            <FieldGroup>
              <Field><FieldLabel>Name</FieldLabel><Input placeholder="Vendor or company name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value ?? "" }))} /></Field>
              <Field><FieldLabel>Category</FieldLabel><Input placeholder="Plumbing, electrical, cleaning" value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value ?? "" }))} /></Field>
              <Field><FieldLabel>Email (Optional)</FieldLabel><Input type="email" placeholder="vendor@email.com" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value ?? "" }))} /></Field>
              <Field><FieldLabel>Phone (Optional)</FieldLabel><Input placeholder="01XXXXXXXXX" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value ?? "" }))} /></Field>
              <Field><FieldLabel>Address (Optional)</FieldLabel><Input placeholder="Office or service address" value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value ?? "" }))} /></Field>
              <Field><FieldLabel>Notes (Optional)</FieldLabel><Textarea placeholder="Service notes, terms, preferred timing" value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value ?? "" }))} /></Field>
              <Field className="flex flex-row items-center justify-between rounded-xl border px-4 py-3">
                <div>
                  <FieldLabel>Active status</FieldLabel>
                  <FieldDescription>Vendor stays available in owner operation flow.</FieldDescription>
                </div>
                <Switch checked={form.isActive} onCheckedChange={(checked) => setForm((current) => ({ ...current, isActive: checked ?? true }))} />
              </Field>
            </FieldGroup>
            <Button type="submit" disabled={createVendor.isPending || !form.name || !form.category}>Save vendor</Button>
          </form>
        </CreateSheet>
      </div>

      <WithBone name="owner-page-vendors" loading={vendors.isLoading} fallback={<DashboardTableSkeleton />}>
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Vendor list</CardTitle>
            <CardDescription>Keep service vendors ready for tickets and work orders.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {vendorList.length ? vendorList.map((vendor) => (
              <div key={vendor._id} className="rounded-xl border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-slate-950">{vendor.name}</p>
                  <Badge variant="outline">{vendor.category}</Badge>
                  <Badge variant={vendor.isActive ? "default" : "secondary"}>{vendor.isActive ? "Active" : "Inactive"}</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-600">{vendor.email ?? vendor.phone ?? "No contact info yet"}</p>
              </div>
            )) : (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon"><BriefcaseBusiness /></EmptyMedia>
                  <EmptyTitle>No vendors yet</EmptyTitle>
                  <EmptyDescription>Add first vendor from top sheet.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>
      </WithBone>
    </div>
  )
}

export function TenantOwnerTicketsPage() {
  const properties = useOwnerPropertiesQuery()
  const units = useOwnerUnitsQuery()
  const tenants = useOwnerTenantsQuery()
  const users = useOwnerUsersQuery()
  const tickets = useOwnerTicketsQuery()
  const createTicket = useOwnerCreateTicketMutation()
  const assignTicket = useOwnerAssignTicketMutation()
  const updateTicket = useOwnerUpdateTicketMutation()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [ticketImages, setTicketImages] = useState<string[]>([])
  const [dragTicketId, setDragTicketId] = useState("")
  const propertyList = Array.isArray(properties.data) ? properties.data : []
  const unitList = Array.isArray(units.data) ? units.data : []
  const tenantList = Array.isArray(tenants.data) ? tenants.data : []
  const userList = Array.isArray(users.data) ? users.data : []
  const ticketList = Array.isArray(tickets.data) ? tickets.data : []
  const workerList = userList.filter((user) => user.role === "worker")
  const [form, setForm] = useState({
    propertyId: "",
    unitId: "",
    tenantId: "",
    title: "",
    description: "",
    category: "general",
    priority: "medium",
  })

  return (
    <div className="space-y-6">
      <OwnerPageHero
        icon={Ticket}
        badge="Support"
        title="Tickets"
        body="Owner can create ticket, upload issue images, drag ticket onto own worker, then mark status done or in progress."
      />
      <div className="flex justify-end">
        <CreateSheet
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          title="Create ticket"
          description="Upload issue photos, set property, then save ticket."
          triggerLabel="Create ticket"
        >
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              createTicket.mutate(
                {
                  propertyId: form.propertyId,
                  unitId: form.unitId || undefined,
                  tenantId: form.tenantId || undefined,
                  title: form.title,
                  description: form.description,
                  category: form.category,
                  priority: form.priority,
                  images: ticketImages,
                },
                {
                  onSuccess: () => {
                    setForm({
                      propertyId: "",
                      unitId: "",
                      tenantId: "",
                      title: "",
                      description: "",
                      category: "general",
                      priority: "medium",
                    })
                    setTicketImages([])
                    setIsCreateOpen(false)
                  },
                }
              )
            }}
          >
            <FieldGroup>
              <Field><FieldLabel>Property</FieldLabel><Select value={form.propertyId} onValueChange={(value) => setForm((current) => ({ ...current, propertyId: value ?? "" }))}><SelectTrigger className="w-full"><SelectValue placeholder="Select property" /></SelectTrigger><SelectContent><SelectGroup>{propertyList.map((property) => <SelectItem key={property._id} value={property._id}>{property.name}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
              <Field><FieldLabel>Unit (Optional)</FieldLabel><Select value={form.unitId} onValueChange={(value) => setForm((current) => ({ ...current, unitId: value ?? "" }))}><SelectTrigger className="w-full"><SelectValue placeholder="Select unit" /></SelectTrigger><SelectContent><SelectGroup>{unitList.map((unit) => <SelectItem key={unit._id} value={unit._id}>{unit.unitNumber}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
              <Field><FieldLabel>Tenant (Optional)</FieldLabel><Select value={form.tenantId} onValueChange={(value) => setForm((current) => ({ ...current, tenantId: value ?? "" }))}><SelectTrigger className="w-full"><SelectValue placeholder="Select tenant" /></SelectTrigger><SelectContent><SelectGroup>{tenantList.map((tenant) => <SelectItem key={tenant._id} value={tenant._id}>{tenant.fullName}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
              <Field><FieldLabel>Title</FieldLabel><Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value ?? "" }))} /></Field>
              <Field><FieldLabel>Description</FieldLabel><Textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value ?? "" }))} /></Field>
              <Field><FieldLabel>Category</FieldLabel><Select value={form.category} onValueChange={(value) => setForm((current) => ({ ...current, category: value ?? "general" }))}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{["plumbing","electrical","hvac","cleaning","appliance","security","internet","structural","general"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
              <Field><FieldLabel>Priority</FieldLabel><Select value={form.priority} onValueChange={(value) => setForm((current) => ({ ...current, priority: value ?? "medium" }))}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{["low","medium","high","emergency"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
              <UploadCollectionField
                label="Issue images"
                accept="image/*"
                kind="image"
                values={ticketImages}
                onChange={setTicketImages}
              />
            </FieldGroup>
            <Button type="submit" disabled={createTicket.isPending || !form.propertyId || !form.title || !form.description}>Create ticket</Button>
          </form>
        </CreateSheet>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <WithBone name="owner-page-tickets" loading={tickets.isLoading} fallback={<DashboardTableSkeleton />}>
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Ticket board</CardTitle>
              <CardDescription>Drag ticket card onto your worker lane to assign.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {ticketList.length ? ticketList.map((ticket) => (
                <div
                  key={ticket._id}
                  draggable
                  onDragStart={() => setDragTicketId(ticket._id)}
                  className="rounded-xl border p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-slate-950">{ticket.title}</p>
                    <Badge variant="outline">{ticket.status}</Badge>
                    <Badge variant="secondary">{ticket.priority}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{ticket.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {["open","assigned","in_progress","completed"].map((status) => (
                      <Button
                        key={status}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shadow-none"
                        onClick={() => updateTicket.mutate({ id: ticket._id, payload: { status } })}
                      >
                        {status}
                      </Button>
                    ))}
                  </div>
                </div>
              )) : (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon"><Ticket /></EmptyMedia>
                    <EmptyTitle>No tickets yet</EmptyTitle>
                    <EmptyDescription>Create first ticket from top sheet.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </CardContent>
          </Card>
        </WithBone>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Assign my workers</CardTitle>
            <CardDescription>Only owner-linked workers show here. No global worker dump.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {workerList.length ? workerList.map((worker) => (
              <div
                key={worker.id}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (!dragTicketId) return
                  assignTicket.mutate({ ticketId: dragTicketId, assignedTo: worker.id })
                  setDragTicketId("")
                }}
                className="rounded-xl border border-dashed p-4"
              >
                <p className="font-medium text-slate-950">{worker.fullName}</p>
                <p className="text-sm text-slate-600">{worker.email}</p>
              </div>
            )) : (
              <div className="rounded-xl border border-dashed p-4 text-sm text-slate-500">
                No workers linked yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function TenantOwnerWorkOrdersPage() {
  const properties = useOwnerPropertiesQuery()
  const units = useOwnerUnitsQuery()
  const tickets = useOwnerTicketsQuery()
  const users = useOwnerUsersQuery()
  const workOrders = useOwnerWorkOrdersQuery()
  const createWorkOrder = useOwnerCreateWorkOrderMutation()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [proofUrls, setProofUrls] = useState<string[]>([])
  const propertyList = Array.isArray(properties.data) ? properties.data : []
  const unitList = Array.isArray(units.data) ? units.data : []
  const ticketList = Array.isArray(tickets.data) ? tickets.data : []
  const userList = Array.isArray(users.data) ? users.data : []
  const workOrderList = Array.isArray(workOrders.data) ? workOrders.data : []
  const [form, setForm] = useState({
    propertyId: "",
    unitId: "",
    ticketId: "",
    title: "",
    description: "",
    assignedTo: "",
    scheduledDate: "",
    dueDate: "",
    priority: "medium",
    status: "open",
  })

  return (
    <div className="space-y-6">
      <OwnerPageHero icon={ClipboardCheck} badge="Execution" title="Work orders" body="Create work order from ticket or directly, assign worker, and attach proof files." />
      <div className="flex justify-end">
        <CreateSheet open={isCreateOpen} onOpenChange={setIsCreateOpen} title="Create work order" description="Owner can assign worker and due dates." triggerLabel="Add work order">
          <form className="space-y-4" onSubmit={(event) => {
            event.preventDefault()
            createWorkOrder.mutate({
              propertyId: form.propertyId,
              unitId: form.unitId || undefined,
              ticketId: form.ticketId || undefined,
              title: form.title,
              description: form.description,
              assignedTo: form.assignedTo || undefined,
              scheduledDate: form.scheduledDate || undefined,
              dueDate: form.dueDate || undefined,
              priority: form.priority,
              status: form.status,
              completionProof: proofUrls,
            }, { onSuccess: () => {
              setForm({ propertyId: "", unitId: "", ticketId: "", title: "", description: "", assignedTo: "", scheduledDate: "", dueDate: "", priority: "medium", status: "open" })
              setProofUrls([])
              setIsCreateOpen(false)
            }})
          }}>
            <FieldGroup>
              <Field><FieldLabel>Property</FieldLabel><Select value={form.propertyId} onValueChange={(value) => setForm((current) => ({ ...current, propertyId: value ?? "" }))}><SelectTrigger className="w-full"><SelectValue placeholder="Select property" /></SelectTrigger><SelectContent><SelectGroup>{propertyList.map((property) => <SelectItem key={property._id} value={property._id}>{property.name}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
              <Field><FieldLabel>Unit (Optional)</FieldLabel><Select value={form.unitId} onValueChange={(value) => setForm((current) => ({ ...current, unitId: value ?? "" }))}><SelectTrigger className="w-full"><SelectValue placeholder="Select unit" /></SelectTrigger><SelectContent><SelectGroup>{unitList.map((unit) => <SelectItem key={unit._id} value={unit._id}>{unit.unitNumber}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
              <Field><FieldLabel>Ticket (Optional)</FieldLabel><Select value={form.ticketId} onValueChange={(value) => setForm((current) => ({ ...current, ticketId: value ?? "" }))}><SelectTrigger className="w-full"><SelectValue placeholder="Select ticket" /></SelectTrigger><SelectContent><SelectGroup>{ticketList.map((ticket) => <SelectItem key={ticket._id} value={ticket._id}>{ticket.title}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
              <Field><FieldLabel>Title</FieldLabel><Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value ?? "" }))} /></Field>
              <Field><FieldLabel>Description</FieldLabel><Textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value ?? "" }))} /></Field>
              <Field><FieldLabel>Assign worker (Optional)</FieldLabel><Select value={form.assignedTo} onValueChange={(value) => setForm((current) => ({ ...current, assignedTo: value ?? "" }))}><SelectTrigger className="w-full"><SelectValue placeholder="Select worker" /></SelectTrigger><SelectContent><SelectGroup>{userList.filter((user) => user.role === "worker").map((user) => <SelectItem key={user.id} value={user.id}>{user.fullName}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
              <Field><FieldLabel>Scheduled date (Optional)</FieldLabel><Input type="date" value={form.scheduledDate} onChange={(event) => setForm((current) => ({ ...current, scheduledDate: event.target.value ?? "" }))} /></Field>
              <Field><FieldLabel>Due date (Optional)</FieldLabel><Input type="date" value={form.dueDate} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value ?? "" }))} /></Field>
              <UploadCollectionField label="Completion proof" accept="image/*,.pdf,.doc,.docx" kind="file" values={proofUrls} onChange={setProofUrls} />
            </FieldGroup>
            <Button type="submit" disabled={createWorkOrder.isPending || !form.propertyId || !form.title || !form.description}>Create work order</Button>
          </form>
        </CreateSheet>
      </div>
      <WithBone name="owner-page-work-orders" loading={workOrders.isLoading} fallback={<DashboardTableSkeleton />}>
        <Card className="shadow-none"><CardHeader><CardTitle>Work orders</CardTitle><CardDescription>Open and scheduled work.</CardDescription></CardHeader><CardContent className="space-y-3">{workOrderList.length ? workOrderList.map((item) => <div key={item._id} className="rounded-xl border p-4"><div className="flex flex-wrap gap-2"><p className="font-medium text-slate-950">{item.title}</p><Badge variant="outline">{item.status}</Badge></div><p className="mt-2 text-sm text-slate-600">{item.description}</p></div>) : <Empty><EmptyHeader><EmptyMedia variant="icon"><ClipboardCheck /></EmptyMedia><EmptyTitle>No work orders yet</EmptyTitle><EmptyDescription>Create first work order from top sheet.</EmptyDescription></EmptyHeader></Empty>}</CardContent></Card>
      </WithBone>
    </div>
  )
}

export function TenantOwnerRecurringPage() {
  const properties = useOwnerPropertiesQuery()
  const units = useOwnerUnitsQuery()
  const recurring = useOwnerRecurringMaintenancesQuery()
  const createRecurring = useOwnerCreateRecurringMaintenanceMutation()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const propertyList = Array.isArray(properties.data) ? properties.data : []
  const unitList = Array.isArray(units.data) ? units.data : []
  const recurringList = Array.isArray(recurring.data) ? recurring.data : []
  const [form, setForm] = useState({ propertyId: "", unitId: "", title: "", description: "", frequency: "monthly", nextRunAt: "", isActive: true })

  return (
    <div className="space-y-6">
      <OwnerPageHero icon={Repeat} badge="Recurring" title="Recurring maintenance" body="Schedule repeating maintenance tasks for any property or unit." />
      <div className="flex justify-end">
        <CreateSheet open={isCreateOpen} onOpenChange={setIsCreateOpen} title="Create recurring maintenance" description="Set frequency and next run date." triggerLabel="Add recurring">
          <form className="space-y-4" onSubmit={(event) => {
            event.preventDefault()
            createRecurring.mutate({ ...form, unitId: form.unitId || undefined }, { onSuccess: () => {
              setForm({ propertyId: "", unitId: "", title: "", description: "", frequency: "monthly", nextRunAt: "", isActive: true })
              setIsCreateOpen(false)
            }})
          }}>
            <FieldGroup>
              <Field><FieldLabel>Property</FieldLabel><Select value={form.propertyId} onValueChange={(value) => setForm((current) => ({ ...current, propertyId: value ?? "" }))}><SelectTrigger className="w-full"><SelectValue placeholder="Select property" /></SelectTrigger><SelectContent><SelectGroup>{propertyList.map((property) => <SelectItem key={property._id} value={property._id}>{property.name}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
              <Field><FieldLabel>Unit (Optional)</FieldLabel><Select value={form.unitId} onValueChange={(value) => setForm((current) => ({ ...current, unitId: value ?? "" }))}><SelectTrigger className="w-full"><SelectValue placeholder="Select unit" /></SelectTrigger><SelectContent><SelectGroup>{unitList.map((unit) => <SelectItem key={unit._id} value={unit._id}>{unit.unitNumber}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
              <Field><FieldLabel>Title</FieldLabel><Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value ?? "" }))} /></Field>
              <Field><FieldLabel>Description (Optional)</FieldLabel><Textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value ?? "" }))} /></Field>
              <Field><FieldLabel>Frequency</FieldLabel><Select value={form.frequency} onValueChange={(value) => setForm((current) => ({ ...current, frequency: value ?? "monthly" }))}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{["weekly","monthly","quarterly","yearly"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
              <Field><FieldLabel>Next run date</FieldLabel><Input type="date" value={form.nextRunAt} onChange={(event) => setForm((current) => ({ ...current, nextRunAt: event.target.value ?? "" }))} /></Field>
            </FieldGroup>
            <Button type="submit" disabled={createRecurring.isPending || !form.propertyId || !form.title || !form.nextRunAt}>Create recurring maintenance</Button>
          </form>
        </CreateSheet>
      </div>
      <WithBone name="owner-page-recurring" loading={recurring.isLoading} fallback={<DashboardTableSkeleton />}>
        <Card className="shadow-none"><CardHeader><CardTitle>Recurring plans</CardTitle><CardDescription>Active repeat maintenance.</CardDescription></CardHeader><CardContent className="space-y-3">{recurringList.length ? recurringList.map((item) => <div key={item._id} className="rounded-xl border p-4"><div className="flex flex-wrap gap-2"><p className="font-medium text-slate-950">{item.title}</p><Badge variant="outline">{item.frequency}</Badge></div><p className="mt-2 text-sm text-slate-600">{item.description ?? "No description"}</p></div>) : <Empty><EmptyHeader><EmptyMedia variant="icon"><Repeat /></EmptyMedia><EmptyTitle>No recurring maintenance yet</EmptyTitle><EmptyDescription>Create first recurring maintenance from top sheet.</EmptyDescription></EmptyHeader></Empty>}</CardContent></Card>
      </WithBone>
    </div>
  )
}

export function TenantOwnerInspectionsPage() {
  const properties = useOwnerPropertiesQuery()
  const units = useOwnerUnitsQuery()
  const inspections = useOwnerInspectionsQuery()
  const createInspection = useOwnerCreateInspectionMutation()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const propertyList = Array.isArray(properties.data) ? properties.data : []
  const unitList = Array.isArray(units.data) ? units.data : []
  const inspectionList = Array.isArray(inspections.data) ? inspections.data : []
  const [form, setForm] = useState({ propertyId: "", unitId: "", type: "routine", scheduledAt: "", checklist: "", damageReport: "", notes: "", completed: false })

  return (
    <div className="space-y-6">
      <OwnerPageHero icon={ClipboardCheck} badge="Inspection" title="Inspections" body="Schedule move-in, move-out, or routine inspections with photos and checklist." />
      <div className="flex justify-end">
        <CreateSheet open={isCreateOpen} onOpenChange={setIsCreateOpen} title="Create inspection" description="Add checklist and upload photos." triggerLabel="Add inspection">
          <form className="space-y-4" onSubmit={(event) => {
            event.preventDefault()
            createInspection.mutate({
              propertyId: form.propertyId,
              unitId: form.unitId || undefined,
              type: form.type,
              scheduledAt: form.scheduledAt,
              checklist: splitCsv(form.checklist),
              photos: photoUrls,
              damageReport: form.damageReport || undefined,
              notes: form.notes || undefined,
              completed: form.completed,
            }, { onSuccess: () => {
              setForm({ propertyId: "", unitId: "", type: "routine", scheduledAt: "", checklist: "", damageReport: "", notes: "", completed: false })
              setPhotoUrls([])
              setIsCreateOpen(false)
            }})
          }}>
            <FieldGroup>
              <Field><FieldLabel>Property</FieldLabel><Select value={form.propertyId} onValueChange={(value) => setForm((current) => ({ ...current, propertyId: value ?? "" }))}><SelectTrigger className="w-full"><SelectValue placeholder="Select property" /></SelectTrigger><SelectContent><SelectGroup>{propertyList.map((property) => <SelectItem key={property._id} value={property._id}>{property.name}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
              <Field><FieldLabel>Unit (Optional)</FieldLabel><Select value={form.unitId} onValueChange={(value) => setForm((current) => ({ ...current, unitId: value ?? "" }))}><SelectTrigger className="w-full"><SelectValue placeholder="Select unit" /></SelectTrigger><SelectContent><SelectGroup>{unitList.map((unit) => <SelectItem key={unit._id} value={unit._id}>{unit.unitNumber}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
              <Field><FieldLabel>Type</FieldLabel><Select value={form.type} onValueChange={(value) => setForm((current) => ({ ...current, type: value ?? "routine" }))}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{["move_in","move_out","routine"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
              <Field><FieldLabel>Scheduled date</FieldLabel><Input type="date" value={form.scheduledAt} onChange={(event) => setForm((current) => ({ ...current, scheduledAt: event.target.value ?? "" }))} /></Field>
              <Field><FieldLabel>Checklist (Optional)</FieldLabel><Textarea value={form.checklist} onChange={(event) => setForm((current) => ({ ...current, checklist: event.target.value ?? "" }))} /><FieldDescription>Comma separated items</FieldDescription></Field>
              <UploadCollectionField label="Inspection photos" accept="image/*" kind="image" values={photoUrls} onChange={setPhotoUrls} />
              <Field><FieldLabel>Damage report (Optional)</FieldLabel><Textarea value={form.damageReport} onChange={(event) => setForm((current) => ({ ...current, damageReport: event.target.value ?? "" }))} /></Field>
              <Field><FieldLabel>Notes (Optional)</FieldLabel><Textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value ?? "" }))} /></Field>
            </FieldGroup>
            <Button type="submit" disabled={createInspection.isPending || !form.propertyId || !form.scheduledAt}>Create inspection</Button>
          </form>
        </CreateSheet>
      </div>
      <WithBone name="owner-page-inspections" loading={inspections.isLoading} fallback={<DashboardTableSkeleton />}>
        <Card className="shadow-none"><CardHeader><CardTitle>Inspections</CardTitle><CardDescription>Scheduled and completed inspections.</CardDescription></CardHeader><CardContent className="space-y-3">{inspectionList.length ? inspectionList.map((item) => <div key={item._id} className="rounded-xl border p-4"><div className="flex flex-wrap gap-2"><p className="font-medium text-slate-950">{item.type}</p><Badge variant={item.completed ? "default" : "outline"}>{item.completed ? "Done" : "Pending"}</Badge></div><p className="mt-2 text-sm text-slate-600">{item.scheduledAt ?? "No date"}</p></div>) : <Empty><EmptyHeader><EmptyMedia variant="icon"><ClipboardCheck /></EmptyMedia><EmptyTitle>No inspections yet</EmptyTitle><EmptyDescription>Create first inspection from top sheet.</EmptyDescription></EmptyHeader></Empty>}</CardContent></Card>
      </WithBone>
    </div>
  )
}

export function TenantOwnerSettingsPage() {
  const { data: me, isLoading } = useMeQuery()

  return (
    <div className="space-y-6">
      <OwnerPageHero
        icon={Settings2}
        badge="Settings"
        title="Tenant owner settings"
        body="Core owner status, subscription gate, organization link, and multi-property rules live here."
      />
      <WithBone name="owner-page-settings" loading={isLoading} fallback={<DashboardPanelSkeleton />}>
        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Owner account</CardTitle>
              <CardDescription>Frontend checks these flags for access and billing flow.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-700">
              <div className="rounded-xl border p-4">
                <p className="font-medium text-slate-950">Name</p>
                <p className="mt-1">{me?.fullName ?? "Unknown"}</p>
              </div>
              <div className="rounded-xl border p-4">
                <p className="font-medium text-slate-950">Organization</p>
                <p className="mt-1 break-all">{me?.organizationId ?? "Not bound yet"}</p>
              </div>
              <div className="rounded-xl border p-4">
                <p className="font-medium text-slate-950">Subscription</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant={me?.subscriptionActive ? "default" : "outline"}>
                    {me?.subscriptionActive ? "Active" : "Inactive"}
                  </Badge>
                  <Badge variant="secondary">{me?.subscriptionTier ?? "No tier"}</Badge>
                  <Badge variant="outline">
                    {me?.subscriptionRequired ? "Required" : "Optional"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Rules already live</CardTitle>
              <CardDescription>Important owner behavior now in backend and surfaced here.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-6 text-slate-700">
              <div className="rounded-xl border p-4">
                Worker can link to multiple tenant owners and multiple properties.
              </div>
              <div className="rounded-xl border p-4">
                Technician profile stays global and can be reused by many owners and many properties.
              </div>
              <div className="rounded-xl border p-4">
                Renter and guest keep one active property at a time.
              </div>
              <div className="rounded-xl border p-4">
                Tenant owner can add many properties under one organization.
              </div>
            </CardContent>
          </Card>
        </div>
      </WithBone>
    </div>
  )
}
