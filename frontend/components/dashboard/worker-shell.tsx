"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ClipboardCheck,
  LayoutDashboard,
  MessageSquare,
  Repeat,
  Ticket,
} from "lucide-react"
import { TenantOwnerShell } from "@/components/dashboard/tenant-owner-shell"

function WorkerMobileNav() {
  const pathname = usePathname()
  const items = [
    { href: "/dashboard/worker", label: "Home", icon: LayoutDashboard },
    { href: "/dashboard/worker/tickets", label: "Tickets", icon: Ticket },
    { href: "/dashboard/worker/inspections", label: "Check", icon: ClipboardCheck },
    { href: "/dashboard/worker/recurring", label: "Repeat", icon: Repeat },
    { href: "/dashboard/worker/messages", label: "Inbox", icon: MessageSquare },
  ]

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-3 py-2 backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-xl grid-cols-5 gap-2">
        {items.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-14 flex-col items-center justify-center rounded-2xl text-[11px] font-semibold transition ${
                active
                  ? "bg-slate-950 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              <item.icon className="mb-1 size-4" />
              {item.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export function WorkerShell({
  children,
  showInsights = false,
}: {
  children: React.ReactNode
  showInsights?: boolean
}) {
  return (
    <TenantOwnerShell showInsights={showInsights}>
      <div className="pb-24 md:pb-0">{children}</div>
      <WorkerMobileNav />
    </TenantOwnerShell>
  )
}
