import { Geist_Mono, Manrope, Space_Grotesk } from "next/font/google"

import "./globals.css"
import "@/bones/registry"
import { Providers } from "@/components/providers"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"
import { TooltipProvider } from "@/components/ui/tooltip"

const fontSans = Manrope({ subsets: ["latin"], variable: "--font-sans" })
const fontHeading = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        fontHeading.variable,
        fontSans.variable,
        "font-sans"
      )}
    >
      <body className="light">
        <ThemeProvider>
          <Providers>
            <TooltipProvider>{children}</TooltipProvider>
            <Toaster richColors position="top-right" />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
