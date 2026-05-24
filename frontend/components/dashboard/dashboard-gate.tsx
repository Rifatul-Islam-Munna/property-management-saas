"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Spinner } from "@/components/ui/spinner"
import { useMeQuery } from "@/hooks/use-auth"
import { getDashboardPath } from "@/lib/auth-routes"
import { getDashboardConfig } from "@/components/dashboard/dashboard-config"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import type { DashboardRoleKey } from "@/lib/types/dashboard"

export function DashboardGate({
  roleKey,
  children,
  bare = false,
}: {
  roleKey: DashboardRoleKey
  children: React.ReactNode
  bare?: boolean
}) {
  const router = useRouter()
  const { data: user, isLoading, isError } = useMeQuery()
  const config = getDashboardConfig(roleKey)

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login")
      return
    }

    if (user && config && !config.allowedRoles.includes(user.role)) {
      router.replace(getDashboardPath(user.role))
    }
  }, [config, isLoading, router, user])

  if (isLoading || !config || !user || isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="size-6" />
      </div>
    )
  }

  if (!config.allowedRoles.includes(user.role)) {
    return null
  }

  if (bare) {
    return <>{children}</>
  }

  return <DashboardShell config={config}>{children}</DashboardShell>
}
