import { DashboardGate } from "@/components/dashboard/dashboard-gate"
import { ResidentStripePaymentResultPage } from "@/components/dashboard/resident-pages"
import { ResidentShell } from "@/components/dashboard/resident-shell"

export default async function ResidentPaymentCancelRoute({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const billId = Array.isArray(params.bill) ? params.bill[0] : params.bill
  const token = Array.isArray(params.token) ? params.token[0] : params.token

  return (
    <DashboardGate roleKey="resident" bare>
      <ResidentShell>
        <ResidentStripePaymentResultPage mode="cancel" billId={billId} token={token} />
      </ResidentShell>
    </DashboardGate>
  )
}
