/**
 * Client Power Automate — proxy API vers Dataverse.
 *
 * Le flow "Equipes API Proxy" reçoit { method, path, body? }
 * et relaie la requête vers l'API Dataverse Web API.
 */

const FLOW_URL = import.meta.env.VITE_FLOW_URL as string | undefined

export function isFlowConfigured(): boolean {
  return !!FLOW_URL
}

export interface FlowRequest {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  path: string
  body?: unknown
}

export interface ODataResponse<T> {
  '@odata.context'?: string
  value: T[]
}

export async function callFlow<T = unknown>(request: FlowRequest): Promise<T> {
  if (!FLOW_URL) {
    throw new Error('VITE_FLOW_URL is not configured')
  }

  const response = await fetch(FLOW_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Flow error ${response.status}: ${text}`)
  }

  // DELETE et certains PATCH retournent 204 No Content
  if (response.status === 204) {
    return undefined as T
  }

  const text = await response.text()
  if (!text) return undefined as T

  return JSON.parse(text) as T
}

/**
 * Raccourcis pour les opérations courantes.
 */

export async function flowGet<T>(path: string): Promise<ODataResponse<T>> {
  return callFlow<ODataResponse<T>>({ method: 'GET', path })
}

export async function flowPost<T>(path: string, body: unknown): Promise<T> {
  return callFlow<T>({ method: 'POST', path, body })
}

export async function flowPatch(path: string, body: unknown): Promise<void> {
  await callFlow({ method: 'PATCH', path, body })
}

export async function flowDelete(path: string): Promise<void> {
  await callFlow({ method: 'DELETE', path })
}
