"use client"

import Link from "next/link"
import { Route } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { usePlansQuery } from "@/hooks/use-plan"

function formatDate(value?: string) {
  if (!value) return "Not set"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "Not set"
  return parsed.toLocaleString()
}

export function PlanListPage({
  roleTitle,
  roleBasePath,
}: {
  roleTitle: string
  roleBasePath: string
}) {
  const plans = usePlansQuery()

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.07),_transparent_28%),linear-gradient(145deg,_#ffffff_0%,_#f8fafc_54%,_#eef2ff_100%)] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Badge variant="outline" className="border-sky-200 bg-white/80 text-sky-700">
              Plan route
            </Badge>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{roleTitle} plan board</h1>
              <p className="max-w-3xl text-sm leading-6 text-slate-600">
                All plans in table. Create or open one in dedicated page. Mobile editor tools live inside sheets there.
              </p>
            </div>
          </div>
          <Link href={`${roleBasePath}/new`}>
            <Button className="min-h-11 rounded-2xl">Create plan</Button>
          </Link>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Plan table</CardTitle>
          <CardDescription>Open plan page. Owner or editor access can modify it.</CardDescription>
        </CardHeader>
        <CardContent>
          {(plans.data ?? []).length ? (
            <>
              <div className="hidden overflow-hidden rounded-2xl border border-slate-200 md:block">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Access</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(plans.data ?? []).map((plan) => (
                      <TableRow key={plan._id}>
                        <TableCell className="min-w-56">
                          <p className="font-medium text-slate-950">{plan.title}</p>
                          <p className="mt-1 text-xs text-slate-500">{plan.description || "No description"}</p>
                        </TableCell>
                        <TableCell>{plan.createdByName}</TableCell>
                        <TableCell>
                          <Badge variant={plan.canEdit ? "default" : "secondary"}>
                            {plan.isOwner ? "owner" : plan.canEdit ? "edit" : "view"}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(plan.updatedAt)}</TableCell>
                        <TableCell className="text-right">
                          <Link href={`${roleBasePath}/${plan._id}`}>
                            <Button size="sm">{plan.canEdit ? "Edit" : "View"}</Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-3 md:hidden">
                {(plans.data ?? []).map((plan) => (
                  <div key={plan._id} className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={plan.canEdit ? "default" : "secondary"}>
                        {plan.isOwner ? "owner" : plan.canEdit ? "edit" : "view"}
                      </Badge>
                      <Badge variant="outline">{plan.nodes?.length ?? 0} nodes</Badge>
                    </div>
                    <p className="mt-3 text-base font-semibold text-slate-950">{plan.title}</p>
                    <p className="mt-2 text-sm text-slate-600">{plan.description || "No description"}</p>
                    <p className="mt-3 text-xs text-slate-500">Owner {plan.createdByName}</p>
                    <p className="mt-1 text-xs text-slate-500">Updated {formatDate(plan.updatedAt)}</p>
                    <Link href={`${roleBasePath}/${plan._id}`} className="mt-4 block">
                      <Button className="min-h-11 w-full rounded-xl">{plan.canEdit ? "Edit plan" : "View plan"}</Button>
                    </Link>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Route />
                </EmptyMedia>
                <EmptyTitle>No plan yet</EmptyTitle>
                <EmptyDescription>Create first plan from dedicated page.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
