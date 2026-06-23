"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { BriefcaseBusiness, CheckCircle2, Send } from "lucide-react"
import { getRequest, postRequest } from "@/api-hooks/api-hooks"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { ApiSuccessResponse } from "@/lib/types/api"

type PublicVendorRequest = {
  _id: string
  title: string
  description?: string | null
  budgetAmount?: number | null
  currency: string
  dueDate?: string | null
  attachments?: string[]
  status: string
}

function dateLabel(value?: string | null) {
  if (!value) return "No due date"
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? "No due date" : parsed.toLocaleDateString()
}

export default function PublicVendorQuotePage() {
  const params = useParams<{ requestId: string }>()
  const requestId = params.requestId
  const [request, setRequest] = useState<PublicVendorRequest | null>(null)
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({
    vendorName: "",
    vendorEmail: "",
    vendorPhone: "",
    amount: "",
    currency: "USD",
    timeline: "",
    paymentTerms: "",
    proposalNote: "",
  })

  useEffect(() => {
    let active = true
    const load = async () => {
      const [data, error] = await getRequest<ApiSuccessResponse<PublicVendorRequest>>(`/public-vendor-quote/${requestId}`)
      if (!active) return
      if (error || !data?.data) {
        setMessage(error?.message ?? "Quote request not found")
        return
      }
      setRequest(data.data)
      setForm((current) => ({ ...current, currency: data.data.currency ?? "USD" }))
    }
    load()
    return () => {
      active = false
    }
  }, [requestId])

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    const payload = {
      vendorName: form.vendorName,
      vendorEmail: form.vendorEmail,
      vendorPhone: form.vendorPhone || undefined,
      amount: Number(form.amount || "0"),
      currency: form.currency || request?.currency || "USD",
      timeline: form.timeline || undefined,
      paymentTerms: form.paymentTerms || undefined,
      proposalNote: form.proposalNote || undefined,
    }
    const [data, error] = await postRequest<ApiSuccessResponse<{ submissionId: string }>, typeof payload>(
      `/public-vendor-quote/${requestId}/submissions`,
      payload
    )
    setBusy(false)

    if (error || !data?.data) {
      setMessage(error?.message ?? "Quote submit failed")
      return
    }

    setMessage(`Quote submitted. Ref: ${data.data.submissionId}`)
    setForm({
      vendorName: "",
      vendorEmail: "",
      vendorPhone: "",
      amount: "",
      currency: request?.currency ?? "USD",
      timeline: "",
      paymentTerms: "",
      proposalNote: "",
    })
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 text-slate-950 md:p-8">
      <div className="mx-auto max-w-4xl space-y-5">
        <section className="rounded-2xl border bg-white p-5">
          <Badge variant="outline">Vendor quote request</Badge>
          <div className="mt-4 flex items-start gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <BriefcaseBusiness className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">{request?.title ?? "Quote request"}</h1>
              <p className="mt-1 text-sm text-slate-600">{request?.description ?? "Submit your price and terms below."}</p>
              {request ? <p className="mt-2 text-sm text-slate-500">Budget: {request.currency} {request.budgetAmount ?? "Open"} - Due {dateLabel(request.dueDate)}</p> : null}
            </div>
          </div>
        </section>

        {message ? (
          <div className="flex items-center gap-2 rounded-xl border bg-white p-3 text-sm text-slate-700">
            <CheckCircle2 className="size-4 text-emerald-600" />
            {message}
          </div>
        ) : null}

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Submit vendor proposal</CardTitle>
            <CardDescription>Owner will compare submissions and selected/rejected vendors get message.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={submit}>
              <FieldGroup>
                <div className="grid gap-3 md:grid-cols-3">
                  <Field><FieldLabel>Vendor name</FieldLabel><Input value={form.vendorName} onChange={(event) => setForm((current) => ({ ...current, vendorName: event.target.value }))} required /></Field>
                  <Field><FieldLabel>Email</FieldLabel><Input type="email" value={form.vendorEmail} onChange={(event) => setForm((current) => ({ ...current, vendorEmail: event.target.value }))} required /></Field>
                  <Field><FieldLabel>Phone</FieldLabel><Input value={form.vendorPhone} onChange={(event) => setForm((current) => ({ ...current, vendorPhone: event.target.value }))} /></Field>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <Field><FieldLabel>Amount</FieldLabel><Input type="number" min="0" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} required /></Field>
                  <Field><FieldLabel>Currency</FieldLabel><Input value={form.currency} onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value }))} /></Field>
                  <Field><FieldLabel>Timeline</FieldLabel><Input placeholder="3 days" value={form.timeline} onChange={(event) => setForm((current) => ({ ...current, timeline: event.target.value }))} /></Field>
                </div>
                <Field><FieldLabel>Payment terms</FieldLabel><Input placeholder="50% advance, 50% after completion" value={form.paymentTerms} onChange={(event) => setForm((current) => ({ ...current, paymentTerms: event.target.value }))} /></Field>
                <Field><FieldLabel>Proposal note</FieldLabel><Textarea value={form.proposalNote} onChange={(event) => setForm((current) => ({ ...current, proposalNote: event.target.value }))} /></Field>
                <FieldDescription>Use clear price, timeline, payment terms, and scope.</FieldDescription>
              </FieldGroup>
              <Button type="submit" disabled={busy || !request || !form.vendorName || !form.vendorEmail || !form.amount} className="bg-blue-700 text-white hover:bg-blue-800">
                <Send className="size-4" />
                {busy ? "Submitting..." : "Submit quote"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
