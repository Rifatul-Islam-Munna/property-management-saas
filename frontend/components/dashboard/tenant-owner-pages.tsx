"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  Bell,
  BriefcaseBusiness,
  Building2,
  ClipboardCheck,
  CreditCard,
  Eye,
  FileText,
  Home,
  Pencil,
  Repeat,
  Settings2,
  Shield,
  Ticket,
  Trash2,
  UserPlus,
  Users,
  Wrench,
} from "lucide-react"
import { getRequest, patchRequest } from "@/api-hooks/api-hooks"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { UploadCollectionField } from "@/components/shared/upload-collection-field"
import { RichTextContent, RichTextEditor } from "@/components/shared/rich-text-editor"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { useOrganizationStripeSettingsQuery } from "@/hooks/use-organization-settings"
import type { AuthUser } from "@/lib/types/auth"
import {
  useOwnerAssignTicketMutation,
  useOwnerAddTicketNoteMutation,
  useOwnerCreateInspectionMutation,
  useOwnerCreatePropertyMutation,
  useOwnerCreateRecurringMaintenanceMutation,
  useOwnerCreateTechnicianMutation,
  useOwnerCreateTenantMutation,
  useOwnerCreateTicketMutation,
  useOwnerCreateUserMutation,
  useOwnerCreateUnitMutation,
  useOwnerCreateVendorMutation,
  useOwnerCreateWorkOrderMutation,
  useOwnerCreateAssignmentRequestMutation,
  useOwnerCreateBillMutation,
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
  useOwnerUpdateBillMutation,
  useOwnerUpdateInspectionMutation,
  useOwnerUpdateRecurringMaintenanceMutation,
  useOwnerUpdateTenantMutation,
  useOwnerUpdateTicketMutation,
} from "@/hooks/use-owner-actions"
import {
  useOwnerAnnouncementsQuery,
  useOwnerBillsQuery,
  useOwnerFinanceEntriesQuery,
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
import type { ApiSuccessResponse } from "@/lib/types/api"
import type { FinanceEntryItem, PropertyItem, TenantItem, TicketItem, UnitItem } from "@/lib/types/dashboard"
import { toast } from "sonner"

function splitCsv(value?: string) {
  return value?.split(",").map((item) => item.trim()).filter(Boolean) ?? []
}

function parseChargeTemplates(value?: string) {
  return value
    ?.split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title, amount, frequency, note] = line.split("|").map((item) => item.trim())
      return {
        title,
        amount: Number(amount || "0"),
        frequency: frequency || "monthly",
        note: note || undefined,
      }
    })
    .filter((item) => item.title && item.amount >= 0) ?? []
}

type ExtraChargeTemplateFormItem = {
  title: string
  amount: string
  frequency: string
}

function mapExtraChargeTemplatesToForm(
  templates?: Array<{ title: string; amount: number; frequency?: string | null; note?: string | null }>
) {
  return templates?.length
    ? templates.map((item) => ({
        title: item.title ?? "",
        amount: String(item.amount ?? ""),
        frequency: item.frequency ?? "monthly",
      }))
    : [{ title: "", amount: "", frequency: "monthly" }]
}

function mapExtraChargeTemplatesFromForm(items: ExtraChargeTemplateFormItem[]) {
  return items
    .map((item) => ({
      title: item.title.trim(),
      amount: Number(item.amount || "0"),
      frequency: item.frequency || "monthly",
    }))
    .filter((item) => item.title && item.amount >= 0)
}

function formatMoney(value?: number | null, currency = "USD") {
  return `${currency} ${value ?? 0}`
}

function resolveDisplayCurrency(currency: string | null | undefined, fallback = "USD") {
  const normalized = currency?.trim()?.toUpperCase()
  if (!normalized || normalized === "BDT") return fallback
  return normalized
}

function formatDateLabel(value?: string | Date | null, fallback = "Not set") {
  if (!value) return fallback
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return fallback
  return parsed.toLocaleDateString()
}

function toDateInputValue(value?: string | Date | null) {
  if (!value) return ""
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ""
  return parsed.toISOString().slice(0, 10)
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
          Prev
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  )
}

function buildMonthDueDate(monthKey: string, dueDay?: number | null) {
  if (!monthKey || !dueDay) return ""
  const [yearString, monthString] = monthKey.split("-")
  const year = Number(yearString)
  const month = Number(monthString)
  if (!year || !month) return ""
  const lastDay = new Date(year, month, 0).getDate()
  const dueDate = new Date(Date.UTC(year, month - 1, Math.min(dueDay, lastDay)))
  return dueDate.toISOString().slice(0, 10)
}

const STRIPE_CURRENCY_OPTIONS = [
  { value: "usd", label: "USD" },
  { value: "bdt", label: "BDT" },
  { value: "eur", label: "EUR" },
  { value: "gbp", label: "GBP" },
  { value: "cad", label: "CAD" },
  { value: "aud", label: "AUD" },
]

const DOCUMENT_TEMPLATE_VARIABLES = [
  "tenant_full_name",
  "tenant_email",
  "tenant_phone",
  "tenant_kind",
  "tenant_address",
  "tenant_lease_start",
  "tenant_lease_end",
  "tenant_monthly_rent",
  "tenant_security_deposit",
  "tenant_guest_fee",
  "property_name",
  "property_type",
  "property_address",
  "property_contact_email",
  "property_contact_phone",
  "unit_number",
  "unit_floor",
  "unit_type",
  "owner_name",
  "owner_email",
  "current_date",
  "current_year",
]

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

