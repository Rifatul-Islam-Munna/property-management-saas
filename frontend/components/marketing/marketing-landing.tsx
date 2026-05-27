"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  Bot,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  FileCheck2,
  FileText,
  LayoutGrid,
  MessageSquareText,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useMeQuery } from "@/hooks/use-auth"
import { usePaddleCheckout } from "@/hooks/use-paddle-checkout"
import { usePublicPlansQuery } from "@/hooks/use-public-plans"

const painList = [
  "Managers call renters and guests one by one for notices.",
  "Monthly rent follow-up eats time every single month.",
  "Workers get assigned from memory, chat, or paper.",
  "Documents, vendors, tickets, and inspections stay scattered.",
]

const offerCards = [
  {
    icon: BellRing,
    title: "Notice delivery in seconds",
    body: "Target one guest, one renter, one property, one role, or everyone. No more manual calls.",
  },
  {
    icon: ReceiptText,
    title: "Track rent month by month",
    body: "Know exactly who paid, who is pending, and which month needs follow-up.",
  },
  {
    icon: Wrench,
    title: "Assign your workers clearly",
    body: "Move tickets to right worker without messy chat handoff.",
  },
  {
    icon: FileText,
    title: "Send any document fast",
    body: "Upload from phone or PC, then send lease docs, notices, forms, or proof instantly.",
  },
]

const showcaseRows = [
  ["Properties", "12 active", "98 units total"],
  ["Unpaid this month", "8 residents", "Need reminder"],
  ["Open tickets", "14 issues", "4 assigned now"],
  ["Workers available", "6 online", "2 on inspection"],
]

const proofCards = [
  {
    icon: Building2,
    title: "Multi-property control",
    body: "One tenant owner can manage many properties, units, renters, guests, workers, and vendors.",
  },
  {
    icon: ClipboardCheck,
    title: "Tickets to completion",
    body: "Issue comes in, worker gets assigned, proof comes back, status stays visible to owner.",
  },
  {
    icon: CalendarClock,
    title: "Recurring tasks and inspections",
    body: "Keep routine work from slipping through the cracks with planned repeat jobs and scheduled checks.",
  },
  {
    icon: ShieldCheck,
    title: "Role-based control",
    body: "Admin, tenant owner, worker, renter, guest. Each role sees only what they need.",
  },
]

const testimonials = [
  {
    quote:
      "We stop calling everyone manually. Notice goes out once, exact people get it, and team knows what happened.",
    name: "Operations manager",
  },
  {
    quote:
      "Payment follow-up is finally visible by month. No more guessing which renter paid already.",
    name: "Tenant owner",
  },
  {
    quote:
      "Worker assignment feels clean now. Ticket, property, documents, and updates stay in one flow.",
    name: "Property team lead",
  },
]

