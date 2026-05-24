"use client"

import axios, { AxiosError, type AxiosRequestConfig } from "axios"
import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  saveAuthSession,
  type StoredAuthSession,
} from "@/lib/auth-storage"

export type ApiErrorShape = {
  message: string
  statusCode: number
}

const baseURL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000"

const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
})

let refreshPromise: Promise<string | null> | null = null

function parseAxiosError(error: AxiosError): ApiErrorShape {
  const responseData = error.response?.data as
    | { message?: string | string[] | { message?: string } }
    | undefined

  const rawMessage = responseData?.message
  let message = "Something went wrong"

  if (Array.isArray(rawMessage)) {
    message = rawMessage[0] ?? message
  } else if (typeof rawMessage === "string") {
    message = rawMessage
  } else if (typeof rawMessage?.message === "string") {
    message = rawMessage.message
  }

  return {
    message,
    statusCode: error.response?.status ?? 500,
  }
}

async function refreshAccessToken() {
  const storedUser = typeof window !== "undefined"
    ? window.localStorage.getItem("pop_user")
    : null
  const refreshToken = getRefreshToken()

  if (!storedUser || !refreshToken) {
    clearAuthSession()
    return null
  }

  const user = JSON.parse(storedUser) as { id: string }
  const response = await axios.post<{
    access_token: string
    refresh_token: string
    user: StoredAuthSession["user"]
  }>(`${baseURL}/user/refresh`, {
    userId: user.id,
    refreshToken,
  })

  saveAuthSession({
    accessToken: response.data.access_token,
    refreshToken: response.data.refresh_token,
    user: response.data.user,
  })

  return response.data.access_token
}

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (AxiosRequestConfig & { _retry?: boolean })
      | undefined

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true

      try {
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = null
        })

        const nextAccessToken = await refreshPromise

        if (nextAccessToken) {
          originalRequest.headers = originalRequest.headers ?? {}
          originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`
          return apiClient(originalRequest)
        }
      } catch {
        clearAuthSession()
      }
    }

    throw error
  }
)

export async function getRequest<T>(url: string, config?: AxiosRequestConfig) {
  try {
    const { data } = await apiClient.get<T>(url, config)
    return [data, null] as const
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return [null, parseAxiosError(error)] as const
    }
    return [null, { message: "Unknown error", statusCode: 500 }] as const
  }
}

export async function postRequest<T, TVariables>(
  url: string,
  payload: TVariables,
  config?: AxiosRequestConfig
) {
  try {
    const { data } = await apiClient.post<T>(url, payload, config)
    return [data, null] as const
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return [null, parseAxiosError(error)] as const
    }
    return [null, { message: "Unknown error", statusCode: 500 }] as const
  }
}

export async function patchRequest<T, TVariables>(
  url: string,
  payload: TVariables,
  config?: AxiosRequestConfig
) {
  try {
    const { data } = await apiClient.patch<T>(url, payload, config)
    return [data, null] as const
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return [null, parseAxiosError(error)] as const
    }
    return [null, { message: "Unknown error", statusCode: 500 }] as const
  }
}

export async function deleteRequest<T>(url: string, config?: AxiosRequestConfig) {
  try {
    const { data } = await apiClient.delete<T>(url, config)
    return [data, null] as const
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return [null, parseAxiosError(error)] as const
    }
    return [null, { message: "Unknown error", statusCode: 500 }] as const
  }
}

export { apiClient }
