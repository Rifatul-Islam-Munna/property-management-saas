"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { AlertCircle, CheckCircle2, CreditCard, Send, Ticket } from "lucide-react"
import { getRequest, postRequest } from "@/api-hooks/api-hooks"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { ApiSuccessResponse } from "@/lib/types/api"

type PublicBill = {
  _id: string
  kind: string
  title: string
  description?: string | null
  amount: number
  currency?: string | null
  monthKey?: string | null
  dueDate?: string | null
  status: string
  paidAt?: string | null
  stripeHostedInvoiceUrl?: string | null
  stripeInvoicePdf?: string | null
}

type PublicPortal = {
  tenant: {
    id: string
    fullName: string
    tenantKind?: string
    email?: string
    phone?: string
    monthlyRent?: number | null
    rentDueDay?: number | null
    oneTimeGuestFee?: number | null
    guestFeePaid?: boolean
  }
  organization: {
    name: string
    logo?: string | null
    stripeConfigured: boolean
    currency: string
  }
  property?: {
    name: string
    contactPhone?: string | null
    contactEmail?: string | null
  } | null
  unit?: { unitNumber: string } | null
  bills: PublicBill[]
}

const ticketCategories = [
  "plumbing",
  "electrical",
  "hvac",
  "cleaning",
  "appliance",
  "security",
  "internet",
  "structural",
  "general",
]

function money(value?: number | null, currency = "USD") {
  return `${currency.toUpperCase()} ${value ?? 0}`
}

function dateLabel(value?: string | null) {
  if (!value) return "No date"
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? "No date" : parsed.toLocaleDateString()
}

