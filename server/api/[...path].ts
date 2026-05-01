import { requireUser } from '../utils/auth-subject'
import { useAppStorage } from '../utils/storage'
import { generateDemoData } from '../utils/demo'

export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'path') || ''
  const query = getQuery(event)
  const method = event.method
  const session = requireUser(event)

  // Demo user — serve mock data instead of proxying to Go
  if (session.demo) {
    try {
      return generateDemoData(path, query)
    } catch (err: unknown) {
      const e = err as { message?: string }
      setResponseStatus(event, 500)
      return { error: e?.message || 'demo data generation error' }
    }
  }

  const hostId = getRequestHeader(event, 'x-mon-host-id') || ''
  if (!hostId) {
    setResponseStatus(event, 400)
    return { error: 'missing x-mon-host-id header' }
  }

  const hostConfig = await useAppStorage().getHost(session.userId, hostId)
  if (!hostConfig) {
    setResponseStatus(event, 404)
    return { error: 'host not found' }
  }

  const baseUrl = hostConfig.url
  const token = hostConfig.token ?? ''

  let url: URL
  try {
    url = new URL(`/api/${path}`, baseUrl)
  } catch {
    setResponseStatus(event, 400)
    return { error: 'invalid host url' }
  }
  for (const [k, v] of Object.entries(query)) {
    if (v != null) url.searchParams.set(k, String(v))
  }

  let body: unknown = undefined
  if (method !== 'GET' && method !== 'HEAD') {
    body = await readBody(event).catch(() => undefined)
  }

  if (method !== 'GET' && method !== 'HEAD') {
    const origin = getRequestHeader(event, 'origin')
    const host = getRequestHeader(event, 'host')
    if (origin && host) {
      try {
        if (new URL(origin).host !== host) {
          setResponseStatus(event, 403)
          return { error: 'forbidden' }
        }
      } catch {
        setResponseStatus(event, 403)
        return { error: 'forbidden' }
      }
    }
  }

  try {
    return await $fetch(url.toString(), {
      method: method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body,
      timeout: 15000,
    })
  } catch (err: unknown) {
    const e = err as { statusCode?: number; data?: { error?: string }; message?: string }
    setResponseStatus(event, e?.statusCode || 502)
    return { error: e?.data?.error || e?.message || 'proxy error' }
  }
})
