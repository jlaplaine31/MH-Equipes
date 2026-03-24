/**
 * Dataverse Web API client.
 *
 * When VITE_USE_MOCK=true (default) the individual service files keep using
 * their in-memory mock data — this client is only called when mock mode is off.
 *
 * In real mode the client:
 *  - acquires a Bearer token via MSAL silently (or falls back to redirect)
 *  - builds OData URLs against the configured Dataverse org
 *  - handles 401 (re-auth) and 429 (retry-after) automatically
 */

import type { AccountInfo, SilentRequest } from '@azure/msal-browser'
import { InteractionRequiredAuthError } from '@azure/msal-browser'
import { msalInstance } from './msalInstance'
import { dataverseScopes, dataverseBaseUrl } from './msalConfig'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export const isMockMode = (): boolean =>
  (import.meta.env.VITE_USE_MOCK ?? 'true') === 'true'

const API_PREFIX = '/api/data/v9.2'

function buildUrl(entityPath: string): string {
  // entityPath examples: "accounts", "contacts(guid)", "accounts?$filter=..."
  const base = dataverseBaseUrl.replace(/\/+$/, '')
  const path = entityPath.replace(/^\/+/, '')
  return `${base}${API_PREFIX}/${path}`
}

// ---------------------------------------------------------------------------
// Token acquisition
// ---------------------------------------------------------------------------

async function acquireToken(): Promise<string> {
  const accounts: AccountInfo[] = msalInstance.getAllAccounts()
  if (accounts.length === 0) {
    // No cached session — force interactive login
    await msalInstance.loginRedirect({ scopes: dataverseScopes })
    // loginRedirect navigates away; code below won't execute.
    // After redirect the app reloads and accounts will be available.
    throw new Error('Redirecting to login…')
  }

  const request: SilentRequest = {
    scopes: dataverseScopes,
    account: accounts[0],
  }

  try {
    const response = await msalInstance.acquireTokenSilent(request)
    return response.accessToken
  } catch (error: unknown) {
    if (error instanceof InteractionRequiredAuthError) {
      await msalInstance.acquireTokenRedirect({ scopes: dataverseScopes })
      throw new Error('Redirecting to login…')
    }
    throw error
  }
}

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

export interface DataverseError {
  status: number
  message: string
}

export function createDataverseError(
  status: number,
  message: string,
): DataverseError {
  return { status, message }
}

// ---------------------------------------------------------------------------
// Core fetch wrapper with retry / re-auth
// ---------------------------------------------------------------------------

const MAX_RETRIES = 3
const DEFAULT_RETRY_MS = 1000

async function dataverseFetch(
  url: string,
  options: RequestInit,
  attempt = 0,
): Promise<Response> {
  const token = await acquireToken()

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    'OData-MaxVersion': '4.0',
    'OData-Version': '4.0',
    ...(options.headers as Record<string, string> | undefined),
  }

  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(url, { ...options, headers })

  // 401 Unauthorized → force re-auth once
  if (response.status === 401 && attempt === 0) {
    msalInstance.clearCache()
    return dataverseFetch(url, options, attempt + 1)
  }

  // 429 Too Many Requests → respect Retry-After then retry
  if (response.status === 429 && attempt < MAX_RETRIES) {
    const retryAfter = response.headers.get('Retry-After')
    const delayMs = retryAfter ? Number(retryAfter) * 1000 : DEFAULT_RETRY_MS
    await new Promise((resolve) => setTimeout(resolve, delayMs))
    return dataverseFetch(url, options, attempt + 1)
  }

  if (!response.ok) {
    let body = ''
    try {
      body = await response.text()
    } catch {
      // ignore
    }
    throw createDataverseError(
      response.status,
      `Dataverse ${options.method ?? 'GET'} ${url} failed: ${response.statusText} – ${body}`,
    )
  }

  return response
}

// ---------------------------------------------------------------------------
// Public API — generic CRUD helpers
// ---------------------------------------------------------------------------

/**
 * GET an entity set or single entity.
 * Returns the parsed JSON (the OData response).
 */
export async function get<T = unknown>(entityPath: string): Promise<T> {
  const url = buildUrl(entityPath)
  const response = await dataverseFetch(url, { method: 'GET' })
  return (await response.json()) as T
}

/**
 * POST (create) an entity.
 * Returns the parsed JSON body (if any) from the Dataverse response.
 */
export async function post<T = unknown>(
  entityPath: string,
  body: unknown,
): Promise<T> {
  const url = buildUrl(entityPath)
  const response = await dataverseFetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  // Dataverse returns 204 on create with Prefer: return=representation absent
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

/**
 * PATCH (update) an entity.
 */
export async function patch(
  entityPath: string,
  body: unknown,
): Promise<void> {
  const url = buildUrl(entityPath)
  await dataverseFetch(url, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

/**
 * DELETE an entity.
 */
export async function del(entityPath: string): Promise<void> {
  const url = buildUrl(entityPath)
  await dataverseFetch(url, { method: 'DELETE' })
}
