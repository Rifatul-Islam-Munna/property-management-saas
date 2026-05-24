"use client"

import {
  useQuery,
  type QueryKey,
  type UseQueryOptions,
} from "@tanstack/react-query"
import { getRequest } from "@/api-hooks/api-hooks"

export function useQueryWrapper<TQueryFnData, TData = TQueryFnData>(
  key: QueryKey,
  url: string,
  options?: Omit<
    UseQueryOptions<TQueryFnData, Error, TData>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery<TQueryFnData, Error, TData>({
    queryKey: key,
    queryFn: async () => {
      const [data, error] = await getRequest<TQueryFnData>(url)

      if (error || !data) {
        throw new Error(error?.message ?? "Request failed")
      }

      return data
    },
    ...options,
  })
}
