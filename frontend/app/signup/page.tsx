import { AuthShell } from "@/components/auth/auth-shell"
import { SignupForm } from "@/components/auth/signup-form"

export default function SignupPage() {
  return (
    <AuthShell
      eyebrow="Worker Or Owner Signup"
      title="Create worker or tenant owner account from one reusable signup flow."
      description="Worker signup creates global profile. Tenant owner signup creates subscription-ready account for SaaS onboarding."
      asideTitle="Seeded admin"
      asideBody="Default super admin auto-seeds on backend start with test@gmail.com and password 11111111."
    >
      <SignupForm />
    </AuthShell>
  )
}
