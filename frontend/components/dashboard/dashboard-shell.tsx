"use client"

import Link from "next/link"
import { useMemo } from "react"
import { Building2, LogOut, Menu, User2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { useLogoutMutation, useMeQuery } from "@/hooks/use-auth"
import { getDashboardPath } from "@/lib/auth-routes"
import type { DashboardRoleConfig } from "@/lib/types/dashboard"

type DashboardShellProps = {
  config: DashboardRoleConfig
  children: React.ReactNode
}

function DashboardLinks({
  config,
  className,
}: {
  config: DashboardRoleConfig
  className?: string
}) {
  return (
    <nav className={cn("flex flex-col gap-1", className)}>
      {config.nav.map((item) => (
        <a
          key={item.href}
          href={item.href}
          className="rounded-lg border border-transparent px-3 py-2 text-sm text-slate-700 transition hover:border-border hover:bg-muted"
        >
          {item.label}
        </a>
      ))}
    </nav>
  )
}

export function DashboardShell({ config, children }: DashboardShellProps) {
  const { data: user } = useMeQuery()
  const { mutate: logout, isPending } = useLogoutMutation()

  const myPath = useMemo(() => getDashboardPath(user?.role), [user?.role])

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f8fbff_0%,_#eff6ff_100%)]">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-700 text-white">
              <Building2 className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-950">{config.title}</p>
              <p className="text-xs text-slate-600">{config.subtitle}</p>
            </div>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <DashboardLinks config={config} className="flex-row" />
            <Button asChild variant="outline" className="ml-2 shadow-none">
              <Link href={myPath}>Home</Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => logout()}
              disabled={isPending}
              className="shadow-none"
            >
              <LogOut className="size-4" />
              Logout
            </Button>
          </div>

          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="outline" size="icon" className="shadow-none">
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[86vw] max-w-sm shadow-none">
              <SheetHeader>
                <SheetTitle>{config.title}</SheetTitle>
              </SheetHeader>
              <div className="space-y-6 px-4 pb-6">
                <div className="rounded-xl border bg-background p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                      <User2 className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-950">
                        {user?.fullName ?? "User"}
                      </p>
                      <p className="text-xs text-slate-600">{user?.email}</p>
                    </div>
                  </div>
                </div>
                <DashboardLinks config={config} />
                <Button
                  variant="outline"
                  onClick={() => logout()}
                  disabled={isPending}
                  className="w-full shadow-none"
                >
                  Logout
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
    </div>
  )
}