function HeroMock() {
  return (
    <div className="relative">
      <div className="absolute -left-12 top-8 h-48 w-48 rounded-full bg-blue-300/25 blur-3xl" />
      <div className="absolute -right-8 bottom-0 h-56 w-56 rounded-full bg-cyan-300/25 blur-3xl" />

      <div className="relative rounded-[2rem] border border-white/65 bg-white/82 p-3 shadow-[0_30px_90px_rgba(25,53,117,0.12)] backdrop-blur-xl">
        <div className="rounded-[1.7rem] border border-blue-100 bg-white">
          <div className="flex items-center justify-between border-b border-blue-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-rose-400" />
              <span className="size-2.5 rounded-full bg-amber-400" />
              <span className="size-2.5 rounded-full bg-emerald-400" />
            </div>
            <Badge className="rounded-full bg-blue-600 text-white hover:bg-blue-600">Live operations</Badge>
          </div>

          <div className="grid gap-4 p-4 lg:grid-cols-[0.72fr_1.28fr]">
            <div className="space-y-4 rounded-[1.4rem] bg-[linear-gradient(180deg,#eef5ff_0%,#f9fbff_100%)] p-4">
              <div className="rounded-2xl border border-blue-100 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-blue-400">Today</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">Send notice to unpaid renters</p>
                <p className="mt-1 text-xs text-slate-500">Property Tower A • 8 people</p>
                <div className="mt-3 rounded-xl bg-blue-600 px-3 py-2 text-xs text-white">
                  Notice prepared. One tap to send.
                </div>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-950">May 2026 rent status</p>
                  <CreditCard className="size-4 text-blue-600" />
                </div>
                <div className="mt-3 h-2 rounded-full bg-slate-100">
                  <div className="h-2 w-[72%] rounded-full bg-[linear-gradient(90deg,#2563eb,#06b6d4)]" />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>24 paid</span>
                  <span>8 pending</span>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-950 p-4 text-white">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Worker board</p>
                  <Wrench className="size-4 text-cyan-300" />
                </div>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between rounded-xl bg-white/8 px-3 py-2 text-sm">
                    <span>Rahim</span>
                    <span className="text-cyan-300">3 tickets</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-white/8 px-3 py-2 text-sm">
                    <span>Jui</span>
                    <span className="text-cyan-300">Inspection</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {showcaseRows.map(([title, meta, note]) => (
                  <div key={title} className="rounded-[1.3rem] border border-blue-100 bg-white p-4 shadow-sm">
                    <p className="text-sm font-semibold text-slate-950">{title}</p>
                    <p className="mt-3 text-2xl font-semibold text-slate-950">{meta}</p>
                    <p className="mt-1 text-sm text-slate-500">{note}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-[1.5rem] border border-blue-100 bg-[linear-gradient(180deg,#ffffff_0%,#f3f8ff_100%)] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">Single system for daily work</p>
                    <p className="text-xs text-slate-500">Notices, docs, workers, rent, vendors, inspections</p>
                  </div>
                  <Sparkles className="size-4 text-blue-600" />
                </div>

                <div className="mt-4 grid gap-3">
                  {[
                    ["Ticket created", "Water leak • Unit A-12", "Assigned"],
                    ["Document sent", "Lease renewal packet", "Delivered"],
                    ["Recurring task", "Generator check", "Tomorrow"],
                    ["Guest fee", "Pending confirmation", "Reminder ready"],
                  ].map(([title, meta, state]) => (
                    <div key={title} className="flex items-center justify-between rounded-2xl border border-blue-100 bg-white px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">{title}</p>
                        <p className="text-xs text-slate-500">{meta}</p>
                      </div>
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">{state}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute -bottom-6 left-5 rounded-2xl border border-blue-100 bg-white/95 px-4 py-3 shadow-[0_20px_40px_rgba(37,99,235,0.12)]">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Outcome</p>
          <p className="mt-1 text-sm font-semibold text-slate-950">Less calling. Less chasing. More control.</p>
        </div>
      </div>
    </div>
  )
}

export function MarketingLanding() {
  const router = useRouter()
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly")
  const { data: me } = useMeQuery()
  const plans = usePublicPlansQuery()
  const { isOpening, openCheckout } = usePaddleCheckout()
  const planList = Array.isArray(plans.data) ? plans.data : []

  return (
    <main className="min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#f5f9ff_0%,#f9fbff_12%,#ffffff_36%,#fbfcff_100%)] text-slate-950">
      <div className="absolute inset-x-0 top-0 -z-10 h-[56rem] bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.22),transparent_35%),radial-gradient(circle_at_top_right,rgba(103,232,249,0.18),transparent_30%),linear-gradient(180deg,rgba(218,234,255,0.95),rgba(255,255,255,0))]" />

      <header className="sticky top-0 z-40 border-b border-white/60 bg-white/72 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1480px] items-center justify-between px-4 py-3 sm:px-6 lg:px-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2563eb,#0f172a)] text-white shadow-[0_18px_34px_rgba(37,99,235,0.24)]">
              <Building2 className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Property Operations Platform</p>
              <p className="text-xs text-slate-500">Modern SaaS for property teams</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 text-sm text-slate-600 lg:flex">
            <a href="#solution" className="transition hover:text-slate-950">Solution</a>
            <a href="#features" className="transition hover:text-slate-950">Features</a>
            <a href="#pricing" className="transition hover:text-slate-950">Pricing</a>
            <a href="#faq" className="transition hover:text-slate-950">FAQ</a>
          </nav>

          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="hidden rounded-full px-4 text-slate-700 sm:inline-flex">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild className="rounded-full bg-blue-600 px-5 text-white hover:bg-blue-700">
              <Link href="/signup">Start free</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="mx-auto w-full max-w-[1480px] px-4 pb-24 pt-12 sm:px-6 xl:px-10 xl:pb-28 xl:pt-16">
          <div className="mx-auto max-w-5xl text-center">
            <Badge variant="outline" className="mx-auto w-fit rounded-full border-blue-200 bg-white/80 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-blue-700">
              Built for tenant owners, admins, workers
            </Badge>
            <p className="mt-6 text-sm font-medium uppercase tracking-[0.24em] text-slate-400">
              Less calling. Less chasing. More control.
            </p>
            <h1 className="mt-4 text-[3.2rem] font-semibold leading-[0.95] tracking-[-0.05em] text-slate-950 sm:text-[4.4rem] xl:text-[6rem]">
              Replace manual property operations
              <span className="mt-2 block text-blue-700">without adding more admin work.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg xl:text-[1.1rem]">
              One faster property operations system for notices, payments, documents, workers,
              tickets, inspections, recurring maintenance, vendors, and multi-property control.
            </p>
          </div>

          <div className="mt-12 grid gap-10 xl:grid-cols-[0.38fr_1.62fr] xl:items-center">
            <div className="space-y-5 xl:pr-4">
              <div className="grid gap-3">
                {[
                  ["Notice sending", "Send to exact users or full properties"],
                  ["Rent follow-up", "Track month-wise paid and unpaid"],
                  ["Worker assignment", "Move jobs clearly to your team"],
                ].map(([title, body]) => (
                  <div key={title} className="rounded-[1.35rem] border border-blue-100 bg-white/86 p-4 shadow-[0_12px_28px_rgba(37,99,235,0.05)]">
                    <p className="text-sm font-semibold text-slate-950">{title}</p>
                    <p className="mt-2 text-xs leading-6 text-slate-500">{body}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row xl:flex-col">
                <Button asChild className="h-12 rounded-full bg-blue-600 px-6 text-white hover:bg-blue-700">
                  <Link href="/signup">
                    Start free
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-12 rounded-full border-blue-200 bg-white px-6 text-blue-800">
                  <Link href="#pricing">See plans</Link>
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                {[
                  ["Targeted notices", "By role, property, or exact user"],
                  ["Payment clarity", "Renter monthly + guest fee tracking"],
                  ["Paddle-ready", "Buy subscription direct from landing"],
                ].map(([title, body]) => (
                  <div key={title} className="rounded-[1.5rem] border border-blue-100 bg-[linear-gradient(180deg,#ffffff_0%,#f7fbff_100%)] px-4 py-4">
                    <p className="text-sm font-semibold text-slate-950">{title}</p>
                    <p className="mt-1 text-xs leading-6 text-slate-500">{body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="xl:pl-2">
              <HeroMock />
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-blue-100 bg-white/88">
        <div className="mx-auto grid w-full max-w-[1480px] gap-4 px-4 py-5 text-center text-sm text-slate-500 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-10">
          <div className="rounded-full border border-blue-100 px-4 py-3">Send notices without calling</div>
          <div className="rounded-full border border-blue-100 px-4 py-3">Collect rent with monthly clarity</div>
          <div className="rounded-full border border-blue-100 px-4 py-3">Assign workers from one board</div>
          <div className="rounded-full border border-blue-100 px-4 py-3">Manage docs, tickets, vendors together</div>
        </div>
      </section>

      <section id="solution" className="mx-auto w-full max-w-[1480px] px-4 py-24 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm uppercase tracking-[0.28em] text-slate-400">What you solve</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            You are not selling software only.
            <span className="block text-blue-700">You are removing operational pain.</span>
          </h2>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-rose-100 bg-[linear-gradient(180deg,#fff8fb_0%,#ffffff_100%)] p-6 shadow-[0_18px_40px_rgba(244,63,94,0.05)]">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
                <MessageSquareText className="size-5" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-rose-500">Before</p>
                <h3 className="text-2xl font-semibold">Too much manual work</h3>
              </div>
            </div>
            <ul className="mt-6 space-y-3">
              {painList.map((item) => (
                <li key={item} className="flex gap-3 rounded-2xl border border-rose-100 bg-white px-4 py-3 text-sm leading-7 text-slate-600">
                  <span className="mt-1 size-2 rounded-full bg-rose-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[2rem] border border-blue-100 bg-[linear-gradient(180deg,#f5f9ff_0%,#ffffff_100%)] p-6 shadow-[0_18px_40px_rgba(37,99,235,0.06)]">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                <CheckCircle2 className="size-5" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-blue-500">After</p>
                <h3 className="text-2xl font-semibold">One fast operating system</h3>
              </div>
            </div>
            <div className="mt-6 grid gap-3">
              {offerCards.map((item) => (
                <div key={item.title} className="rounded-2xl border border-blue-100 bg-white p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                      <item.icon className="size-4" />
                    </div>
                    <p className="text-base font-semibold text-slate-950">{item.title}</p>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-6 lg:px-10">
        <div className="overflow-hidden rounded-[2.3rem] bg-[linear-gradient(180deg,#0f172a_0%,#14213d_35%,#0f172a_100%)] px-5 py-14 text-white shadow-[0_34px_90px_rgba(15,23,42,0.3)] sm:px-8 lg:px-12">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="rounded-full bg-white/10 text-white hover:bg-white/10">Everything connected</Badge>
            <h2 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
              Every daily property workflow,
              <span className="block text-cyan-300">in one blue system.</span>
            </h2>
            <p className="mt-4 text-base leading-8 text-white/72">
              Focus hard on solution. Notice flow. Money follow-up. Worker assignment. Documents. Vendors.
              Tickets. Inspections. Recurring work. Multi-property visibility.
            </p>
          </div>

          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {proofCards.map((item) => (
              <article key={item.title} className="rounded-[1.7rem] border border-white/10 bg-white/6 p-5 backdrop-blur-sm">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-white/10 text-cyan-300">
                  <item.icon className="size-5" />
                </div>
                <h3 className="mt-5 text-xl font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/72">{item.body}</p>
              </article>
            ))}
            <article className="rounded-[1.7rem] border border-cyan-400/20 bg-[linear-gradient(180deg,rgba(37,99,235,0.18),rgba(6,182,212,0.08))] p-5 lg:col-span-3">
              <div className="grid gap-4 lg:grid-cols-[0.86fr_1.14fr]">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Why it feels simpler</p>
                  <h3 className="mt-4 text-3xl font-semibold">Because owner does not jump between five tools.</h3>
                  <p className="mt-4 text-sm leading-7 text-white/72">
                    One app for announcement, payment records, document send, property operations, field work,
                    role-based access, and subscription-ready growth.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ["Notices", "By role, by property, by exact user"],
                    ["Payments", "Renter monthly, guest one-time"],
                    ["Workers", "Assign tickets"],
                    ["Files", "Upload + send from device"],
                  ].map(([title, body]) => (
                    <div key={title} className="rounded-2xl border border-white/10 bg-black/15 p-4">
                      <p className="text-lg font-semibold">{title}</p>
                      <p className="mt-2 text-sm leading-7 text-white/72">{body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1480px] px-4 py-24 sm:px-6 lg:px-10">
        <div className="grid gap-12 xl:grid-cols-[0.7fr_1.3fr]">
          <div className="space-y-5">
            <p className="text-sm uppercase tracking-[0.28em] text-slate-400">How teams use it</p>
            <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Launch with one clean story.
              <span className="block text-blue-700">Then scale with plans.</span>
            </h2>
            <p className="text-base leading-8 text-slate-600">
              First sell simpler operations. Then sell faster growth: more properties, more users, more automation,
              more control for bigger portfolios.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: LayoutGrid,
                title: "Start portfolio",
                body: "Add properties, units, people, and structure without confusion.",
              },
              {
                icon: Bot,
                title: "Run operations daily",
                body: "Notice, rent, tickets, documents, workers, vendors, inspections.",
              },
              {
                icon: BadgeCheck,
                title: "Scale with confidence",
                body: "Use plans, permissions, subscriptions, and cleaner team workflows as business grows.",
              },
            ].map((item, index) => (
              <article key={item.title} className="relative rounded-[1.8rem] border border-blue-100 bg-white p-5 shadow-[0_18px_40px_rgba(37,99,235,0.05)]">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#dbeafe,#67e8f9)] text-blue-800">
                  <span className="text-sm font-semibold">0{index + 1}</span>
                </div>
                <div className="mt-5 flex size-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                  <item.icon className="size-5" />
                </div>
                <h3 className="mt-5 text-xl font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-6 lg:px-10">
        <div className="grid gap-5 xl:grid-cols-3">
          {testimonials.map((item) => (
            <article key={item.name} className="rounded-[1.9rem] border border-blue-100 bg-white p-6 shadow-[0_18px_40px_rgba(37,99,235,0.05)]">
              <p className="text-base leading-8 text-slate-700">“{item.quote}”</p>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                  <Users className="size-4" />
                </div>
                <div>
                  <p className="font-semibold text-slate-950">{item.name}</p>
                  <p className="text-sm text-slate-500">Property operations</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="pricing" className="mx-auto w-full max-w-[1480px] px-4 py-24 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Plans</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            Choose plan.
            <span className="block text-blue-700">Buy direct with Paddle.</span>
          </h2>
          <p className="mt-4 text-base leading-8 text-slate-600">
            If Paddle client token and plan price IDs are configured, checkout opens directly here.
            If not, page stays safe and user can still start from signup.
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <div className="inline-flex rounded-full border border-blue-100 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setBilling("monthly")}
              className={`rounded-full px-5 py-2 text-sm font-medium transition ${billing === "monthly" ? "bg-blue-600 text-white" : "text-slate-600"}`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBilling("yearly")}
              className={`rounded-full px-5 py-2 text-sm font-medium transition ${billing === "yearly" ? "bg-blue-600 text-white" : "text-slate-600"}`}
            >
              Yearly
            </button>
          </div>
        </div>

        <div className="mt-12 grid gap-6 xl:grid-cols-3">
          {planList.length ? planList.map((plan, index) => {
            const price = billing === "monthly" ? plan.monthlyPrice ?? 0 : plan.yearlyPrice ?? 0
            const priceId =
              billing === "monthly"
                ? plan.paddlePriceIdMonthly
                : plan.paddlePriceIdYearly

            return (
              <article
                key={plan._id}
                className={`relative rounded-[2rem] border p-7 shadow-[0_18px_40px_rgba(37,99,235,0.06)] ${index === 1 ? "border-blue-500 bg-[linear-gradient(180deg,#ffffff_0%,#eff6ff_100%)] xl:-translate-y-3" : "border-blue-100 bg-white"}`}
              >
                {index === 1 ? (
                  <Badge className="absolute right-5 top-5 rounded-full bg-blue-600 text-white hover:bg-blue-600">
                    Popular
                  </Badge>
                ) : null}
                <p className="text-lg font-semibold text-slate-950">{plan.name}</p>
                <p className="mt-2 min-h-12 text-sm leading-7 text-slate-600">{plan.description ?? "Simple pricing for smoother operations."}</p>
                <div className="mt-5 flex items-end gap-2">
                  <span className="text-4xl font-semibold text-slate-950">{price}</span>
                  <span className="pb-1 text-sm text-slate-500">/{billing === "monthly" ? "month" : "year"}</span>
                </div>
                <div className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                  <div className="flex items-center justify-between">
                    <span>Properties</span>
                    <span className="font-semibold text-slate-950">{plan.maxProperties ?? "Custom"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Users</span>
                    <span className="font-semibold text-slate-950">{plan.maxUsers ?? "Custom"}</span>
                  </div>
                </div>
                <ul className="mt-6 space-y-3">
                  {(plan.features ?? []).length ? (plan.features ?? []).map((feature) => (
                    <li key={feature} className="flex gap-3 text-sm text-slate-700">
                      <CheckCircle2 className="mt-1 size-4 text-blue-600" />
                      <span>{feature}</span>
                    </li>
                  )) : (
                    <li className="text-sm text-slate-500">Feature list coming from admin plan setup.</li>
                  )}
                </ul>
                <div className="mt-8 flex gap-3">
                  <Button
                    type="button"
                    disabled={isOpening}
                    className="flex-1 rounded-full bg-blue-600 text-white hover:bg-blue-700"
                    onClick={async () => {
                      const opened = await openCheckout({
                        priceId,
                        email: me?.email,
                      })

                      if (!opened) {
                        router.push("/signup")
                      }
                    }}
                  >
                    {isOpening ? "Opening..." : "Buy with Paddle"}
                  </Button>
                  <Button asChild variant="outline" className="rounded-full border-blue-200 text-blue-700">
                    <Link href="/signup">Start free</Link>
                  </Button>
                </div>
              </article>
            )
          }) : (
            <div className="lg:col-span-3">
              <div className="rounded-[2rem] border border-blue-100 bg-white p-8 text-center shadow-[0_18px_40px_rgba(37,99,235,0.05)]">
                <p className="text-lg font-semibold text-slate-950">Plans will appear here from admin setup</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Admin already has plan builder. Once plans and Paddle price IDs are configured, direct checkout starts working here.
                </p>
                <div className="mt-6">
                  <Button asChild className="rounded-full bg-blue-600 text-white hover:bg-blue-700">
                    <Link href="/signup">Start free</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section id="faq" className="mx-auto w-full max-w-[1480px] px-4 py-24 sm:px-6 lg:px-10">
        <div className="grid gap-10 xl:grid-cols-[0.72fr_1.28fr] xl:items-start">
          <div className="xl:sticky xl:top-28">
            <p className="text-sm uppercase tracking-[0.28em] text-slate-400">FAQ</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              Questions before switching?
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Cleaner answers, better spacing, friendlier UI. Big screen should breathe, not feel crushed.
            </p>
            <div className="mt-8 rounded-[1.8rem] border border-blue-100 bg-[linear-gradient(180deg,#f7fbff_0%,#ffffff_100%)] p-6 shadow-[0_18px_40px_rgba(37,99,235,0.05)]">
              <p className="text-sm font-semibold text-slate-950">What buyers usually ask</p>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex items-start gap-3"><CheckCircle2 className="mt-1 size-4 text-blue-600" /><span>Can I manage many properties?</span></div>
                <div className="flex items-start gap-3"><CheckCircle2 className="mt-1 size-4 text-blue-600" /><span>Can I send notices to selected people?</span></div>
                <div className="flex items-start gap-3"><CheckCircle2 className="mt-1 size-4 text-blue-600" /><span>Can I track rent by month?</span></div>
                <div className="flex items-start gap-3"><CheckCircle2 className="mt-1 size-4 text-blue-600" /><span>Can my workers receive assigned jobs clearly?</span></div>
              </div>
            </div>
          </div>
          <div className="rounded-[2rem] border border-blue-100 bg-white p-3 shadow-[0_24px_60px_rgba(37,99,235,0.06)] sm:p-5">
            <Accordion type="single" collapsible className="space-y-3">
              {[
                ["Can tenant owner manage many properties?", "Yes. One tenant owner can manage many properties, units, renters, guests, workers, vendors, and operations from one account."],
                ["Can I send notice to exact users?", "Yes. Notice flow can target by role, by property, or by exact selected users."],
                ["Can I track monthly rent?", "Yes. Renter payment is tracked month by month. Guest fee can be tracked separately as one-time payment."],
                ["Can workers receive tasks clearly?", "Yes. Tickets can be assigned to linked workers with cleaner status flow and status updates."],
                ["Can I send documents too?", "Yes. Upload documents from device, then send to exact users directly from owner workflow."],
                ["Can this grow with subscriptions?", "Yes. Plans, limits, and public Paddle checkout flow are already wired for SaaS growth."],
              ].map(([question, answer], index) => (
                <AccordionItem
                  key={question}
                  value={`item-${index}`}
                  className="overflow-hidden rounded-[1.5rem] border border-blue-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] px-5"
                >
                  <AccordionTrigger className="py-5 text-left text-lg font-semibold text-slate-950 hover:no-underline">
                    {question}
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 text-sm leading-8 text-slate-600">
                    {answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1480px] px-4 pb-24 sm:px-6 lg:px-10">
        <div className="overflow-hidden rounded-[2.5rem] bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_52%,#06b6d4_100%)] px-6 py-12 text-white shadow-[0_34px_90px_rgba(37,99,235,0.25)] sm:px-8 lg:px-12">
          <div className="grid items-center gap-10 lg:grid-cols-[0.92fr_1.08fr]">
            <div>
              <Badge className="rounded-full bg-white/12 text-white hover:bg-white/12">Ready to grow</Badge>
              <h2 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
                Sell simple.
                <span className="block">Operate faster.</span>
              </h2>
              <p className="mt-4 max-w-xl text-base leading-8 text-white/80">
                Good operations software wins because it removes repeating pain:
                calls, reminders, payment confusion, worker confusion, scattered records.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild className="h-12 rounded-full bg-white px-6 text-slate-950 hover:bg-white/90">
                  <Link href="/signup">Create account</Link>
                </Button>
                <Button asChild variant="outline" className="h-12 rounded-full border-white/20 bg-transparent px-6 text-white hover:bg-white/10">
                  <Link href="#pricing">Choose a plan</Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: BellRing, title: "Notice", body: "By role, property, or exact user" },
                { icon: CreditCard, title: "Payments", body: "Rent + guest fee tracking" },
                { icon: FileCheck2, title: "Documents", body: "Send uploaded files easily" },
                { icon: Building2, title: "Portfolio", body: "Manage multi-property operations" },
              ].map((item) => (
                <div key={item.title} className="rounded-[1.4rem] border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                  <item.icon className="size-5 text-cyan-200" />
                  <p className="mt-4 text-lg font-semibold">{item.title}</p>
                  <p className="mt-2 text-sm leading-7 text-white/72">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <footer className="flex flex-col gap-6 border-t border-blue-100 pt-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-slate-950">Property Operations Platform</p>
            <p className="mt-1 text-sm text-slate-500">
              One SaaS flow for notices, payments, workers, documents, and property operations.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-slate-500">
            <Link href="/login" className="transition hover:text-slate-950">Login</Link>
            <Link href="/signup" className="transition hover:text-slate-950">Signup</Link>
            <a href="#features" className="transition hover:text-slate-950">Features</a>
            <a href="#pricing" className="transition hover:text-slate-950">Pricing</a>
          </div>
        </footer>
      </section>
    </main>
  )
}
