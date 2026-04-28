// Catch-all proxy from `/api/*` (browser) → `${BACKEND_URL}/api/*` (Go).
// Auth is enforced by server/middleware/auth.ts before we get here, so we
// only need to attach the Bearer token to the upstream request.
//
// Multi-host: if the browser sets X-Mon-Url, we forward to that backend
// instead of the default one. X-Mon-Token (optional) overrides the bearer.
// The default host has no headers and uses runtimeConfig (server-side only),
// so its token never reaches the browser.
//
// Specific routes like /api/login, /api/logout, /api/me have their own files
// and take precedence over this catch-all.

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const path = getRouterParam(event, 'path') || ''
  const query = getQuery(event)
  const method = event.method

  const monUrl = getRequestHeader(event, 'x-mon-url') || ''
  const monToken = getRequestHeader(event, 'x-mon-token') || ''

  const baseUrl = monUrl || config.apiUrl
  const token = monToken || config.apiToken

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

  // Defense-in-depth: state-changing requests must come from same origin.
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