function AuditStamp({
  item,
  label = "Last update",
}: {
  item?: { updatedByName?: string | null; updatedByRole?: string | null; updatedAt?: string }
  label?: string
}) {
  if (!item?.updatedByName && !item?.updatedAt) return null

  return (
    <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-700">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-medium text-slate-950">
        {item.updatedByName ?? "Unknown user"}
        {item.updatedByRole ? ` • ${item.updatedByRole}` : ""}
      </p>
      <p className="mt-1 text-xs text-slate-500">{formatDateLabel(item.updatedAt, "Unknown time")}</p>
    </div>
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

function ExtraChargeTemplateFields({
  items,
  setItems,
}: {
  items: ExtraChargeTemplateFormItem[]
  setItems: React.Dispatch<React.SetStateAction<ExtraChargeTemplateFormItem[]>>
}) {
  return (
    <Field className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <FieldLabel>Extra charge templates</FieldLabel>
          <FieldDescription>Title, amount, and monthly or yearly.</FieldDescription>
        </div>
        <Button
          type="button"
          variant="outline"
          className="shadow-none"
          onClick={() =>
            setItems((current) => [...current, { title: "", amount: "", frequency: "monthly" }])
          }
        >
          Add charge
        </Button>
      </div>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={`charge-${index}`} className="grid gap-3 rounded-xl border p-3 md:grid-cols-[1.4fr_1fr_1fr_auto]">
            <Field>
              <FieldLabel>Title</FieldLabel>
              <Input
                value={item.title}
                onChange={(event) =>
                  setItems((current) =>
                    current.map((entry, entryIndex) =>
                      entryIndex === index ? { ...entry, title: event.target.value ?? "" } : entry
                    )
                  )
                }
              />
            </Field>
            <Field>
              <FieldLabel>Amount</FieldLabel>
              <Input
                type="number"
                value={item.amount}
                onChange={(event) =>
                  setItems((current) =>
                    current.map((entry, entryIndex) =>
                      entryIndex === index ? { ...entry, amount: event.target.value ?? "" } : entry
                    )
                  )
                }
              />
            </Field>
            <Field>
              <FieldLabel>Frequency</FieldLabel>
              <Select
                value={item.frequency}
                onValueChange={(value) =>
                  setItems((current) =>
                    current.map((entry, entryIndex) =>
                      entryIndex === index ? { ...entry, frequency: value ?? "monthly" } : entry
                    )
                  )
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {["monthly", "yearly"].map((frequency) => (
                      <SelectItem key={frequency} value={frequency}>
                        {frequency}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                className="shadow-none"
                onClick={() =>
                  setItems((current) =>
                    current.length === 1
                      ? [{ title: "", amount: "", frequency: "monthly" }]
                      : current.filter((_, entryIndex) => entryIndex !== index)
                  )
                }
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
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
  const [isPropertyDetailOpen, setIsPropertyDetailOpen] = useState(false)
  const [isPropertyEditOpen, setIsPropertyEditOpen] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<PropertyItem | null>(null)
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
  const [editForm, setEditForm] = useState({
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

      <Sheet open={isPropertyDetailOpen} onOpenChange={setIsPropertyDetailOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:!w-[50vw] sm:!max-w-[50vw]">
          <SheetHeader>
            <SheetTitle>{selectedProperty?.name ?? "Property details"}</SheetTitle>
            <SheetDescription>Full property info, contacts, files, and notes.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4 pb-6">
            <AuditStamp item={selectedProperty ?? undefined} />
            <div className="rounded-xl border p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Type</p>
              <p className="mt-1 font-medium text-slate-950">{selectedProperty?.type ?? "N/A"}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Units</p><p className="mt-1 font-medium text-slate-950">{selectedProperty?.totalUnits ?? 0}</p></div>
              <div className="rounded-xl border p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Floors</p><p className="mt-1 font-medium text-slate-950">{selectedProperty?.totalFloors ?? 0}</p></div>
            </div>
            <div className="rounded-xl border p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Address</p>
              <p className="mt-1 text-sm text-slate-700">
                {[selectedProperty?.address?.street, selectedProperty?.address?.city, selectedProperty?.address?.state, selectedProperty?.address?.country, selectedProperty?.address?.zipCode].filter(Boolean).join(", ") || "No address"}
              </p>
            </div>
            <div className="rounded-xl border p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Description</p>
              <p className="mt-1 text-sm text-slate-700">{selectedProperty?.description ?? "No description"}</p>
            </div>
            <div className="rounded-xl border p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Amenities</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(selectedProperty?.amenities ?? []).length ? (selectedProperty?.amenities ?? []).map((item) => <Badge key={item} variant="secondary">{item}</Badge>) : <span className="text-xs text-slate-500">No amenities</span>}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Phone</p><p className="mt-1 text-sm text-slate-700">{selectedProperty?.contactPhone ?? "No phone"}</p></div>
              <div className="rounded-xl border p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Email</p><p className="mt-1 text-sm text-slate-700">{selectedProperty?.contactEmail ?? "No email"}</p></div>
            </div>
            <div className="rounded-xl border p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Documents</p>
              <div className="mt-2 space-y-2">
                {(selectedProperty?.documents ?? []).length ? (selectedProperty?.documents ?? []).map((item, index) => <a key={`${item}-${index}`} href={item} target="_blank" rel="noreferrer" className="block text-sm text-blue-700 underline">{item}</a>) : <span className="text-xs text-slate-500">No documents</span>}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={isPropertyEditOpen} onOpenChange={setIsPropertyEditOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:!w-[50vw] sm:!max-w-[50vw]">
          <SheetHeader>
            <SheetTitle>Edit property</SheetTitle>
            <SheetDescription>Update property fields from one sheet.</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault()
                if (!selectedProperty?._id) return
                toggleProperty.mutate(
                  {
                    id: selectedProperty._id,
                    payload: {
                      name: editForm.name,
                      type: editForm.type,
                      description: editForm.description || undefined,
                      images: splitCsv(editForm.images),
                      documents: splitCsv(editForm.documents),
                      totalUnits: Number(editForm.totalUnits || "0") || undefined,
                      totalFloors: Number(editForm.totalFloors || "0") || undefined,
                      amenities: splitCsv(editForm.amenities),
                      contactPhone: editForm.contactPhone || undefined,
                      contactEmail: editForm.contactEmail || undefined,
                      isActive: editForm.isActive,
                      address: {
                        street: editForm.street || undefined,
                        city: editForm.city || undefined,
                        state: editForm.state || undefined,
                        country: editForm.country || undefined,
                        zipCode: editForm.zipCode || undefined,
                      },
                    },
                  },
                  {
                    onSuccess: () => {
                      setIsPropertyEditOpen(false)
                    },
                  }
                )
              }}
            >
              <FieldGroup>
                <Field><FieldLabel>Name</FieldLabel><Input value={editForm.name} onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Type</FieldLabel><Select value={editForm.type} onValueChange={(value) => setEditForm((current) => ({ ...current, type: (value ?? "apartment") as typeof current.type }))}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{["apartment", "hotel", "villa", "office", "coworking_space", "vacation_rental"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
                <Field><FieldLabel>Street</FieldLabel><Input value={editForm.street} onChange={(event) => setEditForm((current) => ({ ...current, street: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>City</FieldLabel><Input value={editForm.city} onChange={(event) => setEditForm((current) => ({ ...current, city: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>State</FieldLabel><Input value={editForm.state} onChange={(event) => setEditForm((current) => ({ ...current, state: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Country</FieldLabel><Input value={editForm.country} onChange={(event) => setEditForm((current) => ({ ...current, country: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Zip code</FieldLabel><Input value={editForm.zipCode} onChange={(event) => setEditForm((current) => ({ ...current, zipCode: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Total units</FieldLabel><Input type="number" value={editForm.totalUnits} onChange={(event) => setEditForm((current) => ({ ...current, totalUnits: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Total floors</FieldLabel><Input type="number" value={editForm.totalFloors} onChange={(event) => setEditForm((current) => ({ ...current, totalFloors: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Amenities</FieldLabel><Input value={editForm.amenities} onChange={(event) => setEditForm((current) => ({ ...current, amenities: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Images</FieldLabel><Input value={editForm.images} onChange={(event) => setEditForm((current) => ({ ...current, images: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Documents</FieldLabel><Input value={editForm.documents} onChange={(event) => setEditForm((current) => ({ ...current, documents: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Contact phone</FieldLabel><Input value={editForm.contactPhone} onChange={(event) => setEditForm((current) => ({ ...current, contactPhone: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Contact email</FieldLabel><Input value={editForm.contactEmail} onChange={(event) => setEditForm((current) => ({ ...current, contactEmail: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Description</FieldLabel><Textarea value={editForm.description} onChange={(event) => setEditForm((current) => ({ ...current, description: event.target.value ?? "" }))} /></Field>
              </FieldGroup>
              <Button type="submit" disabled={toggleProperty.isPending}>Update property</Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>

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
                    <Button type="button" variant="outline" size="sm" className="shadow-none" onClick={() => {
                      setSelectedProperty(property)
                      setIsPropertyDetailOpen(true)
                    }}>
                      <Eye className="size-4" />
                      Details
                    </Button>
                    <Button type="button" variant="outline" size="sm" className="shadow-none" onClick={() => {
                      setSelectedProperty(property)
                      setEditForm({
                        name: property.name ?? "",
                        type: (property.type as typeof editForm.type) ?? "apartment",
                        street: property.address?.street ?? "",
                        city: property.address?.city ?? "",
                        state: property.address?.state ?? "",
                        country: property.address?.country ?? "",
                        zipCode: property.address?.zipCode ?? "",
                        totalUnits: String(property.totalUnits ?? ""),
                        totalFloors: String(property.totalFloors ?? ""),
                        description: property.description ?? "",
                        amenities: (property.amenities ?? []).join(", "),
                        images: (property.images ?? []).join(", "),
                        documents: (property.documents ?? []).join(", "),
                        contactPhone: property.contactPhone ?? "",
                        contactEmail: property.contactEmail ?? "",
                        isActive: property.isActive ?? true,
                      })
                      setIsPropertyEditOpen(true)
                    }}>
                      <Pencil className="size-4" />
                      Edit
                    </Button>
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
  const stripeSettings = useOrganizationStripeSettingsQuery()
  const defaultCurrency = stripeSettings.data?.defaultCurrency?.toUpperCase() ?? "USD"
  const propertyList = Array.isArray(properties.data) ? properties.data : []
  const unitList = Array.isArray(units.data) ? units.data : []
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isUnitDetailOpen, setIsUnitDetailOpen] = useState(false)
  const [isUnitEditOpen, setIsUnitEditOpen] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState<UnitItem | null>(null)
  const [extraChargeTemplates, setExtraChargeTemplates] = useState<ExtraChargeTemplateFormItem[]>([
    { title: "", amount: "", frequency: "monthly" },
  ])
  const [editExtraChargeTemplates, setEditExtraChargeTemplates] = useState<ExtraChargeTemplateFormItem[]>([
    { title: "", amount: "", frequency: "monthly" },
  ])
  const [form, setForm] = useState({
    propertyId: "",
    unitNumber: "",
    floor: "",
    type: "",
    status: "vacant",
    monthlyRent: "",
    area: "",
  })
  const [editForm, setEditForm] = useState({
    propertyId: "",
    unitNumber: "",
    floor: "",
    type: "",
    status: "vacant",
    monthlyRent: "",
    area: "",
    isActive: true,
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
                    extraChargeTemplates: mapExtraChargeTemplatesFromForm(extraChargeTemplates),
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
                      setExtraChargeTemplates([{ title: "", amount: "", frequency: "monthly" }])
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
                <ExtraChargeTemplateFields items={extraChargeTemplates} setItems={setExtraChargeTemplates} />
              </FieldGroup>
              <Button type="submit" disabled={createUnit.isPending || !form.propertyId}>Save unit</Button>
            </form>
        </CreateSheet>
      </div>

      <Sheet open={isUnitDetailOpen} onOpenChange={setIsUnitDetailOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:!w-[50vw] sm:!max-w-[50vw]">
          <SheetHeader>
            <SheetTitle>Unit {selectedUnit?.unitNumber ?? ""}</SheetTitle>
            <SheetDescription>Full unit details and extra charge templates.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4 pb-6">
            <AuditStamp item={selectedUnit ?? undefined} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Status</p><p className="mt-1 font-medium text-slate-950">{selectedUnit?.status ?? "N/A"}</p></div>
              <div className="rounded-xl border p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Rent</p><p className="mt-1 font-medium text-slate-950">{formatMoney(selectedUnit?.monthlyRent, defaultCurrency)}</p></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Floor</p><p className="mt-1 font-medium text-slate-950">{selectedUnit?.floor ?? "N/A"}</p></div>
              <div className="rounded-xl border p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Type</p><p className="mt-1 font-medium text-slate-950">{selectedUnit?.type ?? "N/A"}</p></div>
              <div className="rounded-xl border p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Area</p><p className="mt-1 font-medium text-slate-950">{selectedUnit?.area ?? "N/A"}</p></div>
            </div>
            <div className="rounded-xl border p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Extra charge templates</p>
              <div className="mt-3 space-y-2">
                {(selectedUnit?.extraChargeTemplates ?? []).length ? (selectedUnit?.extraChargeTemplates ?? []).map((charge, index) => (
                  <div key={`${charge.title}-${index}`} className="rounded-xl border bg-slate-50 p-3 text-sm">
                    <p className="font-medium text-slate-950">{charge.title}</p>
                    <p className="mt-1 text-slate-600">{formatMoney(charge.amount, defaultCurrency)} / {charge.frequency ?? "monthly"}</p>
                  </div>
                )) : <span className="text-xs text-slate-500">No extra charge templates</span>}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={isUnitEditOpen} onOpenChange={setIsUnitEditOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:!w-[50vw] sm:!max-w-[50vw]">
          <SheetHeader>
            <SheetTitle>Edit unit</SheetTitle>
            <SheetDescription>Update unit data and charge templates.</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault()
                if (!selectedUnit?._id) return
                toggleUnit.mutate(
                  {
                    id: selectedUnit._id,
                    payload: {
                      propertyId: editForm.propertyId,
                      unitNumber: editForm.unitNumber,
                      floor: Number(editForm.floor || "0") || undefined,
                      type: editForm.type || undefined,
                      status: editForm.status as "vacant" | "occupied" | "maintenance" | "reserved",
                      monthlyRent: Number(editForm.monthlyRent || "0") || undefined,
                      area: Number(editForm.area || "0") || undefined,
                      isActive: editForm.isActive,
                      extraChargeTemplates: mapExtraChargeTemplatesFromForm(editExtraChargeTemplates),
                    },
                  },
                  {
                    onSuccess: () => {
                      setIsUnitEditOpen(false)
                    },
                  }
                )
              }}
            >
              <FieldGroup>
                <Field><FieldLabel>Property</FieldLabel><Select value={editForm.propertyId} onValueChange={(value) => setEditForm((current) => ({ ...current, propertyId: value ?? "" }))}><SelectTrigger className="w-full"><SelectValue placeholder="Select property" /></SelectTrigger><SelectContent><SelectGroup>{propertyList.map((property) => <SelectItem key={property._id} value={property._id}>{property.name}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
                <Field><FieldLabel>Unit number</FieldLabel><Input value={editForm.unitNumber} onChange={(event) => setEditForm((current) => ({ ...current, unitNumber: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Status</FieldLabel><Select value={editForm.status} onValueChange={(value) => setEditForm((current) => ({ ...current, status: value ?? "vacant" }))}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{["vacant", "occupied", "maintenance", "reserved"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
                <Field><FieldLabel>Floor</FieldLabel><Input type="number" value={editForm.floor} onChange={(event) => setEditForm((current) => ({ ...current, floor: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Monthly rent</FieldLabel><Input type="number" value={editForm.monthlyRent} onChange={(event) => setEditForm((current) => ({ ...current, monthlyRent: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Area</FieldLabel><Input type="number" value={editForm.area} onChange={(event) => setEditForm((current) => ({ ...current, area: event.target.value ?? "" }))} /></Field>
                <ExtraChargeTemplateFields items={editExtraChargeTemplates} setItems={setEditExtraChargeTemplates} />
              </FieldGroup>
              <Button type="submit" disabled={toggleUnit.isPending || !editForm.propertyId}>Update unit</Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>

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
                    <p className="text-xs text-slate-600">{unit.status} - rent {formatMoney(unit.monthlyRent, defaultCurrency)}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(unit.extraChargeTemplates ?? []).length ? unit.extraChargeTemplates?.map((charge) => (
                        <Badge key={`${unit._id}-${charge.title}`} variant="secondary">{charge.title}: {formatMoney(charge.amount, defaultCurrency)} / {charge.frequency ?? "monthly"}</Badge>
                      )) : <span className="text-xs text-slate-500">No extra charge templates</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" className="shadow-none" onClick={() => {
                      setSelectedUnit(unit)
                      setIsUnitDetailOpen(true)
                    }}>
                      <Eye className="size-4" />
                      Details
                    </Button>
                    <Button type="button" variant="outline" size="sm" className="shadow-none" onClick={() => {
                      setSelectedUnit(unit)
                      setEditForm({
                        propertyId: unit.propertyId ?? "",
                        unitNumber: unit.unitNumber ?? "",
                        floor: String(unit.floor ?? ""),
                        type: unit.type ?? "",
                        status: unit.status ?? "vacant",
                        monthlyRent: String(unit.monthlyRent ?? ""),
                        area: String(unit.area ?? ""),
                        isActive: unit.isActive ?? true,
                      })
                      setEditExtraChargeTemplates(mapExtraChargeTemplatesToForm(unit.extraChargeTemplates))
                      setIsUnitEditOpen(true)
                    }}>
                      <Pencil className="size-4" />
                      Edit
                    </Button>
                    <Switch
                      checked={(unit as { isActive?: boolean }).isActive ?? false}
                      onCheckedChange={(checked) =>
                        toggleUnit.mutate({ id: unit._id, payload: { isActive: checked ?? false } })
                      }
                    />
                    <Button variant="outline" size="sm" className="shadow-none" onClick={() => deleteUnit.mutate(unit._id)}>
                      <Trash2 className="size-4" />
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
  const searchParams = useSearchParams()
  const properties = useOwnerPropertiesQuery()
  const users = useOwnerUsersQuery()
  const tenants = useOwnerTenantsQuery()
  const createRequest = useOwnerCreateAssignmentRequestMutation()
  const propertyList = Array.isArray(properties.data) ? properties.data : []
  const userList = Array.isArray(users.data) ? users.data : []
  const tenantList = Array.isArray(tenants.data) ? tenants.data : []
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [search, setSearch] = useState(searchParams.get("search") ?? "")
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([])
  const [singlePropertyId, setSinglePropertyId] = useState("")
  const [selectedUserId, setSelectedUserId] = useState("")
  const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false)
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
  const selectedUser = userList.find((user) => user.id === selectedUserId) ?? null
  const selectedUserTenant = tenantList.find((tenant) => tenant.userId === selectedUserId) ?? null
  const selectedUserOwnerName = selectedUser?.activeOwnerId
    ? userList.find((user) => user.id === selectedUser.activeOwnerId)?.fullName ?? "Linked owner"
    : "No active owner"
  const selectedUserPropertyName = selectedUser?.activePropertyId
    ? propertyList.find((property) => property._id === selectedUser.activePropertyId)?.name ?? "Linked property"
    : "No active property"

  return (
    <div className="space-y-6">
      <OwnerPageHero
        icon={UserPlus}
        badge="Access"
        title="Users"
        body="Signed-up renter, guest, or worker accounts appear here. Owner sends request first. After user accepts, the property link becomes active."
      />
      <Card className="shadow-none">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
          <div>
            <p className="font-medium text-slate-950">Need add another owner?</p>
            <p className="text-sm text-slate-600">Open Owner Team page for `co_owner` or `manager` account creation.</p>
          </div>
          <a href="/dashboard/tenant-owner/team" className="inline-flex items-center rounded-lg border px-3 py-2 text-sm text-slate-700">
            Open owner team
          </a>
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <CreateSheet
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          title="Find and request user"
          description="Search signed-up account by email or name, send request, then wait for user acceptance."
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
                  {(() => {
                    const linkedTenant = tenantList.find((tenant) => tenant.userId === user.id)
                    return (
                      <>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-slate-950">{user.fullName}</p>
                      <Badge variant="outline">{user.role}</Badge>
                      <Badge variant="secondary">{user.organizationIds?.length ?? 0} org links</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="gap-2 shadow-none"
                        onClick={() => {
                          setSelectedUserId(user.id)
                          setIsUserDetailsOpen(true)
                        }}
                      >
                        <Eye className="size-4" />
                        Details
                      </Button>
                      {linkedTenant ? <a href={`/dashboard/tenant-owner/tenants?search=${encodeURIComponent(user.email)}`} className="inline-flex items-center rounded-lg border px-3 py-2 text-xs text-slate-700">Tenant record</a> : null}
                      {linkedTenant ? <a href={`/dashboard/tenant-owner/billing?tenantId=${linkedTenant._id}`} className="inline-flex items-center rounded-lg border px-3 py-2 text-xs text-slate-700">Billing history</a> : null}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">{linkedTenant ? <Badge>{linkedTenant.tenantKind ?? "tenant"}</Badge> : null}</div>
                  <p className="mt-2 text-sm text-slate-600">{user.email}</p>
                      </>
                    )
                  })()}
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
        <Sheet open={isUserDetailsOpen} onOpenChange={setIsUserDetailsOpen}>
          <SheetContent side="right" className="w-full overflow-y-auto sm:!w-[50vw] sm:!max-w-[50vw]">
            <SheetHeader>
              <SheetTitle>User details</SheetTitle>
              <SheetDescription>Quick user info plus direct tenant and billing jump links.</SheetDescription>
            </SheetHeader>
            {selectedUser ? (
              <div className="space-y-4 px-4 pb-6">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Name</p><p className="mt-1 font-medium text-slate-950">{selectedUser.fullName}</p></div>
                  <div className="rounded-xl border p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Role</p><p className="mt-1 font-medium text-slate-950">{selectedUser.role}</p></div>
                  <div className="rounded-xl border p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Email</p><p className="mt-1 font-medium text-slate-950">{selectedUser.email}</p></div>
                  <div className="rounded-xl border p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Phone</p><p className="mt-1 font-medium text-slate-950">{selectedUser.phoneNumber}</p></div>
                  <div className="rounded-xl border p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Owner link</p><p className="mt-1 font-medium text-slate-950">{selectedUserOwnerName}</p></div>
                  <div className="rounded-xl border p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Property link</p><p className="mt-1 font-medium text-slate-950">{selectedUserPropertyName}</p></div>
                </div>
                {selectedUserTenant ? (
                  <div className="rounded-xl border p-4">
                    <p className="text-sm font-medium text-slate-950">Linked tenant record</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a href={`/dashboard/tenant-owner/tenants?search=${encodeURIComponent(selectedUser.email)}`} className="inline-flex items-center rounded-lg border px-3 py-2 text-sm text-slate-700">Open tenant page</a>
                      <a href={`/dashboard/tenant-owner/billing?tenantId=${selectedUserTenant._id}`} className="inline-flex items-center rounded-lg border px-3 py-2 text-sm text-slate-700">Open billing page</a>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed p-4 text-sm text-slate-500">No tenant record linked yet.</div>
                )}
              </div>
            ) : null}
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}

export function TenantOwnerTeamPage() {
  const { data: me } = useMeQuery()
  const users = useOwnerUsersQuery()
  const createUser = useOwnerCreateUserMutation()
  const canManageOwnerTeam =
    me?.role === "tetentwoner" &&
    (me.canManageOwnerTeam || !me.ownerProfileType || me.ownerProfileType === "primary_owner")
  const ownerTeam = (Array.isArray(users.data) ? users.data : []).filter((user) => user.role === "tetentwoner")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    jobTitle: "",
    ownerProfileType: "manager" as "co_owner" | "manager",
  })

  return (
    <div className="space-y-6">
      <OwnerPageHero
        icon={Shield}
        badge="Owner Team"
        title="Co-owner and manager access"
        body="Primary tenant owner can create delegated co-owner or manager accounts. They see same owner dashboard. Only primary owner can add this team."
      />
      <Card className="shadow-none">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
          <div className="space-y-2">
            <p className="font-medium text-slate-950">Add new owner from this page</p>
            <p className="text-sm text-slate-600">Path: `/dashboard/tenant-owner/team`. Create `co_owner` or `manager` under same organization.</p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{me?.ownerProfileType ?? "primary_owner"}</Badge>
              {canManageOwnerTeam ? <Badge>can add owner team</Badge> : <Badge variant="secondary">view only</Badge>}
            </div>
          </div>
          {canManageOwnerTeam ? (
            <CreateSheet
              open={isCreateOpen}
              onOpenChange={setIsCreateOpen}
              title="Add owner team member"
              description="Create delegated owner access under same organization."
              triggerLabel="Add co-owner / manager"
            >
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault()
                  createUser.mutate(
                    {
                      fullName: form.fullName,
                      email: form.email,
                      phoneNumber: form.phoneNumber,
                      password: form.password,
                      jobTitle: form.jobTitle || undefined,
                      role: "tetentwoner",
                      ownerProfileType: form.ownerProfileType,
                    },
                    {
                      onSuccess: () => {
                        setForm({
                          fullName: "",
                          email: "",
                          phoneNumber: "",
                          password: "",
                          jobTitle: "",
                          ownerProfileType: "manager",
                        })
                        setIsCreateOpen(false)
                      },
                    }
                  )
                }}
              >
                <FieldGroup>
                  <Field><FieldLabel>Access type</FieldLabel><Select value={form.ownerProfileType} onValueChange={(value) => setForm((current) => ({ ...current, ownerProfileType: (value ?? "manager") as "co_owner" | "manager" }))}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="co_owner">co_owner</SelectItem><SelectItem value="manager">manager</SelectItem></SelectGroup></SelectContent></Select></Field>
                  <Field><FieldLabel>Full name</FieldLabel><Input value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value ?? "" }))} /></Field>
                  <Field><FieldLabel>Email</FieldLabel><Input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value ?? "" }))} /></Field>
                  <Field><FieldLabel>Phone</FieldLabel><Input value={form.phoneNumber} onChange={(event) => setForm((current) => ({ ...current, phoneNumber: event.target.value ?? "" }))} /></Field>
                  <Field><FieldLabel>Job title</FieldLabel><Input value={form.jobTitle} onChange={(event) => setForm((current) => ({ ...current, jobTitle: event.target.value ?? "" }))} /></Field>
                  <Field><FieldLabel>Password</FieldLabel><Input type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value ?? "" }))} /></Field>
                </FieldGroup>
                <Button type="submit" disabled={createUser.isPending || !form.fullName || !form.email || !form.phoneNumber || !form.password}>
                  Create team member
                </Button>
              </form>
            </CreateSheet>
          ) : null}
        </CardContent>
      </Card>

      {!canManageOwnerTeam ? (
        <Card className="shadow-none">
          <CardContent className="pt-6 text-sm text-slate-600">
            Only primary tenant owner can add co-owner or manager accounts.
          </CardContent>
        </Card>
      ) : null}

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Owner team</CardTitle>
          <CardDescription>Delegated owner users keep full owner dashboard visibility.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {ownerTeam.length ? ownerTeam.map((user) => (
            <div key={user.id} className="rounded-xl border p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-slate-950">{user.fullName}</p>
                    <Badge variant="outline">{user.ownerProfileType ?? "primary_owner"}</Badge>
                    {user.canManageOwnerTeam ? <Badge>primary access</Badge> : <Badge variant="secondary">delegated</Badge>}
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{user.email}</p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p>{user.jobTitle ?? "No title"}</p>
                  <p>{user.phoneNumber}</p>
                </div>
              </div>
            </div>
          )) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><Shield /></EmptyMedia>
                <EmptyTitle>No owner team yet</EmptyTitle>
                <EmptyDescription>Create co-owner or manager from this page.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function TenantOwnerTenantsPage() {
  const searchParams = useSearchParams()
  const properties = useOwnerPropertiesQuery()
  const units = useOwnerUnitsQuery()
  const users = useOwnerUsersQuery()
  const bills = useOwnerBillsQuery()
  const stripeSettings = useOrganizationStripeSettingsQuery()
  const [paymentMonth, setPaymentMonth] = useState(new Date().toISOString().slice(0, 7))
  const [search, setSearch] = useState(searchParams.get("search") ?? "")
  const [propertyFilter, setPropertyFilter] = useState("")
  const [kindFilter, setKindFilter] = useState<"all" | "renter" | "guest">("all")
  const [paymentFilter, setPaymentFilter] = useState<"all" | "paid" | "unpaid">("all")
  const tenants = useOwnerTenantsQuery({
    search: search || undefined,
    propertyId: propertyFilter || undefined,
    tenantKind: kindFilter === "all" ? undefined : kindFilter,
    paymentMonth: paymentMonth || undefined,
    paidThisMonth: paymentFilter === "all" ? undefined : paymentFilter === "paid",
  })
  const createTenant = useOwnerCreateTenantMutation()
  const createBill = useOwnerCreateBillMutation()
  const recordPayment = useOwnerRecordTenantPaymentMutation()
  const updateTenant = useOwnerUpdateTenantMutation()
  const toggleTenant = useOwnerToggleTenantMutation()
  const deleteTenant = useOwnerDeleteTenantMutation()
  const updateBill = useOwnerUpdateBillMutation()
  const propertyList = Array.isArray(properties.data) ? properties.data : []
  const unitList = Array.isArray(units.data) ? units.data : []
  const userList = Array.isArray(users.data) ? users.data : []
  const tenantList = Array.isArray(tenants.data) ? tenants.data : []
  const billList = Array.isArray(bills.data) ? bills.data : []
  const defaultCurrency = stripeSettings.data?.defaultCurrency?.toUpperCase() ?? "USD"
  const pageSize = 6
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isBillOpen, setIsBillOpen] = useState(false)
  const [selectedTenantId, setSelectedTenantId] = useState("")
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [billFiles, setBillFiles] = useState<string[]>([])
  const [linkedUserSearch, setLinkedUserSearch] = useState("")
  const [selectedLinkedUser, setSelectedLinkedUser] = useState<AuthUser | null>(null)
  const [form, setForm] = useState({
    tenantKind: "renter",
    propertyId: "",
    unitId: "",
    userId: "",
    fullName: "",
    email: "",
    phone: "",
    monthlyRent: "",
    rentDueDay: "",
    oneTimeGuestFee: "",
  })
  const [billForm, setBillForm] = useState({
    tenantId: "",
    kind: "extra",
    title: "",
    description: "",
    amount: "",
    dueDate: "",
    monthKey: new Date().toISOString().slice(0, 7),
    note: "",
  })
  const [editForm, setEditForm] = useState({
    tenantKind: "renter",
    propertyId: "",
    unitId: "",
    fullName: "",
    email: "",
    phone: "",
    monthlyRent: "",
    rentDueDay: "",
    oneTimeGuestFee: "",
    address: "",
    notes: "",
    leaseStart: "",
    leaseEnd: "",
    movedInAt: "",
    movedOutAt: "",
    isActive: true,
  })
  const [paymentForm, setPaymentForm] = useState({
    monthKey: new Date().toISOString().slice(0, 7),
    amount: "",
    status: "paid",
    paidAt: toDateInputValue(new Date()),
    dueDate: "",
    paymentMethod: "",
    note: "",
  })
  const linkedUserResults = useOwnerUserSearchQuery(
    linkedUserSearch,
    form.tenantKind as "renter" | "guest"
  )
  const selectedTenant = tenantList.find((tenant) => tenant._id === selectedTenantId) ?? null

  const hydrateEditForm = (tenant: TenantItem) => {
    setEditForm({
      tenantKind: tenant.tenantKind ?? "renter",
      propertyId: tenant.propertyId ?? "",
      unitId: tenant.unitId ?? "",
      fullName: tenant.fullName ?? "",
      email: tenant.email ?? "",
      phone: tenant.phone ?? tenant.phoneNumber ?? "",
      monthlyRent: tenant.monthlyRent != null ? String(tenant.monthlyRent) : "",
      rentDueDay: tenant.rentDueDay != null ? String(tenant.rentDueDay) : "",
      oneTimeGuestFee: tenant.oneTimeGuestFee != null ? String(tenant.oneTimeGuestFee) : "",
      address: tenant.address ?? "",
      notes: tenant.notes ?? "",
      leaseStart: toDateInputValue(tenant.leaseStart),
      leaseEnd: toDateInputValue(tenant.leaseEnd),
      movedInAt: toDateInputValue(tenant.movedInAt),
      movedOutAt: toDateInputValue(tenant.movedOutAt),
      isActive: tenant.isActive ?? true,
    })
  }

  const hydratePaymentForm = (tenant: TenantItem) => {
    const activePayment = tenant.paymentRecords?.find((item) => item.monthKey === paymentMonth)
    const expectedAmount = tenant.tenantKind === "guest"
      ? tenant.oneTimeGuestFee ?? 0
      : tenant.monthlyRent ?? 0

    setPaymentForm({
      monthKey: paymentMonth,
      amount: String(activePayment?.amount ?? expectedAmount ?? ""),
      status: activePayment?.status ?? "paid",
      paidAt: toDateInputValue(activePayment?.paidAt ?? new Date()),
      dueDate: toDateInputValue(activePayment?.dueDate) || buildMonthDueDate(paymentMonth, tenant.rentDueDay),
      paymentMethod: activePayment?.paymentMethod ?? "",
      note: activePayment?.note ?? "",
    })
  }

  const monthStats = useMemo(
    () =>
      tenantList.reduce(
        (acc, tenant) => {
          const payment = tenant.paymentRecords?.find((item) => item.monthKey === paymentMonth)
          const isPaid =
            payment?.status === "paid" ||
            (tenant.tenantKind === "guest" && (tenant.guestFeePaid ?? false))

          if (isPaid) acc.paid += 1
          else acc.unpaid += 1

          return acc
        },
        { paid: 0, unpaid: 0 }
      ),
    [paymentMonth, tenantList]
  )

  const totalPages = Math.max(1, Math.ceil(tenantList.length / pageSize))
  const paginatedTenants = tenantList.slice((page - 1) * pageSize, page * pageSize)

  useEffect(() => {
    setPage(1)
  }, [search, propertyFilter, kindFilter, paymentFilter, paymentMonth])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  return (
    <div className="space-y-6">
      <OwnerPageHero
        icon={Shield}
        badge="Residents"
        title="Tenant records"
        body="Track renters and guests with direct property dropdowns, linked user accounts, payment month filters, and due follow-up."
      />
      <div className="flex flex-wrap justify-end gap-2">
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
              const linkedUser = selectedLinkedUser ?? linkedUserResults.data?.find((user) => user.id === form.userId) ?? null
              createTenant.mutate(
                {
                  tenantKind: form.tenantKind as "renter" | "guest",
                  propertyId: form.propertyId,
                  unitId: form.unitId || undefined,
                  userId: form.userId || undefined,
                  fullName: form.fullName || linkedUser?.fullName || "",
                  email: form.email || linkedUser?.email || "",
                  phone: form.phone || linkedUser?.phoneNumber || "",
                  monthlyRent: Number(form.monthlyRent || "0") || undefined,
                  rentDueDay: Number(form.rentDueDay || "0") || undefined,
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
                      rentDueDay: "",
                      oneTimeGuestFee: "",
                    })
                    setSelectedLinkedUser(null)
                    setLinkedUserSearch("")
                    setIsCreateOpen(false)
                  },
                }
              )
            }}
          >
            <FieldGroup>
              <Field><FieldLabel>Kind</FieldLabel><Select value={form.tenantKind} onValueChange={(value) => setForm((current) => ({ ...current, tenantKind: value ?? "renter" }))}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{["renter", "guest"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
              <Field><FieldLabel>Property</FieldLabel><Select value={form.propertyId} onValueChange={(value) => setForm((current) => ({ ...current, propertyId: value ?? "" }))}><SelectTrigger className="w-full"><SelectValue placeholder="Select property" /></SelectTrigger><SelectContent><SelectGroup>{propertyList.map((property) => <SelectItem key={property._id} value={property._id}>{property.name}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
              <Field><FieldLabel>Unit (Optional)</FieldLabel><Select value={form.unitId} onValueChange={(value) => {
                const nextUnit = unitList.find((unit) => unit._id === (value ?? ""))
                setForm((current) => ({ ...current, unitId: value ?? "", monthlyRent: current.tenantKind === "renter" ? String(nextUnit?.monthlyRent ?? current.monthlyRent ?? "") : current.monthlyRent }))
              }}><SelectTrigger className="w-full"><SelectValue placeholder="Select unit" /></SelectTrigger><SelectContent><SelectGroup>{unitList.map((unit) => <SelectItem key={unit._id} value={unit._id}>{unit.unitNumber}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
              <Field>
                <FieldLabel>Search linked user (Optional)</FieldLabel>
                <Input
                  placeholder="Search signed-up renter/guest by email or name"
                  value={linkedUserSearch}
                  onChange={(event) => setLinkedUserSearch(event.target.value ?? "")}
                />
                <FieldDescription>This links an existing signed-up renter/guest account.</FieldDescription>
              </Field>
              <Field>
                <FieldLabel>Linked user (Optional)</FieldLabel>
                <Select
                  value={form.userId}
                  onValueChange={(value) => {
                    const selectedUser = linkedUserResults.data?.find((user) => user.id === (value ?? ""))
                    setSelectedLinkedUser(selectedUser ?? null)
                    setForm((current) => ({
                      ...current,
                      userId: value ?? "",
                      fullName: selectedUser?.fullName ?? current.fullName,
                      email: selectedUser?.email ?? current.email,
                      phone: selectedUser?.phoneNumber ?? current.phone,
                    }))
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select signed-up resident" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {(linkedUserResults.data ?? []).map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.fullName} - {user.email}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              {linkedUserSearch.trim().length >= 2 ? (
                <div className="space-y-2">
                  {linkedUserResults.data?.length ? linkedUserResults.data.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      className="w-full rounded-xl border p-3 text-left"
                      onClick={() => {
                        setSelectedLinkedUser(user)
                        setForm((current) => ({
                          ...current,
                          userId: user.id,
                          fullName: user.fullName ?? current.fullName,
                          email: user.email ?? current.email,
                          phone: user.phoneNumber ?? current.phone,
                        }))
                      }}
                    >
                      <p className="font-medium text-slate-950">{user.fullName}</p>
                      <p className="text-sm text-slate-600">{user.email}</p>
                    </button>
                  )) : !linkedUserResults.isLoading ? (
                    <div className="rounded-xl border border-dashed p-3 text-sm text-slate-500">
                      No signed-up {form.tenantKind} found by that search.
                    </div>
                  ) : null}
                </div>
              ) : null}
              <Field><FieldLabel>Full name</FieldLabel><Input placeholder="Resident full name" value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value ?? "" }))} /></Field>
              <Field><FieldLabel>Email</FieldLabel><Input type="email" placeholder="resident@email.com" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value ?? "" }))} /></Field>
              <Field><FieldLabel>Phone</FieldLabel><Input placeholder="01XXXXXXXXX" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value ?? "" }))} /></Field>
              {form.tenantKind === "renter" ? (
                <>
                  <Field><FieldLabel>Monthly rent</FieldLabel><Input type="number" placeholder="Monthly rent amount" value={form.monthlyRent} onChange={(event) => setForm((current) => ({ ...current, monthlyRent: event.target.value ?? "" }))} /></Field>
                  <Field><FieldLabel>Rent due day each month</FieldLabel><Input type="number" min="1" max="31" placeholder="5" value={form.rentDueDay} onChange={(event) => setForm((current) => ({ ...current, rentDueDay: event.target.value ?? "" }))} /><FieldDescription>Set once. Example: `5` means rent due every month on day 5.</FieldDescription></Field>
                </>
              ) : (
                <Field><FieldLabel>One-time guest fee</FieldLabel><Input type="number" placeholder="One-time guest fee" value={form.oneTimeGuestFee} onChange={(event) => setForm((current) => ({ ...current, oneTimeGuestFee: event.target.value ?? "" }))} /></Field>
              )}
            </FieldGroup>
            <Button type="submit" disabled={createTenant.isPending || !form.propertyId}>Create tenant record</Button>
          </form>
        </CreateSheet>
        <CreateSheet
          open={isBillOpen}
          onOpenChange={setIsBillOpen}
          title="Send bill"
          description="Send rent, utility, guest fee, or extra expense with document."
          triggerLabel="Send bill"
        >
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              const selectedTenant = tenantList.find((item) => item._id === billForm.tenantId)
              if (!selectedTenant) return
              createBill.mutate({
                tenantId: selectedTenant._id,
                propertyId: selectedTenant.propertyId ?? "",
                unitId: selectedTenant.unitId ?? undefined,
                kind: billForm.kind as "rent" | "extra" | "utility" | "guest_fee" | "custom",
                title: billForm.title,
                description: billForm.description || undefined,
                amount: Number(billForm.amount || "0"),
                dueDate: billForm.dueDate || undefined,
                monthKey: billForm.monthKey || undefined,
                attachments: billFiles,
                note: billForm.note || undefined,
              }, {
                onSuccess: () => {
                  setBillForm({
                    tenantId: "",
                    kind: "extra",
                    title: "",
                    description: "",
                    amount: "",
                    dueDate: "",
                    monthKey: new Date().toISOString().slice(0, 7),
                    note: "",
                  })
                  setBillFiles([])
                  setIsBillOpen(false)
                },
              })
            }}
          >
            <FieldGroup>
              <Field><FieldLabel>Resident</FieldLabel><Select value={billForm.tenantId} onValueChange={(value) => setBillForm((current) => ({ ...current, tenantId: value ?? "" }))}><SelectTrigger className="w-full"><SelectValue placeholder="Select resident" /></SelectTrigger><SelectContent><SelectGroup>{tenantList.map((tenant) => <SelectItem key={tenant._id} value={tenant._id}>{tenant.fullName}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
              <Field><FieldLabel>Bill kind</FieldLabel><Select value={billForm.kind} onValueChange={(value) => setBillForm((current) => ({ ...current, kind: value ?? "extra" }))}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{["rent", "utility", "extra", "guest_fee", "custom"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
              <Field><FieldLabel>Title</FieldLabel><Input value={billForm.title} onChange={(event) => setBillForm((current) => ({ ...current, title: event.target.value ?? "" }))} /></Field>
              <Field><FieldLabel>Amount</FieldLabel><Input type="number" value={billForm.amount} onChange={(event) => setBillForm((current) => ({ ...current, amount: event.target.value ?? "" }))} /></Field>
              <Field><FieldLabel>Month key (Optional)</FieldLabel><Input type="month" value={billForm.monthKey} onChange={(event) => setBillForm((current) => ({ ...current, monthKey: event.target.value ?? "" }))} /></Field>
              <Field><FieldLabel>Due date (Optional)</FieldLabel><Input type="date" value={billForm.dueDate} onChange={(event) => setBillForm((current) => ({ ...current, dueDate: event.target.value ?? "" }))} /></Field>
              <Field><FieldLabel>Description (Optional)</FieldLabel><Textarea value={billForm.description} onChange={(event) => setBillForm((current) => ({ ...current, description: event.target.value ?? "" }))} /></Field>
              <Field><FieldLabel>Note (Optional)</FieldLabel><Textarea value={billForm.note} onChange={(event) => setBillForm((current) => ({ ...current, note: event.target.value ?? "" }))} /></Field>
              <UploadCollectionField label="Bill file" accept=".pdf,.doc,.docx,.xls,.xlsx,image/*" kind="file" values={billFiles} onChange={setBillFiles} />
            </FieldGroup>
            <Button type="submit" disabled={createBill.isPending || !billForm.tenantId || !billForm.title || !billForm.amount}>Send bill</Button>
          </form>
        </CreateSheet>
      </div>

      <div className="grid gap-4">
        <WithBone name="owner-page-tenants" loading={tenants.isLoading} fallback={<DashboardTableSkeleton />}>
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Tenant list</CardTitle>
              <CardDescription>See who paid, who is due, which month, and exact payment dates.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <Field>
                  <FieldLabel>Search</FieldLabel>
                  <Input placeholder="Name, email, phone" value={search} onChange={(event) => setSearch(event.target.value ?? "")} />
                </Field>
                <Field>
                  <FieldLabel>Property</FieldLabel>
                  <Select value={propertyFilter || "__all__"} onValueChange={(value) => setPropertyFilter(value === "__all__" ? "" : (value ?? ""))}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="All properties" /></SelectTrigger>
                    <SelectContent><SelectGroup><SelectItem value="__all__">All properties</SelectItem>{propertyList.map((property) => <SelectItem key={property._id} value={property._id}>{property.name}</SelectItem>)}</SelectGroup></SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Resident type</FieldLabel>
                  <Select value={kindFilter} onValueChange={(value) => setKindFilter((value ?? "all") as "all" | "renter" | "guest")}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectGroup>{["all", "renter", "guest"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectGroup></SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Payment month</FieldLabel>
                  <Input type="month" value={paymentMonth} onChange={(event) => setPaymentMonth(event.target.value ?? "")} />
                </Field>
                <Field>
                  <FieldLabel>Month status</FieldLabel>
                  <Select value={paymentFilter} onValueChange={(value) => setPaymentFilter((value ?? "all") as "all" | "paid" | "unpaid")}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectGroup>{["all", "paid", "unpaid"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectGroup></SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Total in view</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">{tenantList.length}</p>
                </div>
                <div className="rounded-xl border bg-emerald-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-emerald-700">Paid in {paymentMonth}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">{monthStats.paid}</p>
                </div>
                <div className="rounded-xl border bg-amber-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-amber-700">Due / unpaid in {paymentMonth}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">{monthStats.unpaid}</p>
                </div>
              </div>
              <div className="rounded-xl border bg-blue-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="size-4 text-blue-700" />
                    <p className="text-sm font-medium text-slate-950">Bill sending live</p>
                  </div>
                  <Badge variant="secondary">{billList.length} recent bills</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-600">Send extra expense or utility bill with attachment straight to renter or guest dashboard.</p>
              </div>

              {tenantList.length ? (
                <>
                  <div className="space-y-3">
                    {paginatedTenants.map((tenant) => {
                      const tenantBills = billList.filter((bill) => bill.tenantId === tenant._id)
                      const activePayment = tenant.paymentRecords?.find((item) => item.monthKey === paymentMonth)
                      const expectedAmount =
                        tenant.tenantKind === "renter"
                          ? tenant.monthlyRent ?? 0
                          : tenant.oneTimeGuestFee ?? 0
                      const paymentStatus =
                        activePayment?.status ??
                        (tenant.tenantKind === "guest" && (tenant.guestFeePaid ?? false) ? "paid" : "unpaid")
                      const propertyName = propertyList.find((property) => property._id === tenant.propertyId)?.name ?? "Unknown property"
                      const unitName = unitList.find((unit) => unit._id === tenant.unitId)?.unitNumber ?? "No unit"

                      return (
                        <div key={tenant._id} className="rounded-2xl border p-4">
                          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                            <div className="space-y-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-base font-semibold text-slate-950">{tenant.fullName}</p>
                                <Badge variant="outline">{tenant.tenantKind ?? "resident"}</Badge>
                                <Badge variant={tenant.isActive ? "default" : "secondary"}>{tenant.isActive ? "Active" : "Inactive"}</Badge>
                                <Badge variant={paymentStatus === "paid" ? "default" : paymentStatus === "pending" ? "secondary" : "outline"}>
                                  {paymentStatus}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-600">
                                {tenant.email ?? "No email"}
                                {tenant.phone ?? tenant.phoneNumber ? ` - ${tenant.phone ?? tenant.phoneNumber}` : ""}
                              </p>
                              <div className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-6">
                                <div className="rounded-xl bg-slate-50 p-3">
                                  <p className="text-xs uppercase tracking-wide text-slate-500">Property</p>
                                  <p className="mt-1 font-medium text-slate-950">{propertyName}</p>
                                </div>
                                <div className="rounded-xl bg-slate-50 p-3">
                                  <p className="text-xs uppercase tracking-wide text-slate-500">Unit</p>
                                  <p className="mt-1 font-medium text-slate-950">{unitName}</p>
                                </div>
                                <div className="rounded-xl bg-slate-50 p-3">
                                  <p className="text-xs uppercase tracking-wide text-slate-500">Expected</p>
                                  <p className="mt-1 font-medium text-slate-950">{formatMoney(expectedAmount, defaultCurrency)}</p>
                                </div>
                                <div className="rounded-xl bg-slate-50 p-3">
                                  <p className="text-xs uppercase tracking-wide text-slate-500">Due day</p>
                                  <p className="mt-1 font-medium text-slate-950">{tenant.rentDueDay ?? "Not set"}</p>
                                </div>
                                <div className="rounded-xl bg-slate-50 p-3">
                                  <p className="text-xs uppercase tracking-wide text-slate-500">Due date</p>
                                  <p className="mt-1 font-medium text-slate-950">{formatDateLabel(activePayment?.dueDate ?? buildMonthDueDate(paymentMonth, tenant.rentDueDay), "No due date")}</p>
                                </div>
                                <div className="rounded-xl bg-slate-50 p-3">
                                  <p className="text-xs uppercase tracking-wide text-slate-500">Payment date</p>
                                  <p className="mt-1 font-medium text-slate-950">{formatDateLabel(activePayment?.paidAt, "Not paid")}</p>
                                </div>
                                <div className="rounded-xl bg-slate-50 p-3">
                                  <p className="text-xs uppercase tracking-wide text-slate-500">Bills</p>
                                  <p className="mt-1 font-medium text-slate-950">{tenantBills.length}</p>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="gap-2 shadow-none"
                                onClick={() => {
                                  setSelectedTenantId(tenant._id)
                                  setIsDetailsOpen(true)
                                }}
                              >
                                <Eye className="size-4" />
                                Details
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="gap-2 shadow-none"
                                onClick={() => {
                                  setSelectedTenantId(tenant._id)
                                  hydrateEditForm(tenant)
                                  setIsEditOpen(true)
                                }}
                              >
                                <Pencil className="size-4" />
                                Edit
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                className="gap-2 bg-blue-700 text-white hover:bg-blue-800"
                                onClick={() => {
                                  setSelectedTenantId(tenant._id)
                                  hydratePaymentForm(tenant)
                                  setIsPaymentOpen(true)
                                }}
                              >
                                <CreditCard className="size-4" />
                                Set payment
                              </Button>
                              <div className="flex items-center gap-2 rounded-lg border px-3 py-1.5">
                                <Switch
                                  checked={tenant.isActive ?? false}
                                  onCheckedChange={(checked) =>
                                    toggleTenant.mutate({ id: tenant._id, payload: { isActive: checked ?? false } })
                                  }
                                />
                                <span className="text-xs text-slate-600">Active</span>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="gap-2 shadow-none"
                                onClick={() => deleteTenant.mutate(tenant._id)}
                              >
                                <Trash2 className="size-4" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-slate-50 px-4 py-3">
                    <p className="text-sm text-slate-600">
                      Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, tenantList.length)} of {tenantList.length}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button type="button" size="sm" variant="outline" className="shadow-none" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                        Previous
                      </Button>
                      <Badge variant="secondary">Page {page} / {totalPages}</Badge>
                      <Button type="button" size="sm" variant="outline" className="shadow-none" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
                        Next
                      </Button>
                    </div>
                  </div>

                  <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                    <SheetContent side="right" className="w-full overflow-y-auto sm:!w-[50vw] sm:!max-w-[50vw]">
                      <SheetHeader>
                        <SheetTitle>Tenant details</SheetTitle>
                        <SheetDescription>Full resident info, payment history, and sent bills.</SheetDescription>
                      </SheetHeader>
                      {selectedTenant ? (() => {
                        const tenantBills = billList.filter((bill) => bill.tenantId === selectedTenant._id)
                        const propertyName = propertyList.find((property) => property._id === selectedTenant.propertyId)?.name ?? "Unknown property"
                        const unitName = unitList.find((unit) => unit._id === selectedTenant.unitId)?.unitNumber ?? "No unit"
                        return (
                          <div className="space-y-4 px-4 pb-6">
                            <AuditStamp item={selectedTenant} />
                            <div className="grid gap-3 md:grid-cols-2">
                              <div className="rounded-xl border p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Name</p><p className="mt-1 font-medium text-slate-950">{selectedTenant.fullName}</p></div>
                              <div className="rounded-xl border p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Type</p><p className="mt-1 font-medium text-slate-950">{selectedTenant.tenantKind ?? "resident"}</p></div>
                              <div className="rounded-xl border p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Email</p><p className="mt-1 font-medium text-slate-950">{selectedTenant.email ?? "No email"}</p></div>
                              <div className="rounded-xl border p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Phone</p><p className="mt-1 font-medium text-slate-950">{selectedTenant.phone ?? selectedTenant.phoneNumber ?? "No phone"}</p></div>
                              <div className="rounded-xl border p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Property</p><p className="mt-1 font-medium text-slate-950">{propertyName}</p></div>
                              <div className="rounded-xl border p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Unit</p><p className="mt-1 font-medium text-slate-950">{unitName}</p></div>
                              <div className="rounded-xl border p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Rent / fee</p><p className="mt-1 font-medium text-slate-950">{formatMoney(selectedTenant.tenantKind === "guest" ? selectedTenant.oneTimeGuestFee : selectedTenant.monthlyRent, defaultCurrency)}</p></div>
                              <div className="rounded-xl border p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Deposit</p><p className="mt-1 font-medium text-slate-950">{formatMoney(selectedTenant.securityDeposit, defaultCurrency)}</p></div>
                              <div className="rounded-xl border p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Lease start</p><p className="mt-1 font-medium text-slate-950">{formatDateLabel(selectedTenant.leaseStart)}</p></div>
                              <div className="rounded-xl border p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Lease end</p><p className="mt-1 font-medium text-slate-950">{formatDateLabel(selectedTenant.leaseEnd)}</p></div>
                              <div className="rounded-xl border p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Rent due day</p><p className="mt-1 font-medium text-slate-950">{selectedTenant.rentDueDay ?? "Not set"}</p></div>
                              <div className="rounded-xl border p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Moved in</p><p className="mt-1 font-medium text-slate-950">{formatDateLabel(selectedTenant.movedInAt)}</p></div>
                              <div className="rounded-xl border p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Moved out</p><p className="mt-1 font-medium text-slate-950">{formatDateLabel(selectedTenant.movedOutAt)}</p></div>
                            </div>
                            <div className="rounded-xl border p-4">
                              <p className="text-xs uppercase tracking-wide text-slate-500">Address</p>
                              <p className="mt-1 text-sm text-slate-700">{selectedTenant.address ?? "No address"}</p>
                            </div>
                            <div className="rounded-xl border p-4">
                              <p className="text-xs uppercase tracking-wide text-slate-500">Notes</p>
                              <p className="mt-1 text-sm text-slate-700">{selectedTenant.notes ?? "No notes"}</p>
                            </div>
                            <div className="rounded-xl border p-4">
                              <div className="mb-3 flex items-center justify-between gap-2">
                                <p className="text-sm font-medium text-slate-950">Payment history</p>
                                <Badge variant="secondary">{selectedTenant.paymentRecords?.length ?? 0}</Badge>
                              </div>
                              {selectedTenant.paymentRecords?.length ? (
                                <div className="space-y-2">
                                  {[...(selectedTenant.paymentRecords ?? [])]
                                    .sort((left, right) => (right.monthKey ?? "").localeCompare(left.monthKey ?? ""))
                                    .map((record) => (
                                      <div key={`${selectedTenant._id}-${record.monthKey}`} className="grid gap-2 rounded-xl border p-3 text-sm md:grid-cols-5">
                                        <div><p className="text-xs uppercase tracking-wide text-slate-500">Month</p><p className="mt-1 font-medium text-slate-950">{record.monthKey}</p></div>
                                        <div><p className="text-xs uppercase tracking-wide text-slate-500">Status</p><p className="mt-1 font-medium text-slate-950">{record.status}</p></div>
                                        <div><p className="text-xs uppercase tracking-wide text-slate-500">Amount</p><p className="mt-1 font-medium text-slate-950">{formatMoney(record.amount, defaultCurrency)}</p></div>
                                        <div><p className="text-xs uppercase tracking-wide text-slate-500">Due date</p><p className="mt-1 font-medium text-slate-950">{formatDateLabel(record.dueDate, "No due date")}</p></div>
                                        <div><p className="text-xs uppercase tracking-wide text-slate-500">Paid date</p><p className="mt-1 font-medium text-slate-950">{formatDateLabel(record.paidAt, "Not paid")}</p></div>
                                      </div>
                                    ))}
                                </div>
                              ) : (
                                <p className="text-sm text-slate-500">No payment history yet.</p>
                              )}
                            </div>
                            <div className="rounded-xl border p-4">
                              <div className="mb-3 flex items-center justify-between gap-2">
                                <p className="text-sm font-medium text-slate-950">Bills sent</p>
                                <Badge variant="secondary">{tenantBills.length}</Badge>
                              </div>
                              {tenantBills.length ? (
                                <div className="space-y-2">
                                  {tenantBills.slice(0, 6).map((bill) => (
                                    <div key={bill._id} className="rounded-xl border p-3 text-sm">
                                      <div className="flex flex-wrap gap-2">
                                        <p className="font-medium text-slate-950">{bill.title}</p>
                                        <Badge variant="outline">{bill.kind}</Badge>
                                        <Badge>{bill.status}</Badge>
                                      </div>
                                      <p className="mt-2 text-slate-700">{formatMoney(bill.amount, bill.currency?.toUpperCase() ?? defaultCurrency)}</p>
                                      <p className="mt-1 text-xs text-slate-500">Due {formatDateLabel(bill.dueDate, "No due date")}</p>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-slate-500">No bills sent yet.</p>
                              )}
                            </div>
                          </div>
                        )
                      })() : null}
                    </SheetContent>
                  </Sheet>

                  <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <SheetContent side="right" className="w-full overflow-y-auto sm:!w-[50vw] sm:!max-w-[50vw]">
                      <SheetHeader>
                        <SheetTitle>Edit tenant</SheetTitle>
                        <SheetDescription>Update resident details, lease dates, and rent or fee.</SheetDescription>
                      </SheetHeader>
                      {selectedTenant ? (
                        <form
                          className="space-y-4 px-4 pb-6"
                          onSubmit={(event) => {
                            event.preventDefault()
                            updateTenant.mutate(
                              {
                                id: selectedTenant._id,
                                payload: {
                                  tenantKind: editForm.tenantKind as "renter" | "guest",
                                  propertyId: editForm.propertyId,
                                  unitId: editForm.unitId || undefined,
                                  fullName: editForm.fullName,
                                  email: editForm.email,
                                  phone: editForm.phone,
                                  monthlyRent: editForm.tenantKind === "renter" ? Number(editForm.monthlyRent || "0") || undefined : undefined,
                                  rentDueDay: editForm.tenantKind === "renter" ? Number(editForm.rentDueDay || "0") || undefined : undefined,
                                  oneTimeGuestFee: editForm.tenantKind === "guest" ? Number(editForm.oneTimeGuestFee || "0") || undefined : undefined,
                                  address: editForm.address || undefined,
                                  notes: editForm.notes || undefined,
                                  leaseStart: editForm.leaseStart || undefined,
                                  leaseEnd: editForm.leaseEnd || undefined,
                                  movedInAt: editForm.movedInAt || undefined,
                                  movedOutAt: editForm.movedOutAt || undefined,
                                  isActive: editForm.isActive,
                                },
                              },
                              {
                                onSuccess: () => {
                                  setIsEditOpen(false)
                                },
                              }
                            )
                          }}
                        >
                          <FieldGroup>
                            <Field><FieldLabel>Kind</FieldLabel><Select value={editForm.tenantKind} onValueChange={(value) => setEditForm((current) => ({ ...current, tenantKind: value ?? "renter" }))}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{["renter", "guest"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
                            <Field><FieldLabel>Property</FieldLabel><Select value={editForm.propertyId} onValueChange={(value) => setEditForm((current) => ({ ...current, propertyId: value ?? "" }))}><SelectTrigger className="w-full"><SelectValue placeholder="Select property" /></SelectTrigger><SelectContent><SelectGroup>{propertyList.map((property) => <SelectItem key={property._id} value={property._id}>{property.name}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
                            <Field><FieldLabel>Unit</FieldLabel><Select value={editForm.unitId || "__none__"} onValueChange={(value) => setEditForm((current) => ({ ...current, unitId: value === "__none__" ? "" : (value ?? "") }))}><SelectTrigger className="w-full"><SelectValue placeholder="Select unit" /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="__none__">No unit</SelectItem>{unitList.filter((unit) => !editForm.propertyId || unit.propertyId === editForm.propertyId).map((unit) => <SelectItem key={unit._id} value={unit._id}>{unit.unitNumber}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
                            <Field><FieldLabel>Full name</FieldLabel><Input value={editForm.fullName} onChange={(event) => setEditForm((current) => ({ ...current, fullName: event.target.value ?? "" }))} /></Field>
                            <Field><FieldLabel>Email</FieldLabel><Input type="email" value={editForm.email} onChange={(event) => setEditForm((current) => ({ ...current, email: event.target.value ?? "" }))} /></Field>
                            <Field><FieldLabel>Phone</FieldLabel><Input value={editForm.phone} onChange={(event) => setEditForm((current) => ({ ...current, phone: event.target.value ?? "" }))} /></Field>
                            {editForm.tenantKind === "renter" ? (
                              <>
                                <Field><FieldLabel>Monthly rent</FieldLabel><Input type="number" value={editForm.monthlyRent} onChange={(event) => setEditForm((current) => ({ ...current, monthlyRent: event.target.value ?? "" }))} /></Field>
                                <Field><FieldLabel>Rent due day each month</FieldLabel><Input type="number" min="1" max="31" value={editForm.rentDueDay} onChange={(event) => setEditForm((current) => ({ ...current, rentDueDay: event.target.value ?? "" }))} /></Field>
                              </>
                            ) : (
                              <Field><FieldLabel>Guest fee</FieldLabel><Input type="number" value={editForm.oneTimeGuestFee} onChange={(event) => setEditForm((current) => ({ ...current, oneTimeGuestFee: event.target.value ?? "" }))} /></Field>
                            )}
                            <Field><FieldLabel>Lease start</FieldLabel><Input type="date" value={editForm.leaseStart} onChange={(event) => setEditForm((current) => ({ ...current, leaseStart: event.target.value ?? "" }))} /></Field>
                            <Field><FieldLabel>Lease end</FieldLabel><Input type="date" value={editForm.leaseEnd} onChange={(event) => setEditForm((current) => ({ ...current, leaseEnd: event.target.value ?? "" }))} /></Field>
                            <Field><FieldLabel>Moved in</FieldLabel><Input type="date" value={editForm.movedInAt} onChange={(event) => setEditForm((current) => ({ ...current, movedInAt: event.target.value ?? "" }))} /></Field>
                            <Field><FieldLabel>Moved out</FieldLabel><Input type="date" value={editForm.movedOutAt} onChange={(event) => setEditForm((current) => ({ ...current, movedOutAt: event.target.value ?? "" }))} /></Field>
                            <Field><FieldLabel>Address</FieldLabel><Textarea value={editForm.address} onChange={(event) => setEditForm((current) => ({ ...current, address: event.target.value ?? "" }))} /></Field>
                            <Field><FieldLabel>Notes</FieldLabel><Textarea value={editForm.notes} onChange={(event) => setEditForm((current) => ({ ...current, notes: event.target.value ?? "" }))} /></Field>
                            <Field>
                              <FieldLabel>Status</FieldLabel>
                              <div className="flex items-center gap-3 rounded-xl border p-3">
                                <Switch checked={editForm.isActive} onCheckedChange={(checked) => setEditForm((current) => ({ ...current, isActive: checked ?? false }))} />
                                <span className="text-sm text-slate-700">{editForm.isActive ? "Active" : "Inactive"}</span>
                              </div>
                            </Field>
                          </FieldGroup>
                          <Button type="submit" disabled={updateTenant.isPending}>Save tenant</Button>
                        </form>
                      ) : null}
                    </SheetContent>
                  </Sheet>

                  <Sheet open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                    <SheetContent side="right" className="w-full overflow-y-auto sm:!w-[50vw] sm:!max-w-[50vw]">
                      <SheetHeader>
                        <SheetTitle>Set payment</SheetTitle>
                        <SheetDescription>Set month, due date, payment date, amount, and status.</SheetDescription>
                      </SheetHeader>
                      {selectedTenant ? (
                        <form
                          className="space-y-4 px-4 pb-6"
                          onSubmit={(event) => {
                            event.preventDefault()
                            recordPayment.mutate(
                              {
                                tenantId: selectedTenant._id,
                                monthKey: paymentForm.monthKey,
                                amount: Number(paymentForm.amount || "0"),
                                status: paymentForm.status,
                                paidAt: paymentForm.paidAt || undefined,
                                dueDate: paymentForm.dueDate || undefined,
                                paymentMethod: paymentForm.paymentMethod || undefined,
                                note: paymentForm.note || undefined,
                              },
                              {
                                onSuccess: () => {
                                  setIsPaymentOpen(false)
                                },
                              }
                            )
                          }}
                        >
                          <FieldGroup>
                            <Field><FieldLabel>Resident</FieldLabel><Input value={selectedTenant.fullName} disabled /></Field>
                            <Field><FieldLabel>Month</FieldLabel><Input type="month" value={paymentForm.monthKey} onChange={(event) => setPaymentForm((current) => ({ ...current, monthKey: event.target.value ?? "" }))} /></Field>
                            <Field><FieldLabel>Amount</FieldLabel><Input type="number" value={paymentForm.amount} onChange={(event) => setPaymentForm((current) => ({ ...current, amount: event.target.value ?? "" }))} /></Field>
                            <Field><FieldLabel>Status</FieldLabel><Select value={paymentForm.status} onValueChange={(value) => setPaymentForm((current) => ({ ...current, status: value ?? "paid" }))}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{["paid", "pending", "partial", "overdue"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
                            <Field><FieldLabel>Due date</FieldLabel><Input type="date" value={paymentForm.dueDate} onChange={(event) => setPaymentForm((current) => ({ ...current, dueDate: event.target.value ?? "" }))} /></Field>
                            <Field><FieldLabel>Payment date</FieldLabel><Input type="date" value={paymentForm.paidAt} onChange={(event) => setPaymentForm((current) => ({ ...current, paidAt: event.target.value ?? "" }))} /></Field>
                            <Field><FieldLabel>Method</FieldLabel><Input placeholder="cash, bank, stripe" value={paymentForm.paymentMethod} onChange={(event) => setPaymentForm((current) => ({ ...current, paymentMethod: event.target.value ?? "" }))} /></Field>
                            <Field><FieldLabel>Note</FieldLabel><Textarea value={paymentForm.note} onChange={(event) => setPaymentForm((current) => ({ ...current, note: event.target.value ?? "" }))} /></Field>
                          </FieldGroup>
                          <Button type="submit" disabled={recordPayment.isPending || !paymentForm.monthKey || !paymentForm.amount}>Save payment</Button>
                        </form>
                      ) : null}
                    </SheetContent>
                  </Sheet>
                </>
              ) : (
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

export function TenantOwnerBillingPage() {
  const searchParams = useSearchParams()
  const properties = useOwnerPropertiesQuery()
  const tenants = useOwnerTenantsQuery()
  const stripeSettings = useOrganizationStripeSettingsQuery()
  const recordPayment = useOwnerRecordTenantPaymentMutation()
  const updateBill = useOwnerUpdateBillMutation()
  const [propertyFilter, setPropertyFilter] = useState("")
  const [tenantFilter, setTenantFilter] = useState(searchParams.get("tenantId") ?? "")
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7))
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState<"all" | "monthly" | "bill">("all")
  const propertyList = Array.isArray(properties.data) ? properties.data : []
  const tenantList = Array.isArray(tenants.data) ? tenants.data : []
  const bills = useOwnerBillsQuery({
    tenantId: tenantFilter || undefined,
    propertyId: propertyFilter || undefined,
    monthKey: monthFilter || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
  })
  const financeEntries = useOwnerFinanceEntriesQuery()
  const billList = Array.isArray(bills.data) ? bills.data : []
  const financeList = Array.isArray(financeEntries.data) ? financeEntries.data : []
  const defaultCurrency = stripeSettings.data?.defaultCurrency?.toUpperCase() ?? "USD"

  const paymentHistory = useMemo(() => {
    return tenantList
      .filter((tenant) => !tenantFilter || tenant._id === tenantFilter)
      .filter((tenant) => !propertyFilter || tenant.propertyId === propertyFilter)
      .flatMap((tenant) =>
        (tenant.paymentRecords ?? [])
          .filter((record) => !monthFilter || record.monthKey === monthFilter)
          .filter((record) => statusFilter === "all" || record.status === statusFilter)
          .map((record) => ({
            id: `${tenant._id}-${record.monthKey}`,
            tenantId: tenant._id,
            tenantName: tenant.fullName,
            propertyName: propertyList.find((property) => property._id === tenant.propertyId)?.name ?? "Unknown property",
            monthKey: record.monthKey,
            status: record.status,
            amount: record.amount,
            dueDate: record.dueDate,
            paidAt: record.paidAt,
            paymentMethod: record.paymentMethod,
            note: record.note,
            currency: defaultCurrency,
          }))
      )
      .sort((left, right) => (right.monthKey ?? "").localeCompare(left.monthKey ?? ""))
  }, [defaultCurrency, monthFilter, propertyFilter, propertyList, statusFilter, tenantFilter, tenantList])

  const customBillHistory = useMemo(() => {
    return billList
      .filter((bill) => !["rent", "guest_fee"].includes(bill.kind))
      .filter((bill) => !tenantFilter || bill.tenantId === tenantFilter)
      .filter((bill) => statusFilter === "all" || bill.status === statusFilter)
      .sort((left, right) => new Date(right.createdAt ?? "").getTime() - new Date(left.createdAt ?? "").getTime())
  }, [billList, statusFilter, tenantFilter])

  const financeSummary = useMemo(() => {
    return financeList.reduce(
      (acc, item: FinanceEntryItem) => {
        if (propertyFilter && item.propertyId !== propertyFilter) return acc
        if (item.kind === "earning") acc.earnings += item.amount ?? 0
        if (item.kind === "expense") acc.expenses += item.amount ?? 0
        return acc
      },
      { earnings: 0, expenses: 0 }
    )
  }, [financeList, propertyFilter])

  const visibleMonthlyCount = typeFilter === "bill" ? 0 : paymentHistory.length
  const visibleBillCount = typeFilter === "monthly" ? 0 : customBillHistory.length

  return (
    <div className="space-y-6">
      <OwnerPageHero
        icon={CreditCard}
        badge="Billing"
        title="Billing history"
        body="One owner page for monthly payment history, extra or custom bills, due status, and money movement."
      />

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter by property, renter, month, payment status, or history type.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <Field>
              <FieldLabel>Property</FieldLabel>
              <Select value={propertyFilter || "__all__"} onValueChange={(value) => setPropertyFilter(value === "__all__" ? "" : (value ?? ""))}>
                <SelectTrigger className="w-full"><SelectValue placeholder="All properties" /></SelectTrigger>
                <SelectContent><SelectGroup><SelectItem value="__all__">All properties</SelectItem>{propertyList.map((property) => <SelectItem key={property._id} value={property._id}>{property.name}</SelectItem>)}</SelectGroup></SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Tenant</FieldLabel>
              <Select value={tenantFilter || "__all__"} onValueChange={(value) => setTenantFilter(value === "__all__" ? "" : (value ?? ""))}>
                <SelectTrigger className="w-full"><SelectValue placeholder="All tenants" /></SelectTrigger>
                <SelectContent><SelectGroup><SelectItem value="__all__">All tenants</SelectItem>{tenantList.filter((tenant) => !propertyFilter || tenant.propertyId === propertyFilter).map((tenant) => <SelectItem key={tenant._id} value={tenant._id}>{tenant.fullName}</SelectItem>)}</SelectGroup></SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Month</FieldLabel>
              <Input type="month" value={monthFilter} onChange={(event) => setMonthFilter(event.target.value ?? "")} />
            </Field>
            <Field>
              <FieldLabel>Status</FieldLabel>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value ?? "all")}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent><SelectGroup>{["all", "paid", "pending", "unpaid", "partial", "overdue", "waived"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectGroup></SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>History type</FieldLabel>
              <Select value={typeFilter} onValueChange={(value) => setTypeFilter((value ?? "all") as "all" | "monthly" | "bill")}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent><SelectGroup>{["all", "monthly", "bill"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectGroup></SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-xl border bg-slate-50 p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Monthly payments</p><p className="mt-2 text-2xl font-semibold text-slate-950">{visibleMonthlyCount}</p></div>
            <div className="rounded-xl border bg-slate-50 p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Extra/custom bills</p><p className="mt-2 text-2xl font-semibold text-slate-950">{visibleBillCount}</p></div>
            <div className="rounded-xl border bg-emerald-50 p-4"><p className="text-xs uppercase tracking-wide text-emerald-700">Manual earnings</p><p className="mt-2 text-2xl font-semibold text-slate-950">{formatMoney(financeSummary.earnings, defaultCurrency)}</p></div>
            <div className="rounded-xl border bg-rose-50 p-4"><p className="text-xs uppercase tracking-wide text-rose-700">Manual expenses</p><p className="mt-2 text-2xl font-semibold text-slate-950">{formatMoney(financeSummary.expenses, defaultCurrency)}</p></div>
          </div>
        </CardContent>
      </Card>

      {typeFilter !== "bill" ? (
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Monthly payment history</CardTitle>
            <CardDescription>Rent or guest-fee month ledger with due date and payment date.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {paymentHistory.length ? paymentHistory.map((item) => (
              <div key={item.id} className="rounded-xl border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-slate-950">{item.tenantName}</p>
                  <Badge variant="outline">{item.monthKey}</Badge>
                  <Badge>{item.status}</Badge>
                </div>
                <div className="mt-3 grid gap-3 rounded-xl bg-slate-50 p-3 text-sm md:grid-cols-6">
                  <div><p className="text-xs uppercase tracking-wide text-slate-500">Property</p><p className="mt-1 font-medium text-slate-950">{item.propertyName}</p></div>
                  <div><p className="text-xs uppercase tracking-wide text-slate-500">Amount</p><p className="mt-1 font-medium text-slate-950">{formatMoney(item.amount, resolveDisplayCurrency(item.currency, defaultCurrency))}</p></div>
                  <div><p className="text-xs uppercase tracking-wide text-slate-500">Due date</p><p className="mt-1 font-medium text-slate-950">{formatDateLabel(item.dueDate, "No due date")}</p></div>
                  <div><p className="text-xs uppercase tracking-wide text-slate-500">Payment date</p><p className="mt-1 font-medium text-slate-950">{formatDateLabel(item.paidAt, "Not paid")}</p></div>
                  <div><p className="text-xs uppercase tracking-wide text-slate-500">Method</p><p className="mt-1 font-medium text-slate-950">{item.paymentMethod ?? "N/A"}</p></div>
                  <div><p className="text-xs uppercase tracking-wide text-slate-500">Note</p><p className="mt-1 font-medium text-slate-950">{item.note ?? "No note"}</p></div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="shadow-none"
                    onClick={() => recordPayment.mutate({
                      tenantId: item.tenantId,
                      monthKey: item.monthKey,
                      amount: item.amount,
                      status: "paid",
                      dueDate: item.dueDate ?? undefined,
                      paidAt: new Date().toISOString(),
                      paymentMethod: item.paymentMethod ?? undefined,
                      note: item.note ?? undefined,
                    })}
                  >
                    Mark paid
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="shadow-none"
                    onClick={() => recordPayment.mutate({
                      tenantId: item.tenantId,
                      monthKey: item.monthKey,
                      amount: item.amount,
                      status: "pending",
                      dueDate: item.dueDate ?? undefined,
                      note: item.note ?? undefined,
                    })}
                  >
                    Mark pending
                  </Button>
                </div>
              </div>
            )) : (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon"><CreditCard /></EmptyMedia>
                  <EmptyTitle>No monthly payment history</EmptyTitle>
                  <EmptyDescription>No matching rent or guest payment records for these filters.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>
      ) : null}

      {typeFilter !== "monthly" ? (
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Extra and custom bill history</CardTitle>
            <CardDescription>Every sent bill, due date, attachments, and paid or unpaid state.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {customBillHistory.length ? customBillHistory.map((bill) => {
              const tenantName = tenantList.find((tenant) => tenant._id === bill.tenantId)?.fullName ?? "Unknown tenant"
              const propertyName = propertyList.find((property) => property._id === bill.propertyId)?.name ?? "Unknown property"
              return (
                <div key={bill._id} className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-slate-950">{bill.title}</p>
                    <Badge variant="outline">{bill.kind}</Badge>
                    <Badge>{bill.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{bill.description ?? "No description"}</p>
                  <div className="mt-3 grid gap-3 rounded-xl bg-slate-50 p-3 text-sm md:grid-cols-6">
                    <div><p className="text-xs uppercase tracking-wide text-slate-500">Tenant</p><p className="mt-1 font-medium text-slate-950">{tenantName}</p></div>
                    <div><p className="text-xs uppercase tracking-wide text-slate-500">Property</p><p className="mt-1 font-medium text-slate-950">{propertyName}</p></div>
                    <div><p className="text-xs uppercase tracking-wide text-slate-500">Amount</p><p className="mt-1 font-medium text-slate-950">{formatMoney(bill.amount, resolveDisplayCurrency(bill.currency, defaultCurrency))}</p></div>
                    <div><p className="text-xs uppercase tracking-wide text-slate-500">Month</p><p className="mt-1 font-medium text-slate-950">{bill.monthKey ?? "Custom"}</p></div>
                    <div><p className="text-xs uppercase tracking-wide text-slate-500">Due date</p><p className="mt-1 font-medium text-slate-950">{formatDateLabel(bill.dueDate, "No due date")}</p></div>
                    <div><p className="text-xs uppercase tracking-wide text-slate-500">Payment date</p><p className="mt-1 font-medium text-slate-950">{formatDateLabel(bill.paidAt, "Not paid")}</p></div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="outline" className="shadow-none" onClick={() => updateBill.mutate({ id: bill._id, payload: { status: "paid" } })}>Mark paid</Button>
                    <Button type="button" size="sm" variant="outline" className="shadow-none" onClick={() => updateBill.mutate({ id: bill._id, payload: { status: "unpaid" } })}>Mark unpaid</Button>
                    {bill.attachments?.[0] ? <a href={bill.attachments[0]} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-lg border px-3 py-1.5 text-xs text-blue-700">Open file</a> : null}
                    {bill.stripeHostedInvoiceUrl ? <a href={bill.stripeHostedInvoiceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-lg border px-3 py-1.5 text-xs text-blue-700">Stripe invoice</a> : null}
                    {bill.stripeInvoicePdf ? <a href={bill.stripeInvoicePdf} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-lg border px-3 py-1.5 text-xs text-blue-700">Invoice PDF</a> : null}
                  </div>
                </div>
              )
            }) : (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon"><FileText /></EmptyMedia>
                  <EmptyTitle>No extra or custom bills</EmptyTitle>
                  <EmptyDescription>No matching sent bill history for these filters.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>
      ) : null}

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Manual earning and expense ledger</CardTitle>
          <CardDescription>Owner-added extra earnings and expenses are counted here too.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {financeList.length ? financeList
            .filter((item) => !propertyFilter || item.propertyId === propertyFilter)
            .slice(0, 20)
            .map((item) => (
              <div key={item._id} className="rounded-xl border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-slate-950">{item.title}</p>
                  <Badge variant={item.kind === "earning" ? "secondary" : "outline"}>{item.kind}</Badge>
                  <Badge>{item.status}</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-600">{item.category} | {formatDateLabel(item.occurredAt)}</p>
                <p className="mt-2 font-medium text-slate-950">{formatMoney(item.amount, resolveDisplayCurrency(item.currency, defaultCurrency))}</p>
                <p className="mt-1 text-xs text-slate-500">{item.description ?? item.note ?? "No extra note"}</p>
              </div>
            )) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><CreditCard /></EmptyMedia>
                <EmptyTitle>No manual finance history</EmptyTitle>
                <EmptyDescription>Add earning or expense from owner overview to see it here too.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function TenantOwnerTechniciansPage() {
  const properties = useOwnerPropertiesQuery()
  const users = useOwnerUsersQuery()
  const technicians = useOwnerTechniciansQuery()
  const createTechnician = useOwnerCreateTechnicianMutation()
  const createRequest = useOwnerCreateAssignmentRequestMutation()
  const toggleTechnician = useOwnerToggleTechnicianMutation()
  const deleteTechnician = useOwnerDeleteTechnicianMutation()
  const propertyList = Array.isArray(properties.data) ? properties.data : []
  const technicianList = Array.isArray(technicians.data) ? technicians.data : []
  const workerUsers = Array.isArray(users.data) ? users.data.filter((user) => user.role === "worker") : []
  const [publicWorkerSearch, setPublicWorkerSearch] = useState("")
  const [linkedWorkerSearch, setLinkedWorkerSearch] = useState("")
  const [requestMessage, setRequestMessage] = useState("")
  const [selectedPublicWorkerId, setSelectedPublicWorkerId] = useState("")
  const publicWorkerResults = useOwnerUserSearchQuery(publicWorkerSearch, "worker")
  const linkedWorkerResults = useMemo(() => {
    const needle = linkedWorkerSearch.trim().toLowerCase()
    if (!needle) return workerUsers
    return workerUsers.filter((user) =>
      [user.fullName, user.email, user.phoneNumber].filter(Boolean).join(" ").toLowerCase().includes(needle)
    )
  }, [linkedWorkerSearch, workerUsers])
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
  const selectedPublicWorker =
    publicWorkerResults.data?.find((candidate) => candidate.id === selectedPublicWorkerId) ?? null
  const requestDisabledReason = !selectedPublicWorker
    ? "Select worker first."
    : assignedProperties.length === 0
      ? "Select at least one property first."
      : ""

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
          title="Request or link technician"
          description="Search worker by email, send join request, then link accepted worker into technician profile."
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
                      setSelectedPublicWorkerId("")
                      setPublicWorkerSearch("")
                      setLinkedWorkerSearch("")
                      setRequestMessage("")
                      setAssignedProperties([])
                      setIsCreateOpen(false)
                    },
                  }
                )
              }}
            >
              <div className="rounded-2xl border border-dashed p-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-slate-950">Request worker access first</p>
                    <p className="mt-1 text-sm text-slate-600">
                      Search signed-up worker by email or name. Worker must accept before they appear in linked worker search below.
                    </p>
                  </div>
                  <FieldGroup>
                    <Field>
                      <FieldLabel>Search worker by email or name</FieldLabel>
                      <Input
                        value={publicWorkerSearch}
                        onChange={(event) => setPublicWorkerSearch(event.target.value ?? "")}
                        placeholder="worker@example.com"
                      />
                    </Field>
                    <PropertyMultiSelect
                      properties={propertyList}
                      selectedIds={assignedProperties}
                      setSelectedIds={setAssignedProperties}
                      helper="Worker request should include apartment properties they will serve."
                    />
                    <Field>
                      <FieldLabel>Request message (Optional)</FieldLabel>
                      <Textarea
                        value={requestMessage}
                        onChange={(event) => setRequestMessage(event.target.value ?? "")}
                        placeholder="Join my apartment team as worker..."
                      />
                    </Field>
                  </FieldGroup>
                  <div className="space-y-3">
                    {publicWorkerResults.data?.length ? publicWorkerResults.data.map((candidate) => (
                      <button
                        key={candidate.id}
                        type="button"
                        className={`w-full rounded-xl border p-4 text-left transition ${
                          selectedPublicWorkerId === candidate.id
                            ? "border-blue-300 bg-blue-50"
                            : "border-slate-200 bg-white"
                        }`}
                        onClick={() => {
                          setSelectedPublicWorkerId(candidate.id)
                          setForm((current) => ({
                            ...current,
                            name: candidate.fullName,
                            email: candidate.email,
                            phone: candidate.phoneNumber ?? "",
                          }))
                        }}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-slate-950">{candidate.fullName}</p>
                            <p className="text-sm text-slate-600">{candidate.email}</p>
                            <p className="text-xs text-slate-500">{candidate.phoneNumber || "No phone saved"}</p>
                          </div>
                          <Badge variant={selectedPublicWorkerId === candidate.id ? "default" : "outline"}>
                            {selectedPublicWorkerId === candidate.id ? "Selected" : "Tap to select"}
                          </Badge>
                        </div>
                      </button>
                    )) : publicWorkerSearch.trim().length >= 2 && !publicWorkerResults.isLoading ? (
                      <div className="rounded-xl border border-dashed p-4 text-sm text-slate-500">
                        No signed-up worker found. Ask them to sign up first.
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed p-4 text-sm text-slate-500">
                        Search public worker account first.
                      </div>
                    )}
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                    <p className="font-medium text-slate-950">
                      {selectedPublicWorker ? `Selected: ${selectedPublicWorker.fullName}` : "No worker selected yet"}
                    </p>
                    <p className="mt-1">
                      {selectedPublicWorker
                        ? `${selectedPublicWorker.email}${selectedPublicWorker.phoneNumber ? ` | ${selectedPublicWorker.phoneNumber}` : ""}`
                        : "Pick worker from search results above."}
                    </p>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                      <Button
                        type="button"
                        disabled={createRequest.isPending || Boolean(requestDisabledReason)}
                        onClick={() => {
                          if (!selectedPublicWorker) return
                          createRequest.mutate(
                            {
                              direction: "owner_to_user",
                              targetUserId: selectedPublicWorker.id,
                              targetEmail: selectedPublicWorker.email,
                              requestedRole: "worker",
                              propertyIds: assignedProperties,
                              message: requestMessage || undefined,
                            },
                            {
                              onSuccess: () => {
                                setSelectedPublicWorkerId("")
                                setPublicWorkerSearch("")
                                setRequestMessage("")
                              },
                            }
                          )
                        }}
                      >
                        Send worker request
                      </Button>
                      {requestDisabledReason ? (
                        <span className="text-xs text-amber-700">{requestDisabledReason}</span>
                      ) : (
                        <span className="text-xs text-emerald-700">Ready to send request.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <FieldGroup>
                <Field className="space-y-3">
                  <FieldLabel>Linked worker user</FieldLabel>
                  <Input
                    value={linkedWorkerSearch}
                    onChange={(event) => setLinkedWorkerSearch(event.target.value ?? "")}
                    placeholder="Search accepted worker by email or name"
                  />
                  <FieldDescription>
                    Only workers who already accepted your request show here.
                  </FieldDescription>
                  <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl border p-2">
                    {linkedWorkerResults.length ? linkedWorkerResults.map((user) => {
                      const selected = form.userId === user.id
                      return (
                        <button
                          key={user.id}
                          type="button"
                          className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                            selected ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white"
                          }`}
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              userId: user.id,
                              name: user.fullName,
                              email: user.email,
                              phone: user.phoneNumber,
                            }))
                          }
                        >
                          <p className="font-medium text-slate-950">{user.fullName}</p>
                          <p className="text-sm text-slate-600">{user.email}</p>
                        </button>
                      )
                    }) : (
                      <div className="rounded-xl border border-dashed p-4 text-sm text-slate-500">
                        No accepted linked worker found yet.
                      </div>
                    )}
                  </div>
                </Field>
                <Field><FieldLabel>Name</FieldLabel><Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Email</FieldLabel><Input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Phone</FieldLabel><Input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Skills</FieldLabel><Input value={form.skills} onChange={(event) => setForm((current) => ({ ...current, skills: event.target.value ?? "" }))} /><FieldDescription>Comma separated. Example: plumbing,electrical</FieldDescription></Field>
                <Field><FieldLabel>Availability</FieldLabel><Select value={form.availability} onValueChange={(value) => setForm((current) => ({ ...current, availability: value ?? "available" }))}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{["available", "busy", "on_leave", "off_duty"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
              </FieldGroup>
              <Button type="submit" disabled={createTechnician.isPending || assignedProperties.length === 0}>Save technician</Button>
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
    audience: "role_based",
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
                    audience: form.audience as "all" | "role_based" | "user_based",
                    targetRoles: form.audience === "role_based" ? form.targetRoles : undefined,
                    targetUserIds: form.audience === "user_based" ? selectedUsers : undefined,
                    isActive: true,
                  },
                  {
                    onSuccess: () => {
                      setForm({
                        propertyId: "",
                        title: "",
                        content: "",
                        audience: "role_based",
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
                <Field><FieldLabel>Content</FieldLabel><RichTextEditor value={form.content} onChange={(value) => setForm((current) => ({ ...current, content: value }))} placeholder="Write notice with rich text" minHeightClassName="min-h-48" /></Field>
                <Field><FieldLabel>Audience</FieldLabel><Select value={form.audience} onValueChange={(value) => setForm((current) => ({ ...current, audience: value ?? "role_based" }))}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="all">all</SelectItem><SelectItem value="role_based">roles</SelectItem><SelectItem value="user_based">users</SelectItem></SelectGroup></SelectContent></Select></Field>
                {form.audience === "role_based" ? (
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
                {form.audience === "user_based" ? (
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
                  <RichTextContent value={notice.content} className="mt-2 leading-6" />
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
    htmlContent: "",
    useTemplateVariables: true,
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
          description="Upload template doc/text/html or write rich document here. Variables auto-replace per tenant."
          triggerLabel="Send document"
        >
          <div className="space-y-4">
            <FieldGroup>
              <Field><FieldLabel>Title (Optional)</FieldLabel><Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value ?? "" }))} /></Field>
              <Field><FieldLabel>Note (Optional)</FieldLabel><RichTextEditor value={form.note} onChange={(value) => setForm((current) => ({ ...current, note: value }))} placeholder="Short rich note sent with document" minHeightClassName="min-h-32" /></Field>
              <Field><FieldLabel>Rich document body (Optional)</FieldLabel><RichTextEditor value={form.htmlContent} onChange={(value) => setForm((current) => ({ ...current, htmlContent: value }))} placeholder="Write HTML/rich document here if you do not want upload-only mode" minHeightClassName="min-h-56" /></Field>
              <UploadCollectionField
                label="Template / file upload"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.html,image/*"
                kind="file"
                values={documentUrls}
                onChange={setDocumentUrls}
                optional={true}
              />
              <Field>
                <FieldLabel>Template variables</FieldLabel>
                <div className="rounded-xl border p-4 text-sm text-slate-700">
                  <label className="mb-3 flex items-center gap-3">
                    <Checkbox
                      checked={form.useTemplateVariables}
                      onCheckedChange={(checked) => setForm((current) => ({ ...current, useTemplateVariables: Boolean(checked) }))}
                    />
                    Auto replace variables in uploaded template, note, and rich document
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DOCUMENT_TEMPLATE_VARIABLES.map((item) => (
                      <button
                        key={item}
                        type="button"
                        className="rounded-full border px-3 py-1 text-xs text-slate-700"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            htmlContent: `${current.htmlContent}${current.htmlContent ? " " : ""}{{${item}}}`,
                          }))
                        }
                      >
                        {`{{${item}}}`}
                      </button>
                    ))}
                  </div>
                </div>
              </Field>
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
              disabled={sendDocument.isPending || !selectedUsers.length || (!documentUrls[0] && !form.htmlContent.trim())}
              onClick={() =>
                sendDocument.mutate(
                  {
                    recipientIds: selectedUsers,
                    documentUrl: documentUrls[0] || undefined,
                    title: form.title || undefined,
                    note: form.note || undefined,
                    htmlContent: form.htmlContent || undefined,
                    useTemplateVariables: form.useTemplateVariables,
                  },
                  {
                    onSuccess: () => {
                      setSelectedUsers([])
                      setDocumentUrls([])
                      setForm({ title: "", note: "", htmlContent: "", useTemplateVariables: true })
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
                <RichTextContent value={message.content ?? "Sent document"} className="mt-1" />
                <div className="mt-3 flex flex-wrap gap-2">
                  {(message.attachments ?? []).map((attachment) => (
                    <a key={attachment} href={attachment} target="_blank" rel="noreferrer" className="rounded-lg border px-3 py-2 text-sm text-blue-700">
                      Open file
                    </a>
                  ))}
                </div>
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
          description="Save vendor contact for later ticket or service use."
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
            <CardDescription>Keep service vendors ready for ticket-based repair flow.</CardDescription>
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
  const addTicketNote = useOwnerAddTicketNoteMutation()
  const updateTicket = useOwnerUpdateTicketMutation()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [ticketImages, setTicketImages] = useState<string[]>([])
  const propertyList = Array.isArray(properties.data) ? properties.data : []
  const unitList = Array.isArray(units.data) ? units.data : []
  const tenantList = Array.isArray(tenants.data) ? tenants.data : []
  const userList = Array.isArray(users.data) ? users.data : []
  const ticketList = Array.isArray(tickets.data) ? tickets.data : []
  const workerList = userList.filter((user) => user.role === "worker")
  const propertyMap = new Map(propertyList.map((item) => [item._id, item]))
  const unitMap = new Map(unitList.map((item) => [item._id, item]))
  const tenantMap = new Map(tenantList.map((item) => [item._id, item]))
  const workerMap = new Map(workerList.map((item) => [item.id, item]))
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [assignedFilter, setAssignedFilter] = useState("all")
  const [propertyFilter, setPropertyFilter] = useState("all")
  const [tenantFilter, setTenantFilter] = useState("all")
  const [workerFilter, setWorkerFilter] = useState("all")
  const [page, setPage] = useState(1)
  const pageSize = 8
  const [isAssignSheetOpen, setIsAssignSheetOpen] = useState(false)
  const [selectedTicketId, setSelectedTicketId] = useState("")
  const [assignWorkerSearch, setAssignWorkerSearch] = useState("")
  const [selectedAssignWorkerId, setSelectedAssignWorkerId] = useState("")
  const [manageStatus, setManageStatus] = useState("open")
  const [manageScheduledDate, setManageScheduledDate] = useState("")
  const [manageDueDate, setManageDueDate] = useState("")
  const [manageEstimatedCost, setManageEstimatedCost] = useState("")
  const [manageOwnerNote, setManageOwnerNote] = useState("")
  const [form, setForm] = useState({
    propertyId: "",
    unitId: "",
    tenantId: "",
    title: "",
    description: "",
    category: "general",
    priority: "medium",
  })
  const filteredTickets = useMemo(() => {
    return ticketList.filter((ticket) => {
      if (statusFilter !== "all" && ticket.status !== statusFilter) return false
      if (assignedFilter === "assigned" && !ticket.assignedTo) return false
      if (assignedFilter === "unassigned" && ticket.assignedTo) return false
      if (propertyFilter !== "all" && ticket.propertyId !== propertyFilter) return false
      if (tenantFilter !== "all" && (ticket.tenantId ?? "") !== tenantFilter) return false
      if (workerFilter !== "all" && (ticket.assignedTo ?? "") !== workerFilter) return false
      if (!search.trim()) return true
      const needle = search.trim().toLowerCase()
      const propertyName = ticket.propertyId ? propertyMap.get(ticket.propertyId)?.name ?? "" : ""
      const tenantName = ticket.tenantId ? tenantMap.get(ticket.tenantId)?.fullName ?? "" : ""
      const workerName = ticket.assignedTo ? workerMap.get(ticket.assignedTo)?.fullName ?? "" : ""
      return [
        ticket.title,
        ticket.description,
        ticket.category,
        ticket.priority,
        ticket.status,
        propertyName,
        tenantName,
        workerName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle)
    })
  }, [assignedFilter, propertyFilter, propertyMap, search, statusFilter, tenantFilter, tenantMap, ticketList, workerFilter, workerMap])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, assignedFilter, propertyFilter, tenantFilter, workerFilter])

  const pagedTickets = paginateItems(filteredTickets, page, pageSize)
  const selectedTicket = ticketList.find((item) => item._id === selectedTicketId) ?? null
  const assignWorkerResults = useMemo(() => {
    const needle = assignWorkerSearch.trim().toLowerCase()
    if (!needle) return workerList
    return workerList.filter((worker) =>
      [worker.fullName, worker.email, worker.phoneNumber].filter(Boolean).join(" ").toLowerCase().includes(needle)
    )
  }, [assignWorkerSearch, workerList])

  useEffect(() => {
    if (!selectedTicket) return
    setSelectedAssignWorkerId(selectedTicket.assignedTo ?? "")
    setManageStatus(selectedTicket.status ?? "open")
    setManageScheduledDate(toDateInputValue(selectedTicket.scheduledDate))
    setManageDueDate(toDateInputValue(selectedTicket.dueDate))
    setManageEstimatedCost(
      selectedTicket.estimatedCost != null ? String(selectedTicket.estimatedCost) : ""
    )
    setManageOwnerNote("")
  }, [selectedTicket])

  return (
    <div className="space-y-6">
      <OwnerPageHero
        icon={Ticket}
        badge="Support"
        title="Tickets"
        body="Table-first ticket control with filters, paging, worker assignment, and status actions. New ticket starts unassigned, then you assign worker from action column."
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

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border bg-white p-4"><p className="text-xs uppercase tracking-wide text-slate-500">All</p><p className="mt-2 text-2xl font-semibold text-slate-950">{ticketList.length}</p></div>
        <div className="rounded-xl border bg-white p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Open</p><p className="mt-2 text-2xl font-semibold text-slate-950">{ticketList.filter((item) => item.status === "open").length}</p></div>
        <div className="rounded-xl border bg-white p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Assigned</p><p className="mt-2 text-2xl font-semibold text-slate-950">{ticketList.filter((item) => item.status === "assigned").length}</p></div>
        <div className="rounded-xl border bg-white p-4"><p className="text-xs uppercase tracking-wide text-slate-500">In progress</p><p className="mt-2 text-2xl font-semibold text-slate-950">{ticketList.filter((item) => item.status === "in_progress").length}</p></div>
        <div className="rounded-xl border bg-white p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Completed</p><p className="mt-2 text-2xl font-semibold text-slate-950">{ticketList.filter((item) => item.status === "completed").length}</p></div>
      </div>

      <WithBone name="owner-page-tickets" loading={tickets.isLoading} fallback={<DashboardTableSkeleton />}>
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Ticket table</CardTitle>
            <CardDescription>Filter by status, assignment, tenant, property, worker. Update status and assign worker from actions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 xl:grid-cols-6">
              <Input value={search} onChange={(event) => setSearch(event.target.value ?? "")} placeholder="Search ticket, tenant, worker" />
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="all">All status</option>
                {["open","assigned","in_progress","waiting_parts","completed","cancelled","escalated"].map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <select value={assignedFilter} onChange={(event) => setAssignedFilter(event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="all">All assignment</option>
                <option value="unassigned">Unassigned</option>
                <option value="assigned">Assigned</option>
              </select>
              <select value={propertyFilter} onChange={(event) => setPropertyFilter(event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="all">All properties</option>
                {propertyList.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
              </select>
              <select value={tenantFilter} onChange={(event) => setTenantFilter(event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="all">All tenants</option>
                {tenantList.map((item) => <option key={item._id} value={item._id}>{item.fullName}</option>)}
              </select>
              <select value={workerFilter} onChange={(event) => setWorkerFilter(event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="all">All workers</option>
                {workerList.map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}
              </select>
            </div>

            <div className="overflow-hidden rounded-2xl border">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Ticket</TableHead>
                    <TableHead>Property / unit</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Worker</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedTickets.length ? pagedTickets.map((ticket: TicketItem) => {
                    const property = ticket.propertyId ? propertyMap.get(ticket.propertyId) : null
                    const unit = ticket.unitId ? unitMap.get(ticket.unitId) : null
                    const tenant = ticket.tenantId ? tenantMap.get(ticket.tenantId) : null
                    const assignedWorker = ticket.assignedTo ? workerMap.get(ticket.assignedTo) : null

                    return (
                      <TableRow key={ticket._id}>
                        <TableCell className="min-w-56">
                          <div>
                            <p className="font-medium text-slate-950">{ticket.title}</p>
                            <p className="mt-1 whitespace-normal text-xs text-slate-500">{ticket.description}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <Badge variant="outline">{ticket.category}</Badge>
                              <Badge variant="secondary">{ticket.priority}</Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="min-w-40">
                          <p className="font-medium text-slate-950">{property?.name ?? "No property"}</p>
                          <p className="mt-1 text-xs text-slate-500">{unit?.unitNumber ?? "No unit"}</p>
                        </TableCell>
                        <TableCell className="min-w-40">
                          <p className="font-medium text-slate-950">{tenant?.fullName ?? "No tenant"}</p>
                          <p className="mt-1 text-xs text-slate-500">{tenant?.email ?? ""}</p>
                        </TableCell>
                        <TableCell>
                          <Badge>{ticket.status}</Badge>
                        </TableCell>
                        <TableCell className="min-w-44">
                          <p className="font-medium text-slate-950">{assignedWorker?.fullName ?? "Unassigned"}</p>
                          <p className="mt-1 text-xs text-slate-500">{assignedWorker?.email ?? ""}</p>
                        </TableCell>
                        <TableCell>{ticket.priority}</TableCell>
                        <TableCell className="min-w-56">
                          <div className="grid gap-2">
                            <Select
                              value={ticket.status}
                              onValueChange={(value) =>
                                updateTicket.mutate({ id: ticket._id, payload: { status: value } })
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  {["open","assigned","in_progress","waiting_parts","completed","cancelled","escalated"].map((item) => (
                                    <SelectItem key={item} value={item}>{item}</SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full justify-start"
                              onClick={() => {
                                setSelectedTicketId(ticket._id)
                                setSelectedAssignWorkerId(ticket.assignedTo ?? "")
                                setAssignWorkerSearch("")
                                setIsAssignSheetOpen(true)
                              }}
                            >
                              {assignedWorker ? `Manage: ${assignedWorker.fullName}` : "Manage ticket"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  }) : (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-sm text-slate-500">
                        No tickets match filter.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <PaginationControls page={page} total={filteredTickets.length} pageSize={pageSize} onPageChange={setPage} />
          </CardContent>
        </Card>
      </WithBone>

      <Sheet open={isAssignSheetOpen} onOpenChange={setIsAssignSheetOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:!w-[40rem] sm:!max-w-[40rem]">
          <SheetHeader>
            <SheetTitle>Manage ticket</SheetTitle>
            <SheetDescription>
              {selectedTicket ? `Schedule, estimate, and assign worker for "${selectedTicket.title}"` : "Manage ticket"}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4 pb-6">
            {selectedTicket ? (
              <>
                <div className="rounded-xl border bg-slate-50 p-4 text-sm">
                  <p className="font-medium text-slate-950">{selectedTicket.title}</p>
                  <p className="mt-1 text-slate-600">{selectedTicket.description}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="outline">{selectedTicket.status}</Badge>
                    <Badge variant="secondary">{selectedTicket.priority}</Badge>
                    <Badge>{selectedTicket.category}</Badge>
                  </div>
                </div>
                <AuditStamp item={selectedTicket} />
              </>
            ) : null}

            <div className="grid gap-3 md:grid-cols-3">
              <Field>
                <FieldLabel>Status</FieldLabel>
                <Select value={manageStatus} onValueChange={(value) => setManageStatus(value ?? "open")}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {["open","assigned","in_progress","waiting_parts","completed","cancelled","escalated"].map((item) => (
                        <SelectItem key={item} value={item}>{item}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Schedule date</FieldLabel>
                <Input type="date" value={manageScheduledDate} onChange={(event) => setManageScheduledDate(event.target.value ?? "")} />
              </Field>
              <Field>
                <FieldLabel>Due date</FieldLabel>
                <Input type="date" value={manageDueDate} onChange={(event) => setManageDueDate(event.target.value ?? "")} />
              </Field>
              <Field>
                <FieldLabel>Estimated cost</FieldLabel>
                <Input type="number" value={manageEstimatedCost} onChange={(event) => setManageEstimatedCost(event.target.value ?? "")} />
              </Field>
            </div>

            <Field>
              <FieldLabel>Instruction for worker</FieldLabel>
              <Textarea
                value={manageOwnerNote}
                onChange={(event) => setManageOwnerNote(event.target.value ?? "")}
                placeholder="Access from back gate, call tenant first, bring ladder, check meter..."
              />
            </Field>

            <Input
              value={assignWorkerSearch}
              onChange={(event) => setAssignWorkerSearch(event.target.value ?? "")}
              placeholder="Search worker by name, email, phone"
            />

            <div className="max-h-[60vh] space-y-3 overflow-y-auto">
              {assignWorkerResults.length ? assignWorkerResults.map((worker) => {
                const selected = selectedAssignWorkerId === worker.id
                return (
                  <button
                    key={worker.id}
                    type="button"
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      selected ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white"
                    }`}
                    onClick={() => setSelectedAssignWorkerId(worker.id)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-950">{worker.fullName}</p>
                        <p className="text-sm text-slate-600">{worker.email}</p>
                        <p className="text-xs text-slate-500">{worker.phoneNumber}</p>
                      </div>
                      <Badge variant={selected ? "default" : "outline"}>
                        {selected ? "Selected" : "Select"}
                      </Badge>
                    </div>
                  </button>
                )
              }) : (
                <div className="rounded-xl border border-dashed p-4 text-sm text-slate-500">
                  No worker match search.
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                disabled={!selectedTicketId || updateTicket.isPending || assignTicket.isPending}
                onClick={async () => {
                  updateTicket.mutate({
                    id: selectedTicketId,
                    payload: {
                      status: manageStatus,
                      scheduledDate: manageScheduledDate ? new Date(manageScheduledDate).toISOString() : undefined,
                      dueDate: manageDueDate ? new Date(manageDueDate).toISOString() : undefined,
                      estimatedCost: manageEstimatedCost ? Number(manageEstimatedCost) : undefined,
                    },
                  })

                  if (manageOwnerNote.trim()) {
                    addTicketNote.mutate({
                      id: selectedTicketId,
                      content: manageOwnerNote.trim(),
                    })
                  }

                  if (selectedAssignWorkerId && selectedTicket?.assignedTo !== selectedAssignWorkerId) {
                    assignTicket.mutate(
                      { ticketId: selectedTicketId, assignedTo: selectedAssignWorkerId },
                      {
                        onSuccess: () => {
                          setIsAssignSheetOpen(false)
                          setSelectedTicketId("")
                          setSelectedAssignWorkerId("")
                          setAssignWorkerSearch("")
                        },
                      }
                    )
                    return
                  }

                  setIsAssignSheetOpen(false)
                  setSelectedTicketId("")
                  setSelectedAssignWorkerId("")
                  setAssignWorkerSearch("")
                }}
              >
                {assignTicket.isPending || updateTicket.isPending ? "Saving..." : "Save ticket flow"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAssignSheetOpen(false)
                  setSelectedTicketId("")
                  setSelectedAssignWorkerId("")
                  setAssignWorkerSearch("")
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
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
    estimatedCost: "",
    actualCost: "",
    currency: "usd",
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
              estimatedCost: Number(form.estimatedCost || "0") || undefined,
              actualCost: Number(form.actualCost || "0") || undefined,
              currency: form.currency || undefined,
              priority: form.priority,
              status: form.status,
              completionProof: proofUrls,
            }, { onSuccess: () => {
              setForm({
                propertyId: "",
                unitId: "",
                ticketId: "",
                title: "",
                description: "",
                assignedTo: "",
                scheduledDate: "",
                dueDate: "",
                estimatedCost: "",
                actualCost: "",
                currency: "usd",
                priority: "medium",
                status: "open",
              })
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
              <Field><FieldLabel>Estimated cost (Optional)</FieldLabel><Input type="number" value={form.estimatedCost} onChange={(event) => setForm((current) => ({ ...current, estimatedCost: event.target.value ?? "" }))} /></Field>
              <Field><FieldLabel>Actual cost (Optional)</FieldLabel><Input type="number" value={form.actualCost} onChange={(event) => setForm((current) => ({ ...current, actualCost: event.target.value ?? "" }))} /></Field>
              <Field><FieldLabel>Currency</FieldLabel><Select value={form.currency} onValueChange={(value) => setForm((current) => ({ ...current, currency: value ?? "usd" }))}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{STRIPE_CURRENCY_OPTIONS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
              <UploadCollectionField label="Completion proof" accept="image/*,.pdf,.doc,.docx" kind="file" values={proofUrls} onChange={setProofUrls} />
            </FieldGroup>
            <Button type="submit" disabled={createWorkOrder.isPending || !form.propertyId || !form.title || !form.description}>Create work order</Button>
          </form>
        </CreateSheet>
      </div>
      <WithBone name="owner-page-work-orders" loading={workOrders.isLoading} fallback={<DashboardTableSkeleton />}>
        <Card className="shadow-none"><CardHeader><CardTitle>Work orders</CardTitle><CardDescription>Open, scheduled, and cost-tracked work.</CardDescription></CardHeader><CardContent className="space-y-3">{workOrderList.length ? workOrderList.map((item) => <div key={item._id} className="rounded-xl border p-4"><div className="flex flex-wrap gap-2"><p className="font-medium text-slate-950">{item.title}</p><Badge variant="outline">{item.status}</Badge></div><p className="mt-2 text-sm text-slate-600">{item.description}</p><div className="mt-3 grid gap-3 rounded-xl bg-slate-50 p-3 text-sm sm:grid-cols-3"><div><p className="text-xs uppercase tracking-wide text-slate-500">Estimated</p><p className="font-medium text-slate-950">{formatMoney(item.estimatedCost ?? 0, (item.currency ?? "usd").toUpperCase())}</p></div><div><p className="text-xs uppercase tracking-wide text-slate-500">Actual</p><p className="font-medium text-slate-950">{formatMoney(item.actualCost ?? 0, (item.currency ?? "usd").toUpperCase())}</p></div><div><p className="text-xs uppercase tracking-wide text-slate-500">Due</p><p className="font-medium text-slate-950">{item.dueDate ? new Date(item.dueDate).toLocaleDateString() : "No due date"}</p></div></div></div>) : <Empty><EmptyHeader><EmptyMedia variant="icon"><ClipboardCheck /></EmptyMedia><EmptyTitle>No work orders yet</EmptyTitle><EmptyDescription>Create first work order from top sheet.</EmptyDescription></EmptyHeader></Empty>}</CardContent></Card>
      </WithBone>
    </div>
  )
}

export function TenantOwnerRecurringPage() {
  const properties = useOwnerPropertiesQuery()
  const units = useOwnerUnitsQuery()
  const users = useOwnerUsersQuery()
  const recurring = useOwnerRecurringMaintenancesQuery()
  const createRecurring = useOwnerCreateRecurringMaintenanceMutation()
  const updateRecurring = useOwnerUpdateRecurringMaintenanceMutation()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const propertyList = Array.isArray(properties.data) ? properties.data : []
  const unitList = Array.isArray(units.data) ? units.data : []
  const workerList = Array.isArray(users.data) ? users.data.filter((user) => user.role === "worker") : []
  const recurringList = Array.isArray(recurring.data) ? recurring.data : []
  const [form, setForm] = useState({ propertyId: "", unitId: "", title: "", description: "", frequency: "monthly", nextRunAt: "", assignedTo: "", estimatedCost: "", actualCost: "", currency: "usd", isActive: true })

  return (
    <div className="space-y-6">
        <OwnerPageHero icon={Repeat} badge="Recurring" title="Recurring maintenance" body="Schedule repeating maintenance, assign worker, then receive worker run reports back here." />
      <div className="flex justify-end">
        <CreateSheet open={isCreateOpen} onOpenChange={setIsCreateOpen} title="Create recurring maintenance" description="Set frequency and next run date." triggerLabel="Add recurring">
          <form className="space-y-4" onSubmit={(event) => {
            event.preventDefault()
              createRecurring.mutate({ ...form, unitId: form.unitId || undefined, assignedTo: form.assignedTo || undefined, estimatedCost: Number(form.estimatedCost || "0") || undefined, actualCost: Number(form.actualCost || "0") || undefined, currency: form.currency || undefined }, { onSuccess: () => {
                setForm({ propertyId: "", unitId: "", title: "", description: "", frequency: "monthly", nextRunAt: "", assignedTo: "", estimatedCost: "", actualCost: "", currency: "usd", isActive: true })
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
                <Field><FieldLabel>Assign worker (Optional)</FieldLabel><Select value={form.assignedTo} onValueChange={(value) => setForm((current) => ({ ...current, assignedTo: value ?? "" }))}><SelectTrigger className="w-full"><SelectValue placeholder="Select worker" /></SelectTrigger><SelectContent><SelectGroup>{workerList.map((user) => <SelectItem key={user.id} value={user.id}>{user.fullName}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
                <Field><FieldLabel>Estimated cost (Optional)</FieldLabel><Input type="number" value={form.estimatedCost} onChange={(event) => setForm((current) => ({ ...current, estimatedCost: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Actual cost (Optional)</FieldLabel><Input type="number" value={form.actualCost} onChange={(event) => setForm((current) => ({ ...current, actualCost: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Currency</FieldLabel><Select value={form.currency} onValueChange={(value) => setForm((current) => ({ ...current, currency: value ?? "usd" }))}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{STRIPE_CURRENCY_OPTIONS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
              </FieldGroup>
              <Button type="submit" disabled={createRecurring.isPending || !form.propertyId || !form.title || !form.nextRunAt}>Create recurring maintenance</Button>
            </form>
          </CreateSheet>
        </div>
        <WithBone name="owner-page-recurring" loading={recurring.isLoading} fallback={<DashboardTableSkeleton />}>
          <Card className="shadow-none"><CardHeader><CardTitle>Recurring plans</CardTitle><CardDescription>Assigned worker and latest run report show here.</CardDescription></CardHeader><CardContent className="space-y-3">{recurringList.length ? recurringList.map((item) => {
            const assignedWorker = workerList.find((user) => user.id === item.assignedTo)
            const latestRun = [...(item.runHistory ?? [])].sort((left, right) => new Date(right.reportedAt ?? "").getTime() - new Date(left.reportedAt ?? "").getTime())[0]
            return <div key={item._id} className="rounded-xl border p-4"><div className="flex flex-wrap gap-2"><p className="font-medium text-slate-950">{item.title}</p><Badge variant="outline">{item.frequency}</Badge><Badge variant={item.assignedTo ? "default" : "secondary"}>{assignedWorker?.fullName ?? "Unassigned"}</Badge><Badge variant={item.paymentStatus === "paid" ? "default" : "secondary"}>{item.paymentStatus ?? "unpaid"}</Badge></div><p className="mt-2 text-sm text-slate-600">{item.description ?? "No description"}</p><div className="mt-3 grid gap-3 rounded-xl bg-slate-50 p-3 text-sm sm:grid-cols-5"><div><p className="text-xs uppercase tracking-wide text-slate-500">Next run</p><p className="font-medium text-slate-950">{item.nextRunAt ? new Date(item.nextRunAt).toLocaleDateString() : "No date"}</p></div><div><p className="text-xs uppercase tracking-wide text-slate-500">Latest status</p><p className="font-medium text-slate-950">{latestRun?.status ?? "No report"}</p></div><div><p className="text-xs uppercase tracking-wide text-slate-500">Reported at</p><p className="font-medium text-slate-950">{latestRun?.reportedAt ? new Date(latestRun.reportedAt).toLocaleDateString() : "No report yet"}</p></div><div><p className="text-xs uppercase tracking-wide text-slate-500">Estimated</p><p className="font-medium text-slate-950">{formatMoney(item.estimatedCost ?? 0, (item.currency ?? "usd").toUpperCase())}</p></div><div><p className="text-xs uppercase tracking-wide text-slate-500">Actual</p><p className="font-medium text-slate-950">{formatMoney(item.actualCost ?? 0, (item.currency ?? "usd").toUpperCase())}</p></div></div><div className="mt-3 rounded-xl border bg-white p-3"><p className="text-xs uppercase tracking-wide text-slate-500">Latest worker note</p><p className="mt-1 text-sm text-slate-700">{latestRun?.note ?? "Worker has not submitted report yet."}</p></div><div className="mt-3"><AuditStamp item={item} /></div>{latestRun?.status === "completed" ? <div className="mt-3 flex flex-wrap gap-2"><Button type="button" size="sm" variant={item.paymentStatus === "paid" ? "default" : "outline"} onClick={() => updateRecurring.mutate({ id: item._id, payload: { paymentStatus: "paid" } })}>Paid</Button><Button type="button" size="sm" variant={item.paymentStatus === "unpaid" ? "default" : "outline"} onClick={() => updateRecurring.mutate({ id: item._id, payload: { paymentStatus: "unpaid" } })}>Unpaid</Button></div> : null}</div>
          }) : <Empty><EmptyHeader><EmptyMedia variant="icon"><Repeat /></EmptyMedia><EmptyTitle>No recurring maintenance yet</EmptyTitle><EmptyDescription>Create first recurring maintenance from top sheet.</EmptyDescription></EmptyHeader></Empty>}</CardContent></Card>
        </WithBone>
      </div>
    )
  }

export function TenantOwnerInspectionsPage() {
  const properties = useOwnerPropertiesQuery()
  const units = useOwnerUnitsQuery()
  const users = useOwnerUsersQuery()
  const inspections = useOwnerInspectionsQuery()
  const createInspection = useOwnerCreateInspectionMutation()
  const updateInspection = useOwnerUpdateInspectionMutation()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const propertyList = Array.isArray(properties.data) ? properties.data : []
  const unitList = Array.isArray(units.data) ? units.data : []
  const workerList = Array.isArray(users.data) ? users.data.filter((user) => user.role === "worker") : []
  const inspectionList = Array.isArray(inspections.data) ? inspections.data : []
  const [form, setForm] = useState({ propertyId: "", unitId: "", type: "routine", scheduledAt: "", assignedTo: "", estimatedCost: "", actualCost: "", currency: "usd", checklist: "", damageReport: "", notes: "", completed: false })

  return (
    <div className="space-y-6">
        <OwnerPageHero icon={ClipboardCheck} badge="Inspection" title="Inspections" body="Assign inspection to worker, then review worker report, photos, and completion here." />
      <div className="flex justify-end">
        <CreateSheet open={isCreateOpen} onOpenChange={setIsCreateOpen} title="Create inspection" description="Add checklist and upload photos." triggerLabel="Add inspection">
          <form className="space-y-4" onSubmit={(event) => {
            event.preventDefault()
            createInspection.mutate({
                propertyId: form.propertyId,
                unitId: form.unitId || undefined,
                type: form.type,
                scheduledAt: form.scheduledAt,
                assignedTo: form.assignedTo || undefined,
                estimatedCost: Number(form.estimatedCost || "0") || undefined,
                actualCost: Number(form.actualCost || "0") || undefined,
                currency: form.currency || undefined,
                checklist: splitCsv(form.checklist),
                photos: photoUrls,
                damageReport: form.damageReport || undefined,
                notes: form.notes || undefined,
                completed: form.completed,
              }, { onSuccess: () => {
                setForm({ propertyId: "", unitId: "", type: "routine", scheduledAt: "", assignedTo: "", estimatedCost: "", actualCost: "", currency: "usd", checklist: "", damageReport: "", notes: "", completed: false })
                setPhotoUrls([])
                setIsCreateOpen(false)
              }})
          }}>
            <FieldGroup>
              <Field><FieldLabel>Property</FieldLabel><Select value={form.propertyId} onValueChange={(value) => setForm((current) => ({ ...current, propertyId: value ?? "" }))}><SelectTrigger className="w-full"><SelectValue placeholder="Select property" /></SelectTrigger><SelectContent><SelectGroup>{propertyList.map((property) => <SelectItem key={property._id} value={property._id}>{property.name}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
              <Field><FieldLabel>Unit (Optional)</FieldLabel><Select value={form.unitId} onValueChange={(value) => setForm((current) => ({ ...current, unitId: value ?? "" }))}><SelectTrigger className="w-full"><SelectValue placeholder="Select unit" /></SelectTrigger><SelectContent><SelectGroup>{unitList.map((unit) => <SelectItem key={unit._id} value={unit._id}>{unit.unitNumber}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
                <Field><FieldLabel>Type</FieldLabel><Select value={form.type} onValueChange={(value) => setForm((current) => ({ ...current, type: value ?? "routine" }))}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{["move_in","move_out","routine"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
                <Field><FieldLabel>Scheduled date</FieldLabel><Input type="date" value={form.scheduledAt} onChange={(event) => setForm((current) => ({ ...current, scheduledAt: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Assign worker (Optional)</FieldLabel><Select value={form.assignedTo} onValueChange={(value) => setForm((current) => ({ ...current, assignedTo: value ?? "" }))}><SelectTrigger className="w-full"><SelectValue placeholder="Select worker" /></SelectTrigger><SelectContent><SelectGroup>{workerList.map((user) => <SelectItem key={user.id} value={user.id}>{user.fullName}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
                <Field><FieldLabel>Estimated cost (Optional)</FieldLabel><Input type="number" value={form.estimatedCost} onChange={(event) => setForm((current) => ({ ...current, estimatedCost: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Actual cost (Optional)</FieldLabel><Input type="number" value={form.actualCost} onChange={(event) => setForm((current) => ({ ...current, actualCost: event.target.value ?? "" }))} /></Field>
                <Field><FieldLabel>Currency</FieldLabel><Select value={form.currency} onValueChange={(value) => setForm((current) => ({ ...current, currency: value ?? "usd" }))}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{STRIPE_CURRENCY_OPTIONS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
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
          <Card className="shadow-none"><CardHeader><CardTitle>Inspections</CardTitle><CardDescription>Assigned worker, worker report, and cost tracking now visible here.</CardDescription></CardHeader><CardContent className="space-y-3">{inspectionList.length ? inspectionList.map((item) => {
            const assignedWorker = workerList.find((user) => user.id === item.assignedTo)
            return <div key={item._id} className="rounded-xl border p-4"><div className="flex flex-wrap gap-2"><p className="font-medium text-slate-950">{item.type}</p><Badge variant={item.completed ? "default" : "outline"}>{item.completed ? "Done" : "Pending"}</Badge><Badge variant={item.assignedTo ? "default" : "secondary"}>{assignedWorker?.fullName ?? "Unassigned"}</Badge><Badge variant={item.paymentStatus === "paid" ? "default" : "secondary"}>{item.paymentStatus ?? "unpaid"}</Badge></div><p className="mt-2 text-sm text-slate-600">{item.scheduledAt ? new Date(item.scheduledAt).toLocaleDateString() : "No date"}</p><div className="mt-3 grid gap-3 rounded-xl bg-slate-50 p-3 text-sm sm:grid-cols-4"><div><p className="text-xs uppercase tracking-wide text-slate-500">Worker report</p><p className="font-medium text-slate-950">{item.workerReport ?? "No report yet"}</p></div><div><p className="text-xs uppercase tracking-wide text-slate-500">Reported at</p><p className="font-medium text-slate-950">{item.workerReportedAt ? new Date(item.workerReportedAt).toLocaleDateString() : "Not submitted"}</p></div><div><p className="text-xs uppercase tracking-wide text-slate-500">Estimated</p><p className="font-medium text-slate-950">{formatMoney(item.estimatedCost ?? 0, (item.currency ?? "usd").toUpperCase())}</p></div><div><p className="text-xs uppercase tracking-wide text-slate-500">Actual</p><p className="font-medium text-slate-950">{formatMoney(item.actualCost ?? 0, (item.currency ?? "usd").toUpperCase())}</p></div></div><div className="mt-3 rounded-xl border bg-white p-3"><p className="text-xs uppercase tracking-wide text-slate-500">Damage report</p><p className="mt-1 text-sm text-slate-700">{item.damageReport ?? "No damage report"}</p></div><div className="mt-3"><AuditStamp item={item} /></div>{item.completed ? <div className="mt-3 flex flex-wrap gap-2"><Button type="button" size="sm" variant={item.paymentStatus === "paid" ? "default" : "outline"} onClick={() => updateInspection.mutate({ id: item._id, payload: { paymentStatus: "paid" } })}>Paid</Button><Button type="button" size="sm" variant={item.paymentStatus === "unpaid" ? "default" : "outline"} onClick={() => updateInspection.mutate({ id: item._id, payload: { paymentStatus: "unpaid" } })}>Unpaid</Button></div> : null}</div>
          }) : <Empty><EmptyHeader><EmptyMedia variant="icon"><ClipboardCheck /></EmptyMedia><EmptyTitle>No inspections yet</EmptyTitle><EmptyDescription>Create first inspection from top sheet.</EmptyDescription></EmptyHeader></Empty>}</CardContent></Card>
        </WithBone>
      </div>
    )
  }

export function TenantOwnerSettingsPage() {
  const { data: me, isLoading } = useMeQuery()
  const [stripeStatus, setStripeStatus] = useState<{
    configured: boolean
    publishableKeyConfigured: boolean
    defaultCurrency: string
    last4?: string | null
    maskedSecretKey?: string | null
    maskedPublishableKey?: string | null
  } | null>(null)
  const [stripeForm, setStripeForm] = useState({
    secretKey: "",
    publishableKey: "",
    defaultCurrency: "usd",
  })
  const [stripeBusy, setStripeBusy] = useState(false)

  useEffect(() => {
    let active = true

    const loadStripeStatus = async () => {
      const [data, error] = await getRequest<
        ApiSuccessResponse<{
          configured: boolean
          publishableKeyConfigured: boolean
          defaultCurrency: string
          last4?: string | null
          maskedSecretKey?: string | null
          maskedPublishableKey?: string | null
        }>
      >("/organization/my/stripe-settings")

      const payload = (data as ApiSuccessResponse<any> | null)?.data ?? data

      if (!active || error || !payload) return
      setStripeStatus(payload)
      setStripeForm((current) => ({
        ...current,
        defaultCurrency: payload.defaultCurrency ?? "usd",
      }))
    }

    if (me?.organizationId) {
      loadStripeStatus()
    }

    return () => {
      active = false
    }
  }, [me?.organizationId])

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

          <Card className="shadow-none xl:col-span-2">
            <CardHeader>
              <CardTitle>Stripe payout settings</CardTitle>
              <CardDescription>Saved Stripe values stay masked but readable. Currency-only update also works now.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant={stripeStatus?.configured ? "default" : "outline"}>
                  {stripeStatus?.configured ? "Secret saved" : "No secret"}
                </Badge>
                <Badge variant={stripeStatus?.publishableKeyConfigured ? "default" : "outline"}>
                  {stripeStatus?.publishableKeyConfigured ? "Publishable key saved" : "No publishable key"}
                </Badge>
                <Badge variant="secondary">{stripeStatus?.defaultCurrency?.toUpperCase() ?? "USD"}</Badge>
                {stripeStatus?.last4 ? <Badge variant="outline">Key ending {stripeStatus.last4}</Badge> : null}
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Saved secret key</p>
                  <p className="mt-1 break-all font-medium text-slate-950">{stripeStatus?.maskedSecretKey ?? "Not saved"}</p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Saved publishable key</p>
                  <p className="mt-1 break-all font-medium text-slate-950">{stripeStatus?.maskedPublishableKey ?? "Not saved"}</p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Saved currency</p>
                  <p className="mt-1 font-medium text-slate-950">{stripeStatus?.defaultCurrency?.toUpperCase() ?? "USD"}</p>
                </div>
              </div>
              <form
                className="space-y-4"
                onSubmit={async (event) => {
                  event.preventDefault()
                  setStripeBusy(true)
                  const [data, error] = await patchRequest<
                    ApiSuccessResponse<{
                      configured: boolean
                      publishableKeyConfigured: boolean
                      defaultCurrency: string
                      last4?: string | null
                      maskedSecretKey?: string | null
                      maskedPublishableKey?: string | null
                    }>,
                    typeof stripeForm
                  >("/organization/my/stripe-settings", stripeForm)

                  setStripeBusy(false)
                  const payload = (data as ApiSuccessResponse<any> | null)?.data ?? data

                  if (error || !payload) {
                    toast.error(error?.message ?? "Stripe settings save failed")
                    return
                  }

                  setStripeStatus(payload)
                  setStripeForm((current) => ({
                    ...current,
                    secretKey: "",
                    publishableKey: "",
                    defaultCurrency: payload.defaultCurrency ?? current.defaultCurrency,
                  }))
                  toast.success("Stripe settings saved")
                }}
              >
                <FieldGroup>
                  <Field>
                    <FieldLabel>Secret key</FieldLabel>
                    <Input
                      type="password"
                      placeholder="sk_live_..."
                      value={stripeForm.secretKey}
                      onChange={(event) => setStripeForm((current) => ({ ...current, secretKey: event.target.value ?? "" }))}
                    />
                    <FieldDescription>Leave empty to keep current saved secret key.</FieldDescription>
                  </Field>
                  <Field>
                    <FieldLabel>Publishable key (Optional)</FieldLabel>
                    <Input
                      placeholder="pk_live_..."
                      value={stripeForm.publishableKey}
                      onChange={(event) => setStripeForm((current) => ({ ...current, publishableKey: event.target.value ?? "" }))}
                    />
                    <FieldDescription>Leave empty to keep current saved publishable key.</FieldDescription>
                  </Field>
                  <Field>
                    <FieldLabel>Default currency</FieldLabel>
                    <Select value={stripeForm.defaultCurrency} onValueChange={(value) => setStripeForm((current) => ({ ...current, defaultCurrency: value ?? "usd" }))}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {STRIPE_CURRENCY_OPTIONS.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                </FieldGroup>
                <Button type="submit" disabled={stripeBusy || !me?.organizationId}>
                  {stripeBusy ? "Saving..." : "Save Stripe settings"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </WithBone>
    </div>
  )
}
