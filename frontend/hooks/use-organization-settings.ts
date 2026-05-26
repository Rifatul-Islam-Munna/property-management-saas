"use client"

import { useQueryWrapper } from "@/api-hooks/react-query-wrapper"
import type { ApiSuccessResponse } from "@/lib/types/api"

export type OrganizationStripeSettings = {
  configured: boolean
  publishableKeyConfigured: boolean
  defaultCurrency: string
  last4?: string | null
  maskedSecretKey?: string | null
  maskedPublishableKey?: string | null
}

export function useOrganizationStripeSettingsQuery(enabled = true) {
  return useQueryWrapper<
    ApiSuccessResponse<OrganizationStripeSettings>,
    OrganizationStripeSettings | undefined
  >(["organization", "my", "stripe-settings"], "/organization/my/stripe-settings", {
    enabled,
    select: (response) => response?.data,
  })
}