export default function PublicTenantPage() {
  const params = useParams<{ tenantId: string }>()
  const searchParams = useSearchParams()
  const tenantId = params.tenantId
  const [portal, setPortal] = useState<PublicPortal | null>(null)
  const [loading, setLoading] = useState(true)
  const [payingBillId, setPayingBillId] = useState("")
  const [message, setMessage] = useState("")
  const [ticketBusy, setTicketBusy] = useState(false)
  const [ticketForm, setTicketForm] = useState({
    title: "",
    description: "",
    category: "general",
    priority: "medium",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
  })

  const currentMonth = useMemo(() => new Date().toISOString().slice(0, 7), [])

  const loadPortal = async () => {
    setLoading(true)
    const [data, error] = await getRequest<ApiSuccessResponse<PublicPortal>>(`/public-request/tenant/${tenantId}`)
    setLoading(false)
    if (error || !data?.data) {
      setMessage(error?.message ?? "Public page not found")
      return
    }
    setPortal(data.data)
  }

  useEffect(() => {
    loadPortal()
  }, [tenantId])

  useEffect(() => {
    const sessionId = searchParams.get("session_id")
    const billId = searchParams.get("bill")
    const token = searchParams.get("token")
    if (!sessionId || !billId || !token) return

    let active = true
    const verify = async () => {
      const [data, error] = await postRequest<
        ApiSuccessResponse<{ paid: boolean }>,
        { billId: string; sessionId: string; token: string }
      >(`/public-request/tenant/${tenantId}/stripe-verify`, { billId, sessionId, token })

      if (!active) return
      setMessage(error ? error.message : data?.data?.paid ? "Payment verified. Bill marked paid." : "Payment not paid yet.")
      await loadPortal()
    }

    verify()
    return () => {
      active = false
    }
  }, [searchParams, tenantId])

  const startPayment = async (billId?: string) => {
    if (!portal?.organization.stripeConfigured) {
      setMessage("Stripe not configured by property owner.")
      return
    }

    setPayingBillId(billId ?? "__current__")
    const baseUrl = window.location.origin
    const [data, error] = await postRequest<
      ApiSuccessResponse<{ checkoutUrl?: string }>,
      { billId?: string; monthKey?: string; successUrl: string; cancelUrl: string }
    >(`/public-request/tenant/${tenantId}/stripe-checkout`, {
      billId,
      monthKey: currentMonth,
      successUrl: `${baseUrl}/public/tenant/${tenantId}`,
      cancelUrl: `${baseUrl}/public/tenant/${tenantId}`,
    })
    setPayingBillId("")

    if (error || !data?.data?.checkoutUrl) {
      setMessage(error?.message ?? "Checkout failed")
      return
    }

    window.location.href = data.data.checkoutUrl
  }

  const submitTicket = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setTicketBusy(true)
    const payload = {
      title: ticketForm.title,
      description: ticketForm.description,
      category: ticketForm.category,
      priority: ticketForm.priority,
      contactName: ticketForm.contactName || undefined,
      contactEmail: ticketForm.contactEmail || undefined,
      contactPhone: ticketForm.contactPhone || undefined,
    }
    const [data, error] = await postRequest<ApiSuccessResponse<{ _id: string }>, typeof payload>(
      `/public-request/tenant/${tenantId}/tickets`,
      payload
    )
    setTicketBusy(false)

    if (error || !data?.data) {
      setMessage(error?.message ?? "Ticket failed")
      return
    }

    setMessage(`Ticket submitted: ${data.data._id}`)
    setTicketForm({
      title: "",
      description: "",
      category: "general",
      priority: "medium",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
    })
  }

  if (loading) {
    return <main className="min-h-screen bg-slate-50 p-4 text-slate-700">Loading...</main>
  }

  if (!portal) {
    return <main className="min-h-screen bg-slate-50 p-4 text-slate-700">{message || "Not found"}</main>
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 text-slate-950 md:p-8">
      <div className="mx-auto max-w-5xl space-y-5">
        <section className="rounded-2xl border bg-white p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              {portal.organization.logo ? (
                <img src={portal.organization.logo} alt={portal.organization.name} className="mb-3 h-12 w-auto rounded-lg object-contain" />
              ) : null}
              <Badge variant="outline">Public QR portal</Badge>
              <h1 className="mt-3 text-2xl font-semibold">{portal.organization.name}</h1>
              <p className="mt-1 text-sm text-slate-600">
                {portal.tenant.fullName} - {portal.property?.name ?? "Property"} - Unit {portal.unit?.unitNumber ?? "N/A"}
              </p>
            </div>
            <Button type="button" className="bg-blue-700 text-white hover:bg-blue-800" onClick={() => startPayment()}>
              <CreditCard className="size-4" />
              Pay current month
            </Button>
          </div>
        </section>

        {message ? (
          <div className="flex items-center gap-2 rounded-xl border bg-white p-3 text-sm text-slate-700">
            {message.includes("verified") || message.includes("submitted") ? <CheckCircle2 className="size-4 text-emerald-600" /> : <AlertCircle className="size-4 text-amber-600" />}
            {message}
          </div>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Pay bill</CardTitle>
              <CardDescription>Pay rent, guest fee, utility, or extra bill by Stripe.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {portal.bills.length ? portal.bills.map((bill) => (
                <div key={bill._id} className="rounded-xl border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{bill.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{bill.kind} - Due {dateLabel(bill.dueDate)}</p>
                    </div>
                    <Badge variant={bill.status === "overdue" ? "destructive" : "outline"}>{bill.status}</Badge>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-lg font-semibold">{money(bill.amount, bill.currency ?? portal.organization.currency)}</p>
                    <Button type="button" disabled={Boolean(payingBillId)} onClick={() => startPayment(bill._id)}>
                      {payingBillId === bill._id ? "Opening..." : "Pay"}
                    </Button>
                  </div>
                </div>
              )) : (
                <div className="rounded-xl border border-dashed p-4 text-sm text-slate-600">
                  No unpaid bill found. Use current month payment button if rent or guest fee exists.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="size-5" />
                Submit ticket
              </CardTitle>
              <CardDescription>Create maintenance ticket for this tenant/unit.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={submitTicket}>
                <FieldGroup>
                  <Field>
                    <FieldLabel>Issue title</FieldLabel>
                    <Input value={ticketForm.title} onChange={(event) => setTicketForm((current) => ({ ...current, title: event.target.value }))} required />
                  </Field>
                  <Field>
                    <FieldLabel>Description</FieldLabel>
                    <Textarea value={ticketForm.description} onChange={(event) => setTicketForm((current) => ({ ...current, description: event.target.value }))} required />
                  </Field>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field>
                      <FieldLabel>Category</FieldLabel>
                      <Select value={ticketForm.category} onValueChange={(value) => setTicketForm((current) => ({ ...current, category: value ?? "general" }))}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectGroup>{ticketCategories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectGroup></SelectContent>
                      </Select>
                    </Field>
                    <Field>
                      <FieldLabel>Priority</FieldLabel>
                      <Select value={ticketForm.priority} onValueChange={(value) => setTicketForm((current) => ({ ...current, priority: value ?? "medium" }))}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectGroup>{["low", "medium", "high", "emergency"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectGroup></SelectContent>
                      </Select>
                    </Field>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <Field><FieldLabel>Name</FieldLabel><Input value={ticketForm.contactName} onChange={(event) => setTicketForm((current) => ({ ...current, contactName: event.target.value }))} /></Field>
                    <Field><FieldLabel>Email</FieldLabel><Input type="email" value={ticketForm.contactEmail} onChange={(event) => setTicketForm((current) => ({ ...current, contactEmail: event.target.value }))} /></Field>
                    <Field><FieldLabel>Phone</FieldLabel><Input value={ticketForm.contactPhone} onChange={(event) => setTicketForm((current) => ({ ...current, contactPhone: event.target.value }))} /></Field>
                  </div>
                  <FieldDescription>Ticket goes straight to property owner dashboard.</FieldDescription>
                </FieldGroup>
                <Button type="submit" disabled={ticketBusy || !ticketForm.title || !ticketForm.description} className="bg-blue-700 text-white hover:bg-blue-800">
                  <Send className="size-4" />
                  {ticketBusy ? "Submitting..." : "Submit ticket"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
