/**
 * 基于 Fetch 的请求封装（Web + Electron 渲染进程共用）
 *
 * 鉴权：401 侧效应已预留，默认不执行跳转/清栈。
 * Token 与用户会话读写位于 `@/lib/auth/session`。
 */
import { applyStreamingProxyClientHints } from "@/lib/api/streaming-fetch-headers"
import { clearAuthStorage, getAuthorizationHeaderValue } from "@/lib/auth/session"
import { defaultLocale, locales, type AppLocale } from "@/i18n/config"
import enMessages from "@/messages/en.json"
import zhCNMessages from "@/messages/zh-CN.json"
import { createTranslator } from "next-intl"
import { toast } from "sonner"

const HTTP_ERROR_MESSAGES: Record<AppLocale, (typeof zhCNMessages)> = {
  "zh-CN": zhCNMessages,
  en: enMessages,
}

let unauthorizedRedirecting = false

function getLocaleFromPathname(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean)
  return segments[0] || "zh-CN"
}

function redirectToLoginNewChat(): void {
  if (typeof window === "undefined") return
  if (unauthorizedRedirecting) return
  unauthorizedRedirecting = true

  clearAuthStorage()
  const locale = getLocaleFromPathname(window.location.pathname)
  const target = `/${locale}/creation-center/new?__authRedirect=1`
  window.location.replace(target)
}

/**
 * 401 时：清会话 + 跳转登录（带 locale）。接入后取消注释并按实际路由修改。
 * 需在客户端调用；locale 可从 pathname 解析或从 next-intl 客户端 API 获取。
 */
export function handleUnauthorizedRedirect(): void {
  if (typeof window === "undefined") return
  clearAuthStorage()
  // const locale = window.location.pathname.split("/")[1] || "zh-CN"
  // window.location.href = `/${locale}/login?redirect=${encodeURIComponent(window.location.pathname)}`
}

function mergeHeaders(
  defaults: Record<string, string>,
  init?: HeadersInit,
): Headers {
  const h = new Headers()
  for (const [k, v] of Object.entries(defaults)) {
    if (v !== undefined && v !== "") h.set(k, v)
  }
  if (init) {
    new Headers(init).forEach((value, key) => {
      h.set(key, value)
    })
  }
  return h
}

function defaultJsonContentTypeIfNeeded(
  options: RequestInit,
): Record<string, string> {
  if (options.body instanceof FormData) return {}
  const method = (options.method ?? "GET").toUpperCase()
  if (method === "GET" || method === "HEAD") return {}
  if (options.body == null && !["POST", "PUT", "PATCH"].includes(method))
    return {}
  return { "Content-Type": "application/json" }
}

/**
 * 从 API 错误响应体解析可展示的错误信息
 * 优先从 detail 取（FastAPI / OpenAPI 标准），支持 detail 为字符串或数组
 */
function parseErrorMessageFromBody(data: unknown): string | null {
  if (!data || typeof data !== "object") return null
  const o = data as Record<string, unknown>
  // 优先 detail（接口统一约定）
  const detail = o.detail
  if (typeof detail === "string" && detail.length > 0) return detail
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0]
    if (first && typeof first === "object") {
      const msg =
        (first as Record<string, unknown>).msg ??
        (first as Record<string, unknown>).message
      if (typeof msg === "string" && msg.length > 0) return msg
    }
  }
  return (
    (typeof o.message === "string" && o.message ? o.message : null) ??
    (typeof o.error === "string" && o.error ? o.error : null) ??
    (typeof o.msg === "string" && o.msg ? o.msg : null)
  )
}

