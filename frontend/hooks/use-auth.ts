"use client"

import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useCommonMutationApi } from "@/api-hooks/use-api-mutation"
import { useQueryWrapper } from "@/api-hooks/react-query-wrapper"
import { getDashboardPath } from "@/lib/auth-routes"
import {
  clearAuthSession,
  getAccessToken,
  saveAuthSession,
} from "@/lib/auth-storage"
import type {
  AuthResponse,
  AuthUser,
  LoginPayload,
  PublicSignupPayload,
  WorkerSignupPayload,
} from "@/lib/types/auth"

const ME_QUERY_KEY = ["auth", "me"]

export function useLoginMutation() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useCommonMutationApi<AuthResponse, LoginPayload>({
    url: "/user/login",
    method: "POST",
    mutationKey: ["auth", "login"],
    onSuccess: (result) => {
      if (!result.data) return

      saveAuthSession({
        accessToken: result.data.access_token,
        refreshToken: result.data.refresh_token,
        user: result.data.user,
      })

      queryClient.setQueryData(ME_QUERY_KEY, result.data.user)

      if (
        result.data.user.role === "tetentwoner" &&
        result.data.user.subscriptionRequired &&
        !result.data.user.subscriptionActive
      ) {
        toast.info("Subscription inactive. Pick a plan before full access.")
      }

      router.push(getDashboardPath(result.data.user.role))
    },
  })
}

export function useWorkerSignupMutation() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useCommonMutationApi<AuthResponse, WorkerSignupPayload>({
    url: "/user/register-worker",
    method: "POST",
    mutationKey: ["auth", "register-worker"],
    successMessage: "Worker account ready",
    onSuccess: (result) => {
      if (!result.data) return

      saveAuthSession({
        accessToken: result.data.access_token,
        refreshToken: result.data.refresh_token,
        user: result.data.user,
      })

      queryClient.setQueryData(ME_QUERY_KEY, result.data.user)
      router.push(getDashboardPath(result.data.user.role))
    },
  })
}

export function usePublicSignupMutation() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useCommonMutationApi<AuthResponse, PublicSignupPayload>({
    url: "/user/public-signup",
    method: "POST",
    mutationKey: ["auth", "public-signup"],
    successMessage: "Account ready",
    onSuccess: (result) => {
      if (!result.data) return

      saveAuthSession({
        accessToken: result.data.access_token,
        refreshToken: result.data.refresh_token,
        user: result.data.user,
      })

      queryClient.setQueryData(ME_QUERY_KEY, result.data.user)
      router.push(getDashboardPath(result.data.user.role))
    },
  })
}

export function useMeQuery() {
  return useQueryWrapper<AuthUser>(ME_QUERY_KEY, "/user/me", {
    enabled: Boolean(getAccessToken()),
  })
}

export function useLogoutMutation() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useCommonMutationApi<{ message: string }, void>({
    url: "/user/logout",
    method: "POST",
    mutationKey: ["auth", "logout"],
    onSuccess: () => {
      clearAuthSession()
      queryClient.removeQueries({ queryKey: ME_QUERY_KEY })
      router.push("/login")
    },
  })
}
