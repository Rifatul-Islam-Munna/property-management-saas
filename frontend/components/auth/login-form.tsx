"use client"

import Link from "next/link"
import { useState } from "react"
import { Building2, Eye, EyeOff, KeyRound, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AuthFormSkeleton, WithBone } from "@/components/dashboard/dashboard-loading"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLoginMutation } from "@/hooks/use-auth"

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const { mutate, isPending } = useLoginMutation()

  return (
    <WithBone
      name="auth-login-form"
      loading={isPending}
      fallback={<AuthFormSkeleton />}
    >
      <Card className="border-white/70 bg-white/90 shadow-[0_25px_70px_rgba(37,99,235,0.16)] backdrop-blur">
        <CardHeader className="space-y-5 px-6 pt-6 sm:px-8 sm:pt-8">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-linear-to-br from-sky-500 to-blue-700 text-white shadow-lg shadow-blue-500/30">
              <Building2 className="size-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
                Property Ops
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Sign in
              </h2>
            </div>
          </div>
          <p className="text-sm leading-6 text-slate-600">
            One login for admin, tenant owner, worker, renter, and guest.
          </p>
        </CardHeader>
        <CardContent className="px-6 pb-6 sm:px-8 sm:pb-8">
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault()
              mutate(formData)
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="owner@example.com"
                  required
                  value={formData.email}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  className="h-12 rounded-xl border-slate-200 bg-white pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  required
                  value={formData.password}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  className="h-12 rounded-xl border-slate-200 bg-white px-10"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="h-12 w-full rounded-xl bg-linear-to-r from-sky-500 to-blue-700 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:from-sky-600 hover:to-blue-800"
            >
              {isPending ? "Signing in..." : "Sign in"}
            </Button>

            <p className="text-center text-sm text-slate-600">
              New worker?
              {" "}
              <Link
                href="/signup"
                className="font-semibold text-blue-700 transition hover:text-blue-900"
              >
                Create account
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </WithBone>
  )
}
