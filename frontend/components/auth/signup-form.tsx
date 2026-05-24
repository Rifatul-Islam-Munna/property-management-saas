"use client"

import Link from "next/link"
import { useState } from "react"
import {
  BriefcaseBusiness,
  Building2,
  CircleUserRound,
  Home,
  Mail,
  Phone,
  ShieldCheck,
  User2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { AuthFormSkeleton, WithBone } from "@/components/dashboard/dashboard-loading"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePublicSignupMutation } from "@/hooks/use-auth"

export function SignupForm() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    jobTitle: "",
    role: "worker" as "worker" | "tetentwoner" | "renter" | "guest",
  })
  const { mutate, isPending } = usePublicSignupMutation()

  return (
    <WithBone
      name="auth-signup-form"
      loading={isPending}
      fallback={<AuthFormSkeleton />}
    >
      <Card className="border-white/70 bg-white/92 shadow-[0_25px_70px_rgba(37,99,235,0.16)] backdrop-blur">
        <CardHeader className="space-y-5 px-6 pt-6 sm:px-8 sm:pt-8">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-linear-to-br from-cyan-500 to-blue-700 text-white shadow-lg shadow-blue-500/30">
              <ShieldCheck className="size-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
                Public signup
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Sign up
              </h2>
            </div>
          </div>
          <p className="text-sm leading-6 text-slate-600">
            Worker, renter, guest, tenant owner all can sign up. Owner later links people by request and property assignment.
          </p>
        </CardHeader>
        <CardContent className="px-6 pb-6 sm:px-8 sm:pb-8">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              mutate({
                ...formData,
                jobTitle: formData.jobTitle || undefined,
              })
            }}
          >
            <div className="space-y-2">
              <Label>Account type</Label>
              <Tabs
                value={formData.role}
                onValueChange={(value) =>
                  setFormData((current) => ({
                    ...current,
                    role: value as "worker" | "tetentwoner" | "renter" | "guest",
                  }))
                }
              >
                <TabsList className="grid w-full grid-cols-2 gap-2 md:grid-cols-4">
                  <TabsTrigger value="worker">
                    <BriefcaseBusiness className="size-4" />
                    Worker
                  </TabsTrigger>
                  <TabsTrigger value="renter">
                    <Home className="size-4" />
                    Renter
                  </TabsTrigger>
                  <TabsTrigger value="guest">
                    <CircleUserRound className="size-4" />
                    Guest
                  </TabsTrigger>
                  <TabsTrigger value="tetentwoner">
                    <Building2 className="size-4" />
                    Tenant owner
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <div className="relative">
              <User2 className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="fullName"
                required
                placeholder="Rashed Hossain"
                value={formData.fullName}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    fullName: event.target.value,
                  }))
                }
                className="h-12 rounded-xl border-slate-200 pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="signupEmail">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="signupEmail"
                type="email"
                required
                placeholder="worker@example.com"
                value={formData.email}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                className="h-12 rounded-xl border-slate-200 pl-10"
              />
            </div>
          </div>

            <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone</Label>
              <div className="relative">
                <Phone className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="phoneNumber"
                  required
                  placeholder="01700000000"
                  value={formData.phoneNumber}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      phoneNumber: event.target.value,
                    }))
                  }
                  className="h-12 rounded-xl border-slate-200 pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job title</Label>
              <div className="relative">
                <BriefcaseBusiness className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="jobTitle"
                  placeholder={
                    formData.role === "worker"
                      ? "Electrician"
                      : formData.role === "tetentwoner"
                        ? "Property Owner"
                        : formData.role === "renter"
                          ? "Resident"
                          : "Guest"
                  }
                  value={formData.jobTitle}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      jobTitle: event.target.value,
                    }))
                  }
                  className="h-12 rounded-xl border-slate-200 pl-10"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="signupPassword">Password</Label>
            <Input
              id="signupPassword"
              type="password"
              required
              placeholder="Create a strong password"
              value={formData.password}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              className="h-12 rounded-xl border-slate-200"
            />
          </div>

            <Button
              type="submit"
              disabled={isPending}
              className="h-12 w-full rounded-xl bg-linear-to-r from-sky-500 to-blue-700 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:from-sky-600 hover:to-blue-800"
            >
              {isPending
                ? "Creating account..."
                : formData.role === "worker"
                  ? "Create worker account"
                  : formData.role === "tetentwoner"
                    ? "Create tenant owner account"
                    : formData.role === "renter"
                      ? "Create renter account"
                      : "Create guest account"}
            </Button>

            <p className="text-center text-sm text-slate-600">
              Already have account?
              {" "}
              <Link
                href="/login"
                className="font-semibold text-blue-700 transition hover:text-blue-900"
              >
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </WithBone>
  )
}
