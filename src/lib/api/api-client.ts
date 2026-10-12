import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { getAccessToken, isJwtExpired, signOutCurrentUser } from '@/lib/auth'
import { env } from '@/lib/env'

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _authRetry?: boolean
  _accessToken?: string
}

let refreshAccessTokenPromise: Promise<string | null> | null = null
let authFailureRedirectStarted = false

export const apiClient = axios.create({
  baseURL: env.apiGatewayBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use(async (config) => {
  const token = await getAccessToken()
  const retriableConfig = config as RetriableRequestConfig

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
    retriableConfig._accessToken = token
  } else {
    retriableConfig._accessToken = undefined
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._authRetry ||
      !isJwtExpired(originalRequest._accessToken)
    ) {
      throw error
    }

    originalRequest._authRetry = true
    const token = await refreshAccessTokenOnce()

    if (!token) {
      await handleRefreshFailure()
      throw error
    }

    originalRequest.headers.Authorization = `Bearer ${token}`
    return apiClient(originalRequest)
  },
)

function refreshAccessTokenOnce(): Promise<string | null> {
  refreshAccessTokenPromise ??= getAccessToken(true).finally(() => {
    refreshAccessTokenPromise = null
  })

  return refreshAccessTokenPromise
}

async function handleRefreshFailure(): Promise<void> {
  try {
    await signOutCurrentUser()
  } catch {
    // Best-effort cleanup; the original 401 remains the actionable error.
  }

  if (typeof window === 'undefined' || authFailureRedirectStarted) {
    return
  }

  authFailureRedirectStarted = true
  const loginUrl = new URL('/auth/login', window.location.origin)
  loginUrl.searchParams.set('next', `${window.location.pathname}${window.location.search}`)
  window.location.assign(loginUrl.toString())
}
