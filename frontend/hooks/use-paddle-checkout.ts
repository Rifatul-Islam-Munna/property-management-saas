"use client"

import { useState } from "react"
import { toast } from "sonner"

declare global {
  interface Window {
    Paddle?: {
      Environment?: {
        set: (value: string) => void
      }
      Initialize: (payload: { token: string }) => void
      Checkout: {
        open: (payload: {
          settings?: {
            displayMode?: "overlay" | "inline"
            theme?: "light" | "dark"
            locale?: string
            variant?: "one-page" | "multi-page"
          }
          items: Array<{
            priceId: string
            quantity: number
          }>
          customer?: {
            email?: string
          }
        }) => void
      }
    }
    __popPaddleReady?: boolean
  }
}

let paddleScriptPromise: Promise<void> | null = null

async function ensurePaddleLoaded() {
  if (typeof window === "undefined") return
  if (window.Paddle && window.__popPaddleReady) return

  const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? ""
  const environment = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT ?? "sandbox"

  if (!token) {
    throw new Error("Paddle not configured yet")
  }

  paddleScriptPromise ??= new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-paddle-script="true"]')

    if (existingScript && window.Paddle) {
      try {
        window.Paddle.Environment?.set(environment)
        window.Paddle.Initialize({ token })
        window.__popPaddleReady = true
        resolve()
      } catch (error) {
        reject(error)
      }
      return
    }

    const script = document.createElement("script")
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js"
    script.async = true
    script.dataset.paddleScript = "true"
    script.onload = () => {
      try {
        window.Paddle?.Environment?.set(environment)
        window.Paddle?.Initialize({ token })
        window.__popPaddleReady = true
        resolve()
      } catch (error) {
        reject(error)
      }
    }
    script.onerror = () => reject(new Error("Failed to load Paddle"))
    document.head.appendChild(script)
  })

  return paddleScriptPromise
}

type OpenCheckoutArgs = {
  priceId?: string | null
  email?: string
}

export function usePaddleCheckout() {
  const [isOpening, setIsOpening] = useState(false)

  async function openCheckout({ priceId, email }: OpenCheckoutArgs) {
    if (!priceId) {
      toast.info("Plan not ready for direct checkout yet")
      return false
    }

    try {
      setIsOpening(true)
      await ensurePaddleLoaded()
      window.Paddle?.Checkout.open({
        settings: {
          displayMode: "overlay",
          theme: "light",
          locale: "en",
          variant: "one-page",
        },
        items: [
          {
            priceId,
            quantity: 1,
          },
        ],
        customer: email ? { email } : undefined,
      })
      return true
    } catch (error) {
      toast.info((error as Error).message || "Paddle unavailable right now")
      return false
    } finally {
      setIsOpening(false)
    }
  }

  return {
    isOpening,
    openCheckout,
  }
}
