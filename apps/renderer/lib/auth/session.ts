/** 与登录态持久化一致（例如 zustand persist 的 name） */
export const AUTH_STORAGE_KEY = "media-auto-publish-auth"

export type PersistedAuthUser = {
  id: string
  name?: string | null
  phone?: string | null
  create_at?: string
  update_at?: string
  three_party_identities?: Array<{
    id: string
    three_party_type: string
    three_party_open_id: string
    three_party_scan: string
  }>
}

type AuthPersistState = {
  token?: string
  user?: PersistedAuthUser
}

function readAuthStateFromPersistSnapshot(parsed: unknown): AuthPersistState | null {
  if (!parsed || typeof parsed !== "object") return null
  const state = (parsed as { state?: AuthPersistState }).state
  if (!state || typeof state !== "object") return null
  return state
}

function readTokenFromPersistSnapshot(parsed: unknown): string | null {
  const state = readAuthStateFromPersistSnapshot(parsed)
  const token = state?.token
  return typeof token === "string" && token.length > 0 ? token : null
}

/** 获取 Bearer Token（供 request / upload / 路由守卫等复用） */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(AUTH_STORAGE_KEY)
  if (!raw) return null
  try {
    return readTokenFromPersistSnapshot(JSON.parse(raw))
  } catch {
    return null
  }
}

export function getAuthorizationHeaderValue(): string {
  const token = getAuthToken()
  if (token) return `Bearer ${token}`
  return ""
}

/** 登出或 401 时清理本地会话（接入登录后可在登出按钮里调用） */
export function clearAuthStorage(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(AUTH_STORAGE_KEY)
  window.dispatchEvent(new Event("media-auth-changed"))
}

export function setPersistedAuthSession(
  token: string,
  user: PersistedAuthUser,
): void {
  if (typeof window === "undefined") return
  const payload = JSON.stringify({
    state: { token, user },
    version: 0,
  })
  localStorage.setItem(AUTH_STORAGE_KEY, payload)
  window.dispatchEvent(new Event("media-auth-changed"))
}

export function getAuthUser(): PersistedAuthUser | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(AUTH_STORAGE_KEY)
  if (!raw) return null
  try {
    const state = readAuthStateFromPersistSnapshot(JSON.parse(raw))
    const user = state?.user
    if (!user || typeof user !== "object") return null
    return user
  } catch {
    return null
  }
}
