"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { AlertCircle, CheckCircle2, ImagePlus, Send, Ticket } from "lucide-react"
import { apiClient, getRequest, patchRequest } from "@/api-hooks/api-hooks"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { ApiSuccessResponse } from "@/lib/types/api"

type PublicTicket = {
  _id: string
  title: string
  description: string
  category: string
  priority: string
  status: string
  images?: string[]
  completionProof?: string[]
  completionNotes?: string | null
  comments?: { userName: string; content: string; createdAt?: string }[]
  organization?: { name: string; logo?: string | null }
  property?: { name: string; address?: string | null } | null
  unit?: { unitNumber: string } | null
  tenant?: { fullName: string } | null
}

const statuses = ["open", "assigned", "in_progress", "waiting_parts", "completed", "cancelled", "escalated"]

export default function PublicTicketPage() {
  const params = useParams<{ ticketId: string }>()
  const ticketId = params.ticketId
  const [ticket, setTicket] = useState<PublicTicket | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState("")
  const [form, setForm] = useState({ status: "in_progress", comment: "", completionNotes: "", images: [] as string[] })

  const loadTicket = async () => {
    setLoading(true)
    const [data, error] = await getRequest<ApiSuccessResponse<PublicTicket>>(`/public-request/ticket/${ticketId}`)
    setLoading(false)
    if (error || !data?.data) {
      setMessage(error?.message ?? "Ticket not found")
      return
    }
    setTicket(data.data)
    setForm((current) => ({ ...current, status: data.data.status ?? "in_progress" }))
  }

  useEffect(() => {
    loadTicket()
  }, [ticketId])

  const uploadImages = async (files: File[]) => {
    setUploading(true)
    const urls: string[] = []
    for (const file of files) {
      const formData = new FormData()
      formData.append("file", file)
      const { data } = await apiClient.post<{ url: string }>("/image/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      urls.push(data.url)
    }
    setForm((current) => ({ ...current, images: [...current.images, ...urls] }))
    setUploading(false)
  }

  const submitUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    const payload = {
      status: form.status,
      comment: form.comment || undefined,
      completionNotes: form.completionNotes || undefined,
      images: form.images,
    }
    const [data, error] = await patchRequest<ApiSuccessResponse<PublicTicket>, typeof payload>(`/public-request/ticket/${ticketId}`, payload)
    setBusy(false)
    if (error || !data?.data) {
      setMessage(error?.message ?? "Ticket update failed")
      return
    }
    setTicket(data.data)
    setMessage("Ticket updated.")
    setForm({ status: data.data.status, comment: "", completionNotes: "", images: [] })
  }

  if (loading) return <main className="min-h-screen bg-slate-50 p-4 text-slate-700">Loading...</main>
  if (!ticket) return <main className="min-h-screen bg-slate-50 p-4 text-slate-700">{message || "Not found"}</main>

  return (
    <main className="min-h-screen bg-slate-50 p-4 text-slate-950 md:p-8">
      <div className="mx-auto max-w-3xl space-y-5">
        <section className="rounded-2xl border bg-white p-5">
          {ticket.organization?.logo ? <img src={ticket.organization.logo} alt={ticket.organization.name} className="mb-3 h-12 w-auto rounded-lg object-contain" /> : null}
          <Badge variant="outline">Public ticket QR</Badge>
          <h1 className="mt-3 text-2xl font-semibold">{ticket.title}</h1>
          <p className="mt-1 text-sm text-slate-600">
            {ticket.organization?.name ?? "Property team"} - {ticket.property?.name ?? "Property"} - Unit {ticket.unit?.unitNumber ?? "N/A"}
          </p>
        </section>

        {message ? (
          <div className="flex items-center gap-2 rounded-xl border bg-white p-3 text-sm text-slate-700">
            {message.includes("updated") ? <CheckCircle2 className="size-4 text-emerald-600" /> : <AlertCircle className="size-4 text-amber-600" />}
            {message}
          </div>
        ) : null}

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Ticket className="size-5" />Ticket</CardTitle>
            <CardDescription>{ticket.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge>{ticket.status}</Badge>
              <Badge variant="outline">{ticket.category}</Badge>
              <Badge variant="secondary">{ticket.priority}</Badge>
            </div>

            <form className="space-y-4" onSubmit={submitUpdate}>
              <FieldGroup>
                <Field>
                  <FieldLabel>Status</FieldLabel>
                  <Select value={form.status} onValueChange={(value) => setForm((current) => ({ ...current, status: value ?? "in_progress" }))}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectGroup>{statuses.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectGroup></SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Update note</FieldLabel>
                  <Textarea value={form.comment} onChange={(event) => setForm((current) => ({ ...current, comment: event.target.value }))} />
                </Field>
                <Field>
                  <FieldLabel>Completion notes</FieldLabel>
                  <Textarea value={form.completionNotes} onChange={(event) => setForm((current) => ({ ...current, completionNotes: event.target.value }))} />
                </Field>
                <Field>
                  <FieldLabel>Attach images</FieldLabel>
                  <label className="flex cursor-pointer items-center justify-between rounded-xl border bg-white p-4 text-sm">
                    <span className="flex items-center gap-2"><ImagePlus className="size-4" />{uploading ? "Uploading..." : "Choose images"}</span>
                    <input className="sr-only" type="file" accept="image/*" multiple onChange={(event) => uploadImages(Array.from(event.target.files ?? []))} />
                  </label>
                  <FieldDescription>{form.images.length ? `${form.images.length} image ready` : "Image goes as completion proof."}</FieldDescription>
                </Field>
              </FieldGroup>
              <Button type="submit" disabled={busy || uploading} className="bg-blue-700 text-white hover:bg-blue-800">
                <Send className="size-4" />
                {busy ? "Saving..." : "Update ticket"}
              </Button>
            </form>

            {ticket.completionProof?.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {ticket.completionProof.map((url) => <img key={url} src={url} alt="Completion proof" className="aspect-video w-full rounded-xl border object-cover" />)}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
