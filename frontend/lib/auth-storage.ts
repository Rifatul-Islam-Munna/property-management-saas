const ACCESS_TOKEN_KEY = "pop_access_token"
const REFRESH_TOKEN_KEY = "pop_refresh_token"
const USER_KEY = "pop_user"

export type StoredAuthUser = {
  id: string
  fullName: string
  email: string
  phoneNumber: string
  role: string
  subscriptionActive?: boolean
  subscriptionRequired?: boolean
}

export type StoredAuthSession = {
  accessToken: string
  refreshToken: string
  user: StoredAuthUser
}

function canUseStorage() {
  return typeof window !== "undefined"
}

export function saveAuthSession(session: StoredAuthSession) {
  if (!canUseStorage()) return

  window.localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken)
  window.localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken)
  window.localStorage.setItem(USER_KEY, JSON.stringify(session.user))
}

export function clearAuthSession() {
  if (!canUseStorage()) return

  window.localStorage.removeItem(ACCESS_TOKEN_KEY)
  window.localStorage.removeItem(REFRESH_TOKEN_KEY)
  window.localStorage.removeItem(USER_KEY)
}

export function getAccessToken() {
  if (!canUseStorage()) return null
  return window.localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken() {
  if (!canUseStorage()) return null
  return window.localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function getStoredUser(): StoredAuthUser | null {
  if (!canUseStorage()) return null

  const raw = window.localStorage.getItem(USER_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as StoredAuthUser
  } catch {
    return null
  }
}
