"use client"

import {
  useMutation,
  type MutationKey,
  type UseMutationOptions,
} from "@tanstack/react-query"
import { toast } from "sonner"
import {
  deleteRequest,
  patchRequest,
  postRequest,
  type ApiErrorShape,
} from "@/api-hooks/api-hooks"

type HttpMethod = "POST" | "PATCH" | "DELETE"

type MutationResult<TData> = {
  data: TData | null
  error: ApiErrorShape | null
}

type UseApiMutationConfig<TData, TVariables> = {
  url: string
  method: HttpMethod
  mutationKey?: MutationKey
  successMessage?: string
} & Omit<
  UseMutationOptions<MutationResult<TData>, Error, TVariables>,
  "mutationFn" | "mutationKey"
>

export function useCommonMutationApi<TData, TVariables = void>(
  config: UseApiMutationConfig<TData, TVariables>
) {
  const { url, method, mutationKey, successMessage, onSuccess, onError, ...rest } =
    config

  return useMutation<MutationResult<TData>, Error, TVariables>({
    mutationKey,
    mutationFn: async (variables: TVariables) => {
      switch (method) {
        case "POST": {
          const [data, error] = await postRequest<TData, TVariables>(url, variables)
          return { data, error }
        }
        case "PATCH": {
          const [data, error] = await patchRequest<TData, TVariables>(url, variables)
          return { data, error }
        }
        case "DELETE": {
          const [data, error] = await deleteRequest<TData>(url)
          return { data, error }
        }
      }
    },
    onSuccess: (result, variables, onMutateResult, context) => {
      if (result.error || !result.data) {
        const message = result.error?.message ?? "Request failed"
        toast.error(message)
        onError?.(new Error(message), variables, onMutateResult, context)
        return
      }

      if (successMessage) {
        toast.success(successMessage)
      }

      onSuccess?.(result, variables, onMutateResult, context)
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(error.message)
      onError?.(error, variables, onMutateResult, context)
    },
    ...rest,
  })
}
