import type { LoginInput, RegisterInput, User, Company } from './auth.types'
import type { ProductListResponse } from './product.types'
import type { SimulationRequest, SimulationResponse } from './simulation.types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333'

let accessToken: string | null = null
let refreshPromise: Promise<string> | null = null
let onAuthFailureCallback: (() => void) | null = null

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}

export function onAuthFailure(callback: () => void): void {
  onAuthFailureCallback = callback
}

export class ApiError extends Error {
  code: string
  status: number

  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

async function parseError(response: Response): Promise<ApiError> {
  try {
    const body = (await response.json()) as {
      error?: { code?: string; message?: string }
    }
    return new ApiError(
      response.status,
      body.error?.code ?? 'UNKNOWN_ERROR',
      body.error?.message ?? response.statusText,
    )
  } catch {
    return new ApiError(response.status, 'UNKNOWN_ERROR', response.statusText)
  }
}

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise = fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
    .then(async (response) => {
      if (!response.ok) {
        throw await parseError(response)
      }
      const data = (await response.json()) as { accessToken: string }
      accessToken = data.accessToken
      return data.accessToken
    })
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}

export async function apiFetch(
  input: string,
  init?: RequestInit,
): Promise<Response> {
  const url = `${API_BASE_URL}${input}`
  const headers = new Headers(init?.headers)

  if (!headers.has('Content-Type') && init?.body) {
    headers.set('Content-Type', 'application/json')
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  let response = await fetch(url, {
    ...init,
    headers,
    credentials: 'include',
  })

  if (response.status === 401 && input !== '/auth/refresh') {
    try {
      const newToken = await refreshAccessToken()
      headers.set('Authorization', `Bearer ${newToken}`)
      response = await fetch(url, {
        ...init,
        headers,
        credentials: 'include',
      })
    } catch {
      onAuthFailureCallback?.()
      throw await parseError(response)
    }
  }

  return response
}

async function apiGet<T>(input: string): Promise<T> {
  const response = await apiFetch(input, { method: 'GET' })
  if (!response.ok) {
    throw await parseError(response)
  }
  return response.json() as Promise<T>
}

async function apiPost<T>(input: string, body: unknown): Promise<T> {
  const response = await apiFetch(input, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    throw await parseError(response)
  }
  return response.json() as Promise<T>
}

export async function refreshSession(): Promise<string> {
  return refreshAccessToken()
}

export async function me(): Promise<{ user: User; company: Company }> {
  return apiGet<{ user: User; company: Company }>('/auth/me')
}

export async function login(input: LoginInput): Promise<{
  user: User
  accessToken: string
}> {
  return apiPost<{ user: User; accessToken: string }>('/auth/login', input)
}

export async function register(input: RegisterInput): Promise<{
  user: User
  company: Company
  accessToken: string
}> {
  return apiPost<{ user: User; company: Company; accessToken: string }>(
    '/auth/register',
    input,
  )
}

export async function logout(): Promise<void> {
  const response = await apiFetch('/auth/logout', { method: 'POST' })
  if (!response.ok && response.status !== 401) {
    throw await parseError(response)
  }
}

export async function getProducts(search?: string): Promise<ProductListResponse> {
  const query = new URLSearchParams({ limit: '50' })
  if (search) {
    query.set('search', search)
  }
  return apiGet<ProductListResponse>(`/products?${query.toString()}`)
}

export async function simulateSales(payload: SimulationRequest): Promise<SimulationResponse> {
  return apiPost<SimulationResponse>('/sales/simulate', payload)
}
