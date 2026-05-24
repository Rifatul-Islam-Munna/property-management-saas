"use client"

import { useQueryWrapper } from "@/api-hooks/react-query-wrapper"
import type { ApiSuccessResponse, PaginatedResult } from "@/lib/types/api"
import type { PlanItem } from "@/lib/types/dashboard"

export function usePublicPlansQuery() {
  return useQueryWrapper<ApiSuccessResponse<PaginatedResult<PlanItem>>, PlanItem[]>(
    ["public", "plans"],
    "/public/subscription/plans",
    {
      select: (response) => response?.data?.data ?? [],
    }
  )
}
