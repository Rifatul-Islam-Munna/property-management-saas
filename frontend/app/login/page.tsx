import { AuthShell } from "@/components/auth/auth-shell"
import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Mobile First Access"
      title="Property workflows, billing, tickets, and notices in one calm blue hub."
      description="Same auth direction as your reference project, but rebuilt for this SaaS stack with React Query hooks and a cleaner mobile-first layout."
      asideTitle="Who can sign in?"
      asideBody="Admin, tenant owner, worker, renter, guest use one login. Test super admin: test@gmail.com / 11111111."
    >
      <LoginForm />
    </AuthShell>
  )
}
