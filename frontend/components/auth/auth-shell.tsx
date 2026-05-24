import type { ReactNode } from "react"

type AuthShellProps = {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
  asideTitle: string
  asideBody: string
}

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  asideTitle,
  asideBody,
}: AuthShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.22),_transparent_28%),linear-gradient(160deg,_#f8fbff_0%,_#eef6ff_52%,_#dbeafe_100%)]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.55)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.55)_1px,transparent_1px)] bg-[size:32px_32px] opacity-40" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center gap-8 px-4 py-8 sm:px-6 lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <section className="hidden rounded-[2rem] border border-white/60 bg-slate-950 px-8 py-10 text-white shadow-[0_30px_80px_rgba(15,23,42,0.28)] lg:flex lg:flex-col lg:justify-between">
          <div className="space-y-5">
            <span className="inline-flex w-fit rounded-full border border-sky-400/40 bg-sky-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-200">
              {eyebrow}
            </span>
            <div className="space-y-4">
              <h1 className="max-w-md text-4xl font-semibold tracking-tight text-balance">
                {title}
              </h1>
              <p className="max-w-lg text-sm leading-7 text-slate-300">
                {description}
              </p>
            </div>
          </div>
          <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 backdrop-blur">
            <p className="text-sm font-semibold text-sky-200">{asideTitle}</p>
            <p className="mt-2 text-sm leading-7 text-slate-300">{asideBody}</p>
          </div>
        </section>
        <section className="mx-auto flex w-full max-w-md flex-col justify-center">
          {children}
        </section>
      </div>
    </main>
  )
}
