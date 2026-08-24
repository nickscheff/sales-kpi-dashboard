import type { DashboardData } from '../types'

const API_SECRET = import.meta.env.VITE_API_SECRET as string | undefined

async function request<T>(method: 'GET' | 'PUT', body?: unknown): Promise<T> {
  const headers: Record<string, string> = {}
  if (API_SECRET) headers['X-Shared-Secret'] = API_SECRET
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const res = await fetch('/api/data', {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`API-Fehler (${res.status}): ${text}`)
  }
  return (await res.json()) as T
}

export function loadData(): Promise<DashboardData | null> {
  return request<DashboardData | null>('GET')
}

export function saveData(data: DashboardData): Promise<{ ok: true }> {
  return request<{ ok: true }>('PUT', data)
}