/**
 * 从 catch 到的 error 中提取可展示的 API 错误信息，供 toast 等使用
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === "string") return error
  return fallback
}

function resolveAppLocaleFromPath(): AppLocale {
  if (typeof window === "undefined") return defaultLocale
  const segment = getLocaleFromPathname(window.location.pathname)
  return locales.includes(segment as AppLocale) ? (segment as AppLocale) : defaultLocale
}

function toastHttpErrorIfClient(message: string): void {
  if (typeof window === "undefined") return
  toast.error(message)
}

async function handleResponseError(response: Response): Promise<never> {
  const status = response.status
  let errorMessage: string | null = null
  try {
    const errorData = await response.json()
    errorMessage = parseErrorMessageFromBody(errorData)
  } catch {
    errorMessage = response.statusText || null
  }

  const locale = resolveAppLocaleFromPath()
  const t = createTranslator({
    locale,
    messages: HTTP_ERROR_MESSAGES[locale],
    namespace: "request",
  })

  switch (status) {
    case 401: {
      // 全局兜底：任何接口 401 都回到新对话页并弹登录（由 AuthRouteGuard 处理弹窗）
      if (typeof window !== "undefined") {
        // redirectToLoginNewChat()
      }
      const msg = t("http.unauthorized")
      toastHttpErrorIfClient(msg)
      throw new Error(msg)
    }
    case 403: {
      const msg = errorMessage || t("http.forbidden")
      toastHttpErrorIfClient(msg)
      throw new Error(msg)
    }
    case 404: {
      const msg = errorMessage || t("http.notFound")
      toastHttpErrorIfClient(msg)
      throw new Error(msg)
    }
    case 500: {
      const msg = errorMessage || t("http.serverError")
      toastHttpErrorIfClient(msg)
      throw new Error(msg)
    }
    default: {
      const msg = errorMessage || t("http.requestFailed")
      toastHttpErrorIfClient(msg)
      throw new Error(msg)
    }
  }
}

function authHeadersInit(
  options: RequestInit,
  extraDefaults?: Record<string, string>,
): Headers {
  const defaults = { ...defaultJsonContentTypeIfNeeded(options), ...extraDefaults }
  const h = mergeHeaders(defaults, options.headers)
  if (!h.has("Authorization")) {
    const authorization = getAuthorizationHeaderValue()
    if (authorization) {
      h.set("Authorization", authorization)
    }
  }
  return h
}

/**
 * JSON API 请求（完整 URL；后续可加 baseURL 包装）
 */
export async function request<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  try {
    const headers = authHeadersInit(options)
    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      await handleResponseError(response)
    }

    if (response.status === 204) {
      return undefined as T
    }

    const text = await response.text()
    if (!text) return undefined as T
    return JSON.parse(text) as T
  } catch (error) {
    console.error("Request error:", error)
    throw error
  }
}

/**
 * multipart 上传（不要手动设 Content-Type）
 */
export async function upload<T>(
  url: string,
  formData: FormData,
  options?: RequestInit,
): Promise<T> {
  try {
    const headers = authHeadersInit({
      ...options,
      body: formData,
      method: options?.method ?? "POST",
    })
    headers.delete("Content-Type")

    const response = await fetch(url, {
      ...options,
      method: options?.method ?? "POST",
      headers,
      body: formData,
    })

    if (!response.ok) {
      await handleResponseError(response)
    }

    if (response.status === 204) {
      return undefined as T
    }

    const text = await response.text()
    if (!text) return undefined as T
    return JSON.parse(text) as T
  } catch (error) {
    console.error("Upload error:", error)
    throw error
  }
}

/**
 * SSE 风格流式读取（按行缓冲，避免 chunk 截断半行）
 */
export async function streamRequest<T = unknown>(
  url: string,
  options: RequestInit,
  onChunk: (data: T) => void,
  onError?: (error: Error) => void,
  abortSignal?: AbortSignal,
): Promise<void> {
  const headers = authHeadersInit(options)
  applyStreamingProxyClientHints(headers)

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: abortSignal,
    })

    if (!response.ok) {
      await handleResponseError(response)
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new Error("No response body")
    }

    let lineBuffer = ""

    while (true) {
      if (abortSignal?.aborted) {
        await reader.cancel()
        break
      }

      const { done, value } = await reader.read()
      if (done) break

      if (abortSignal?.aborted) {
        await reader.cancel()
        break
      }

      lineBuffer += decoder.decode(value, { stream: true })
      const lines = lineBuffer.split("\n")
      lineBuffer = lines.pop() ?? ""

      for (const raw of lines) {
        if (abortSignal?.aborted) {
          await reader.cancel()
          break
        }
        const line = raw.replace(/\r$/, "").trim()
        if (!line) continue
        if (line.startsWith("data: ")) {
          const data = line.slice(6)
          if (data === "[DONE]") continue
          try {
            onChunk(JSON.parse(data) as T)
          } catch (e) {
            console.error("Failed to parse SSE data:", data, e)
          }
        }
      }
    }

    const tail = lineBuffer.replace(/\r$/, "").trim()
    if (tail.startsWith("data: ") && !abortSignal?.aborted) {
      const data = tail.slice(6)
      if (data !== "[DONE]") {
        try {
          onChunk(JSON.parse(data) as T)
        } catch (e) {
          console.error("Failed to parse SSE tail:", data, e)
        }
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return
    }
    const err = error instanceof Error ? error : new Error("Unknown error")
    if (onError) {
      onError(err)
    } else {
      throw err
    }
  }
}

/** 二进制下载（默认不为 GET 带 JSON Content-Type） */
export async function requestBlob(
  url: string,
  options: RequestInit = {},
): Promise<Blob> {
  const headers = authHeadersInit(options)
  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    await handleResponseError(response)
  }

  return response.blob()
}

export const api = {
  request,
  upload,
  stream: streamRequest,
  requestBlob,
}

export default api
