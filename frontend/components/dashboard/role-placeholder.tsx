import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function RolePlaceholder({
  title,
  body,
}: {
  title: string
  body: string
}) {
  return (
    <div className="space-y-4">
      <section className="rounded-2xl border bg-background p-5">
        <Badge variant="outline">Reusable role module</Badge>
        <h1 className="mt-3 text-2xl font-semibold text-slate-950">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{body}</p>
      </section>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {["Overview", "Tickets", "Notices", "Payments"].map((item) => (
          <Card key={item} className="shadow-none">
            <CardHeader>
              <CardTitle>{item}</CardTitle>
              <CardDescription>Next module slot ready.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              Shared shell already done. Real feature page can drop in here.
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
